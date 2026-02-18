import { ConfigService } from '@nestjs/config';
export interface ClassifyResult {
    category: 'Meetings' | 'Work' | 'Personal' | 'Bills' | 'Newsletters' | 'Support' | 'Other';
    priorityScore: number;
    needsReply: boolean;
    tags: string[];
    summary: string;
}
export interface GenerateDraftOptions {
    tone: string;
    length: string;
    instruction?: string;
}
export declare class AiService {
    private configService;
    private client;
    private models;
    constructor(configService: ConfigService);
    classifyEmail(email: {
        from: string;
        subject: string;
        body: string;
    }): Promise<ClassifyResult>;
    generateDraft(email: {
        from: string;
        subject: string;
        body: string;
    }, options: GenerateDraftOptions): Promise<string>;
    private createUserMessage;
    private callWithRetry;
    private isModelAccessError;
    private getErrorMessage;
}
