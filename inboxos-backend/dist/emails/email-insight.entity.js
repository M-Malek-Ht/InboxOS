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
exports.EmailInsightEntity = void 0;
const typeorm_1 = require("typeorm");
let EmailInsightEntity = class EmailInsightEntity {
    id;
    userId;
    emailId;
    category;
    priorityScore;
    needsReply;
    tags;
    summary;
    createdAt;
    updatedAt;
};
exports.EmailInsightEntity = EmailInsightEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], EmailInsightEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], EmailInsightEntity.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], EmailInsightEntity.prototype, "emailId", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 'Other' }),
    __metadata("design:type", String)
], EmailInsightEntity.prototype, "category", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 50 }),
    __metadata("design:type", Number)
], EmailInsightEntity.prototype, "priorityScore", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], EmailInsightEntity.prototype, "needsReply", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: () => "'[]'" }),
    __metadata("design:type", Array)
], EmailInsightEntity.prototype, "tags", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', default: '' }),
    __metadata("design:type", String)
], EmailInsightEntity.prototype, "summary", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], EmailInsightEntity.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], EmailInsightEntity.prototype, "updatedAt", void 0);
exports.EmailInsightEntity = EmailInsightEntity = __decorate([
    (0, typeorm_1.Entity)('email_insights'),
    (0, typeorm_1.Index)(['userId', 'emailId'], { unique: true })
], EmailInsightEntity);
//# sourceMappingURL=email-insight.entity.js.map