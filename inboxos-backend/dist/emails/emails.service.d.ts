import { Repository } from 'typeorm';
import { EmailEntity } from './email.entity';
import { EmailInsightEntity } from './email-insight.entity';
import { DraftEntity } from '../drafts/draft.entity';
import { User } from '../users/entities/user.entity';
import { GmailService } from './gmail.service';
import { MicrosoftMailService } from './microsoft-mail.service';
export declare class EmailsService {
    private readonly repo;
    private readonly insightsRepo;
    private readonly draftsRepo;
    private readonly usersRepo;
    private readonly gmail;
    private readonly microsoftMail;
    private readonly log;
    constructor(repo: Repository<EmailEntity>, insightsRepo: Repository<EmailInsightEntity>, draftsRepo: Repository<DraftEntity>, usersRepo: Repository<User>, gmail: GmailService, microsoftMail: MicrosoftMailService);
    listForUser(userId: string, options?: {
        filter?: string;
        search?: string;
        limit?: number;
    }): Promise<EmailEntity[]>;
    getForUser(userId: string, emailId: string): Promise<EmailEntity | null>;
    setReadState(userId: string, emailId: string, isRead: boolean): Promise<EmailEntity | {
        ok: boolean;
    } | null>;
    getThread(userId: string, emailId: string): Promise<EmailEntity[]>;
    sendReply(userId: string, emailId: string, body: string): Promise<{
        ok: boolean;
        provider: "gmail";
    } | {
        ok: boolean;
        provider: "microsoft";
    }>;
    listSentForUser(userId: string, options?: {
        search?: string;
        limit?: number;
    }): Promise<import("./gmail.service").ParsedEmail[]>;
    listTrashForUser(userId: string, options?: {
        search?: string;
        limit?: number;
    }): Promise<import("./gmail.service").ParsedEmail[]>;
    untrashEmail(userId: string, emailId: string): Promise<{
        ok: boolean;
        provider: "gmail";
    } | {
        ok: boolean;
        provider: "microsoft";
    } | {
        ok: boolean;
        provider?: undefined;
    }>;
    deleteEmail(userId: string, emailId: string): Promise<{
        ok: boolean;
    }>;
    private attachInsights;
    private attachInsight;
    getUnclassifiedIds(userId: string, emailIds: string[]): Promise<string[]>;
    private seedIfEmpty;
}
