import { JobsService } from './jobs.service';
export declare class JobsController {
    private readonly jobs;
    constructor(jobs: JobsService);
    get(id: string): Promise<{
        id: string;
        type: string;
        status: string;
        result: Record<string, any> | null;
        error: string | null;
    }>;
}
