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
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const auth_service_1 = require("./auth.service");
const jwt_auth_guard_1 = require("./guards/jwt-auth.guard");
class GoogleCallbackGuard extends (0, passport_1.AuthGuard)('google') {
    getAuthenticateOptions() {
        return { failureRedirect: '/auth/failed' };
    }
}
class MicrosoftCallbackGuard extends (0, passport_1.AuthGuard)('microsoft') {
    getAuthenticateOptions() {
        return { failureRedirect: '/auth/failed' };
    }
}
let AuthController = class AuthController {
    authService;
    constructor(authService) {
        this.authService = authService;
    }
    async googleAuth() {
    }
    async googleCallback(req, res) {
        const token = this.authService.generateToken(req.user);
        const isProd = process.env.NODE_ENV === 'production';
        res.cookie('accessToken', token, {
            httpOnly: true,
            sameSite: isProd ? 'none' : 'lax',
            secure: isProd,
            path: '/',
            maxAge: 60 * 60 * 1000,
        });
        res.redirect(process.env.FRONTEND_URL || 'http://localhost:8080');
    }
    async microsoftAuth() {
    }
    async microsoftCallback(req, res) {
        const token = this.authService.generateToken(req.user);
        const isProd = process.env.NODE_ENV === 'production';
        res.cookie('accessToken', token, {
            httpOnly: true,
            sameSite: isProd ? 'none' : 'lax',
            secure: isProd,
            path: '/',
            maxAge: 60 * 60 * 1000,
        });
        res.redirect(process.env.FRONTEND_URL || 'http://localhost:8080');
    }
    async getProfile(req) {
        return req.user;
    }
    async logout(res) {
        res.clearCookie('accessToken');
        res.redirect(process.env.FRONTEND_URL || 'http://localhost:8080');
    }
    async failed() {
        throw new common_1.HttpException('Authentication failed', common_1.HttpStatus.UNAUTHORIZED);
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Get)('google'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('google')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "googleAuth", null);
__decorate([
    (0, common_1.Get)('google/callback'),
    (0, common_1.UseGuards)(GoogleCallbackGuard),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Response)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "googleCallback", null);
__decorate([
    (0, common_1.Get)('microsoft'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('microsoft')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "microsoftAuth", null);
__decorate([
    (0, common_1.Get)('microsoft/callback'),
    (0, common_1.UseGuards)(MicrosoftCallbackGuard),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Response)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "microsoftCallback", null);
__decorate([
    (0, common_1.Get)('me'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "getProfile", null);
__decorate([
    (0, common_1.Get)('logout'),
    __param(0, (0, common_1.Response)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "logout", null);
__decorate([
    (0, common_1.Get)('failed'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "failed", null);
exports.AuthController = AuthController = __decorate([
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map