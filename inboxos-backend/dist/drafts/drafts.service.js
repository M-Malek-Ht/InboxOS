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
var DraftsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DraftsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const draft_entity_1 = require("./draft.entity");
const email_entity_1 = require("../emails/email.entity");
let DraftsService = DraftsService_1 = class DraftsService {
    draftsRepo;
    emailsRepo;
    dataSource;
    log = new common_1.Logger(DraftsService_1.name);
    constructor(draftsRepo, emailsRepo, dataSource) {
        this.draftsRepo = draftsRepo;
        this.emailsRepo = emailsRepo;
        this.dataSource = dataSource;
    }
    async onApplicationBootstrap() {
        try {
            await this.dataSource.query(`ALTER TABLE drafts ADD COLUMN IF NOT EXISTS "userId" uuid;`);
            await this.dataSource.query(`CREATE INDEX IF NOT EXISTS "IDX_drafts_userId" ON drafts ("userId");`);
            await this.dataSource.query(`ALTER TABLE emails ADD COLUMN IF NOT EXISTS "externalId" varchar DEFAULT NULL;`);
            this.log.log('drafts.userId and emails.externalId columns ensured');
        }
        catch (err) {
            this.log.error(`Failed to ensure schema columns: ${err?.message ?? err}`);
        }
    }
    async findEmailOrNull(userId, emailId) {
        return this.emailsRepo.findOne({ where: { id: emailId, userId } });
    }
    listByEmail(userId, emailId) {
        return this.draftsRepo.find({
            where: { userId, emailId, status: 'draft' },
            order: { createdAt: 'DESC' },
        });
    }
    async listLatestDrafts(userId) {
        return this.draftsRepo
            .createQueryBuilder('d')
            .where('d.userId = :userId', { userId })
            .andWhere('d.status = :status', { status: 'draft' })
            .distinctOn(['d.emailId'])
            .orderBy('d.emailId')
            .addOrderBy('d.version', 'DESC')
            .getMany();
    }
    async createDirectDraft(userId, emailId, dto) {
        const latestDraft = await this.draftsRepo.findOne({
            where: { userId, emailId },
            order: { version: 'DESC' },
        });
        const nextVersion = (latestDraft?.version ?? 0) + 1;
        const draft = this.draftsRepo.create({
            userId,
            emailId,
            content: dto.content,
            version: nextVersion,
            tone: dto.tone ?? 'Professional',
            length: dto.length ?? 'Medium',
            instruction: dto.instruction ?? null,
            status: dto.status ?? 'draft',
        });
        return this.draftsRepo.save(draft);
    }
    async markAsSent(userId, draftId) {
        await this.draftsRepo.update({ id: draftId, userId }, { status: 'sent' });
    }
};
exports.DraftsService = DraftsService;
exports.DraftsService = DraftsService = DraftsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(draft_entity_1.DraftEntity)),
    __param(1, (0, typeorm_1.InjectRepository)(email_entity_1.EmailEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.DataSource])
], DraftsService);
//# sourceMappingURL=drafts.service.js.map