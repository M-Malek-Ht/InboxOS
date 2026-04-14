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

  async create(
    type: string,
    payload: Record<string, any>,
    userId?: string,
  ): Promise<JobEntity> {
    const job = this.repo.create({
      type,
      payload,
      userId: userId ?? null,
      status: 'queued',
    });
    return this.repo.save(job);
  }

  async findById(id: string): Promise<JobEntity> {
    const job = await this.repo.findOne({ where: { id } });
    if (!job) throw new NotFoundException('Job not found');
    return job;
  }

  async findByIdForUser(id: string, userId: string): Promise<JobEntity> {
    const job = await this.repo.findOne({ where: { id, userId } });
    if (!job) throw new NotFoundException('Job not found');
    return job;
  }

  async markProcessing(id: string): Promise<void> {
    await this.repo.update(id, { status: 'processing' });
  }

  async markDone(id: string, result: Record<string, any>): Promise<void> {
    await this.repo.update(id, { status: 'done', result });
  }

  async markFailed(id: string, error: string): Promise<void> {
    await this.repo.update(id, { status: 'failed', error });
  }
}
