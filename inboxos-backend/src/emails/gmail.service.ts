import { Injectable } from '@nestjs/common';
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
  constructor(
    @InjectRepository(Account)
    private accountRepo: Repository<Account>,
    private configService: ConfigService,
  ) {}

  // ── token management ────────────────────────────────

  async getAccessTokenForUser(userId: string): Promise<string | null> {
    console.log('[GmailService] Looking for account with userId:', userId);
    const account = await this.accountRepo.findOne({
      where: { userId, provider: 'google' },
    });
    console.log('[GmailService] Account found:', account ? 'YES' : 'NO');
    console.log('[GmailService] Has refreshToken:', account?.refreshToken ? 'YES' : 'NO');
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

  async listEmails(
    accessToken: string,
    options: { maxResults?: number; filter?: string; search?: string } = {},
  ): Promise<ParsedEmail[]> {
    const params = new URLSearchParams();
    params.set('maxResults', String(options.maxResults ?? 40));
    params.append('labelIds', 'INBOX');

    const qParts: string[] = [];
    if (options.filter === 'unread') qParts.push('is:unread');
    if (options.search) qParts.push(options.search);
    if (qParts.length > 0) params.set('q', qParts.join(' '));

    const url = `https://www.googleapis.com/gmail/v1/users/me/messages?${params.toString()}`;
    console.log('[GmailService] Fetching emails from:', url);

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    console.log('[GmailService] Gmail API response status:', res.status);
    const data = await res.json();
    console.log('[GmailService] Gmail API response:', JSON.stringify(data, null, 2));

    if (!data.messages) {
      console.log('[GmailService] No messages array in response');
      return [];
    }

    console.log('[GmailService] Found', data.messages.length, 'message IDs');
    const messages = await Promise.all(
      data.messages.map((msg: { id: string }) =>
        this.fetchAndParse(accessToken, msg.id),
      ),
    );

    // Filter out sent-only messages (SENT label but no INBOX label)
    const inboxMessages = messages.filter((m) => {
      const labels = m.labelIds ?? [];
      if (labels.includes('SENT') && !labels.includes('INBOX')) return false;
      return true;
    });

    // Deduplicate by threadId — prefer received (non-SENT) messages over sent ones
    const threadMap = new Map<string, ParsedEmail>();
    for (const msg of inboxMessages) {
      const key = msg.threadId ?? msg.id;
      const existing = threadMap.get(key);
      if (!existing) {
        threadMap.set(key, msg);
        continue;
      }
      const msgIsSent = msg.isSent ?? false;
      const existingIsSent = existing.isSent ?? false;
      if (existingIsSent && !msgIsSent) {
        // Replace sent with received
        threadMap.set(key, msg);
      } else if (msgIsSent === existingIsSent && new Date(msg.receivedAt) > new Date(existing.receivedAt)) {
        // Same type: keep most recent
        threadMap.set(key, msg);
      }
    }

    return Array.from(threadMap.values());
  }

  async getMessage(accessToken: string, messageId: string): Promise<ParsedEmail> {
    console.log('[GmailService] getMessage called with messageId:', messageId);
    return this.fetchAndParse(accessToken, messageId);
  }

  async markAsRead(accessToken: string, messageId: string): Promise<void> {
    console.log('[GmailService] markAsRead called with messageId:', messageId);
    await this.setReadState(accessToken, messageId, true);
  }

  async markAsUnread(accessToken: string, messageId: string): Promise<void> {
    console.log('[GmailService] markAsUnread called with messageId:', messageId);
    await this.setReadState(accessToken, messageId, false);
  }

  // ── thread ─────────────────────────────────────────

  async getThread(
    accessToken: string,
    threadId: string,
  ): Promise<ParsedEmail[]> {
    const url = `https://www.googleapis.com/gmail/v1/users/me/threads/${threadId}?format=full`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error?.message ?? 'Failed to fetch thread');
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
    return { id: data.id };
  }

  // ── internals ───────────────────────────────────────

  private async fetchAndParse(accessToken: string, messageId: string): Promise<ParsedEmail> {
    const url = `https://www.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`;
    console.log('[GmailService] fetchAndParse URL:', url);

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    console.log('[GmailService] fetchAndParse response status:', res.status);
    const msg = await res.json();

    if (msg.error) {
      console.error('[GmailService] fetchAndParse error:', msg.error);
      throw new Error(msg.error.message);
    }

    const parsed = this.parseMessage(msg);
    console.log('[GmailService] Parsed email subject:', parsed.subject);
    return parsed;
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
      console.error('[GmailService] setReadState error:', error);
      throw new Error(error.error?.message ?? 'Failed to update read state');
    }

    console.log('[GmailService] Email read state updated:', isRead ? 'read' : 'unread');
  }

  private parseMessage(msg: any): ParsedEmail {
    const headers: { name: string; value: string }[] = msg.payload?.headers ?? [];
    const getHeader = (name: string) =>
      headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ?? '';

    // Check if email is unread by looking at labelIds
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

    // Simple (non-multipart) message
    if (payload.body?.data) {
      return this.decodeBase64Url(payload.body.data);
    }

    // Multipart — prefer text/plain, fallback text/html, then recurse into nested multipart
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

  // Gmail uses base64url encoding (- and _ instead of + and /)
  private decodeBase64Url(data: string): string {
    const base64 = data.replace(/-/g, '+').replace(/_/g, '/');
    return Buffer.from(base64, 'base64').toString('utf-8');
  }
}
