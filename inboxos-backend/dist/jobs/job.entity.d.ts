export declare class JobEntity {
    id: string;
    type: string;
    status: string;
    payload: Record<string, any> | null;
    result: Record<string, any> | null;
    error: string | null;
    createdAt: Date;
    updatedAt: Date;
}
