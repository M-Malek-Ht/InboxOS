import { OnApplicationBootstrap } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { DraftEntity } from './draft.entity';
import { EmailEntity } from '../emails/email.entity';
import { CreateDraftDto } from './dto/create-draft.dto';
export declare class DraftsService implements OnApplicationBootstrap {
    private readonly draftsRepo;
    private readonly emailsRepo;
    private readonly dataSource;
    private readonly log;
    constructor(draftsRepo: Repository<DraftEntity>, emailsRepo: Repository<EmailEntity>, dataSource: DataSource);
    onApplicationBootstrap(): Promise<void>;
    findEmailOrNull(userId: string, emailId: string): Promise<EmailEntity | null>;
    listByEmail(userId: string, emailId: string): Promise<DraftEntity[]>;
    listLatestDrafts(userId: string): Promise<DraftEntity[]>;
    createDirectDraft(userId: string, emailId: string, dto: CreateDraftDto): Promise<DraftEntity>;
    markAsSent(userId: string, draftId: string): Promise<void>;
}
