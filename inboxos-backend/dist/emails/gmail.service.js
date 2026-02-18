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
var GmailService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GmailService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const account_entity_1 = require("../auth/account.entity");
let GmailService = GmailService_1 = class GmailService {
    accountRepo;
    configService;
    log = new common_1.Logger(GmailService_1.name);
    constructor(accountRepo, configService) {
        this.accountRepo = accountRepo;
        this.configService = configService;
    }
    async getAccessTokenForUser(userId) {
        const account = await this.accountRepo.findOne({
            where: { userId, provider: 'google' },
        });
        if (!account?.refreshToken)
            return null;
        return this.refreshAccessToken(account.refreshToken);
    }
    async refreshAccessToken(refreshToken) {
        const res = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id: this.configService.get('GOOGLE_CLIENT_ID'),
                client_secret: this.configService.get('GOOGLE_CLIENT_SECRET'),
                refresh_token: refreshToken,
                grant_type: 'refresh_token',
            }),
        });
        const data = await res.json();
        if (!data.access_token) {
            throw new Error('Failed to refresh Gmail access token');
        }
        return data.access_token;
    }
    async listEmails(accessToken, options = {}) {
        const myEmail = options.userEmail?.toLowerCase() ??
            (await this.getUserProfile(accessToken))?.toLowerCase();
        this.log.log(`listEmails: userEmail=${myEmail ?? 'UNKNOWN — filtering will be weak!'}`);
        const params = new URLSearchParams();
        params.set('maxResults', String(options.maxResults ?? 40));
        params.set('labelIds', 'INBOX');
        const qParts = [];
        if (options.filter === 'unread')
            qParts.push('is:unread');
        if (options.search)
            qParts.push(options.search);
        if (qParts.length > 0)
            params.set('q', qParts.join(' '));
        const listUrl = `https://www.googleapis.com/gmail/v1/users/me/threads?${params.toString()}`;
        this.log.log(`Listing threads: ${listUrl}`);
        const listRes = await fetch(listUrl, {
            headers: { Authorization: `Bearer ${accessToken}` },
        });
        const listData = await listRes.json();
        if (!listData.threads)
            return [];
        this.log.log(`Found ${listData.threads.length} threads`);
        const results = [];
        const threads = await Promise.all(listData.threads.map((t) => this.fetchThread(accessToken, t.id)));
        for (const threadMessages of threads) {
            if (!threadMessages || threadMessages.length === 0)
                continue;
            for (const m of threadMessages) {
                this.log.debug(`  msg id=${m.id} from="${m.from}" isSent=${m.isSent} labels=${m.labelIds?.join(',')}`);
            }
            const received = threadMessages.filter((m) => {
                if (m.isSent) {
                    this.log.debug(`  FILTERED (isSent): ${m.id}`);
                    return false;
                }
                if (myEmail && m.from.toLowerCase().includes(myEmail)) {
                    this.log.debug(`  FILTERED (from matches user): ${m.id} from="${m.from}"`);
                    return false;
                }
                return true;
            });
            if (received.length > 0) {
                received.sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime());
                this.log.log(`Thread: picked msg ${received[0].id} subject="${received[0].subject}" (${threadMessages.length} msgs, ${received.length} received)`);
                results.push(received[0]);
            }
            else {
                this.log.log(`Thread SKIPPED (all sent/from-user): subject="${threadMessages[0]?.subject}" (${threadMessages.length} msgs)`);
            }
        }
        return results;
    }
    async getMessage(accessToken, messageId) {
        return this.fetchAndParse(accessToken, messageId);
    }
    async markAsRead(accessToken, messageId) {
        await this.setReadState(accessToken, messageId, true);
    }
    async markAsUnread(accessToken, messageId) {
        await this.setReadState(accessToken, messageId, false);
    }
    async getUserProfile(accessToken) {
        try {
            const res = await fetch('https://www.googleapis.com/gmail/v1/users/me/profile', { headers: { Authorization: `Bearer ${accessToken}` } });
            if (!res.ok)
                return null;
            const data = await res.json();
            return data.emailAddress ?? null;
        }
        catch {
            return null;
        }
    }
    async getThread(accessToken, threadId) {
        return this.fetchThread(accessToken, threadId);
    }
    async fetchThread(accessToken, threadId) {
        const url = `https://www.googleapis.com/gmail/v1/users/me/threads/${threadId}?format=full`;
        const res = await fetch(url, {
            headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!res.ok) {
            this.log.warn(`Failed to fetch thread ${threadId}: ${res.status}`);
            return [];
        }
        const data = await res.json();
        const messages = data.messages ?? [];
        return messages.map((msg) => this.parseMessage(msg));
    }
    async sendReply(accessToken, params) {
        const lines = [
            `To: ${params.to}`,
            `Subject: ${params.subject.startsWith('Re:') ? params.subject : `Re: ${params.subject}`}`,
            'Content-Type: text/plain; charset=UTF-8',
        ];
        if (params.inReplyTo) {
            lines.push(`In-Reply-To: ${params.inReplyTo}`);
            lines.push(`References: ${params.inReplyTo}`);
        }
        lines.push('', params.body);
        const raw = Buffer.from(lines.join('\r\n'))
            .toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');
        const payload = { raw };
        if (params.threadId)
            payload.threadId = params.threadId;
        const res = await fetch('https://www.googleapis.com/gmail/v1/users/me/messages/send', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });
        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error?.message ?? 'Failed to send reply via Gmail');
        }
        const data = await res.json();
        const sentId = data.id;
        this.log.log(`Reply sent: id=${sentId}, threadId=${params.threadId}`);
        try {
            await this.removeFromInbox(accessToken, sentId);
        }
        catch (err) {
            this.log.warn(`Could not remove INBOX label from sent reply ${sentId}: ${err.message}`);
        }
        return { id: sentId };
    }
    async removeFromInbox(accessToken, messageId) {
        const url = `https://www.googleapis.com/gmail/v1/users/me/messages/${messageId}/modify`;
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ removeLabelIds: ['INBOX'] }),
        });
        if (res.ok) {
            this.log.log(`Removed INBOX label from sent message ${messageId}`);
        }
    }
    async listSentEmails(accessToken, options = {}) {
        const params = new URLSearchParams();
        params.set('maxResults', String(options.maxResults ?? 40));
        params.set('labelIds', 'SENT');
        if (options.search)
            params.set('q', options.search);
        const url = `https://www.googleapis.com/gmail/v1/users/me/messages?${params.toString()}`;
        const listRes = await fetch(url, {
            headers: { Authorization: `Bearer ${accessToken}` },
        });
        const listData = await listRes.json();
        if (!listData.messages)
            return [];
        const messages = await Promise.all(listData.messages.map((m) => this.fetchAndParse(accessToken, m.id)));
        return messages;
    }
    async listTrashEmails(accessToken, options = {}) {
        const params = new URLSearchParams();
        params.set('maxResults', String(options.maxResults ?? 40));
        params.set('labelIds', 'TRASH');
        if (options.search)
            params.set('q', options.search);
        const url = `https://www.googleapis.com/gmail/v1/users/me/messages?${params.toString()}`;
        const listRes = await fetch(url, {
            headers: { Authorization: `Bearer ${accessToken}` },
        });
        const listData = await listRes.json();
        if (!listData.messages)
            return [];
        const messages = await Promise.all(listData.messages.map((m) => this.fetchAndParse(accessToken, m.id)));
        return messages;
    }
    async untrashMessage(accessToken, messageId) {
        const url = `https://www.googleapis.com/gmail/v1/users/me/messages/${messageId}/untrash`;
        const res = await fetch(url, {
            method: 'POST',
            headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error?.message ?? 'Failed to untrash message');
        }
    }
    async trashMessage(accessToken, messageId) {
        const url = `https://www.googleapis.com/gmail/v1/users/me/messages/${messageId}/trash`;
        const res = await fetch(url, {
            method: 'POST',
            headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error?.message ?? 'Failed to trash message');
        }
    }
    async fetchAndParse(accessToken, messageId) {
        const url = `https://www.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`;
        const res = await fetch(url, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        const msg = await res.json();
        if (msg.error) {
            throw new Error(msg.error.message);
        }
        return this.parseMessage(msg);
    }
    async setReadState(accessToken, messageId, isRead) {
        const url = `https://www.googleapis.com/gmail/v1/users/me/messages/${messageId}/modify`;
        const body = isRead
            ? { removeLabelIds: ['UNREAD'] }
            : { addLabelIds: ['UNREAD'] };
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });
        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error?.message ?? 'Failed to update read state');
        }
    }
    parseMessage(msg) {
        const headers = msg.payload?.headers ?? [];
        const getHeader = (name) => headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ?? '';
        const labelIds = msg.labelIds ?? [];
        const isRead = !labelIds.includes('UNREAD');
        return {
            id: msg.id,
            from: getHeader('from'),
            subject: getHeader('subject'),
            snippet: msg.snippet ?? '',
            body: this.extractBody(msg.payload),
            receivedAt: new Date(getHeader('date')),
            isRead,
            threadId: msg.threadId,
            to: getHeader('to'),
            messageIdHeader: getHeader('message-id'),
            labelIds,
            isSent: labelIds.includes('SENT'),
        };
    }
    extractBody(payload) {
        if (!payload)
            return '';
        if (payload.body?.data) {
            return this.decodeBase64Url(payload.body.data);
        }
        if (payload.parts) {
            const textPart = payload.parts.find((p) => p.mimeType === 'text/plain');
            if (textPart)
                return this.extractBody(textPart);
            const htmlPart = payload.parts.find((p) => p.mimeType === 'text/html');
            if (htmlPart)
                return this.extractBody(htmlPart);
            const nestedMultipart = payload.parts.find((p) => p.mimeType?.startsWith('multipart/'));
            if (nestedMultipart)
                return this.extractBody(nestedMultipart);
        }
        return '';
    }
    decodeBase64Url(data) {
        const base64 = data.replace(/-/g, '+').replace(/_/g, '/');
        return Buffer.from(base64, 'base64').toString('utf-8');
    }
};
exports.GmailService = GmailService;
exports.GmailService = GmailService = GmailService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(account_entity_1.Account)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        config_1.ConfigService])
], GmailService);
//# sourceMappingURL=gmail.service.js.map