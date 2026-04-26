import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JobEntity } from './job.entity';

// Jobs stuck in 'processing' longer than this are assumed abandoned (Lambda died mid-run).
// Worst-case batch: 40 emails × (4s AI + 1.5s delay) ≈ 4 min. 10 min is a safe threshold.
const STALE_PROCESSING_MS = 10 * 60 * 1000;

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

  async findActiveByTypeAndUser(type: string, userId: string): Promise<JobEntity | null> {
    return this.repo.findOne({
      where: [
        { type, userId, status: 'queued' },
        { type, userId, status: 'processing' },
      ],
      order: { createdAt: 'DESC' },
    });
  }

  async findRecoverable(): Promise<JobEntity[]> {
    const staleThreshold = new Date(Date.now() - STALE_PROCESSING_MS);
    return this.repo
      .createQueryBuilder('job')
      .where('job.status = :queued', { queued: 'queued' })
      .orWhere('job.status = :processing AND job."updatedAt" < :threshold', {
        processing: 'processing',
        threshold: staleThreshold,
      })
      .orderBy('job.createdAt', 'ASC')
      .getMany();
  }
}
