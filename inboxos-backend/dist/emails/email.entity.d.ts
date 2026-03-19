export declare class EmailEntity {
    id: string;
    userId: string;
    from: string;
    to: string;
    subject: string;
    snippet: string;
    body: string;
    isRead: boolean;
    isSent: boolean;
    isTrashed: boolean;
    receivedAt: Date;
    externalId: string | null;
}
