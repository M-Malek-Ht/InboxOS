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
    async resolveProviderClient(userId) {
        const gmailToken = await this.gmail.getAccessTokenForUser(userId);
        if (gmailToken) {
            return { provider: 'gmail', token: gmailToken, service: this.gmail };
        }
        const msToken = await this.microsoftMail.getAccessTokenForUser(userId);
        if (msToken) {
            return {
                provider: 'microsoft',
                token: msToken,
                service: this.microsoftMail,
            };
        }
        return null;
    }
    async listForUser(userId, options = {}) {
        const user = await this.usersRepo.findOne({ where: { id: userId } });
        const userEmail = user?.email?.toLowerCase();
        this.log.log(`listForUser: userId=${userId}, userEmail=${userEmail}`);
        const providerClient = await this.resolveProviderClient(userId);
        if (providerClient) {
            const { token, provider, service } = providerClient;
            try {
                const emails = await service.listEmails(token, {
                    maxResults: options.filter && options.filter !== 'unread'
                        ? Math.max(options.limit ?? 40, 100)
                        : options.limit,
                    filter: options.filter,
                    search: options.search,
                    userEmail: provider === 'gmail' ? userEmail : undefined,
                });
                this.log.log(`${provider} returned ${emails.length} emails`);
                const withInsights = await this.attachInsights(userId, emails);
                return this.applyEmailFilters(withInsights, options);
            }
            catch (error) {
                this.log.error(`${provider} API error: ${error}`);
            }
        }
        this.log.log('Falling back to seed data');
        await this.seedIfEmpty(userId);
        const qb = this.repo.createQueryBuilder('email');
        qb.where('email.userId = :userId', { userId })
            .andWhere('email.isTrashed = false')
            .andWhere('email.isSent = false');
        if (options.search) {
            qb.andWhere('email.subject ILIKE :q OR email.from ILIKE :q OR email.snippet ILIKE :q', { q: `%${options.search}%` });
        }
        if (options.filter === 'unread') {
            qb.andWhere('email.isRead = false');
        }
        qb.orderBy('email.receivedAt', 'DESC');
        const emails = await qb.getMany();
        const withInsights = await this.attachInsights(userId, emails);
        return this.applyEmailFilters(withInsights, options);
    }
    async getForUser(userId, emailId) {
        this.log.debug(`getForUser called with emailId=${emailId}`);
        const providerClient = await this.resolveProviderClient(userId);
        if (providerClient?.provider === 'gmail') {
            try {
                const email = await providerClient.service.getMessage(providerClient.token, emailId);
                this.log.debug(`Gmail getMessage returned ${email ? 'a result' : 'no result'}`);
                return this.attachInsight(userId, email);
            }
            catch {
                this.log.warn(`Gmail getMessage failed for emailId=${emailId}`);
            }
        }
        if (providerClient?.provider === 'microsoft') {
            try {
                const email = await providerClient.service.getMessage(providerClient.token, emailId);
                this.log.debug(`Microsoft getMessage returned ${email ? 'a result' : 'no result'}`);
                return this.attachInsight(userId, email);
            }
            catch {
                this.log.warn(`Microsoft getMessage failed for emailId=${emailId}`);
            }
        }
        const email = await this.repo.findOne({ where: { id: emailId, userId } });
        return this.attachInsight(userId, email);
    }
    async getManyForUser(userId, emailIds) {
        if (!emailIds.length)
            return [];
        const providerClient = await this.resolveProviderClient(userId);
        if (providerClient) {
            const results = await Promise.all(emailIds.map(async (emailId) => {
                try {
                    return await providerClient.service.getMessage(providerClient.token, emailId);
                }
                catch {
                    return null;
                }
            }));
            const emails = results.filter((email) => email !== null);
            return this.attachInsights(userId, emails);
        }
        const emails = await this.repo.find({
            where: { userId, id: (0, typeorm_2.In)(emailIds) },
        });
        const emailsById = new Map(emails.map((email) => [email.id, email]));
        const ordered = emailIds
            .map((emailId) => emailsById.get(emailId))
            .filter((email) => Boolean(email));
        return this.attachInsights(userId, ordered);
    }
    async setReadState(userId, emailId, isRead) {
        this.log.debug(`setReadState emailId=${emailId} isRead=${isRead}`);
        const providerClient = await this.resolveProviderClient(userId);
        if (providerClient?.provider === 'gmail') {
            if (isRead) {
                await providerClient.service.markAsRead(providerClient.token, emailId);
            }
            else {
                await providerClient.service.markAsUnread(providerClient.token, emailId);
            }
            return { ok: true };
        }
        if (providerClient?.provider === 'microsoft') {
            if (isRead) {
                await providerClient.service.markAsRead(providerClient.token, emailId);
            }
            else {
                await providerClient.service.markAsUnread(providerClient.token, emailId);
            }
            return { ok: true };
        }
        await this.repo.update({ id: emailId, userId }, { isRead });
        return this.repo.findOne({ where: { id: emailId, userId } });
    }
    async updatePriorityScore(userId, emailId, priorityScore) {
        const email = await this.getForUser(userId, emailId);
        if (!email) {
            throw new common_1.NotFoundException('Email not found');
        }
        const normalizedScore = Math.max(0, Math.min(100, Math.round(priorityScore)));
        const existingInsight = await this.insightsRepo.findOne({
            where: { userId, emailId },
        });
        const insight = this.insightsRepo.create({
            ...(existingInsight ?? {}),
            userId,
            emailId,
            category: existingInsight?.category ?? 'Other',
            priorityScore: normalizedScore,
            needsReply: existingInsight?.needsReply ?? false,
            tags: existingInsight?.tags ?? [],
            summary: existingInsight?.summary ?? '',
        });
        await this.insightsRepo.save(insight);
        return this.attachInsight(userId, email);
    }
    async getThread(userId, emailId) {
        const providerClient = await this.resolveProviderClient(userId);
        if (providerClient?.provider === 'gmail') {
            try {
                const email = await providerClient.service.getMessage(providerClient.token, emailId);
                if (email.threadId) {
                    return providerClient.service.getThread(providerClient.token, email.threadId);
                }
                return [email];
            }
            catch {
                this.log.warn(`Gmail getThread failed for emailId=${emailId}`);
            }
        }
        if (providerClient?.provider === 'microsoft') {
            try {
                const email = await providerClient.service.getMessage(providerClient.token, emailId);
                return [email];
            }
            catch {
                this.log.warn(`Microsoft getThread failed for emailId=${emailId}`);
            }
        }
        const email = await this.repo.findOne({ where: { id: emailId, userId } });
        return email ? [email] : [];
    }
    async sendReply(userId, emailId, body, draftId) {
        const providerClient = await this.resolveProviderClient(userId);
        if (providerClient?.provider === 'gmail') {
            const email = await providerClient.service.getMessage(providerClient.token, emailId);
            await providerClient.service.sendReply(providerClient.token, {
                to: email.from,
                subject: email.subject,
                body,
                threadId: email.threadId,
                inReplyTo: email.messageIdHeader,
            });
            if (draftId) {
                await this.draftsRepo.update({ id: draftId, userId }, { status: 'sent' });
            }
            return { ok: true, provider: 'gmail' };
        }
        if (providerClient?.provider === 'microsoft') {
            await providerClient.service.sendReply(providerClient.token, emailId, body);
            if (draftId) {
                await this.draftsRepo.update({ id: draftId, userId }, { status: 'sent' });
            }
            return { ok: true, provider: 'microsoft' };
        }
        const original = await this.repo.findOne({ where: { id: emailId, userId } });
        const user = await this.usersRepo.findOne({ where: { id: userId } });
        if (!original || !user) {
            throw new Error('No email provider linked and local email context missing');
        }
        const subject = original.subject.startsWith('Re:')
            ? original.subject
            : `Re: ${original.subject}`;
        await this.repo.save(this.repo.create({
            userId,
            from: user.email,
            to: original.from,
            subject,
            snippet: body.slice(0, 180),
            body,
            isRead: true,
            isSent: true,
            isTrashed: false,
        }));
        if (draftId) {
            await this.draftsRepo.update({ id: draftId, userId }, { status: 'sent' });
        }
        return { ok: true, provider: 'local' };
    }
    async listSentForUser(userId, options = {}) {
        const providerClient = await this.resolveProviderClient(userId);
        if (providerClient?.provider === 'gmail') {
            try {
                return await providerClient.service.listSentEmails(providerClient.token, {
                    maxResults: options.limit,
                    search: options.search,
                });
            }
            catch (error) {
                this.log.error(`Gmail sent list error: ${error}`);
            }
        }
        if (providerClient?.provider === 'microsoft') {
            try {
                return await providerClient.service.listSentEmails(providerClient.token, {
                    maxResults: options.limit,
                    search: options.search,
                });
            }
            catch (error) {
                this.log.error(`Microsoft sent list error: ${error}`);
            }
        }
        const qb = this.repo.createQueryBuilder('email');
        qb.where('email.userId = :userId', { userId })
            .andWhere('email.isSent = true')
            .andWhere('email.isTrashed = false');
        if (options.search) {
            qb.andWhere('email.subject ILIKE :q OR email.to ILIKE :q OR email.snippet ILIKE :q', { q: `%${options.search}%` });
        }
        qb.orderBy('email.receivedAt', 'DESC');
        if (options.limit)
            qb.take(options.limit);
        return qb.getMany();
    }
    async listTrashForUser(userId, options = {}) {
        const providerClient = await this.resolveProviderClient(userId);
        if (providerClient?.provider === 'gmail') {
            try {
                const providerTrash = await providerClient.service.listTrashEmails(providerClient.token, {
                    maxResults: options.limit ?? 40,
                    search: options.search,
                });
                await this.syncProviderEmailsToLocal(userId, providerTrash, true);
            }
            catch (err) {
                this.log.warn(`Could not sync Gmail trash: ${err}`);
            }
        }
        else if (providerClient?.provider === 'microsoft') {
            try {
                const providerTrash = await providerClient.service.listTrashEmails(providerClient.token, {
                    maxResults: options.limit ?? 40,
                    search: options.search,
                });
                await this.syncProviderEmailsToLocal(userId, providerTrash, true);
            }
            catch (err) {
                this.log.warn(`Could not sync Microsoft trash: ${err}`);
            }
        }
        const qb = this.repo.createQueryBuilder('email');
        qb.where('email.userId = :userId', { userId })
            .andWhere('email.isTrashed = true');
        if (options.search) {
            qb.andWhere('email.subject ILIKE :q OR email.from ILIKE :q OR email.snippet ILIKE :q', { q: `%${options.search}%` });
        }
        qb.orderBy('email.receivedAt', 'DESC');
        if (options.limit)
            qb.take(options.limit);
        return qb.getMany();
    }
    async untrashEmail(userId, emailId) {
        const local = await this.repo.findOne({ where: { id: emailId, userId } });
        const externalId = local?.externalId ?? null;
        const providerClient = externalId
            ? await this.resolveProviderClient(userId)
            : null;
        if (externalId && providerClient?.provider === 'gmail') {
            await providerClient.service.untrashMessage(providerClient.token, externalId);
        }
        else if (externalId && providerClient?.provider === 'microsoft') {
            await providerClient.service.untrashMessage(providerClient.token, externalId);
        }
        await this.repo.update({ id: emailId, userId }, { isTrashed: false });
        return { ok: true, provider: externalId ? 'provider' : 'local' };
    }
    async permanentDeleteEmail(userId, emailId) {
        const local = await this.repo.findOne({ where: { id: emailId, userId } });
        const externalId = local?.externalId ?? null;
        const providerClient = externalId
            ? await this.resolveProviderClient(userId)
            : null;
        if (externalId && providerClient?.provider === 'gmail') {
            await providerClient.service.permanentlyDeleteMessage(providerClient.token, externalId);
        }
        else if (externalId && providerClient?.provider === 'microsoft') {
            await providerClient.service.deleteMessage(providerClient.token, externalId);
        }
        await this.repo.delete({ id: emailId, userId });
        await this.insightsRepo.delete({ userId, emailId });
        await this.draftsRepo.delete({ emailId, userId });
        return { ok: true };
    }
    async deleteEmail(userId, emailId) {
        const providerClient = await this.resolveProviderClient(userId);
        if (providerClient?.provider === 'gmail') {
            try {
                const email = await providerClient.service.getMessage(providerClient.token, emailId);
                await this.saveLocalCopy(userId, email, emailId, true, false);
            }
            catch (err) {
                this.log.warn(`Could not cache Gmail email ${emailId} before trashing: ${err}`);
            }
            await providerClient.service.trashMessage(providerClient.token, emailId);
        }
        else if (providerClient?.provider === 'microsoft') {
            try {
                const email = await providerClient.service.getMessage(providerClient.token, emailId);
                await this.saveLocalCopy(userId, email, emailId, true, false);
            }
            catch (err) {
                this.log.warn(`Could not cache Microsoft email ${emailId} before trashing: ${err}`);
            }
            await providerClient.service.deleteMessage(providerClient.token, emailId);
        }
        else {
            await this.repo.update({ id: emailId, userId }, { isTrashed: true });
        }
        await this.insightsRepo.delete({ userId, emailId });
        await this.draftsRepo.delete({ emailId, userId });
        return { ok: true };
    }
    async saveLocalCopy(userId, email, externalId, isTrashed, isSent) {
        const existing = await this.repo.findOne({ where: { userId, externalId } });
        if (existing) {
            await this.repo.update({ id: existing.id }, { isTrashed, isSent });
            return;
        }
        await this.repo.save(this.repo.create({
            userId,
            from: email.from,
            to: email.to ?? '',
            subject: email.subject,
            snippet: email.snippet,
            body: email.body,
            isRead: email.isRead,
            isSent,
            isTrashed,
            receivedAt: email.receivedAt,
            externalId,
        }));
    }
    async syncProviderEmailsToLocal(userId, emails, isTrashed) {
        if (!emails.length)
            return;
        const externalIds = emails.map((email) => email.id);
        const existing = await this.repo.find({
            where: { userId, externalId: (0, typeorm_2.In)(externalIds) },
        });
        const existingByExternalId = new Map(existing
            .filter((email) => email.externalId)
            .map((email) => [email.externalId, email]));
        const recordsToSave = [];
        for (const email of emails) {
            const current = existingByExternalId.get(email.id);
            if (current && isTrashed && !current.isTrashed) {
                continue;
            }
            recordsToSave.push(this.repo.create({
                ...current,
                userId,
                from: email.from,
                to: email.to ?? '',
                subject: email.subject,
                snippet: email.snippet,
                body: email.body,
                isRead: email.isRead,
                isSent: email.isSent ?? false,
                isTrashed,
                receivedAt: email.receivedAt,
                externalId: email.id,
            }));
        }
        if (recordsToSave.length > 0) {
            await this.repo.save(recordsToSave);
        }
    }
    applyEmailFilters(emails, options = {}) {
        let filtered = emails;
        switch (options.filter) {
            case 'needsReply':
                filtered = filtered.filter((email) => !!this.getEmailMeta(email).needsReply);
                break;
            case 'highPriority':
                filtered = filtered.filter((email) => (this.getEmailMeta(email).priorityScore ?? 0) >= 80);
                break;
            case 'unread':
                break;
            default:
                if (options.filter) {
                    filtered = filtered.filter((email) => this.getEmailMeta(email).category === options.filter);
                }
                break;
        }
        return typeof options.limit === 'number'
            ? filtered.slice(0, options.limit)
            : filtered;
    }
    getEmailMeta(email) {
        return email;
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
    async seedIfEmpty(userId) {
        const count = await this.repo.count({ where: { userId } });
        if (count > 0)
            return;
        await this.repo.save([
            {
                userId,
                from: 'demo@company.com',
                subject: 'Welcome to InboxOS',
                snippet: 'This is a seeded email from your backend.',
                body: 'If you can read this, your NestJS + Postgres is working.',
                isRead: false,
            },
            {
                userId,
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