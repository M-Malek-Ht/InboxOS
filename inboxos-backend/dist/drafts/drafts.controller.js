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
exports.DraftsController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const drafts_service_1 = require("./drafts.service");
const create_draft_dto_1 = require("./dto/create-draft.dto");
const job_runner_service_1 = require("../jobs/job-runner.service");
let DraftsController = class DraftsController {
    drafts;
    runner;
    constructor(drafts, runner) {
        this.drafts = drafts;
        this.runner = runner;
    }
    list(emailId) {
        return this.drafts.listByEmail(emailId);
    }
    async create(emailId, dto) {
        if (dto.content) {
            return this.drafts.createDirectDraft(emailId, dto);
        }
        let from = dto.emailFrom;
        let subject = dto.emailSubject;
        let body = dto.emailBody;
        if (!from || !subject) {
            const email = await this.drafts.findEmailOrNull(emailId);
            if (email) {
                from = from ?? email.from;
                subject = subject ?? email.subject;
                body = body ?? email.body ?? '';
            }
        }
        if (!from || !subject) {
            throw new common_1.BadRequestException('Email context required: provide emailFrom/emailSubject/emailBody in the request body');
        }
        const jobId = await this.runner.enqueue('draft', {
            emailId,
            from,
            subject,
            body: body ?? '',
            tone: dto.tone,
            length: dto.length,
            instruction: dto.instruction,
        });
        return { jobId };
    }
};
exports.DraftsController = DraftsController;
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('emailId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], DraftsController.prototype, "list", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('emailId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_draft_dto_1.CreateDraftDto]),
    __metadata("design:returntype", Promise)
], DraftsController.prototype, "create", null);
exports.DraftsController = DraftsController = __decorate([
    (0, common_1.Controller)('emails/:emailId/drafts'),
    __metadata("design:paramtypes", [drafts_service_1.DraftsService,
        job_runner_service_1.JobRunnerService])
], DraftsController);
//# sourceMappingURL=drafts.controller.js.map