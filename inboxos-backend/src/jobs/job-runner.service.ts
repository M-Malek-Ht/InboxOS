import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { JobsService } from './jobs.service';
import { AiService } from '../ai/ai.service';
import { DraftEntity } from '../drafts/draft.entity';
import { EmailInsightEntity } from '../emails/email-insight.entity';
import { SettingsService } from '../settings/settings.service';

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
    private readonly settingsService: SettingsService,
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
        case 'classify-batch':
          result = await this.handleClassifyBatch(jobId, payload);
          break;
        case 'draft':
          result = await this.handleDraft(payload);
          break;
        case 'auto-draft-batch':
          result = await this.handleAutoDraftBatch(jobId, payload);
          break;
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

  private async handleClassifyBatch(jobId: string, payload: Record<string, any>) {
    const { userId, items } = payload as {
      userId: string;
      items: { emailId: string; from: string; subject: string; body: string }[];
    };

    let classified = 0;
    let failed = 0;

    for (const item of items) {
      try {
        const result = await this.ai.classifyEmail({
          from: item.from,
          subject: item.subject,
          body: item.body,
        });

        await this.insightsRepo.upsert(
          {
            userId,
            emailId: item.emailId,
            category: result.category,
            priorityScore: result.priorityScore,
            needsReply: result.needsReply,
            tags: result.tags,
            summary: result.summary,
          },
          ['userId', 'emailId'],
        );
        classified++;
        this.log.log(`Batch ${jobId}: classified ${classified}/${items.length} (${item.emailId})`);
      } catch (err: any) {
        failed++;
        this.log.warn(`Batch ${jobId}: failed ${item.emailId}: ${err.message}`);
      }

      // Small delay between requests to stay within rate limits
      if (classified + failed < items.length) {
        await new Promise((r) => setTimeout(r, 1500));
      }
    }

    // After classification, auto-draft replies for emails that need them
    try {
      const needsReplyInsights = await this.insightsRepo.find({
        where: {
          userId,
          needsReply: true,
          emailId: In(items.map((i) => i.emailId)),
        },
      });

      if (needsReplyInsights.length > 0) {
        const autoDraftItems = items.filter((item) =>
          needsReplyInsights.some((insight) => insight.emailId === item.emailId),
        );

        if (autoDraftItems.length > 0) {
          this.log.log(`Batch ${jobId}: enqueuing auto-draft for ${autoDraftItems.length} emails`);
          this.enqueue('auto-draft-batch', { userId, items: autoDraftItems }).catch((err) =>
            this.log.warn(`Failed to enqueue auto-draft-batch: ${err.message}`),
          );
        }
      }
    } catch (err: any) {
      this.log.warn(`Batch ${jobId}: auto-draft trigger failed: ${err.message}`);
    }

    return { classified, failed, total: items.length };
  }

  private async handleAutoDraftBatch(jobId: string, payload: Record<string, any>) {
    const { userId, items } = payload as {
      userId: string;
      items: { emailId: string; from: string; subject: string; body: string }[];
    };

    const settings = await this.settingsService.getForUser(userId);
    const tone = settings.defaultTone || 'Professional';
    const length = settings.defaultLength || 'Medium';

    let drafted = 0;
    let skipped = 0;

    for (const item of items) {
      // Skip if a draft already exists for this email
      const existingDraft = await this.draftsRepo.findOne({
        where: { emailId: item.emailId },
      });
      if (existingDraft) {
        skipped++;
        continue;
      }

      try {
        const content = await this.ai.generateDraft(
          { from: item.from, subject: item.subject, body: item.body },
          { tone, length },
        );

        const draft = this.draftsRepo.create({
          emailId: item.emailId,
          content,
          version: 1,
          tone,
          length,
          status: 'draft',
        });
        await this.draftsRepo.save(draft);
        drafted++;
        this.log.log(`Auto-draft ${jobId}: drafted ${drafted} (${item.emailId})`);
      } catch (err: any) {
        this.log.warn(`Auto-draft ${jobId}: failed ${item.emailId}: ${err.message}`);
      }

      // Rate limit delay
      if (drafted + skipped < items.length) {
        await new Promise((r) => setTimeout(r, 1500));
      }
    }

    return { drafted, skipped, total: items.length };
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
