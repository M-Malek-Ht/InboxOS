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
exports.GoogleStrategy = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const passport_1 = require("@nestjs/passport");
const passport_google_oauth20_1 = require("passport-google-oauth20");
const auth_service_1 = require("../auth.service");
let GoogleStrategy = class GoogleStrategy extends (0, passport_1.PassportStrategy)(passport_google_oauth20_1.Strategy, 'google') {
    configService;
    authService;
    constructor(configService, authService) {
        super({
            clientID: configService.get('GOOGLE_CLIENT_ID'),
            clientSecret: configService.get('GOOGLE_CLIENT_SECRET'),
            callbackURL: `${configService.get('APP_URL')}/auth/google/callback`,
            scope: [
                'email',
                'profile',
                'https://www.googleapis.com/auth/gmail.modify',
                'https://www.googleapis.com/auth/gmail.send',
            ],
            accessType: 'offline',
            prompt: 'consent',
        });
        this.configService = configService;
        this.authService = authService;
    }
    authorizationParams() {
        return {
            access_type: 'offline',
            prompt: 'consent',
        };
    }
    async validate(_accessToken, refreshToken, profile, done) {
        console.log('[GoogleStrategy] validate called, refreshToken:', refreshToken ? 'YES' : 'NO');
        const user = await this.authService.validateOrCreateOAuthUser(profile.emails[0].value, 'google', profile.id, refreshToken);
        done(null, user);
    }
};
exports.GoogleStrategy = GoogleStrategy;
exports.GoogleStrategy = GoogleStrategy = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        auth_service_1.AuthService])
], GoogleStrategy);
//# sourceMappingURL=google.strategy.js.map