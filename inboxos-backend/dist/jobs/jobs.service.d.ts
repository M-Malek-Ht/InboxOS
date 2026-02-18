import { Repository } from 'typeorm';
import { JobEntity } from './job.entity';
export declare class JobsService {
    private readonly repo;
    constructor(repo: Repository<JobEntity>);
    create(type: string, payload: Record<string, any>): Promise<JobEntity>;
    findById(id: string): Promise<JobEntity>;
    markProcessing(id: string): Promise<void>;
    markDone(id: string, result: Record<string, any>): Promise<void>;
    markFailed(id: string, error: string): Promise<void>;
}
