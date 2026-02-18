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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const jwt_1 = require("@nestjs/jwt");
const account_entity_1 = require("./account.entity");
const users_service_1 = require("../users/users.service");
let AuthService = class AuthService {
    accountRepository;
    usersService;
    jwtService;
    constructor(accountRepository, usersService, jwtService) {
        this.accountRepository = accountRepository;
        this.usersService = usersService;
        this.jwtService = jwtService;
    }
    async validateOrCreateOAuthUser(email, provider, providerId, refreshToken) {
        console.log('[AuthService] validateOrCreateOAuthUser called');
        console.log('[AuthService] email:', email);
        console.log('[AuthService] refreshToken received:', refreshToken ? 'YES' : 'NO');
        const account = await this.accountRepository.findOne({
            where: { provider, providerId },
            relations: ['user'],
        });
        if (account) {
            console.log('[AuthService] Existing account found, userId:', account.userId);
            if (refreshToken && refreshToken !== account.refreshToken) {
                console.log('[AuthService] Updating refresh token');
                await this.accountRepository.update(account.id, { refreshToken });
            }
            return account.user;
        }
        console.log('[AuthService] Creating new account');
        const user = await this.usersService.findOrCreate(email);
        await this.accountRepository.save(this.accountRepository.create({
            userId: user.id,
            provider,
            providerId,
            refreshToken: refreshToken ?? null,
        }));
        console.log('[AuthService] Account created with userId:', user.id);
        return user;
    }
    generateToken(user) {
        return this.jwtService.sign({ sub: user.id, email: user.email });
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(account_entity_1.Account)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        users_service_1.UsersService,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map