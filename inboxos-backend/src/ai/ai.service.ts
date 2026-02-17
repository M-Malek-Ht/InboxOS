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
    const message = await this.createUserMessage(
      `Analyze the following email and return a JSON object with these fields:
- "category": one of "Meetings", "Work", "Personal", "Bills", "Newsletters", "Support", "Other"
- "priorityScore": integer 0-100 (100 = most urgent)
- "needsReply": boolean (true if the sender expects a response)
- "tags": array of relevant tags (e.g. "urgent", "deadline", "meeting", "follow-up", "action-required", "fyi", "billing")
- "summary": a 1-2 sentence summary of the email

Return ONLY the JSON object, no markdown, no explanation.

From: ${email.from}
Subject: ${email.subject}
Body:
${email.body}`,
      1024,
    );

    const text =
      message.content[0].type === 'text' ? message.content[0].text : '';
    const result = JSON.parse(text);

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
}
