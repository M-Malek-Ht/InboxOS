import { DraftsService } from './drafts.service';
import { CreateDraftDto } from './dto/create-draft.dto';
import { JobRunnerService } from '../jobs/job-runner.service';
export declare class DraftsController {
    private readonly drafts;
    private readonly runner;
    private static readonly MAX_FROM_CHARS;
    private static readonly MAX_SUBJECT_CHARS;
    private static readonly MAX_BODY_CHARS;
    constructor(drafts: DraftsService, runner: JobRunnerService);
    list(emailId: string, req: any): Promise<import("./draft.entity").DraftEntity[]>;
    create(emailId: string, req: any, dto: CreateDraftDto): Promise<import("./draft.entity").DraftEntity | {
        jobId: string;
    }>;
    private sanitizePromptField;
}
