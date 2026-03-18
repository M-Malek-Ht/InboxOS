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
exports.MicrosoftStrategy = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const passport_1 = require("@nestjs/passport");
const passport_microsoft_1 = require("passport-microsoft");
const auth_service_1 = require("../auth.service");
let MicrosoftStrategy = class MicrosoftStrategy extends (0, passport_1.PassportStrategy)(passport_microsoft_1.Strategy, 'microsoft') {
    configService;
    authService;
    constructor(configService, authService) {
        super({
            clientID: configService.get('MICROSOFT_CLIENT_ID'),
            clientSecret: configService.get('MICROSOFT_CLIENT_SECRET'),
            callbackURL: `${configService.get('APP_URL')}/auth/microsoft/callback`,
            scope: [
                'user.read',
                'openid',
                'email',
                'profile',
                'Mail.Read',
                'Mail.ReadWrite',
                'Mail.Send',
                'offline_access',
            ],
            tenant: 'common',
        });
        this.configService = configService;
        this.authService = authService;
    }
    async validate(accessToken, refreshToken, profile, done) {
        let email = profile.emails?.[0]?.value;
        if (!email && profile._json) {
            email = profile._json.mail || profile._json.userPrincipalName;
        }
        if (!email) {
            return done(new Error('Could not retrieve email from Microsoft account'));
        }
        const user = await this.authService.validateOrCreateOAuthUser(email, 'microsoft', profile.id, refreshToken);
        done(null, user);
    }
};
exports.MicrosoftStrategy = MicrosoftStrategy;
exports.MicrosoftStrategy = MicrosoftStrategy = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        auth_service_1.AuthService])
], MicrosoftStrategy);
//# sourceMappingURL=microsoft.strategy.js.map