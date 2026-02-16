import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { EmailEntity } from './email.entity';
import { EmailInsightEntity } from './email-insight.entity';
import { GmailService } from './gmail.service';
import { MicrosoftMailService } from './microsoft-mail.service';

@Injectable()
export class EmailsService {
  constructor(
    @InjectRepository(EmailEntity)
    private readonly repo: Repository<EmailEntity>,
    @InjectRepository(EmailInsightEntity)
    private readonly insightsRepo: Repository<EmailInsightEntity>,
    private readonly gmail: GmailService,
    private readonly microsoftMail: MicrosoftMailService,
  ) {}

  async listForUser(
    userId: string,
    options: { filter?: string; search?: string; limit?: number } = {},
  ) {
    console.log('[EmailsService] listForUser called with userId:', userId);
    const accessToken = await this.gmail.getAccessTokenForUser(userId);
    console.log('[EmailsService] accessToken retrieved:', accessToken ? 'YES' : 'NO');
    if (accessToken) {
      try {
        const emails = await this.gmail.listEmails(accessToken, {
          maxResults: options.limit,
          filter: options.filter,
          search: options.search,
        });
        console.log('[EmailsService] Gmail returned', emails.length, 'emails');
        return this.attachInsights(userId, emails);
      } catch (error) {
        console.error('[EmailsService] Gmail API error:', error);
      }
    }

    // Try Microsoft Graph
    const msToken = await this.microsoftMail.getAccessTokenForUser(userId);
    console.log('[EmailsService] Microsoft accessToken:', msToken ? 'YES' : 'NO');
    if (msToken) {
      try {
        const emails = await this.microsoftMail.listEmails(msToken, {
          maxResults: options.limit,
          filter: options.filter,
          search: options.search,
        });
        console.log('[EmailsService] Microsoft returned', emails.length, 'emails');
        return this.attachInsights(userId, emails);
      } catch (error) {
        console.error('[EmailsService] Microsoft Graph API error:', error);
      }
    }

    // No provider linked — fall back to seed data
    console.log('[EmailsService] Falling back to seed data');
    await this.seedIfEmpty();
    const qb = this.repo.createQueryBuilder('email');

    if (options.search) {
      qb.where(
        'email.subject ILIKE :q OR email.from ILIKE :q OR email.snippet ILIKE :q',
        { q: `%${options.search}%` },
      );
    }

    if (options.filter === 'unread') {
      if (qb.expressionMap.wheres.length === 0) {
        qb.where('email.isRead = false');
      } else {
        qb.andWhere('email.isRead = false');
      }
    }

    qb.orderBy('email.receivedAt', 'DESC');
    if (options.limit) qb.take(options.limit);

    const emails = await qb.getMany();
    return this.attachInsights(userId, emails);
  }

  async getForUser(userId: string, emailId: string) {
    console.log('[EmailsService] getForUser called with emailId:', emailId);
    const accessToken = await this.gmail.getAccessTokenForUser(userId);
    if (accessToken) {
      try {
        const email = await this.gmail.getMessage(accessToken, emailId);
        console.log('[EmailsService] Gmail getMessage returned:', email ? 'YES' : 'NO');
        return this.attachInsight(userId, email);
      } catch (error) {
        console.error('[EmailsService] Gmail getMessage error:', error);
        // Gmail fetch failed; fall through
      }
    }

    // Try Microsoft Graph
    const msToken = await this.microsoftMail.getAccessTokenForUser(userId);
    if (msToken) {
      try {
        const email = await this.microsoftMail.getMessage(msToken, emailId);
        console.log('[EmailsService] Microsoft getMessage returned:', email ? 'YES' : 'NO');
        return this.attachInsight(userId, email);
      } catch (error) {
        console.error('[EmailsService] Microsoft getMessage error:', error);
      }
    }

    const email = await this.repo.findOne({ where: { id: emailId } });
    return this.attachInsight(userId, email);
  }

  async setReadState(userId: string, emailId: string, isRead: boolean) {
    console.log('[EmailsService] setReadState called with emailId:', emailId, 'isRead:', isRead);
    const accessToken = await this.gmail.getAccessTokenForUser(userId);
    if (accessToken) {
      if (isRead) {
        await this.gmail.markAsRead(accessToken, emailId);
      } else {
        await this.gmail.markAsUnread(accessToken, emailId);
      }
      return { ok: true };
    }

    // Try Microsoft Graph
    const msToken = await this.microsoftMail.getAccessTokenForUser(userId);
    if (msToken) {
      if (isRead) {
        await this.microsoftMail.markAsRead(msToken, emailId);
      } else {
        await this.microsoftMail.markAsUnread(msToken, emailId);
      }
      return { ok: true };
    }

    await this.repo.update({ id: emailId }, { isRead });
    return this.repo.findOne({ where: { id: emailId } });
  }

  private async attachInsights<T extends { id: string }>(userId: string, emails: T[]) {
    if (!emails.length) return emails;

    const ids = Array.from(new Set(emails.map((email) => email.id).filter(Boolean)));
    const insights = await this.insightsRepo.find({
      where: { userId, emailId: In(ids) },
    });
    const byEmailId = new Map(insights.map((insight) => [insight.emailId, insight]));

    return emails.map((email) => {
      const insight = byEmailId.get(email.id);
      if (!insight) return email;

      return {
        ...email,
        category: insight.category,
        priorityScore: insight.priorityScore,
        needsReply: insight.needsReply,
        tags: insight.tags,
        summary: insight.summary,
      };
    });
  }

  private async attachInsight<T extends { id: string } | null>(
    userId: string,
    email: T,
  ) {
    if (!email) return email;

    const insight = await this.insightsRepo.findOne({
      where: { userId, emailId: email.id },
    });
    if (!insight) return email;

    return {
      ...email,
      category: insight.category,
      priorityScore: insight.priorityScore,
      needsReply: insight.needsReply,
      tags: insight.tags,
      summary: insight.summary,
    };
  }

  private async seedIfEmpty() {
    const count = await this.repo.count();
    if (count > 0) return;

    await this.repo.save([
      {
        from: 'demo@company.com',
        subject: 'Welcome to InboxOS',
        snippet: 'This is a seeded email from your backend.',
        body: 'If you can read this, your NestJS + Postgres is working.',
        isRead: false,
      },
      {
        from: 'hr@company.com',
        subject: 'Interview Scheduling',
        snippet: 'Can you do Tuesday 2pm?',
        body: 'Please confirm a time that works for you.',
        isRead: false,
      },
    ]);
  }
}
