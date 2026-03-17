import { EmailsService } from './emails.service';
import { JobRunnerService } from '../jobs/job-runner.service';
export declare class EmailsController {
    private readonly emails;
    private readonly runner;
    constructor(emails: EmailsService, runner: JobRunnerService);
    list(req: any, filter?: string, search?: string, limit?: string): Promise<{
        id: string;
    }[]>;
    listSent(req: any, search?: string, limit?: string): Promise<any>;
    listTrash(req: any, search?: string, limit?: string): Promise<any>;
    getThread(id: string, req: any): Promise<any[]>;
    get(id: string, req: any): Promise<any>;
    setRead(id: string, body: {
        isRead: boolean;
    }, req: any): Promise<any>;
    classifyBatch(body: {
        emailIds: string[];
    }, req: any): Promise<{
        jobId: null;
        count: number;
    } | {
        jobId: string;
        count: number;
    }>;
    permanentDelete(id: string, req: any): Promise<{
        ok: boolean;
    }>;
    delete(id: string, req: any): Promise<{
        ok: boolean;
    }>;
    untrash(id: string, req: any): Promise<{
        ok: boolean;
        provider: "provider" | "local";
    }>;
    reply(id: string, body: {
        body: string;
        draftId?: string;
    }, req: any): Promise<{
        ok: boolean;
        provider: "gmail";
    } | {
        ok: boolean;
        provider: "microsoft";
    } | {
        ok: boolean;
        provider: "local";
    }>;
    classify(id: string, req: any): Promise<{
        jobId: string;
    }>;
}
