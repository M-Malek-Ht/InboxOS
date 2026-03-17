import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { Account } from '../auth/account.entity';
import { ParsedEmail } from './email.types';
import { EmailProviderService } from './email-provider.service';
export declare class MicrosoftMailService extends EmailProviderService {
    constructor(accountRepo: Repository<Account>, configService: ConfigService);
    get providerName(): string;
    protected refreshAccessToken(refreshToken: string): Promise<string>;
    listEmails(accessToken: string, options?: {
        maxResults?: number;
        filter?: string;
        search?: string;
    }): Promise<ParsedEmail[]>;
    getMessage(accessToken: string, messageId: string): Promise<ParsedEmail>;
    markAsRead(accessToken: string, messageId: string): Promise<void>;
    markAsUnread(accessToken: string, messageId: string): Promise<void>;
    sendReply(accessToken: string, messageId: string, body: string): Promise<void>;
    listSentEmails(accessToken: string, options?: {
        maxResults?: number;
        search?: string;
    }): Promise<ParsedEmail[]>;
    listTrashEmails(accessToken: string, options?: {
        maxResults?: number;
        search?: string;
    }): Promise<ParsedEmail[]>;
    untrashMessage(accessToken: string, messageId: string): Promise<void>;
    deleteMessage(accessToken: string, messageId: string): Promise<void>;
    private setReadState;
    private parseMessage;
}
