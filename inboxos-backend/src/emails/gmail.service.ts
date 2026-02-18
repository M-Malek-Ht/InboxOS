import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account } from '../auth/account.entity';

export interface ParsedEmail {
  id: string;
  from: string;
  subject: string;
  snippet: string;
  body: string;
  receivedAt: Date;
  isRead: boolean;
  threadId?: string;
  to?: string;
  messageIdHeader?: string;
  labelIds?: string[];
  isSent?: boolean;
}

@Injectable()
export class GmailService {
  private readonly log = new Logger(GmailService.name);

  constructor(
    @InjectRepository(Account)
    private accountRepo: Repository<Account>,
    private configService: ConfigService,
  ) {}

  // ── token management ────────────────────────────────

  async getAccessTokenForUser(userId: string): Promise<string | null> {
    const account = await this.accountRepo.findOne({
      where: { userId, provider: 'google' },
    });
    if (!account?.refreshToken) return null;
    return this.refreshAccessToken(account.refreshToken);
  }

  private async refreshAccessToken(refreshToken: string): Promise<string> {
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: this.configService.get<string>('GOOGLE_CLIENT_ID')!,
        client_secret: this.configService.get<string>('GOOGLE_CLIENT_SECRET')!,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    const data = await res.json();
    if (!data.access_token) {
      throw new Error('Failed to refresh Gmail access token');
    }
    return data.access_token as string;
  }

  // ── Gmail API ───────────────────────────────────────

