import { Injectable, Logger, NotFoundException, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { JobEntity } from './job.entity';

@Injectable()
export class JobsService implements OnApplicationBootstrap {
  private readonly log = new Logger(JobsService.name);

  constructor(
    @InjectRepository(JobEntity)
    private readonly repo: Repository<JobEntity>,
    private readonly dataSource: DataSource,
  ) {}

  /** Ensure schema columns exist — runs on every startup, bypasses migration tracking. */
  async onApplicationBootstrap(): Promise<void> {
    try {
      await this.dataSource.query(
        `ALTER TABLE jobs ADD COLUMN IF NOT EXISTS "userId" uuid;`,
      );
      await this.dataSource.query(
        `CREATE INDEX IF NOT EXISTS "IDX_jobs_userId" ON jobs ("userId");`,
      );
      this.log.log('jobs.userId column ensured');
    } catch (err: any) {
      this.log.error(`Failed to ensure jobs.userId column: ${err?.message ?? err}`);
    }
  }

  /** Create a new job row and return it immediately. */
  async create(type: string, payload: Record<string, any>, userId?: string): Promise<JobEntity> {
    const job = this.repo.create({
      type,
      payload,
      userId: userId ?? null,
      status: 'queued',
    });
    return this.repo.save(job);
  }

  /** Poll-friendly: return the current state of a job. */
  async findById(id: string): Promise<JobEntity> {
    const job = await this.repo.findOne({ where: { id } });
    if (!job) throw new NotFoundException('Job not found');
    return job;
  }

  /** Poll-friendly and ownership-safe lookup. */
  async findByIdForUser(id: string, userId: string): Promise<JobEntity> {
    const job = await this.repo.findOne({ where: { id, userId } });
    if (!job) throw new NotFoundException('Job not found');
    return job;
  }

  /** Mark a job as processing. */
  async markProcessing(id: string): Promise<void> {
    await this.repo.update(id, { status: 'processing' });
  }

  /** Mark a job as done with a result. */
  async markDone(id: string, result: Record<string, any>): Promise<void> {
    await this.repo.update(id, { status: 'done', result });
  }

  /** Mark a job as failed with an error message. */
  async markFailed(id: string, error: string): Promise<void> {
    await this.repo.update(id, { status: 'failed', error });
  }
}
