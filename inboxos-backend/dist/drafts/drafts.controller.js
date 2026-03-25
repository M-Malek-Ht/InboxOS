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
var DraftsController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DraftsController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const drafts_service_1 = require("./drafts.service");
const create_draft_dto_1 = require("./dto/create-draft.dto");
const job_runner_service_1 = require("../jobs/job-runner.service");
let DraftsController = class DraftsController {
    static { DraftsController_1 = this; }
    drafts;
    runner;
    static MAX_FROM_CHARS = 320;
    static MAX_SUBJECT_CHARS = 500;
    static MAX_BODY_CHARS = 16000;
    constructor(drafts, runner) {
        this.drafts = drafts;
        this.runner = runner;
    }
    list(emailId, req) {
        return this.drafts.listByEmail(req.user.id, emailId);
    }
    async create(emailId, req, dto) {
        if (dto.content) {
            return this.drafts.createDirectDraft(req.user.id, emailId, dto);
        }
        let from = dto.emailFrom;
        let subject = dto.emailSubject;
        let body = dto.emailBody;
        if (!from || !subject) {
            const email = await this.drafts.findEmailOrNull(req.user.id, emailId);
            if (email) {
                from = from ?? email.from;
                subject = subject ?? email.subject;
                body = body ?? email.body ?? '';
            }
        }
        if (!from || !subject) {
            throw new common_1.BadRequestException('Email context required: provide emailFrom/emailSubject/emailBody in the request body');
        }
        const safeFrom = this.sanitizePromptField(from, DraftsController_1.MAX_FROM_CHARS);
        const safeSubject = this.sanitizePromptField(subject, DraftsController_1.MAX_SUBJECT_CHARS);
        const safeBody = this.sanitizePromptField(body ?? '', DraftsController_1.MAX_BODY_CHARS);
        if (!safeFrom || !safeSubject) {
            throw new common_1.BadRequestException('Email context required: provide emailFrom/emailSubject/emailBody in the request body');
        }
        try {
            const jobId = await this.runner.enqueue('draft', {
                userId: req.user.id,
                emailId,
                from: safeFrom,
                subject: safeSubject,
                body: safeBody,
                tone: dto.tone,
                length: dto.length,
                instruction: dto.instruction,
            });
            return { jobId };
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to queue draft generation';
            throw new common_1.InternalServerErrorException(message);
        }
    }
    sanitizePromptField(value, maxChars) {
        const text = typeof value === 'string' ? value : String(value ?? '');
        const withoutNulls = text.replace(/\u0000/g, ' ').trim();
        return withoutNulls.length <= maxChars
            ? withoutNulls
            : withoutNulls.slice(0, maxChars);
    }
};
exports.DraftsController = DraftsController;
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('emailId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], DraftsController.prototype, "list", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('emailId')),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, create_draft_dto_1.CreateDraftDto]),
    __metadata("design:returntype", Promise)
], DraftsController.prototype, "create", null);
exports.DraftsController = DraftsController = DraftsController_1 = __decorate([
    (0, common_1.Controller)('emails/:emailId/drafts'),
    __metadata("design:paramtypes", [drafts_service_1.DraftsService,
        job_runner_service_1.JobRunnerService])
], DraftsController);
//# sourceMappingURL=drafts.controller.js.map