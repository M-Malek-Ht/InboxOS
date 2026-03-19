export declare class DraftEntity {
    id: string;
    userId: string;
    emailId: string;
    content: string;
    version: number;
    tone: string;
    length: string;
    instruction: string | null;
    status: 'draft' | 'sent';
    createdAt: Date;
}
