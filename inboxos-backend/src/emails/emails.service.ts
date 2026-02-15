import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmailEntity } from './email.entity';
import { GmailService } from './gmail.service';

@Injectable()
export class EmailsService {
  constructor(
    @InjectRepository(EmailEntity)
    private readonly repo: Repository<EmailEntity>,
    private readonly gmail: GmailService,
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
        return emails;
      } catch (error) {
        console.error('[EmailsService] Gmail API error:', error);
      }
    }
    // No Gmail linked — fall back to seed data
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

    return qb.getMany();
  }

  async getForUser(userId: string, emailId: string) {
    console.log('[EmailsService] getForUser called with emailId:', emailId);
    const accessToken = await this.gmail.getAccessTokenForUser(userId);
    if (accessToken) {
      try {
        const email = await this.gmail.getMessage(accessToken, emailId);
        console.log('[EmailsService] Gmail getMessage returned:', email ? 'YES' : 'NO');
        return email;
      } catch (error) {
        console.error('[EmailsService] Gmail getMessage error:', error);
        // Gmail fetch failed; fall through to DB
      }
    }
    return this.repo.findOne({ where: { id: emailId } });
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

    await this.repo.update({ id: emailId }, { isRead });
    return this.repo.findOne({ where: { id: emailId } });
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
