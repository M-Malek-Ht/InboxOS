import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { Account } from '../auth/account.entity';
import { ParsedEmail } from './gmail.service';
export declare class MicrosoftMailService {
    private accountRepo;
    private configService;
    constructor(accountRepo: Repository<Account>, configService: ConfigService);
    getAccessTokenForUser(userId: string): Promise<string | null>;
    private refreshAccessToken;
    listEmails(accessToken: string, options?: {
        maxResults?: number;
        filter?: string;
        search?: string;
    }): Promise<ParsedEmail[]>;
    getMessage(accessToken: string, messageId: string): Promise<ParsedEmail>;
    markAsRead(accessToken: string, messageId: string): Promise<void>;
    markAsUnread(accessToken: string, messageId: string): Promise<void>;
    sendReply(accessToken: string, messageId: string, body: string): Promise<void>;
    listSentEmails(_accessToken: string, _options?: {
        maxResults?: number;
        search?: string;
    }): Promise<ParsedEmail[]>;
    listTrashEmails(_accessToken: string, _options?: {
        maxResults?: number;
        search?: string;
    }): Promise<ParsedEmail[]>;
    untrashMessage(_accessToken: string, _messageId: string): Promise<void>;
    deleteMessage(accessToken: string, messageId: string): Promise<void>;
    private setReadState;
    private parseMessage;
}
