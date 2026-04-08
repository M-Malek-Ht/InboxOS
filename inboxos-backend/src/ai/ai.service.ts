import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';

export interface ClassifyResult {
  category: 'Meetings' | 'Work' | 'Personal' | 'Bills' | 'Newsletters' | 'Support' | 'Other';
  priorityScore: number;
  needsReply: boolean;
  tags: string[];
  summary: string;
}

export interface GenerateDraftOptions {
  tone: string;
  length: string;
  instruction?: string;
}

@Injectable()
export class AiService {
  private client: Anthropic;
  private models: string[];
  private static readonly MAX_CLASSIFY_BODY_CHARS = 12000;
  private static readonly MAX_DRAFT_BODY_CHARS = 16000;
  private static readonly MAX_INSTRUCTION_CHARS = 1000;

  constructor(private configService: ConfigService) {
    this.client = new Anthropic({
      apiKey: this.configService.get<string>('ANTHROPIC_API_KEY'),
    });
    const configuredModel =
      this.configService.get<string>('ANTHROPIC_MODEL') ??
      'claude-sonnet-4-20250514';
    // Keep a fallback so keys without access to the primary model can still work.
    this.models = Array.from(new Set([configuredModel, 'claude-3-5-sonnet-latest']));
  }

  async classifyEmail(email: {
    from: string;
    subject: string;
    body: string;
  }): Promise<ClassifyResult> {
    const safeFrom = this.truncateForPrompt(email.from, 320);
    const safeSubject = this.truncateForPrompt(email.subject, 500);
    const safeBody = this.truncateForPrompt(
      email.body,
      AiService.MAX_CLASSIFY_BODY_CHARS,
    );

    const message = await this.createUserMessage(
      `Analyze the following email and return a JSON object with these fields:
- "category": one of "Meetings", "Work", "Personal", "Bills", "Newsletters", "Support", "Other"
- "priorityScore": integer 0-100 using the exact bands below — do NOT cluster scores around 70-75
  - 0-19:  Automated/no-reply emails, newsletters, marketing, notifications, receipts, shipping updates, social media digests. No human action needed.
  - 20-39: FYI updates, CC'd threads, low-stakes announcements, informational emails the recipient does not need to act on.
  - 40-59: Normal work emails that need a response eventually but have no urgency — scheduling, routine questions, non-critical follow-ups.
  - 60-79: Important emails that need a prompt response — direct requests from colleagues or clients, meetings being scheduled, items with a soft deadline within the week.
  - 80-100: Urgent or high-stakes emails — hard deadlines today or tomorrow, escalations, critical bugs/outages, executive requests, legal/compliance, payments overdue, or any email explicitly marked urgent.
  Use the FULL range. Most everyday work emails should score 40-59. Reserve 80+ for genuinely urgent items.
- "needsReply": boolean (true ONLY if a real person directly expects a personal response. Set to false for: automated/system emails, no-reply or noreply senders, newsletters, marketing, notifications, receipts, shipping updates, password resets, system alerts, social media notifications, calendar invites, and any email that says "do not reply" or "this is an automated message")
- "tags": array of relevant tags (e.g. "urgent", "deadline", "meeting", "follow-up", "action-required", "fyi", "billing")
- "summary": a 1-2 sentence summary of the email

Return ONLY the JSON object, no markdown, no explanation.

From: ${safeFrom}
Subject: ${safeSubject}
Body:
${safeBody}`,
      1024,
    );

    const text =
      message.content[0].type === 'text' ? message.content[0].text : '';
    const result = this.parseJsonObject(text);

    return {
      category: result.category ?? 'Other',
      priorityScore: Math.min(100, Math.max(0, Number(result.priorityScore) || 50)),
      needsReply: Boolean(result.needsReply),
      tags: Array.isArray(result.tags) ? result.tags : [],
      summary: result.summary ?? '',
    };
  }

