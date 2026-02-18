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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
let AiService = class AiService {
    configService;
    client;
    models;
    constructor(configService) {
        this.configService = configService;
        this.client = new sdk_1.default({
            apiKey: this.configService.get('ANTHROPIC_API_KEY'),
        });
        const configuredModel = this.configService.get('ANTHROPIC_MODEL') ??
            'claude-sonnet-4-20250514';
        this.models = Array.from(new Set([configuredModel, 'claude-3-5-sonnet-latest']));
    }
    async classifyEmail(email) {
        const message = await this.createUserMessage(`Analyze the following email and return a JSON object with these fields:
- "category": one of "Meetings", "Work", "Personal", "Bills", "Newsletters", "Support", "Other"
- "priorityScore": integer 0-100 (100 = most urgent)
- "needsReply": boolean (true ONLY if a real person directly expects a personal response. Set to false for: automated/system emails, no-reply or noreply senders, newsletters, marketing, notifications, receipts, shipping updates, password resets, system alerts, social media notifications, calendar invites, and any email that says "do not reply" or "this is an automated message")
- "tags": array of relevant tags (e.g. "urgent", "deadline", "meeting", "follow-up", "action-required", "fyi", "billing")
- "summary": a 1-2 sentence summary of the email

Return ONLY the JSON object, no markdown, no explanation.

From: ${email.from}
Subject: ${email.subject}
Body:
${email.body}`, 1024);
        const text = message.content[0].type === 'text' ? message.content[0].text : '';
        const result = JSON.parse(text);
        return {
            category: result.category ?? 'Other',
            priorityScore: Math.min(100, Math.max(0, Number(result.priorityScore) || 50)),
            needsReply: Boolean(result.needsReply),
            tags: Array.isArray(result.tags) ? result.tags : [],
            summary: result.summary ?? '',
        };
    }
    async generateDraft(email, options) {
        const toneGuide = {
            Professional: 'Use a professional, business-appropriate tone.',
            Friendly: 'Use a warm, friendly, and approachable tone.',
            Short: 'Be extremely concise and to the point. Use short sentences.',
            Firm: 'Use a firm, assertive tone. Be direct and clear about expectations.',
            Apologetic: 'Use an apologetic, empathetic tone. Acknowledge any issues.',
        };
        const lengthGuide = {
            Short: 'Keep the response to 2-3 sentences maximum.',
            Medium: 'Write a moderate response of about 1-2 short paragraphs.',
            Detailed: 'Write a thorough, detailed response covering all points raised in the email.',
        };
        const toneInstruction = toneGuide[options.tone] || toneGuide['Professional'];
        const lengthInstruction = lengthGuide[options.length] || lengthGuide['Medium'];
        let prompt = `Draft a reply to the following email.

${toneInstruction}
${lengthInstruction}`;
        if (options.instruction) {
            prompt += `\n\nAdditional instructions from the user: ${options.instruction}`;
        }
        prompt += `

Original email:
From: ${email.from}
Subject: ${email.subject}
Body:
${email.body}

Write ONLY the reply body text. Do not include "Subject:", "To:", greeting headers, or email metadata. Start directly with the greeting (e.g. "Hi [Name],").`;
        const message = await this.createUserMessage(prompt, 2048);
        return message.content[0].type === 'text' ? message.content[0].text : '';
    }
    async createUserMessage(content, maxTokens) {
        let lastError = null;
        for (const model of this.models) {
            try {
                return await this.callWithRetry(model, content, maxTokens);
            }
            catch (error) {
                lastError = error;
                if (!this.isModelAccessError(error))
                    break;
            }
        }
        throw new Error(`Anthropic request failed: ${this.getErrorMessage(lastError)}`);
    }
    async callWithRetry(model, content, maxTokens, maxRetries = 5) {
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                return await this.client.messages.create({
                    model,
                    max_tokens: maxTokens,
                    messages: [{ role: 'user', content }],
                });
            }
            catch (error) {
                const status = error?.status ?? error?.error?.status;
                if (status === 429 && attempt < maxRetries) {
                    const delay = Math.min(2000 * Math.pow(2, attempt), 30000);
                    await new Promise((r) => setTimeout(r, delay));
                    continue;
                }
                throw error;
            }
        }
        throw new Error('Max retries exceeded');
    }
    isModelAccessError(error) {
        const msg = this.getErrorMessage(error).toLowerCase();
        return msg.includes('model') && (msg.includes('not found') ||
            msg.includes('not available') ||
            msg.includes('permission') ||
            msg.includes('access'));
    }
    getErrorMessage(error) {
        if (!error)
            return 'unknown error';
        return (error?.error?.message ??
            error?.response?.data?.error?.message ??
            error?.message ??
            String(error));
    }
};
exports.AiService = AiService;
exports.AiService = AiService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], AiService);
//# sourceMappingURL=ai.service.js.map