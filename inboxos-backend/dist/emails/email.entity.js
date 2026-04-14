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
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailEntity = void 0;
const typeorm_1 = require("typeorm");
let EmailEntity = class EmailEntity {
    id;
    userId;
    from;
    to;
    subject;
    snippet;
    body;
    isRead;
    isSent;
    isTrashed;
    receivedAt;
    externalId;
};
exports.EmailEntity = EmailEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], EmailEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], EmailEntity.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], EmailEntity.prototype, "from", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: '' }),
    __metadata("design:type", String)
], EmailEntity.prototype, "to", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], EmailEntity.prototype, "subject", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: '' }),
    __metadata("design:type", String)
], EmailEntity.prototype, "snippet", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', default: '' }),
    __metadata("design:type", String)
], EmailEntity.prototype, "body", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], EmailEntity.prototype, "isRead", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], EmailEntity.prototype, "isSent", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], EmailEntity.prototype, "isTrashed", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', default: () => 'NOW()' }),
    __metadata("design:type", Date)
], EmailEntity.prototype, "receivedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true, default: null }),
    __metadata("design:type", Object)
], EmailEntity.prototype, "externalId", void 0);
exports.EmailEntity = EmailEntity = __decorate([
    (0, typeorm_1.Entity)('emails'),
    (0, typeorm_1.Index)('IDX_emails_userId_externalId', ['userId', 'externalId']),
    (0, typeorm_1.Index)('IDX_emails_userId_folder_receivedAt', ['userId', 'isTrashed', 'isSent', 'receivedAt'])
], EmailEntity);
//# sourceMappingURL=email.entity.js.map