  async generateDraft(
    email: { from: string; subject: string; body: string },
    options: GenerateDraftOptions,
  ): Promise<string> {
    const toneGuide: Record<string, string> = {
      Professional: 'Use a professional, business-appropriate tone.',
      Friendly: 'Use a warm, friendly, and approachable tone.',
      Short: 'Be extremely concise and to the point. Use short sentences.',
      Firm: 'Use a firm, assertive tone. Be direct and clear about expectations.',
      Apologetic: 'Use an apologetic, empathetic tone. Acknowledge any issues.',
    };

    const lengthGuide: Record<string, string> = {
      Short: 'Keep the response to 2-3 sentences maximum.',
      Medium: 'Write a moderate response of about 1-2 short paragraphs.',
      Detailed: 'Write a thorough, detailed response covering all points raised in the email.',
    };

    const toneInstruction = toneGuide[options.tone] || toneGuide['Professional'];
    const lengthInstruction = lengthGuide[options.length] || lengthGuide['Medium'];

    const safeFrom = this.truncateForPrompt(email.from, 320);
    const safeSubject = this.truncateForPrompt(email.subject, 500);
    const safeBody = this.truncateForPrompt(
      email.body,
      AiService.MAX_DRAFT_BODY_CHARS,
    );

    let prompt = `Draft a reply to the following email.

${toneInstruction}
${lengthInstruction}`;

    if (options.instruction) {
      const safeInstruction = this.truncateForPrompt(
        options.instruction,
        AiService.MAX_INSTRUCTION_CHARS,
      );
      prompt += `\n\nAdditional instructions from the user: ${safeInstruction}`;
    }

    prompt += `

Original email:
From: ${safeFrom}
Subject: ${safeSubject}
Body:
${safeBody}

Write ONLY the reply body text. Do not include "Subject:", "To:", greeting headers, or email metadata. Start directly with the greeting (e.g. "Hi [Name],").`;

    const message = await this.createUserMessage(prompt, 2048);

    return message.content[0].type === 'text' ? message.content[0].text : '';
  }

  private async createUserMessage(content: string, maxTokens: number) {
    let lastError: any = null;

    for (const model of this.models) {
      try {
        return await this.callWithRetry(model, content, maxTokens);
      } catch (error: any) {
        lastError = error;
        if (!this.isModelAccessError(error)) break;
      }
    }

    throw new Error(`Anthropic request failed: ${this.getErrorMessage(lastError)}`);
  }

  private async callWithRetry(
    model: string,
    content: string,
    maxTokens: number,
    maxRetries = 5,
  ) {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await this.client.messages.create({
          model,
          max_tokens: maxTokens,
          messages: [{ role: 'user', content }],
        });
      } catch (error: any) {
        const status = error?.status ?? error?.error?.status;
        const transient = status === 429 || status === 500 || status === 502 || status === 503 || status === 504;
        if (transient && attempt < maxRetries) {
          const base = Math.min(1500 * Math.pow(2, attempt), 30000);
          const jitter = Math.floor(Math.random() * 500);
          const delay = base + jitter;
          await new Promise((r) => setTimeout(r, delay));
          continue;
        }
        throw error;
      }
    }
    throw new Error('Max retries exceeded');
  }

  private isModelAccessError(error: any): boolean {
    const msg = this.getErrorMessage(error).toLowerCase();
    return msg.includes('model') && (
      msg.includes('not found') ||
      msg.includes('not available') ||
      msg.includes('permission') ||
      msg.includes('access')
    );
  }

  private getErrorMessage(error: any): string {
    if (!error) return 'unknown error';
    return (
      error?.error?.message ??
      error?.response?.data?.error?.message ??
      error?.message ??
      String(error)
    );
  }

  private truncateForPrompt(value: unknown, maxChars: number): string {
    const text = typeof value === 'string' ? value : String(value ?? '');
    if (text.length <= maxChars) return text;
    return `${text.slice(0, maxChars)}\n[truncated]`;
  }

  private parseJsonObject(text: string): Record<string, any> {
    const trimmed = text.trim();

    try {
      return JSON.parse(trimmed);
    } catch {
      // Fall through and try extracting first JSON object block.
    }

    const start = trimmed.indexOf('{');
    const end = trimmed.lastIndexOf('}');
    if (start >= 0 && end > start) {
      const candidate = trimmed.slice(start, end + 1);
      try {
        return JSON.parse(candidate);
      } catch {
        // fallthrough
      }
    }

    throw new Error('Invalid JSON returned by AI classify response');
  }
}
