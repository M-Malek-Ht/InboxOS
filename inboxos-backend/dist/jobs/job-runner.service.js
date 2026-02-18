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
let JobRunnerService = JobRunnerService_1 = class JobRunnerService {
    jobs;
    ai;
    settingsService;
    draftsRepo;
    insightsRepo;
    log = new common_1.Logger(JobRunnerService_1.name);
    constructor(jobs, ai, settingsService, draftsRepo, insightsRepo) {
        this.jobs = jobs;
        this.ai = ai;
        this.settingsService = settingsService;
        this.draftsRepo = draftsRepo;
        this.insightsRepo = insightsRepo;
    }
    async enqueue(type, payload) {
        const job = await this.jobs.create(type, payload);
        this.log.log(`Job ${job.id} [${type}] queued`);
        this.process(job.id, type, payload).catch((err) => this.log.error(`Unhandled error in job ${job.id}: ${err.message}`));
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
            this.log.error(`Job ${jobId} [${type}] failed: ${err.message}`);
            await this.jobs.markFailed(jobId, err.message);
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
        for (const item of items) {
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
                this.log.warn(`Batch ${jobId}: failed ${item.emailId}: ${err.message}`);
            }
            if (classified + failed < items.length) {
                await new Promise((r) => setTimeout(r, 1500));
            }
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
                const autoDraftItems = items.filter((item) => needsReplyInsights.some((insight) => insight.emailId === item.emailId));
                if (autoDraftItems.length > 0) {
                    this.log.log(`Batch ${jobId}: enqueuing auto-draft for ${autoDraftItems.length} emails`);
                    this.enqueue('auto-draft-batch', { userId, items: autoDraftItems }).catch((err) => this.log.warn(`Failed to enqueue auto-draft-batch: ${err.message}`));
                }
            }
        }
        catch (err) {
            this.log.warn(`Batch ${jobId}: auto-draft trigger failed: ${err.message}`);
        }
        return { classified, failed, total: items.length };
    }
    async handleAutoDraftBatch(jobId, payload) {
        const { userId, items } = payload;
        const settings = await this.settingsService.getForUser(userId);
        const tone = settings.defaultTone || 'Professional';
        const length = settings.defaultLength || 'Medium';
        let drafted = 0;
        let skipped = 0;
        for (const item of items) {
            const existingDraft = await this.draftsRepo.findOne({
                where: { emailId: item.emailId },
            });
            if (existingDraft) {
                skipped++;
                continue;
            }
            try {
                const content = await this.ai.generateDraft({ from: item.from, subject: item.subject, body: item.body }, { tone, length });
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
            }
            catch (err) {
                this.log.warn(`Auto-draft ${jobId}: failed ${item.emailId}: ${err.message}`);
            }
            if (drafted + skipped < items.length) {
                await new Promise((r) => setTimeout(r, 1500));
            }
        }
        return { drafted, skipped, total: items.length };
    }
    async handleDraft(payload) {
        const { emailId, from, subject, body, tone, length, instruction } = payload;
        const content = await this.ai.generateDraft({ from, subject, body }, { tone: tone ?? 'Professional', length: length ?? 'Medium', instruction });
        const latestDraft = await this.draftsRepo.findOne({
            where: { emailId },
            order: { version: 'DESC' },
        });
        const nextVersion = (latestDraft?.version ?? 0) + 1;
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