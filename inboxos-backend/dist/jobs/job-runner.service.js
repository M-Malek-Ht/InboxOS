"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var JobRunnerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobRunnerService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const jobs_service_1 = require("./jobs.service");
const ai_service_1 = require("../ai/ai.service");
const draft_entity_1 = require("../drafts/draft.entity");
const email_insight_entity_1 = require("../emails/email-insight.entity");
const settings_service_1 = require("../settings/settings.service");
let JobRunnerService = class JobRunnerService {
    static { JobRunnerService_1 = this; }
    jobs;
    ai;
    settingsService;
    draftsRepo;
    insightsRepo;
    log = new common_1.Logger(JobRunnerService_1.name);
    static RATE_LIMIT_DELAY_MS = 1500;
    constructor(jobs, ai, settingsService, draftsRepo, insightsRepo) {
        this.jobs = jobs;
        this.ai = ai;
        this.settingsService = settingsService;
        this.draftsRepo = draftsRepo;
        this.insightsRepo = insightsRepo;
    }
    async enqueue(type, payload) {
        const userId = this.getUserIdFromPayload(payload);
        if (!userId) {
            throw new Error(`Missing userId in payload for job type: ${type}`);
        }
        const job = await this.jobs.create(type, payload, userId);
        this.log.log(`Job ${job.id} [${type}] queued`);
        this.process(job.id, type, payload).catch((err) => this.log.error(`Unhandled error in job ${job.id}: ${this.getErrorMessage(err)}`));
        return job.id;
    }
    async process(jobId, type, payload) {
        await this.jobs.markProcessing(jobId);
        try {
            let result;
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
        }
        catch (err) {
            const message = this.getErrorMessage(err);
            this.log.error(`Job ${jobId} [${type}] failed: ${message}`);
            await this.jobs.markFailed(jobId, message);
        }
    }
    async handleClassify(payload) {
        const { userId, emailId, from, subject, body } = payload;
        const result = await this.ai.classifyEmail({ from, subject, body });
        if (userId && emailId) {
            await this.insightsRepo.upsert({
                userId,
                emailId,
                category: result.category,
                priorityScore: result.priorityScore,
                needsReply: result.needsReply,
                tags: result.tags,
                summary: result.summary,
            }, ['userId', 'emailId']);
        }
        return result;
    }
    async handleClassifyBatch(jobId, payload) {
        const { userId, items } = payload;
        let classified = 0;
        let failed = 0;
        for (const [index, item] of items.entries()) {
            try {
                const result = await this.ai.classifyEmail({
                    from: item.from,
                    subject: item.subject,
                    body: item.body,
                });
                await this.insightsRepo.upsert({
                    userId,
                    emailId: item.emailId,
                    category: result.category,
                    priorityScore: result.priorityScore,
                    needsReply: result.needsReply,
                    tags: result.tags,
                    summary: result.summary,
                }, ['userId', 'emailId']);
                classified++;
                this.log.log(`Batch ${jobId}: classified ${classified}/${items.length} (${item.emailId})`);
            }
            catch (err) {
                failed++;
                this.log.warn(`Batch ${jobId}: failed ${item.emailId}: ${this.getErrorMessage(err)}`);
            }
            await this.waitBetweenItems(index, items.length);
        }
        try {
            const needsReplyInsights = await this.insightsRepo.find({
                where: {
                    userId,
                    needsReply: true,
                    emailId: (0, typeorm_2.In)(items.map((i) => i.emailId)),
                },
            });
            if (needsReplyInsights.length > 0) {
                const needsReplyIds = new Set(needsReplyInsights.map((insight) => insight.emailId));
                const autoDraftItems = items.filter((item) => needsReplyIds.has(item.emailId));
                if (autoDraftItems.length > 0) {
                    this.log.log(`Batch ${jobId}: enqueuing auto-draft for ${autoDraftItems.length} emails`);
                    this.enqueue('auto-draft-batch', { userId, items: autoDraftItems }).catch((err) => this.log.warn(`Failed to enqueue auto-draft-batch: ${this.getErrorMessage(err)}`));
                }
            }
        }
        catch (err) {
            this.log.warn(`Batch ${jobId}: auto-draft trigger failed: ${this.getErrorMessage(err)}`);
        }
        return { classified, failed, total: items.length };
    }
    async handleAutoDraftBatch(jobId, payload) {
        const { userId, items } = payload;
        const settings = await this.settingsService.getForUser(userId);
        const tone = settings.defaultTone || 'Professional';
        const length = settings.defaultLength || 'Medium';
        const existingDrafts = await this.draftsRepo.find({
            select: ['emailId'],
            where: {
                userId,
                status: 'draft',
                emailId: (0, typeorm_2.In)(items.map((item) => item.emailId)),
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
                const content = await this.ai.generateDraft({ from: item.from, subject: item.subject, body: item.body }, { tone, length });
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
            }
            catch (err) {
                this.log.warn(`Auto-draft ${jobId}: failed ${item.emailId}: ${this.getErrorMessage(err)}`);
            }
            await this.waitBetweenItems(index, items.length);
        }
        return { drafted, skipped, total: items.length };
    }
    async handleDraft(payload) {
        const { userId, emailId, from, subject, body, tone, length, instruction } = payload;
        const content = await this.ai.generateDraft({ from, subject, body }, { tone: tone ?? 'Professional', length: length ?? 'Medium', instruction });
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
    async waitBetweenItems(index, total) {
        if (index < total - 1) {
            await new Promise((resolve) => setTimeout(resolve, JobRunnerService_1.RATE_LIMIT_DELAY_MS));
        }
    }
    getUserIdFromPayload(payload) {
        const userId = payload?.userId;
        return typeof userId === 'string' && userId.length > 0 ? userId : null;
    }
    getErrorMessage(err) {
        if (!err)
            return 'unknown error';
        if (err instanceof Error) {
            return err.message;
        }
        if (typeof err === 'object') {
            const maybeErr = err;
            const nested = maybeErr.error;
            if (typeof nested?.message === 'string')
                return nested.message;
            if (typeof maybeErr.message === 'string')
                return maybeErr.message;
        }
        return String(err);
    }
};
exports.JobRunnerService = JobRunnerService;
exports.JobRunnerService = JobRunnerService = JobRunnerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(3, (0, typeorm_1.InjectRepository)(draft_entity_1.DraftEntity)),
    __param(4, (0, typeorm_1.InjectRepository)(email_insight_entity_1.EmailInsightEntity)),
    __metadata("design:paramtypes", [jobs_service_1.JobsService,
        ai_service_1.AiService,
        settings_service_1.SettingsService,
        typeorm_2.Repository,
        typeorm_2.Repository])
], JobRunnerService);
//# sourceMappingURL=job-runner.service.js.map