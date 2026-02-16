import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account } from '../auth/account.entity';
import { ParsedEmail } from './gmail.service';

@Injectable()
export class MicrosoftMailService {
  constructor(
    @InjectRepository(Account)
    private accountRepo: Repository<Account>,
    private configService: ConfigService,
  ) {}

  // ── token management ────────────────────────────────

  async getAccessTokenForUser(userId: string): Promise<string | null> {
    console.log('[MicrosoftMailService] Looking for account with userId:', userId);
    const account = await this.accountRepo.findOne({
      where: { userId, provider: 'microsoft' },
    });
    console.log('[MicrosoftMailService] Account found:', account ? 'YES' : 'NO');
    console.log('[MicrosoftMailService] Has refreshToken:', account?.refreshToken ? 'YES' : 'NO');
    if (!account?.refreshToken) return null;
    return this.refreshAccessToken(account.refreshToken);
  }

  private async refreshAccessToken(refreshToken: string): Promise<string> {
    const res = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: this.configService.get<string>('MICROSOFT_CLIENT_ID')!,
        client_secret: this.configService.get<string>('MICROSOFT_CLIENT_SECRET')!,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
        scope: 'Mail.Read Mail.ReadWrite offline_access',
      }),
    });

    const data = await res.json();
    if (!data.access_token) {
      console.error('[MicrosoftMailService] Token refresh failed:', data);
      throw new Error('Failed to refresh Microsoft access token');
    }
    return data.access_token as string;
  }

  // ── Microsoft Graph API ───────────────────────────────

  async listEmails(
    accessToken: string,
    options: { maxResults?: number; filter?: string; search?: string } = {},
  ): Promise<ParsedEmail[]> {
    const top = options.maxResults ?? 40;
    const params = new URLSearchParams();
    params.set('$top', String(top));
    params.set('$orderby', 'receivedDateTime desc');
    params.set('$select', 'id,from,subject,bodyPreview,body,receivedDateTime,isRead');

    const filterParts: string[] = [];
    if (options.filter === 'unread') {
      filterParts.push('isRead eq false');
    }
    if (filterParts.length > 0) {
      params.set('$filter', filterParts.join(' and '));
    }

    if (options.search) {
      params.set('$search', `"${options.search}"`);
    }

    const url = `https://graph.microsoft.com/v1.0/me/messages?${params.toString()}`;
    console.log('[MicrosoftMailService] Fetching emails from:', url);

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('[MicrosoftMailService] Graph API response status:', res.status);
    const data = await res.json();

    if (data.error) {
      console.error('[MicrosoftMailService] Graph API error:', data.error);
      throw new Error(data.error.message);
    }

    const messages = data.value ?? [];
    console.log('[MicrosoftMailService] Found', messages.length, 'messages');
    return messages.map((msg: any) => this.parseMessage(msg));
  }

  async getMessage(accessToken: string, messageId: string): Promise<ParsedEmail> {
    console.log('[MicrosoftMailService] getMessage called with messageId:', messageId);
    const url = `https://graph.microsoft.com/v1.0/me/messages/${messageId}?$select=id,from,subject,bodyPreview,body,receivedDateTime,isRead`;

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('[MicrosoftMailService] getMessage response status:', res.status);
    const msg = await res.json();

    if (msg.error) {
      console.error('[MicrosoftMailService] getMessage error:', msg.error);
      throw new Error(msg.error.message);
    }

    return this.parseMessage(msg);
  }

  async markAsRead(accessToken: string, messageId: string): Promise<void> {
    console.log('[MicrosoftMailService] markAsRead called with messageId:', messageId);
    await this.setReadState(accessToken, messageId, true);
  }

  async markAsUnread(accessToken: string, messageId: string): Promise<void> {
    console.log('[MicrosoftMailService] markAsUnread called with messageId:', messageId);
    await this.setReadState(accessToken, messageId, false);
  }

  // ── internals ───────────────────────────────────────

  private async setReadState(accessToken: string, messageId: string, isRead: boolean): Promise<void> {
    const url = `https://graph.microsoft.com/v1.0/me/messages/${messageId}`;

    const res = await fetch(url, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ isRead }),
    });

    if (!res.ok) {
      const error = await res.json();
      console.error('[MicrosoftMailService] setReadState error:', error);
      throw new Error(error.error?.message ?? 'Failed to update read state');
    }

    console.log('[MicrosoftMailService] Email read state updated:', isRead ? 'read' : 'unread');
  }

  private parseMessage(msg: any): ParsedEmail {
    const fromAddress = msg.from?.emailAddress;
    const fromStr = fromAddress
      ? (fromAddress.name ? `${fromAddress.name} <${fromAddress.address}>` : fromAddress.address)
      : '';

    return {
      id: msg.id,
      from: fromStr,
      subject: msg.subject ?? '',
      snippet: msg.bodyPreview ?? '',
      body: msg.body?.content ?? '',
      receivedAt: new Date(msg.receivedDateTime),
      isRead: msg.isRead ?? false,
    };
  }
}
