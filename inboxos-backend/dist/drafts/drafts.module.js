"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DraftsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const drafts_controller_1 = require("./drafts.controller");
const all_drafts_controller_1 = require("./all-drafts.controller");
const drafts_service_1 = require("./drafts.service");
const draft_entity_1 = require("./draft.entity");
const email_entity_1 = require("../emails/email.entity");
const jobs_module_1 = require("../jobs/jobs.module");
let DraftsModule = class DraftsModule {
};
exports.DraftsModule = DraftsModule;
exports.DraftsModule = DraftsModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([draft_entity_1.DraftEntity, email_entity_1.EmailEntity]), jobs_module_1.JobsModule],
        controllers: [all_drafts_controller_1.AllDraftsController, drafts_controller_1.DraftsController],
        providers: [drafts_service_1.DraftsService],
    })
], DraftsModule);
//# sourceMappingURL=drafts.module.js.map