import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { Account } from '../auth/account.entity';
import { ParsedEmail } from './email.types';
export declare abstract class EmailProviderService {
    protected accountRepo: Repository<Account>;
    protected configService: ConfigService;
    protected readonly log: Logger;
    constructor(accountRepo: Repository<Account>, configService: ConfigService);
    abstract get providerName(): string;
    getAccessTokenForUser(userId: string): Promise<string | null>;
    protected abstract refreshAccessToken(refreshToken: string): Promise<string>;
    abstract listEmails(accessToken: string, options?: {
        maxResults?: number;
        filter?: string;
        search?: string;
        userEmail?: string;
    }): Promise<ParsedEmail[]>;
    abstract getMessage(accessToken: string, messageId: string): Promise<ParsedEmail>;
}
