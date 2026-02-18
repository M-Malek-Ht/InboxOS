import { Repository } from 'typeorm';
import { DraftEntity } from './draft.entity';
import { EmailEntity } from '../emails/email.entity';
import { CreateDraftDto } from './dto/create-draft.dto';
export declare class DraftsService {
    private readonly draftsRepo;
    private readonly emailsRepo;
    constructor(draftsRepo: Repository<DraftEntity>, emailsRepo: Repository<EmailEntity>);
    findEmailOrNull(emailId: string): Promise<EmailEntity | null>;
    listByEmail(emailId: string): Promise<DraftEntity[]>;
    listLatestDrafts(): Promise<DraftEntity[]>;
    createDirectDraft(emailId: string, dto: CreateDraftDto): Promise<DraftEntity>;
}
