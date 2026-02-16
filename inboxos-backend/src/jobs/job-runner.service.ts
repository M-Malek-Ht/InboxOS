import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JobsService } from './jobs.service';
import { AiService } from '../ai/ai.service';
import { DraftEntity } from '../drafts/draft.entity';
import { EmailInsightEntity } from '../emails/email-insight.entity';

/**
 * Central async job runner.
 *
 * Kicks off AI work in the background (non-blocking) and updates
 * the Job row as it progresses.  Every new job type you add
 * (workflows, calendar extraction, etc.) just needs a new case
 * in the dispatch switch.
 */
@Injectable()
export class JobRunnerService {
  private readonly log = new Logger(JobRunnerService.name);

  constructor(
    private readonly jobs: JobsService,
    private readonly ai: AiService,
    @InjectRepository(DraftEntity)
    private readonly draftsRepo: Repository<DraftEntity>,
    @InjectRepository(EmailInsightEntity)
    private readonly insightsRepo: Repository<EmailInsightEntity>,
  ) {}

  /**
   * Create a job row, fire-and-forget the processing, return the jobId
   * immediately so the controller can respond to the client.
   */
  async enqueue(type: string, payload: Record<string, any>): Promise<string> {
    const job = await this.jobs.create(type, payload);
    this.log.log(`Job ${job.id} [${type}] queued`);

    // fire-and-forget — intentionally not awaited
    this.process(job.id, type, payload).catch((err) =>
      this.log.error(`Unhandled error in job ${job.id}: ${err.message}`),
    );

    return job.id;
  }

  // ── internal dispatch ───────────────────────────────

  private async process(
    jobId: string,
    type: string,
    payload: Record<string, any>,
  ): Promise<void> {
    await this.jobs.markProcessing(jobId);

    try {
      let result: Record<string, any>;

      switch (type) {
        case 'classify':
          result = await this.handleClassify(payload);
          break;
        case 'draft':
          result = await this.handleDraft(payload);
          break;
        // Future: 'extractDates', 'workflow', 'calendarSuggestion', etc.
        default:
          throw new Error(`Unknown job type: ${type}`);
      }

      await this.jobs.markDone(jobId, result);
      this.log.log(`Job ${jobId} [${type}] done`);
    } catch (err: any) {
      this.log.error(`Job ${jobId} [${type}] failed: ${err.message}`);
      await this.jobs.markFailed(jobId, err.message);
    }
  }

  // ── handlers ────────────────────────────────────────

  private async handleClassify(payload: Record<string, any>) {
    const { userId, emailId, from, subject, body } = payload;
    const result = await this.ai.classifyEmail({ from, subject, body });

    if (userId && emailId) {
      await this.insightsRepo.upsert(
        {
          userId,
          emailId,
          category: result.category,
          priorityScore: result.priorityScore,
          needsReply: result.needsReply,
          tags: result.tags,
          summary: result.summary,
        },
        ['userId', 'emailId'],
      );
    }

    return result;
  }

  private async handleDraft(payload: Record<string, any>) {
    const { emailId, from, subject, body, tone, length, instruction } = payload;

    const content = await this.ai.generateDraft(
      { from, subject, body },
      { tone: tone ?? 'Professional', length: length ?? 'Medium', instruction },
    );

    // Auto-increment version for this email
    const latestDraft = await this.draftsRepo.findOne({
      where: { emailId },
      order: { version: 'DESC' },
    });
    const nextVersion = (latestDraft?.version ?? 0) + 1;

    // Persist the draft
    const draft = this.draftsRepo.create({
      emailId,
      content,
      version: nextVersion,
      tone: tone ?? 'Professional',
      length: length ?? 'Medium',
      instruction: instruction ?? null,
      status: 'draft',
    });
    const saved = await this.draftsRepo.save(draft);

    return {
      draftId: saved.id,
      version: saved.version,
      content: saved.content,
      tone: saved.tone,
      length: saved.length,
    };
  }
}
