import { Repository } from 'typeorm';
import { JobsService } from './jobs.service';
import { AiService } from '../ai/ai.service';
import { DraftEntity } from '../drafts/draft.entity';
import { EmailInsightEntity } from '../emails/email-insight.entity';
import { SettingsService } from '../settings/settings.service';
export declare class JobRunnerService {
    private readonly jobs;
    private readonly ai;
    private readonly settingsService;
    private readonly draftsRepo;
    private readonly insightsRepo;
    private readonly log;
    constructor(jobs: JobsService, ai: AiService, settingsService: SettingsService, draftsRepo: Repository<DraftEntity>, insightsRepo: Repository<EmailInsightEntity>);
    enqueue(type: string, payload: Record<string, any>): Promise<string>;
    private process;
    private handleClassify;
    private handleClassifyBatch;
    private handleAutoDraftBatch;
    private handleDraft;
}
