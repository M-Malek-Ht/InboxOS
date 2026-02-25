import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { EmailEntity } from './email.entity';
import { EmailInsightEntity } from './email-insight.entity';
import { DraftEntity } from '../drafts/draft.entity';
import { User } from '../users/entities/user.entity';
import { GmailService, ParsedEmail } from './gmail.service';
import { MicrosoftMailService } from './microsoft-mail.service';

@Injectable()
export class EmailsService {
  private readonly log = new Logger(EmailsService.name);

  constructor(
    @InjectRepository(EmailEntity)
    private readonly repo: Repository<EmailEntity>,
    @InjectRepository(EmailInsightEntity)
    private readonly insightsRepo: Repository<EmailInsightEntity>,
    @InjectRepository(DraftEntity)
    private readonly draftsRepo: Repository<DraftEntity>,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    private readonly gmail: GmailService,
    private readonly microsoftMail: MicrosoftMailService,
  ) {}

  async listForUser(
    userId: string,
    options: { filter?: string; search?: string; limit?: number } = {},
  ) {
    // Get the user's own email address from the database — this is
    // used to reliably filter out sent messages from the inbox.
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    const userEmail = user?.email?.toLowerCase();
    this.log.log(`listForUser: userId=${userId}, userEmail=${userEmail}`);

    const accessToken = await this.gmail.getAccessTokenForUser(userId);
    if (accessToken) {
      try {
        const emails = await this.gmail.listEmails(accessToken, {
          maxResults: options.limit,
          filter: options.filter,
          search: options.search,
          userEmail,
        });
        this.log.log(`Gmail returned ${emails.length} emails`);
        return this.attachInsights(userId, emails);
      } catch (error) {
        this.log.error(`Gmail API error: ${error}`);
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
    qb.where('email.isTrashed = false').andWhere('email.isSent = false');

    if (options.search) {
      qb.andWhere(
        'email.subject ILIKE :q OR email.from ILIKE :q OR email.snippet ILIKE :q',
        { q: `%${options.search}%` },
      );
    }

    if (options.filter === 'unread') {
      qb.andWhere('email.isRead = false');
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

  async getThread(userId: string, emailId: string) {
    // Try Gmail — get the message first to find its threadId
    const accessToken = await this.gmail.getAccessTokenForUser(userId);
    if (accessToken) {
      try {
        const email = await this.gmail.getMessage(accessToken, emailId);
        if (email.threadId) {
          const messages = await this.gmail.getThread(accessToken, email.threadId);
          return messages;
        }
        return [email];
      } catch (error) {
        console.error('[EmailsService] Gmail getThread error:', error);
      }
    }

    // Microsoft doesn't have a simple thread API — return single email
    const msToken = await this.microsoftMail.getAccessTokenForUser(userId);
    if (msToken) {
      try {
        const email = await this.microsoftMail.getMessage(msToken, emailId);
        return [email];
      } catch (error) {
        console.error('[EmailsService] Microsoft getThread error:', error);
      }
    }

    // Fallback to DB
    const email = await this.repo.findOne({ where: { id: emailId } });
    return email ? [email] : [];
  }

  async sendReply(userId: string, emailId: string, body: string) {
    // Try Gmail
    const accessToken = await this.gmail.getAccessTokenForUser(userId);
    if (accessToken) {
      const email = await this.gmail.getMessage(accessToken, emailId);
      await this.gmail.sendReply(accessToken, {
        to: email.from,
        subject: email.subject,
        body,
        threadId: email.threadId,
        inReplyTo: email.messageIdHeader,
      });
      return { ok: true, provider: 'gmail' as const };
    }

    // Try Microsoft Graph
    const msToken = await this.microsoftMail.getAccessTokenForUser(userId);
    if (msToken) {
      await this.microsoftMail.sendReply(msToken, emailId, body);
      return { ok: true, provider: 'microsoft' as const };
    }

    // Local fallback (no provider linked): persist a synthetic sent item.
    const original = await this.repo.findOne({ where: { id: emailId } });
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!original || !user) {
      throw new Error('No email provider linked and local email context missing');
    }

    const subject = original.subject.startsWith('Re:')
      ? original.subject
      : `Re: ${original.subject}`;
    await this.repo.save(
      this.repo.create({
        from: user.email,
        to: original.from,
        subject,
        snippet: body.slice(0, 180),
        body,
        isRead: true,
        isSent: true,
        isTrashed: false,
      }),
    );
    return { ok: true, provider: 'local' as const };
  }

  async listSentForUser(
    userId: string,
    options: { search?: string; limit?: number } = {},
  ) {
    const accessToken = await this.gmail.getAccessTokenForUser(userId);
    if (accessToken) {
      try {
        return await this.gmail.listSentEmails(accessToken, {
          maxResults: options.limit,
          search: options.search,
        });
      } catch (error) {
        this.log.error(`Gmail sent list error: ${error}`);
      }
    }

    const msToken = await this.microsoftMail.getAccessTokenForUser(userId);
    if (msToken) {
      try {
        return await this.microsoftMail.listSentEmails(msToken, {
          maxResults: options.limit,
          search: options.search,
        });
      } catch (error) {
        this.log.error(`Microsoft sent list error: ${error}`);
      }
    }

    const qb = this.repo.createQueryBuilder('email');
    qb.where('email.isSent = true').andWhere('email.isTrashed = false');
    if (options.search) {
      qb.andWhere(
        'email.subject ILIKE :q OR email.to ILIKE :q OR email.snippet ILIKE :q',
        { q: `%${options.search}%` },
      );
    }
    qb.orderBy('email.receivedAt', 'DESC');
    if (options.limit) qb.take(options.limit);
    return qb.getMany();
  }

  async listTrashForUser(
    userId: string,
    options: { search?: string; limit?: number } = {},
  ) {
    // Always serve trash from local DB — emails are cached there on delete
    // so this works regardless of provider availability or API propagation delays.
    const qb = this.repo.createQueryBuilder('email');
    qb.where('email.isTrashed = true');
    if (options.search) {
      qb.andWhere(
        'email.subject ILIKE :q OR email.from ILIKE :q OR email.snippet ILIKE :q',
        { q: `%${options.search}%` },
      );
    }
    qb.orderBy('email.receivedAt', 'DESC');
    if (options.limit) qb.take(options.limit);
    return qb.getMany();
  }

  async untrashEmail(userId: string, emailId: string) {
    // emailId is a local DB UUID — look up externalId to call provider API
    const local = await this.repo.findOne({ where: { id: emailId } });
    const externalId = local?.externalId ?? null;

    if (externalId) {
      const accessToken = await this.gmail.getAccessTokenForUser(userId);
      if (accessToken) {
        await this.gmail.untrashMessage(accessToken, externalId);
      } else {
        const msToken = await this.microsoftMail.getAccessTokenForUser(userId);
        if (msToken) {
          await this.microsoftMail.untrashMessage(msToken, externalId);
        }
      }
    }

    // Always update local record
    await this.repo.update({ id: emailId }, { isTrashed: false });
    return { ok: true, provider: externalId ? 'provider' as const : 'local' as const };
  }

  async permanentDeleteEmail(userId: string, emailId: string) {
    // emailId is a local DB UUID — look up externalId to call provider API
    const local = await this.repo.findOne({ where: { id: emailId } });
    const externalId = local?.externalId ?? null;

    if (externalId) {
      const accessToken = await this.gmail.getAccessTokenForUser(userId);
      if (accessToken) {
        await this.gmail.permanentlyDeleteMessage(accessToken, externalId);
      } else {
        const msToken = await this.microsoftMail.getAccessTokenForUser(userId);
        if (msToken) {
          // For Microsoft, deleteMessage on a Deleted Items message permanently removes it
          await this.microsoftMail.deleteMessage(msToken, externalId);
        }
      }
    }

    // Always hard-delete the local record
    await this.repo.delete({ id: emailId });
    await this.insightsRepo.delete({ userId, emailId });
    await this.draftsRepo.delete({ emailId });
    return { ok: true };
  }

  async deleteEmail(userId: string, emailId: string) {
    // Try Gmail — cache locally then move to trash in provider
    const accessToken = await this.gmail.getAccessTokenForUser(userId);
    if (accessToken) {
      try {
        const email = await this.gmail.getMessage(accessToken, emailId);
        await this.saveLocalCopy(email, emailId, true, false);
      } catch (err) {
        this.log.warn(`Could not cache Gmail email ${emailId} before trashing: ${err}`);
      }
      await this.gmail.trashMessage(accessToken, emailId);
    } else {
      const msToken = await this.microsoftMail.getAccessTokenForUser(userId);
      if (msToken) {
        try {
          const email = await this.microsoftMail.getMessage(msToken, emailId);
          await this.saveLocalCopy(email, emailId, true, false);
        } catch (err) {
          this.log.warn(`Could not cache Microsoft email ${emailId} before trashing: ${err}`);
        }
        await this.microsoftMail.deleteMessage(msToken, emailId);
      } else {
        await this.repo.update({ id: emailId }, { isTrashed: true });
      }
    }

    // Clean up insights and drafts so deleted email doesn't affect dashboard
    await this.insightsRepo.delete({ userId, emailId });
    await this.draftsRepo.delete({ emailId });

    return { ok: true };
  }

  /**
   * Save a local copy of a provider email so trash/sent views always work
   * from the DB, independent of provider API availability.
   * If a record with the same externalId already exists, just updates its flags.
   */
  private async saveLocalCopy(
    email: ParsedEmail,
    externalId: string,
    isTrashed: boolean,
    isSent: boolean,
  ): Promise<void> {
    const existing = await this.repo.findOne({ where: { externalId } });
    if (existing) {
      await this.repo.update({ id: existing.id }, { isTrashed, isSent });
      return;
    }
    await this.repo.save(
      this.repo.create({
        from: email.from,
        to: email.to ?? '',
        subject: email.subject,
        snippet: email.snippet,
        body: email.body,
        isRead: email.isRead,
        isSent,
        isTrashed,
        receivedAt: email.receivedAt,
        externalId,
      }),
    );
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

  /**
   * Returns email IDs that have no classification insight for the given user.
   */
  async getUnclassifiedIds(
    userId: string,
    emailIds: string[],
  ): Promise<string[]> {
    if (!emailIds.length) return [];

    const existing = await this.insightsRepo.find({
      select: ['emailId'],
      where: { userId, emailId: In(emailIds) },
    });
    const classified = new Set(existing.map((i) => i.emailId));
    return emailIds.filter((id) => !classified.has(id));
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
