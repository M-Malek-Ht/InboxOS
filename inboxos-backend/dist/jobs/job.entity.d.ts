export declare class JobEntity {
    id: string;
    userId: string | null;
    type: string;
    status: string;
    payload: Record<string, any> | null;
    result: Record<string, any> | null;
    error: string | null;
    createdAt: Date;
    updatedAt: Date;
}
