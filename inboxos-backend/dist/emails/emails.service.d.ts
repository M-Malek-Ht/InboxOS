import { Repository } from 'typeorm';
import { EmailEntity } from './email.entity';
import { EmailInsightEntity } from './email-insight.entity';
import { DraftEntity } from '../drafts/draft.entity';
import { User } from '../users/entities/user.entity';
import { GmailService } from './gmail.service';
import { ParsedEmail } from './email.types';
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
    private resolveProviderClient;
    listForUser(userId: string, options?: {
        filter?: string;
        search?: string;
        limit?: number;
    }): Promise<ParsedEmail[] | EmailEntity[]>;
    getForUser(userId: string, emailId: string): Promise<EmailEntity | ParsedEmail | null>;
    getManyForUser(userId: string, emailIds: string[]): Promise<ParsedEmail[] | EmailEntity[]>;
    setReadState(userId: string, emailId: string, isRead: boolean): Promise<EmailEntity | {
        ok: boolean;
    } | null>;
    updatePriorityScore(userId: string, emailId: string, priorityScore: number): Promise<EmailEntity | ParsedEmail>;
    getThread(userId: string, emailId: string): Promise<ParsedEmail[] | EmailEntity[]>;
    sendReply(userId: string, emailId: string, body: string, draftId?: string): Promise<{
        ok: boolean;
        provider: "gmail";
    } | {
        ok: boolean;
        provider: "microsoft";
    } | {
        ok: boolean;
        provider: "local";
    }>;
    listSentForUser(userId: string, options?: {
        search?: string;
        limit?: number;
    }): Promise<ParsedEmail[] | EmailEntity[]>;
    listTrashForUser(userId: string, options?: {
        search?: string;
        limit?: number;
    }): Promise<EmailEntity[]>;
    untrashEmail(userId: string, emailId: string): Promise<{
        ok: boolean;
        provider: "provider" | "local";
    }>;
    permanentDeleteEmail(userId: string, emailId: string): Promise<{
        ok: boolean;
    }>;
    deleteEmail(userId: string, emailId: string): Promise<{
        ok: boolean;
    }>;
    private saveLocalCopy;
    private syncProviderEmailsToLocal;
    private applyEmailFilters;
    private getEmailMeta;
    private attachInsights;
    private attachInsight;
    getUnclassifiedIds(userId: string, emailIds: string[]): Promise<string[]>;
    private seedIfEmpty;
}