  /**
   * List inbox emails using threads.list → threads.get approach.
   *
   * Why threads.list instead of messages.list?
   * -  messages.list can return sent replies that Gmail auto-labels
   *    as INBOX (depending on account settings / filters).
   * -  threads.list + picking the first *received* message per thread
   *    guarantees we only show emails from other people.
   */
  async listEmails(
    accessToken: string,
    options: {
      maxResults?: number;
      filter?: string;
      search?: string;
      userEmail?: string;
    } = {},
  ): Promise<ParsedEmail[]> {
    // The user's email is passed from the database (reliable).
    // Fall back to Gmail profile API if not provided.
    const myEmail =
      options.userEmail?.toLowerCase() ??
      (await this.getUserProfile(accessToken))?.toLowerCase();
    this.log.log(`listEmails: userEmail=${myEmail ?? 'UNKNOWN — filtering will be weak!'}`);

    // List threads in INBOX
    const params = new URLSearchParams();
    params.set('maxResults', String(options.maxResults ?? 40));
    params.set('labelIds', 'INBOX');

    const qParts: string[] = [];
    if (options.filter === 'unread') qParts.push('is:unread');
    if (options.search) qParts.push(options.search);
    if (qParts.length > 0) params.set('q', qParts.join(' '));

    const listUrl = `https://www.googleapis.com/gmail/v1/users/me/threads?${params.toString()}`;
    this.log.log(`Listing threads: ${listUrl}`);

    const listRes = await fetch(listUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const listData = await listRes.json();

    if (!listData.threads) return [];
    this.log.log(`Found ${listData.threads.length} threads`);

    // Step 3: Fetch each thread in full, pick the best received message
    const results: ParsedEmail[] = [];

    const threads = await Promise.all(
      listData.threads.map((t: { id: string }) =>
        this.fetchThread(accessToken, t.id),
      ),
    );

    for (const threadMessages of threads) {
      if (!threadMessages || threadMessages.length === 0) continue;

      // Log every message in the thread for debugging
      for (const m of threadMessages) {
        this.log.debug(
          `  msg id=${m.id} from="${m.from}" isSent=${m.isSent} labels=${m.labelIds?.join(',')}`,
        );
      }

      // Find messages NOT from the current user
      const received = threadMessages.filter((m) => {
        // Check 1: SENT label
        if (m.isSent) {
          this.log.debug(`  FILTERED (isSent): ${m.id}`);
          return false;
        }
        // Check 2: From address matches the user's email
        if (myEmail && m.from.toLowerCase().includes(myEmail)) {
          this.log.debug(`  FILTERED (from matches user): ${m.id} from="${m.from}"`);
          return false;
        }
        return true;
      });

      if (received.length > 0) {
        received.sort(
          (a, b) =>
            new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime(),
        );
        this.log.log(
          `Thread: picked msg ${received[0].id} subject="${received[0].subject}" (${threadMessages.length} msgs, ${received.length} received)`,
        );
        results.push(received[0]);
      } else {
        this.log.log(
          `Thread SKIPPED (all sent/from-user): subject="${threadMessages[0]?.subject}" (${threadMessages.length} msgs)`,
        );
      }
    }

    return results;
  }

  async getMessage(accessToken: string, messageId: string): Promise<ParsedEmail> {
    return this.fetchAndParse(accessToken, messageId);
  }

  async markAsRead(accessToken: string, messageId: string): Promise<void> {
    await this.setReadState(accessToken, messageId, true);
  }

  async markAsUnread(accessToken: string, messageId: string): Promise<void> {
    await this.setReadState(accessToken, messageId, false);
  }

  // ── profile ────────────────────────────────────────

  private async getUserProfile(accessToken: string): Promise<string | null> {
    try {
      const res = await fetch(
        'https://www.googleapis.com/gmail/v1/users/me/profile',
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      if (!res.ok) return null;
      const data = await res.json();
      return data.emailAddress ?? null;
    } catch {
      return null;
    }
  }

  // ── thread ─────────────────────────────────────────

  async getThread(
    accessToken: string,
    threadId: string,
  ): Promise<ParsedEmail[]> {
    return this.fetchThread(accessToken, threadId);
  }

  private async fetchThread(
    accessToken: string,
    threadId: string,
  ): Promise<ParsedEmail[]> {
    const url = `https://www.googleapis.com/gmail/v1/users/me/threads/${threadId}?format=full`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      this.log.warn(`Failed to fetch thread ${threadId}: ${res.status}`);
      return [];
    }

    const data = await res.json();
    const messages: any[] = data.messages ?? [];
    return messages.map((msg) => this.parseMessage(msg));
  }

  // ── send ──────────────────────────────────────────

  async sendReply(
    accessToken: string,
    params: { to: string; subject: string; body: string; threadId?: string; inReplyTo?: string },
  ): Promise<{ id: string }> {
    const lines = [
      `To: ${params.to}`,
      `Subject: ${params.subject.startsWith('Re:') ? params.subject : `Re: ${params.subject}`}`,
      'Content-Type: text/plain; charset=UTF-8',
    ];
    if (params.inReplyTo) {
      lines.push(`In-Reply-To: ${params.inReplyTo}`);
      lines.push(`References: ${params.inReplyTo}`);
    }
    lines.push('', params.body);

    const raw = Buffer.from(lines.join('\r\n'))
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const payload: Record<string, string> = { raw };
    if (params.threadId) payload.threadId = params.threadId;

    const res = await fetch(
      'https://www.googleapis.com/gmail/v1/users/me/messages/send',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      },
    );

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error?.message ?? 'Failed to send reply via Gmail');
    }

    const data = await res.json();
    const sentId: string = data.id;
    this.log.log(`Reply sent: id=${sentId}, threadId=${params.threadId}`);

    // Immediately strip INBOX label from the sent message so it never
    // appears as a received email in the inbox. AWAIT this — don't
    // return to the client until the label is removed.
    try {
      await this.removeFromInbox(accessToken, sentId);
    } catch (err: any) {
      this.log.warn(`Could not remove INBOX label from sent reply ${sentId}: ${err.message}`);
    }

    return { id: sentId };
  }

  /**
   * Remove the INBOX label from a message so it doesn't appear in the inbox.
   */
  private async removeFromInbox(accessToken: string, messageId: string): Promise<void> {
    const url = `https://www.googleapis.com/gmail/v1/users/me/messages/${messageId}/modify`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ removeLabelIds: ['INBOX'] }),
    });
    if (res.ok) {
      this.log.log(`Removed INBOX label from sent message ${messageId}`);
    }
  }

  // ── trash / delete ──────────────────────────────────

  async trashMessage(accessToken: string, messageId: string): Promise<void> {
    const url = `https://www.googleapis.com/gmail/v1/users/me/messages/${messageId}/trash`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error?.message ?? 'Failed to trash message');
    }
  }

  // ── internals ───────────────────────────────────────

  private async fetchAndParse(accessToken: string, messageId: string): Promise<ParsedEmail> {
    const url = `https://www.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    const msg = await res.json();

    if (msg.error) {
      throw new Error(msg.error.message);
    }

    return this.parseMessage(msg);
  }

  private async setReadState(accessToken: string, messageId: string, isRead: boolean): Promise<void> {
    const url = `https://www.googleapis.com/gmail/v1/users/me/messages/${messageId}/modify`;
    const body = isRead
      ? { removeLabelIds: ['UNREAD'] }
      : { addLabelIds: ['UNREAD'] };

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error?.message ?? 'Failed to update read state');
    }
  }

  private parseMessage(msg: any): ParsedEmail {
    const headers: { name: string; value: string }[] = msg.payload?.headers ?? [];
    const getHeader = (name: string) =>
      headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ?? '';

    const labelIds: string[] = msg.labelIds ?? [];
    const isRead = !labelIds.includes('UNREAD');

    return {
      id: msg.id,
      from: getHeader('from'),
      subject: getHeader('subject'),
      snippet: msg.snippet ?? '',
      body: this.extractBody(msg.payload),
      receivedAt: new Date(getHeader('date')),
      isRead,
      threadId: msg.threadId,
      to: getHeader('to'),
      messageIdHeader: getHeader('message-id'),
      labelIds,
      isSent: labelIds.includes('SENT'),
    };
  }

  private extractBody(payload: any): string {
    if (!payload) return '';

    if (payload.body?.data) {
      return this.decodeBase64Url(payload.body.data);
    }

    if (payload.parts) {
      const textPart = payload.parts.find((p: any) => p.mimeType === 'text/plain');
      if (textPart) return this.extractBody(textPart);

      const htmlPart = payload.parts.find((p: any) => p.mimeType === 'text/html');
      if (htmlPart) return this.extractBody(htmlPart);

      const nestedMultipart = payload.parts.find((p: any) =>
        p.mimeType?.startsWith('multipart/'),
      );
      if (nestedMultipart) return this.extractBody(nestedMultipart);
    }

    return '';
  }

  private decodeBase64Url(data: string): string {
    const base64 = data.replace(/-/g, '+').replace(/_/g, '/');
    return Buffer.from(base64, 'base64').toString('utf-8');
  }
}
