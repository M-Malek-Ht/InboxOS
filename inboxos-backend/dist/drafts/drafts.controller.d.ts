import { DraftsService } from './drafts.service';
import { CreateDraftDto } from './dto/create-draft.dto';
import { JobRunnerService } from '../jobs/job-runner.service';
export declare class DraftsController {
    private readonly drafts;
    private readonly runner;
    constructor(drafts: DraftsService, runner: JobRunnerService);
    list(emailId: string): any;
    create(emailId: string, dto: CreateDraftDto): Promise<any>;
}
