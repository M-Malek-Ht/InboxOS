import { Repository } from 'typeorm';
import { DraftEntity } from './draft.entity';
import { EmailEntity } from '../emails/email.entity';
import { CreateDraftDto } from './dto/create-draft.dto';
export declare class DraftsService {
    private readonly draftsRepo;
    private readonly emailsRepo;
    constructor(draftsRepo: Repository<DraftEntity>, emailsRepo: Repository<EmailEntity>);
    findEmailOrNull(userId: string, emailId: string): Promise<EmailEntity | null>;
    listByEmail(userId: string, emailId: string): Promise<DraftEntity[]>;
    listLatestDrafts(userId: string): Promise<DraftEntity[]>;
    createDirectDraft(userId: string, emailId: string, dto: CreateDraftDto): Promise<DraftEntity>;
    markAsSent(userId: string, draftId: string): Promise<void>;
}
