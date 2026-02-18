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
exports.MicrosoftMailService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const account_entity_1 = require("../auth/account.entity");
let MicrosoftMailService = class MicrosoftMailService {
    accountRepo;
    configService;
    constructor(accountRepo, configService) {
        this.accountRepo = accountRepo;
        this.configService = configService;
    }
    async getAccessTokenForUser(userId) {
        console.log('[MicrosoftMailService] Looking for account with userId:', userId);
        const account = await this.accountRepo.findOne({
            where: { userId, provider: 'microsoft' },
        });
        console.log('[MicrosoftMailService] Account found:', account ? 'YES' : 'NO');
        console.log('[MicrosoftMailService] Has refreshToken:', account?.refreshToken ? 'YES' : 'NO');
        if (!account?.refreshToken)
            return null;
        return this.refreshAccessToken(account.refreshToken);
    }
    async refreshAccessToken(refreshToken) {
        const res = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id: this.configService.get('MICROSOFT_CLIENT_ID'),
                client_secret: this.configService.get('MICROSOFT_CLIENT_SECRET'),
                refresh_token: refreshToken,
                grant_type: 'refresh_token',
                scope: 'Mail.Read Mail.ReadWrite Mail.Send offline_access',
            }),
        });
        const data = await res.json();
        if (!data.access_token) {
            console.error('[MicrosoftMailService] Token refresh failed:', data);
            throw new Error('Failed to refresh Microsoft access token');
        }
        return data.access_token;
    }
    async listEmails(accessToken, options = {}) {
        const top = options.maxResults ?? 40;
        const params = new URLSearchParams();
        params.set('$top', String(top));
        params.set('$orderby', 'receivedDateTime desc');
        params.set('$select', 'id,from,subject,bodyPreview,body,receivedDateTime,isRead');
        const filterParts = [];
        if (options.filter === 'unread') {
            filterParts.push('isRead eq false');
        }
        if (filterParts.length > 0) {
            params.set('$filter', filterParts.join(' and '));
        }
        if (options.search) {
            params.set('$search', `"${options.search}"`);
        }
        const url = `https://graph.microsoft.com/v1.0/me/messages?${params.toString()}`;
        console.log('[MicrosoftMailService] Fetching emails from:', url);
        const res = await fetch(url, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
        });
        console.log('[MicrosoftMailService] Graph API response status:', res.status);
        const data = await res.json();
        if (data.error) {
            console.error('[MicrosoftMailService] Graph API error:', data.error);
            throw new Error(data.error.message);
        }
        const messages = data.value ?? [];
        console.log('[MicrosoftMailService] Found', messages.length, 'messages');
        return messages.map((msg) => this.parseMessage(msg));
    }
    async getMessage(accessToken, messageId) {
        console.log('[MicrosoftMailService] getMessage called with messageId:', messageId);
        const url = `https://graph.microsoft.com/v1.0/me/messages/${messageId}?$select=id,from,subject,bodyPreview,body,receivedDateTime,isRead`;
        const res = await fetch(url, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
        });
        console.log('[MicrosoftMailService] getMessage response status:', res.status);
        const msg = await res.json();
        if (msg.error) {
            console.error('[MicrosoftMailService] getMessage error:', msg.error);
            throw new Error(msg.error.message);
        }
        return this.parseMessage(msg);
    }
    async markAsRead(accessToken, messageId) {
        console.log('[MicrosoftMailService] markAsRead called with messageId:', messageId);
        await this.setReadState(accessToken, messageId, true);
    }
    async markAsUnread(accessToken, messageId) {
        console.log('[MicrosoftMailService] markAsUnread called with messageId:', messageId);
        await this.setReadState(accessToken, messageId, false);
    }
    async sendReply(accessToken, messageId, body) {
        const url = `https://graph.microsoft.com/v1.0/me/messages/${messageId}/reply`;
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ comment: body }),
        });
        if (!res.ok) {
            const error = await res.json().catch(() => ({}));
            throw new Error(error.error?.message ?? 'Failed to send reply via Microsoft Graph');
        }
    }
    async listSentEmails(_accessToken, _options = {}) {
        return [];
    }
    async listTrashEmails(_accessToken, _options = {}) {
        return [];
    }
    async untrashMessage(_accessToken, _messageId) {
    }
    async deleteMessage(accessToken, messageId) {
        const url = `https://graph.microsoft.com/v1.0/me/messages/${messageId}`;
        const res = await fetch(url, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!res.ok && res.status !== 204) {
            const error = await res.json().catch(() => ({}));
            throw new Error(error.error?.message ?? 'Failed to delete message');
        }
    }
    async setReadState(accessToken, messageId, isRead) {
        const url = `https://graph.microsoft.com/v1.0/me/messages/${messageId}`;
        const res = await fetch(url, {
            method: 'PATCH',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ isRead }),
        });
        if (!res.ok) {
            const error = await res.json();
            console.error('[MicrosoftMailService] setReadState error:', error);
            throw new Error(error.error?.message ?? 'Failed to update read state');
        }
        console.log('[MicrosoftMailService] Email read state updated:', isRead ? 'read' : 'unread');
    }
    parseMessage(msg) {
        const fromAddress = msg.from?.emailAddress;
        const fromStr = fromAddress
            ? (fromAddress.name ? `${fromAddress.name} <${fromAddress.address}>` : fromAddress.address)
            : '';
        return {
            id: msg.id,
            from: fromStr,
            subject: msg.subject ?? '',
            snippet: msg.bodyPreview ?? '',
            body: msg.body?.content ?? '',
            receivedAt: new Date(msg.receivedDateTime),
            isRead: msg.isRead ?? false,
        };
    }
};
exports.MicrosoftMailService = MicrosoftMailService;
exports.MicrosoftMailService = MicrosoftMailService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(account_entity_1.Account)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        config_1.ConfigService])
], MicrosoftMailService);
//# sourceMappingURL=microsoft-mail.service.js.map