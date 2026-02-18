"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailsModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const emails_controller_1 = require("./emails.controller");
const emails_service_1 = require("./emails.service");
const gmail_service_1 = require("./gmail.service");
const microsoft_mail_service_1 = require("./microsoft-mail.service");
const email_entity_1 = require("./email.entity");
const email_insight_entity_1 = require("./email-insight.entity");
const account_entity_1 = require("../auth/account.entity");
const user_entity_1 = require("../users/entities/user.entity");
const draft_entity_1 = require("../drafts/draft.entity");
const jobs_module_1 = require("../jobs/jobs.module");
let EmailsModule = class EmailsModule {
};
exports.EmailsModule = EmailsModule;
exports.EmailsModule = EmailsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([email_entity_1.EmailEntity, email_insight_entity_1.EmailInsightEntity, account_entity_1.Account, user_entity_1.User, draft_entity_1.DraftEntity]),
            config_1.ConfigModule,
            jobs_module_1.JobsModule,
        ],
        controllers: [emails_controller_1.EmailsController],
        providers: [emails_service_1.EmailsService, gmail_service_1.GmailService, microsoft_mail_service_1.MicrosoftMailService],
    })
], EmailsModule);
//# sourceMappingURL=emails.module.js.map