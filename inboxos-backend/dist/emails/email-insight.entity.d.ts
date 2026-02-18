export declare class EmailInsightEntity {
    id: string;
    userId: string;
    emailId: string;
    category: string;
    priorityScore: number;
    needsReply: boolean;
    tags: string[];
    summary: string;
    createdAt: Date;
    updatedAt: Date;
}
