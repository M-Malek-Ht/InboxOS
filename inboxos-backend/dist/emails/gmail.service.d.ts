import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { Account } from '../auth/account.entity';
import { ParsedEmail } from './email.types';
import { EmailProviderService } from './email-provider.service';
export declare class GmailService extends EmailProviderService {
    get providerName(): string;
    constructor(accountRepo: Repository<Account>, configService: ConfigService);
    protected refreshAccessToken(refreshToken: string): Promise<string>;
    listEmails(accessToken: string, options?: {
        maxResults?: number;
        filter?: string;
        search?: string;
        userEmail?: string;
    }): Promise<ParsedEmail[]>;
    getMessage(accessToken: string, messageId: string): Promise<ParsedEmail>;
    markAsRead(accessToken: string, messageId: string): Promise<void>;
    markAsUnread(accessToken: string, messageId: string): Promise<void>;
    private getUserProfile;
    getThread(accessToken: string, threadId: string): Promise<ParsedEmail[]>;
    private fetchThread;
    sendReply(accessToken: string, params: {
        to: string;
        subject: string;
        body: string;
        threadId?: string;
        inReplyTo?: string;
    }): Promise<{
        id: string;
    }>;
    private removeFromInbox;
    listSentEmails(accessToken: string, options?: {
        maxResults?: number;
        search?: string;
    }): Promise<ParsedEmail[]>;
    listTrashEmails(accessToken: string, options?: {
        maxResults?: number;
        search?: string;
    }): Promise<ParsedEmail[]>;
    untrashMessage(accessToken: string, messageId: string): Promise<void>;
    trashMessage(accessToken: string, messageId: string): Promise<void>;
    permanentlyDeleteMessage(accessToken: string, messageId: string): Promise<void>;
    private fetchAndParse;
    private setReadState;
    private parseMessage;
    private extractBody;
    private decodeBase64Url;
}
