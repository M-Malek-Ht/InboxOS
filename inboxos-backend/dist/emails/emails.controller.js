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
exports.EmailsController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const emails_service_1 = require("./emails.service");
const job_runner_service_1 = require("../jobs/job-runner.service");
let EmailsController = class EmailsController {
    emails;
    runner;
    constructor(emails, runner) {
        this.emails = emails;
        this.runner = runner;
    }
    async list(req, filter, search, limit) {
        return this.emails.listForUser(req.user.id, {
            filter,
            search,
            limit: limit ? Number(limit) : undefined,
        });
    }
    async listSent(req, search, limit) {
        return this.emails.listSentForUser(req.user.id, {
            search,
            limit: limit ? Number(limit) : undefined,
        });
    }
    async listTrash(req, search, limit) {
        return this.emails.listTrashForUser(req.user.id, {
            search,
            limit: limit ? Number(limit) : undefined,
        });
    }
    async getThread(id, req) {
        return this.emails.getThread(req.user.id, id);
    }
    async get(id, req) {
        const email = await this.emails.getForUser(req.user.id, id);
        if (!email)
            throw new common_1.NotFoundException('Email not found');
        return email;
    }
    async setRead(id, body, req) {
        return this.emails.setReadState(req.user.id, id, !!body.isRead);
    }
    async classifyBatch(body, req) {
        const ids = body.emailIds ?? [];
        const unclassified = await this.emails.getUnclassifiedIds(req.user.id, ids);
        if (!unclassified.length)
            return { jobId: null, count: 0 };
        const items = [];
        for (const emailId of unclassified) {
            const email = await this.emails.getForUser(req.user.id, emailId);
            if (!email)
                continue;
            items.push({
                emailId,
                from: email.from,
                subject: email.subject,
                body: email.body ?? '',
            });
        }
        if (!items.length)
            return { jobId: null, count: 0 };
        const jobId = await this.runner.enqueue('classify-batch', {
            userId: req.user.id,
            items,
        });
        return { jobId, count: items.length };
    }
    async delete(id, req) {
        return this.emails.deleteEmail(req.user.id, id);
    }
    async untrash(id, req) {
        return this.emails.untrashEmail(req.user.id, id);
    }
    async reply(id, body, req) {
        const result = await this.emails.sendReply(req.user.id, id, body.body);
        return result;
    }
    async classify(id, req) {
        const email = await this.emails.getForUser(req.user.id, id);
        if (!email)
            throw new common_1.NotFoundException('Email not found');
        const jobId = await this.runner.enqueue('classify', {
            userId: req.user.id,
            emailId: id,
            from: email.from,
            subject: email.subject,
            body: email.body ?? '',
        });
        return { jobId };
    }
};
exports.EmailsController = EmailsController;
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('filter')),
    __param(2, (0, common_1.Query)('search')),
    __param(3, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", Promise)
], EmailsController.prototype, "list", null);
__decorate([
    (0, common_1.Get)('sent'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('search')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], EmailsController.prototype, "listSent", null);
__decorate([
    (0, common_1.Get)('trash'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('search')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], EmailsController.prototype, "listTrash", null);
__decorate([
    (0, common_1.Get)(':id/thread'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], EmailsController.prototype, "getThread", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], EmailsController.prototype, "get", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], EmailsController.prototype, "setRead", null);
__decorate([
    (0, common_1.Post)('classify-batch'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], EmailsController.prototype, "classifyBatch", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], EmailsController.prototype, "delete", null);
__decorate([
    (0, common_1.Post)(':id/untrash'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], EmailsController.prototype, "untrash", null);
__decorate([
    (0, common_1.Post)(':id/reply'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], EmailsController.prototype, "reply", null);
__decorate([
    (0, common_1.Post)(':id/classify'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], EmailsController.prototype, "classify", null);
exports.EmailsController = EmailsController = __decorate([
    (0, common_1.Controller)('emails'),
    __metadata("design:paramtypes", [emails_service_1.EmailsService,
        job_runner_service_1.JobRunnerService])
], EmailsController);
//# sourceMappingURL=emails.controller.js.map