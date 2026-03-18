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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DraftsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const draft_entity_1 = require("./draft.entity");
const email_entity_1 = require("../emails/email.entity");
let DraftsService = class DraftsService {
    draftsRepo;
    emailsRepo;
    constructor(draftsRepo, emailsRepo) {
        this.draftsRepo = draftsRepo;
        this.emailsRepo = emailsRepo;
    }
    async findEmailOrNull(emailId) {
        return this.emailsRepo.findOne({ where: { id: emailId } });
    }
    listByEmail(emailId) {
        return this.draftsRepo.find({
            where: { emailId },
            order: { createdAt: 'DESC' },
        });
    }
    async listLatestDrafts() {
        return this.draftsRepo
            .createQueryBuilder('d')
            .distinctOn(['d.emailId'])
            .orderBy('d.emailId')
            .addOrderBy('d.version', 'DESC')
            .getMany();
    }
    async createDirectDraft(emailId, dto) {
        const latestDraft = await this.draftsRepo.findOne({
            where: { emailId },
            order: { version: 'DESC' },
        });
        const nextVersion = (latestDraft?.version ?? 0) + 1;
        const draft = this.draftsRepo.create({
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
};
exports.DraftsService = DraftsService;
exports.DraftsService = DraftsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(draft_entity_1.DraftEntity)),
    __param(1, (0, typeorm_1.InjectRepository)(email_entity_1.EmailEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], DraftsService);
//# sourceMappingURL=drafts.service.js.map