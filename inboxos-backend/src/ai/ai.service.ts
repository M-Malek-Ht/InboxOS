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

  constructor(private configService: ConfigService) {
    this.client = new Anthropic({
      apiKey: this.configService.get<string>('ANTHROPIC_API_KEY'),
    });
  }

  async classifyEmail(email: {
    from: string;
    subject: string;
    body: string;
  }): Promise<ClassifyResult> {
    const message = await this.client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `Analyze the following email and return a JSON object with these fields:
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
        },
      ],
    });

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

    const message = await this.client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    });

    return message.content[0].type === 'text' ? message.content[0].text : '';
  }
}
