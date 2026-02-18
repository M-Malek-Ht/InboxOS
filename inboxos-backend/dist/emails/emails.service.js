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
var EmailsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const email_entity_1 = require("./email.entity");
const email_insight_entity_1 = require("./email-insight.entity");
const draft_entity_1 = require("../drafts/draft.entity");
const user_entity_1 = require("../users/entities/user.entity");
const gmail_service_1 = require("./gmail.service");
const microsoft_mail_service_1 = require("./microsoft-mail.service");
let EmailsService = EmailsService_1 = class EmailsService {
    repo;
    insightsRepo;
    draftsRepo;
    usersRepo;
    gmail;
    microsoftMail;
    log = new common_1.Logger(EmailsService_1.name);
    constructor(repo, insightsRepo, draftsRepo, usersRepo, gmail, microsoftMail) {
        this.repo = repo;
        this.insightsRepo = insightsRepo;
        this.draftsRepo = draftsRepo;
        this.usersRepo = usersRepo;
        this.gmail = gmail;
        this.microsoftMail = microsoftMail;
    }
    async listForUser(userId, options = {}) {
        const user = await this.usersRepo.findOne({ where: { id: userId } });
        const userEmail = user?.email?.toLowerCase();
        this.log.log(`listForUser: userId=${userId}, userEmail=${userEmail}`);
        const accessToken = await this.gmail.getAccessTokenForUser(userId);
        if (accessToken) {
            try {
                const emails = await this.gmail.listEmails(accessToken, {
                    maxResults: options.limit,
                    filter: options.filter,
                    search: options.search,
                    userEmail,
                });
                this.log.log(`Gmail returned ${emails.length} emails`);
                return this.attachInsights(userId, emails);
            }
            catch (error) {
                this.log.error(`Gmail API error: ${error}`);
            }
        }
        const msToken = await this.microsoftMail.getAccessTokenForUser(userId);
        console.log('[EmailsService] Microsoft accessToken:', msToken ? 'YES' : 'NO');
        if (msToken) {
            try {
                const emails = await this.microsoftMail.listEmails(msToken, {
                    maxResults: options.limit,
                    filter: options.filter,
                    search: options.search,
                });
                console.log('[EmailsService] Microsoft returned', emails.length, 'emails');
                return this.attachInsights(userId, emails);
            }
            catch (error) {
                console.error('[EmailsService] Microsoft Graph API error:', error);
            }
        }
        console.log('[EmailsService] Falling back to seed data');
        await this.seedIfEmpty();
        const qb = this.repo.createQueryBuilder('email');
        if (options.search) {
            qb.where('email.subject ILIKE :q OR email.from ILIKE :q OR email.snippet ILIKE :q', { q: `%${options.search}%` });
        }
        if (options.filter === 'unread') {
            if (qb.expressionMap.wheres.length === 0) {
                qb.where('email.isRead = false');
            }
            else {
                qb.andWhere('email.isRead = false');
            }
        }
        qb.orderBy('email.receivedAt', 'DESC');
        if (options.limit)
            qb.take(options.limit);
        const emails = await qb.getMany();
        return this.attachInsights(userId, emails);
    }
    async getForUser(userId, emailId) {
        console.log('[EmailsService] getForUser called with emailId:', emailId);
        const accessToken = await this.gmail.getAccessTokenForUser(userId);
        if (accessToken) {
            try {
                const email = await this.gmail.getMessage(accessToken, emailId);
                console.log('[EmailsService] Gmail getMessage returned:', email ? 'YES' : 'NO');
                return this.attachInsight(userId, email);
            }
            catch (error) {
                console.error('[EmailsService] Gmail getMessage error:', error);
            }
        }
        const msToken = await this.microsoftMail.getAccessTokenForUser(userId);
        if (msToken) {
            try {
                const email = await this.microsoftMail.getMessage(msToken, emailId);
                console.log('[EmailsService] Microsoft getMessage returned:', email ? 'YES' : 'NO');
                return this.attachInsight(userId, email);
            }
            catch (error) {
                console.error('[EmailsService] Microsoft getMessage error:', error);
            }
        }
        const email = await this.repo.findOne({ where: { id: emailId } });
        return this.attachInsight(userId, email);
    }
    async setReadState(userId, emailId, isRead) {
        console.log('[EmailsService] setReadState called with emailId:', emailId, 'isRead:', isRead);
        const accessToken = await this.gmail.getAccessTokenForUser(userId);
        if (accessToken) {
            if (isRead) {
                await this.gmail.markAsRead(accessToken, emailId);
            }
            else {
                await this.gmail.markAsUnread(accessToken, emailId);
            }
            return { ok: true };
        }
        const msToken = await this.microsoftMail.getAccessTokenForUser(userId);
        if (msToken) {
            if (isRead) {
                await this.microsoftMail.markAsRead(msToken, emailId);
            }
            else {
                await this.microsoftMail.markAsUnread(msToken, emailId);
            }
            return { ok: true };
        }
        await this.repo.update({ id: emailId }, { isRead });
        return this.repo.findOne({ where: { id: emailId } });
    }
    async getThread(userId, emailId) {
        const accessToken = await this.gmail.getAccessTokenForUser(userId);
        if (accessToken) {
            try {
                const email = await this.gmail.getMessage(accessToken, emailId);
                if (email.threadId) {
                    const messages = await this.gmail.getThread(accessToken, email.threadId);
                    return messages;
                }
                return [email];
            }
            catch (error) {
                console.error('[EmailsService] Gmail getThread error:', error);
            }
        }
        const msToken = await this.microsoftMail.getAccessTokenForUser(userId);
        if (msToken) {
            try {
                const email = await this.microsoftMail.getMessage(msToken, emailId);
                return [email];
            }
            catch (error) {
                console.error('[EmailsService] Microsoft getThread error:', error);
            }
        }
        const email = await this.repo.findOne({ where: { id: emailId } });
        return email ? [email] : [];
    }
    async sendReply(userId, emailId, body) {
        const accessToken = await this.gmail.getAccessTokenForUser(userId);
        if (accessToken) {
            const email = await this.gmail.getMessage(accessToken, emailId);
            await this.gmail.sendReply(accessToken, {
                to: email.from,
                subject: email.subject,
                body,
                threadId: email.threadId,
                inReplyTo: email.messageIdHeader,
            });
            return { ok: true, provider: 'gmail' };
        }
        const msToken = await this.microsoftMail.getAccessTokenForUser(userId);
        if (msToken) {
            await this.microsoftMail.sendReply(msToken, emailId, body);
            return { ok: true, provider: 'microsoft' };
        }
        throw new Error('No email provider linked — cannot send reply');
    }
    async listSentForUser(userId, options = {}) {
        const accessToken = await this.gmail.getAccessTokenForUser(userId);
        if (accessToken) {
            return this.gmail.listSentEmails(accessToken, {
                maxResults: options.limit,
                search: options.search,
            });
        }
        const msToken = await this.microsoftMail.getAccessTokenForUser(userId);
        if (msToken) {
            return this.microsoftMail.listSentEmails(msToken, {
                maxResults: options.limit,
                search: options.search,
            });
        }
        return [];
    }
    async listTrashForUser(userId, options = {}) {
        const accessToken = await this.gmail.getAccessTokenForUser(userId);
        if (accessToken) {
            return this.gmail.listTrashEmails(accessToken, {
                maxResults: options.limit,
                search: options.search,
            });
        }
        const msToken = await this.microsoftMail.getAccessTokenForUser(userId);
        if (msToken) {
            return this.microsoftMail.listTrashEmails(msToken, {
                maxResults: options.limit,
                search: options.search,
            });
        }
        return [];
    }
    async untrashEmail(userId, emailId) {
        const accessToken = await this.gmail.getAccessTokenForUser(userId);
        if (accessToken) {
            await this.gmail.untrashMessage(accessToken, emailId);
            return { ok: true, provider: 'gmail' };
        }
        const msToken = await this.microsoftMail.getAccessTokenForUser(userId);
        if (msToken) {
            await this.microsoftMail.untrashMessage(msToken, emailId);
            return { ok: true, provider: 'microsoft' };
        }
        return { ok: false };
    }
    async deleteEmail(userId, emailId) {
        const accessToken = await this.gmail.getAccessTokenForUser(userId);
        if (accessToken) {
            await this.gmail.trashMessage(accessToken, emailId);
        }
        else {
            const msToken = await this.microsoftMail.getAccessTokenForUser(userId);
            if (msToken) {
                await this.microsoftMail.deleteMessage(msToken, emailId);
            }
            else {
                await this.repo.delete({ id: emailId });
            }
        }
        await this.insightsRepo.delete({ userId, emailId });
        await this.draftsRepo.delete({ emailId });
        return { ok: true };
    }
    async attachInsights(userId, emails) {
        if (!emails.length)
            return emails;
        const ids = Array.from(new Set(emails.map((email) => email.id).filter(Boolean)));
        const insights = await this.insightsRepo.find({
            where: { userId, emailId: (0, typeorm_2.In)(ids) },
        });
        const byEmailId = new Map(insights.map((insight) => [insight.emailId, insight]));
        return emails.map((email) => {
            const insight = byEmailId.get(email.id);
            if (!insight)
                return email;
            return {
                ...email,
                category: insight.category,
                priorityScore: insight.priorityScore,
                needsReply: insight.needsReply,
                tags: insight.tags,
                summary: insight.summary,
            };
        });
    }
    async attachInsight(userId, email) {
        if (!email)
            return email;
        const insight = await this.insightsRepo.findOne({
            where: { userId, emailId: email.id },
        });
        if (!insight)
            return email;
        return {
            ...email,
            category: insight.category,
            priorityScore: insight.priorityScore,
            needsReply: insight.needsReply,
            tags: insight.tags,
            summary: insight.summary,
        };
    }
    async getUnclassifiedIds(userId, emailIds) {
        if (!emailIds.length)
            return [];
        const existing = await this.insightsRepo.find({
            select: ['emailId'],
            where: { userId, emailId: (0, typeorm_2.In)(emailIds) },
        });
        const classified = new Set(existing.map((i) => i.emailId));
        return emailIds.filter((id) => !classified.has(id));
    }
    async seedIfEmpty() {
        const count = await this.repo.count();
        if (count > 0)
            return;
        await this.repo.save([
            {
                from: 'demo@company.com',
                subject: 'Welcome to InboxOS',
                snippet: 'This is a seeded email from your backend.',
                body: 'If you can read this, your NestJS + Postgres is working.',
                isRead: false,
            },
            {
                from: 'hr@company.com',
                subject: 'Interview Scheduling',
                snippet: 'Can you do Tuesday 2pm?',
                body: 'Please confirm a time that works for you.',
                isRead: false,
            },
        ]);
    }
};
exports.EmailsService = EmailsService;
exports.EmailsService = EmailsService = EmailsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(email_entity_1.EmailEntity)),
    __param(1, (0, typeorm_1.InjectRepository)(email_insight_entity_1.EmailInsightEntity)),
    __param(2, (0, typeorm_1.InjectRepository)(draft_entity_1.DraftEntity)),
    __param(3, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        gmail_service_1.GmailService,
        microsoft_mail_service_1.MicrosoftMailService])
], EmailsService);
//# sourceMappingURL=emails.service.js.map