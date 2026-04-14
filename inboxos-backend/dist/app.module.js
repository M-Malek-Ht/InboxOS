"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const path_1 = require("path");
const health_controller_1 = require("./health.controller");
const emails_module_1 = require("./emails/emails.module");
const drafts_module_1 = require("./drafts/drafts.module");
const users_module_1 = require("./users/users.module");
const auth_module_1 = require("./auth/auth.module");
const ai_module_1 = require("./ai/ai.module");
const jobs_module_1 = require("./jobs/jobs.module");
const settings_module_1 = require("./settings/settings.module");
function isEnvFlagEnabled(value, fallback) {
    return value ? value.toLowerCase() === 'true' : fallback;
}
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            typeorm_1.TypeOrmModule.forRootAsync({
                inject: [config_1.ConfigService],
                useFactory: (cfg) => {
                    const isProduction = cfg.get('NODE_ENV') === 'production';
                    const synchronize = isEnvFlagEnabled(cfg.get('DB_SYNC'), !isProduction);
                    const useSsl = isEnvFlagEnabled(cfg.get('DB_SSL'), isProduction);
                    const dbPort = Number(cfg.get('DB_PORT') ?? 5432);
                    const dbPoolMax = Number(cfg.get('DB_POOL_MAX') ?? 10);
                    return {
                        type: 'postgres',
                        host: cfg.get('DB_HOST'),
                        port: Number.isFinite(dbPort) ? dbPort : 5432,
                        username: cfg.get('DB_USER'),
                        password: cfg.get('DB_PASS'),
                        database: cfg.get('DB_NAME'),
                        autoLoadEntities: true,
                        synchronize,
                        migrations: [(0, path_1.join)(__dirname, 'migrations', '*{.ts,.js}')],
                        migrationsRun: true,
                        ssl: useSsl ? { rejectUnauthorized: false } : false,
                        extra: {
                            max: Number.isFinite(dbPoolMax) ? dbPoolMax : 10,
                            keepAlive: true,
                        },
                    };
                },
            }),
            emails_module_1.EmailsModule,
            drafts_module_1.DraftsModule,
            users_module_1.UsersModule,
            auth_module_1.AuthModule,
            ai_module_1.AiModule,
            jobs_module_1.JobsModule,
            settings_module_1.SettingsModule,
        ],
        controllers: [health_controller_1.HealthController],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map