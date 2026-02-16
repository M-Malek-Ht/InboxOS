import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JobEntity } from './job.entity';

@Injectable()
export class JobsService {
  constructor(
    @InjectRepository(JobEntity)
    private readonly repo: Repository<JobEntity>,
  ) {}

  /** Create a new job row and return it immediately. */
  async create(type: string, payload: Record<string, any>): Promise<JobEntity> {
    const job = this.repo.create({ type, payload, status: 'queued' });
    return this.repo.save(job);
  }

  /** Poll-friendly: return the current state of a job. */
  async findById(id: string): Promise<JobEntity> {
    const job = await this.repo.findOne({ where: { id } });
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
