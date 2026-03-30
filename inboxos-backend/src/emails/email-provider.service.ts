import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account } from '../auth/account.entity';
import { ParsedEmail } from './email.types';

@Injectable()
export abstract class EmailProviderService {
  protected readonly log = new Logger(this.constructor.name);

  constructor(
    @InjectRepository(Account)
    protected accountRepo: Repository<Account>,
    protected configService: ConfigService,
  ) {}

  abstract get providerName(): string;

  async getAccessTokenForUser(userId: string): Promise<string | null> {
    const account = await this.accountRepo.findOne({
      where: { userId, provider: this.providerName },
    });
    if (!account?.refreshToken) return null;
    try {
      return await this.refreshAccessToken(account.refreshToken);
    } catch (err: any) {
      this.log.warn(
        `${this.providerName} token refresh failed for userId=${userId}: ${err?.message ?? err}`,
      );
      return null;
    }
  }

  protected abstract refreshAccessToken(refreshToken: string): Promise<string>;

  abstract listEmails(accessToken: string, options?: {
    maxResults?: number;
    filter?: string;
    search?: string;
    userEmail?: string;
  }): Promise<ParsedEmail[]>;
  abstract getMessage(accessToken: string, messageId: string): Promise<ParsedEmail>;
}