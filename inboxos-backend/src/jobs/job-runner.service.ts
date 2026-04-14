import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { JobsService } from './jobs.service';
import { AiService } from '../ai/ai.service';
import { DraftEntity } from '../drafts/draft.entity';
import { EmailInsightEntity } from '../emails/email-insight.entity';
import { SettingsService } from '../settings/settings.service';

@Injectable()
export class JobRunnerService {
  private readonly log = new Logger(JobRunnerService.name);
  private static readonly RATE_LIMIT_DELAY_MS = 1500;

  constructor(
    private readonly jobs: JobsService,
    private readonly ai: AiService,
    private readonly settingsService: SettingsService,
    @InjectRepository(DraftEntity)
    private readonly draftsRepo: Repository<DraftEntity>,
    @InjectRepository(EmailInsightEntity)
    private readonly insightsRepo: Repository<EmailInsightEntity>,
  ) {}

  async enqueue(type: string, payload: Record<string, any>): Promise<string> {
    const userId = this.getUserIdFromPayload(payload);
    if (!userId) {
      throw new Error(`Missing userId in payload for job type: ${type}`);
    }

    const job = await this.jobs.create(type, payload, userId);
    this.log.log(`Job ${job.id} [${type}] queued`);

    this.process(job.id, type, payload).catch((err: any) =>
      this.log.error(
        `Unhandled error in job ${job.id}: ${this.getErrorMessage(err)}`,
      ),
    );

    return job.id;
  }

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
      const message = this.getErrorMessage(err);
      this.log.error(`Job ${jobId} [${type}] failed: ${message}`);
      await this.jobs.markFailed(jobId, message);
    }
  }

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

    for (const [index, item] of items.entries()) {
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
        this.log.log(
          `Batch ${jobId}: classified ${classified}/${items.length} (${item.emailId})`,
        );
      } catch (err: any) {
        failed++;
        this.log.warn(
          `Batch ${jobId}: failed ${item.emailId}: ${this.getErrorMessage(err)}`,
        );
      }

      await this.waitBetweenItems(index, items.length);
    }

    try {
      const needsReplyInsights = await this.insightsRepo.find({
        where: {
          userId,
          needsReply: true,
          emailId: In(items.map((i) => i.emailId)),
        },
      });

      if (needsReplyInsights.length > 0) {
        const needsReplyIds = new Set(
          needsReplyInsights.map((insight) => insight.emailId),
        );
        const autoDraftItems = items.filter((item) =>
          needsReplyIds.has(item.emailId),
        );

        if (autoDraftItems.length > 0) {
          this.log.log(
            `Batch ${jobId}: enqueuing auto-draft for ${autoDraftItems.length} emails`,
          );
          this.enqueue('auto-draft-batch', { userId, items: autoDraftItems }).catch(
            (err) =>
              this.log.warn(
                `Failed to enqueue auto-draft-batch: ${this.getErrorMessage(err)}`,
              ),
          );
        }
      }
    } catch (err: any) {
      this.log.warn(
        `Batch ${jobId}: auto-draft trigger failed: ${this.getErrorMessage(err)}`,
      );
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

    const existingDrafts = await this.draftsRepo.find({
      select: ['emailId'],
      where: {
        userId,
        status: 'draft',
        emailId: In(items.map((item) => item.emailId)),
      },
    });
    const existingDraftIds = new Set(existingDrafts.map((draft) => draft.emailId));

    let drafted = 0;
    let skipped = 0;

    for (const [index, item] of items.entries()) {
      if (existingDraftIds.has(item.emailId)) {
        skipped++;
        continue;
      }

      try {
        const content = await this.ai.generateDraft(
          { from: item.from, subject: item.subject, body: item.body },
          { tone, length },
        );

        const draft = this.draftsRepo.create({
          userId,
          emailId: item.emailId,
          content,
          version: 1,
          tone,
          length,
          status: 'draft',
        });
        await this.draftsRepo.save(draft);
        existingDraftIds.add(item.emailId);
        drafted++;
        this.log.log(`Auto-draft ${jobId}: drafted ${drafted} (${item.emailId})`);
      } catch (err: any) {
        this.log.warn(
          `Auto-draft ${jobId}: failed ${item.emailId}: ${this.getErrorMessage(err)}`,
        );
      }

      await this.waitBetweenItems(index, items.length);
    }

    return { drafted, skipped, total: items.length };
  }

  private async handleDraft(payload: Record<string, any>) {
    const { userId, emailId, from, subject, body, tone, length, instruction } =
      payload;

    const content = await this.ai.generateDraft(
      { from, subject, body },
      { tone: tone ?? 'Professional', length: length ?? 'Medium', instruction },
    );

    const latestDraft = await this.draftsRepo.findOne({
      where: { userId, emailId },
      order: { version: 'DESC' },
    });
    const nextVersion = (latestDraft?.version ?? 0) + 1;

    const draft = this.draftsRepo.create({
      userId,
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

  private async waitBetweenItems(index: number, total: number): Promise<void> {
    if (index < total - 1) {
      await new Promise((resolve) =>
        setTimeout(resolve, JobRunnerService.RATE_LIMIT_DELAY_MS),
      );
    }
  }

  private getUserIdFromPayload(payload: Record<string, any>): string | null {
    const userId = payload?.userId;
    return typeof userId === 'string' && userId.length > 0 ? userId : null;
  }

  private getErrorMessage(err: unknown): string {
    if (!err) return 'unknown error';

    if (err instanceof Error) {
      return err.message;
    }

    if (typeof err === 'object') {
      const maybeErr = err as Record<string, unknown>;
      const nested = maybeErr.error as Record<string, unknown> | undefined;
      if (typeof nested?.message === 'string') return nested.message;
      if (typeof maybeErr.message === 'string') return maybeErr.message;
    }

    return String(err);
  }
}
