import { EmailsService } from './emails.service';
import { JobRunnerService } from '../jobs/job-runner.service';
export declare class EmailsController {
    private readonly emails;
    private readonly runner;
    constructor(emails: EmailsService, runner: JobRunnerService);
    list(req: any, filter?: string, search?: string, limit?: string): Promise<import("./email.entity").EmailEntity[]>;
    listSent(req: any, search?: string, limit?: string): Promise<import("./gmail.service").ParsedEmail[]>;
    listTrash(req: any, search?: string, limit?: string): Promise<import("./gmail.service").ParsedEmail[]>;
    getThread(id: string, req: any): Promise<import("./email.entity").EmailEntity[]>;
    get(id: string, req: any): Promise<import("./email.entity").EmailEntity>;
    setRead(id: string, body: {
        isRead: boolean;
    }, req: any): Promise<import("./email.entity").EmailEntity | {
        ok: boolean;
    } | null>;
    classifyBatch(body: {
        emailIds: string[];
    }, req: any): Promise<{
        jobId: null;
        count: number;
    } | {
        jobId: string;
        count: number;
    }>;
    delete(id: string, req: any): Promise<{
        ok: boolean;
    }>;
    untrash(id: string, req: any): Promise<{
        ok: boolean;
        provider: "gmail";
    } | {
        ok: boolean;
        provider: "microsoft";
    } | {
        ok: boolean;
        provider?: undefined;
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
    }>;
    classify(id: string, req: any): Promise<{
        jobId: string;
    }>;
}
