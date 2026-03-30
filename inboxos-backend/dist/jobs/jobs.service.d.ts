import { OnApplicationBootstrap } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { JobEntity } from './job.entity';
export declare class JobsService implements OnApplicationBootstrap {
    private readonly repo;
    private readonly dataSource;
    private readonly log;
    constructor(repo: Repository<JobEntity>, dataSource: DataSource);
    onApplicationBootstrap(): Promise<void>;
    create(type: string, payload: Record<string, any>, userId?: string): Promise<JobEntity>;
    findById(id: string): Promise<JobEntity>;
    findByIdForUser(id: string, userId: string): Promise<JobEntity>;
    markProcessing(id: string): Promise<void>;
    markDone(id: string, result: Record<string, any>): Promise<void>;
    markFailed(id: string, error: string): Promise<void>;
}
