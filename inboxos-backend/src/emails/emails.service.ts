import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { EmailEntity } from './email.entity';
import { EmailInsightEntity } from './email-insight.entity';
import { DraftEntity } from '../drafts/draft.entity';
import { User } from '../users/entities/user.entity';
import { GmailService } from './gmail.service';
import { ParsedEmail } from './email.types';
import { MicrosoftMailService } from './microsoft-mail.service';

type EmailProviderClient =
  | { provider: 'gmail'; token: string; service: GmailService }
  | { provider: 'microsoft'; token: string; service: MicrosoftMailService };

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

  private async resolveProviderClient(
    userId: string,
  ): Promise<EmailProviderClient | null> {
    const gmailToken = await this.gmail.getAccessTokenForUser(userId);
    if (gmailToken) {
      return { provider: 'gmail', token: gmailToken, service: this.gmail };
    }

    const msToken = await this.microsoftMail.getAccessTokenForUser(userId);
    if (msToken) {
      return {
        provider: 'microsoft',
        token: msToken,
        service: this.microsoftMail,
      };
    }

    return null;
  }

  async listForUser(
    userId: string,
    options: { filter?: string; search?: string; limit?: number } = {},
  ) {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    const userEmail = user?.email?.toLowerCase();
    this.log.log(`listForUser: userId=${userId}, userEmail=${userEmail}`);

    const providerClient = await this.resolveProviderClient(userId);
    if (providerClient) {
      const { token, provider, service } = providerClient;
      try {
        const emails = await service.listEmails(token, {
          maxResults:
            options.filter && options.filter !== 'unread'
              ? Math.max(options.limit ?? 40, 100)
              : options.limit,
          filter: options.filter,
          search: options.search,
          userEmail: provider === 'gmail' ? userEmail : undefined,
        });
        this.log.log(`${provider} returned ${emails.length} emails`);
        const withInsights = await this.attachInsights(userId, emails);
        return this.applyEmailFilters(withInsights, options);
      } catch (error) {
        this.log.error(`${provider} API error: ${error}`);
      }
    }

    this.log.log('Falling back to seed data');
    await this.seedIfEmpty(userId);
    const qb = this.repo.createQueryBuilder('email');
    qb.where('email.userId = :userId', { userId })
      .andWhere('email.isTrashed = false')
      .andWhere('email.isSent = false');

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

    const emails = await qb.getMany();
    const withInsights = await this.attachInsights(userId, emails);
    return this.applyEmailFilters(withInsights, options);
  }

  async getForUser(userId: string, emailId: string) {
    this.log.debug(`getForUser called with emailId=${emailId}`);
    const providerClient = await this.resolveProviderClient(userId);

    if (providerClient?.provider === 'gmail') {
      try {
        const email = await providerClient.service.getMessage(
          providerClient.token,
          emailId,
        );
        this.log.debug(
          `Gmail getMessage returned ${email ? 'a result' : 'no result'}`,
        );
        return this.attachInsight(userId, email);
      } catch {
        this.log.warn(`Gmail getMessage failed for emailId=${emailId}`);
      }
    }

    if (providerClient?.provider === 'microsoft') {
      try {
        const email = await providerClient.service.getMessage(
          providerClient.token,
          emailId,
        );
        this.log.debug(
          `Microsoft getMessage returned ${email ? 'a result' : 'no result'}`,
        );
        return this.attachInsight(userId, email);
      } catch {
        this.log.warn(`Microsoft getMessage failed for emailId=${emailId}`);
      }
    }

    const email = await this.repo.findOne({ where: { id: emailId, userId } });
    return this.attachInsight(userId, email);
  }

  async getManyForUser(userId: string, emailIds: string[]) {
    if (!emailIds.length) return [];

    const providerClient = await this.resolveProviderClient(userId);
    if (providerClient) {
      const results = await Promise.all(
        emailIds.map(async (emailId) => {
          try {
            return await providerClient.service.getMessage(
              providerClient.token,
              emailId,
            );
          } catch {
            return null;
          }
        }),
      );

      const emails = results.filter(
        (email): email is ParsedEmail => email !== null,
      );
      return this.attachInsights(userId, emails);
    }

    const emails = await this.repo.find({
      where: { userId, id: In(emailIds) },
    });
    const emailsById = new Map(emails.map((email) => [email.id, email]));
    const ordered = emailIds
      .map((emailId) => emailsById.get(emailId))
      .filter((email): email is EmailEntity => Boolean(email));

    return this.attachInsights(userId, ordered);
  }

  async setReadState(userId: string, emailId: string, isRead: boolean) {
    this.log.debug(`setReadState emailId=${emailId} isRead=${isRead}`);
    const providerClient = await this.resolveProviderClient(userId);

    if (providerClient?.provider === 'gmail') {
      if (isRead) {
        await providerClient.service.markAsRead(providerClient.token, emailId);
      } else {
        await providerClient.service.markAsUnread(providerClient.token, emailId);
      }
      return { ok: true };
    }

    if (providerClient?.provider === 'microsoft') {
      if (isRead) {
        await providerClient.service.markAsRead(providerClient.token, emailId);
      } else {
        await providerClient.service.markAsUnread(providerClient.token, emailId);
      }
      return { ok: true };
    }

    await this.repo.update({ id: emailId, userId }, { isRead });
    return this.repo.findOne({ where: { id: emailId, userId } });
  }

  async getThread(userId: string, emailId: string) {
    const providerClient = await this.resolveProviderClient(userId);

    if (providerClient?.provider === 'gmail') {
      try {
        const email = await providerClient.service.getMessage(
          providerClient.token,
          emailId,
        );
        if (email.threadId) {
          return providerClient.service.getThread(
            providerClient.token,
            email.threadId,
          );
        }
        return [email];
      } catch {
        this.log.warn(`Gmail getThread failed for emailId=${emailId}`);
      }
    }

    if (providerClient?.provider === 'microsoft') {
      try {
        const email = await providerClient.service.getMessage(
          providerClient.token,
          emailId,
        );
        return [email];
      } catch {
        this.log.warn(`Microsoft getThread failed for emailId=${emailId}`);
      }
    }

    const email = await this.repo.findOne({ where: { id: emailId, userId } });
    return email ? [email] : [];
  }

  async sendReply(userId: string, emailId: string, body: string, draftId?: string) {
    const providerClient = await this.resolveProviderClient(userId);

    if (providerClient?.provider === 'gmail') {
      const email = await providerClient.service.getMessage(
        providerClient.token,
        emailId,
      );
      await providerClient.service.sendReply(providerClient.token, {
        to: email.from,
        subject: email.subject,
        body,
        threadId: email.threadId,
        inReplyTo: email.messageIdHeader,
      });
      if (draftId) {
        await this.draftsRepo.update({ id: draftId, userId }, { status: 'sent' });
      }
      return { ok: true, provider: 'gmail' as const };
    }

    if (providerClient?.provider === 'microsoft') {
      await providerClient.service.sendReply(providerClient.token, emailId, body);
      if (draftId) {
        await this.draftsRepo.update({ id: draftId, userId }, { status: 'sent' });
      }
      return { ok: true, provider: 'microsoft' as const };
    }

    const original = await this.repo.findOne({ where: { id: emailId, userId } });
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!original || !user) {
      throw new Error('No email provider linked and local email context missing');
    }

    const subject = original.subject.startsWith('Re:')
      ? original.subject
      : `Re: ${original.subject}`;
    await this.repo.save(
      this.repo.create({
        userId,
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
    if (draftId) {
      await this.draftsRepo.update({ id: draftId, userId }, { status: 'sent' });
    }
    return { ok: true, provider: 'local' as const };
  }

  async listSentForUser(
    userId: string,
    options: { search?: string; limit?: number } = {},
  ) {
    const providerClient = await this.resolveProviderClient(userId);

    if (providerClient?.provider === 'gmail') {
      try {
        return await providerClient.service.listSentEmails(providerClient.token, {
          maxResults: options.limit,
          search: options.search,
        });
      } catch (error) {
        this.log.error(`Gmail sent list error: ${error}`);
      }
    }

    if (providerClient?.provider === 'microsoft') {
      try {
        return await providerClient.service.listSentEmails(providerClient.token, {
          maxResults: options.limit,
          search: options.search,
        });
      } catch (error) {
        this.log.error(`Microsoft sent list error: ${error}`);
      }
    }

    const qb = this.repo.createQueryBuilder('email');
    qb.where('email.userId = :userId', { userId })
      .andWhere('email.isSent = true')
      .andWhere('email.isTrashed = false');
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
    const providerClient = await this.resolveProviderClient(userId);

    if (providerClient?.provider === 'gmail') {
      try {
        const providerTrash = await providerClient.service.listTrashEmails(
          providerClient.token,
          {
            maxResults: options.limit ?? 40,
            search: options.search,
          },
        );
        await this.syncProviderEmailsToLocal(userId, providerTrash, true);
      } catch (err) {
        this.log.warn(`Could not sync Gmail trash: ${err}`);
      }
    } else if (providerClient?.provider === 'microsoft') {
      try {
        const providerTrash = await providerClient.service.listTrashEmails(
          providerClient.token,
          {
            maxResults: options.limit ?? 40,
            search: options.search,
          },
        );
        await this.syncProviderEmailsToLocal(userId, providerTrash, true);
      } catch (err) {
        this.log.warn(`Could not sync Microsoft trash: ${err}`);
      }
    }

    const qb = this.repo.createQueryBuilder('email');
    qb.where('email.userId = :userId', { userId })
      .andWhere('email.isTrashed = true');
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
    const local = await this.repo.findOne({ where: { id: emailId, userId } });
    const externalId = local?.externalId ?? null;
    const providerClient = externalId
      ? await this.resolveProviderClient(userId)
      : null;

    if (externalId && providerClient?.provider === 'gmail') {
      await providerClient.service.untrashMessage(providerClient.token, externalId);
    } else if (externalId && providerClient?.provider === 'microsoft') {
      await providerClient.service.untrashMessage(providerClient.token, externalId);
    }

    await this.repo.update({ id: emailId, userId }, { isTrashed: false });
    return { ok: true, provider: externalId ? ('provider' as const) : ('local' as const) };
  }

  async permanentDeleteEmail(userId: string, emailId: string) {
    const local = await this.repo.findOne({ where: { id: emailId, userId } });
    const externalId = local?.externalId ?? null;
    const providerClient = externalId
      ? await this.resolveProviderClient(userId)
      : null;

    if (externalId && providerClient?.provider === 'gmail') {
      await providerClient.service.permanentlyDeleteMessage(
        providerClient.token,
        externalId,
      );
    } else if (externalId && providerClient?.provider === 'microsoft') {
      await providerClient.service.deleteMessage(providerClient.token, externalId);
    }

    await this.repo.delete({ id: emailId, userId });
    await this.insightsRepo.delete({ userId, emailId });
    await this.draftsRepo.delete({ emailId, userId });
    return { ok: true };
  }

  async deleteEmail(userId: string, emailId: string) {
    const providerClient = await this.resolveProviderClient(userId);

    if (providerClient?.provider === 'gmail') {
      try {
        const email = await providerClient.service.getMessage(
          providerClient.token,
          emailId,
        );
        await this.saveLocalCopy(userId, email, emailId, true, false);
      } catch (err) {
        this.log.warn(`Could not cache Gmail email ${emailId} before trashing: ${err}`);
      }
      await providerClient.service.trashMessage(providerClient.token, emailId);
    } else if (providerClient?.provider === 'microsoft') {
      try {
        const email = await providerClient.service.getMessage(
          providerClient.token,
          emailId,
        );
        await this.saveLocalCopy(userId, email, emailId, true, false);
      } catch (err) {
        this.log.warn(
          `Could not cache Microsoft email ${emailId} before trashing: ${err}`,
        );
      }
      await providerClient.service.deleteMessage(providerClient.token, emailId);
    } else {
      await this.repo.update({ id: emailId, userId }, { isTrashed: true });
    }

    await this.insightsRepo.delete({ userId, emailId });
    await this.draftsRepo.delete({ emailId, userId });

    return { ok: true };
  }

  private async saveLocalCopy(
    userId: string,
    email: ParsedEmail,
    externalId: string,
    isTrashed: boolean,
    isSent: boolean,
  ): Promise<void> {
    const existing = await this.repo.findOne({ where: { userId, externalId } });
    if (existing) {
      await this.repo.update({ id: existing.id }, { isTrashed, isSent });
      return;
    }
    await this.repo.save(
      this.repo.create({
        userId,
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

  private async syncProviderEmailsToLocal(
    userId: string,
    emails: ParsedEmail[],
    isTrashed: boolean,
  ): Promise<void> {
    if (!emails.length) return;

    const externalIds = emails.map((email) => email.id);
    const existing = await this.repo.find({
      where: { userId, externalId: In(externalIds) },
    });
    const existingByExternalId = new Map(
      existing
        .filter((email) => email.externalId)
        .map((email) => [email.externalId as string, email]),
    );

    const recordsToSave: EmailEntity[] = [];
    for (const email of emails) {
      const current = existingByExternalId.get(email.id);
      if (current && isTrashed && !current.isTrashed) {
        continue;
      }

      recordsToSave.push(
        this.repo.create({
          ...current,
          userId,
          from: email.from,
          to: email.to ?? '',
          subject: email.subject,
          snippet: email.snippet,
          body: email.body,
          isRead: email.isRead,
          isSent: email.isSent ?? false,
          isTrashed,
          receivedAt: email.receivedAt,
          externalId: email.id,
        }),
      );
    }

    if (recordsToSave.length > 0) {
      await this.repo.save(recordsToSave);
    }
  }

  private applyEmailFilters<T extends object>(
    emails: T[],
    options: { filter?: string; limit?: number } = {},
  ) {
    let filtered = emails;

    switch (options.filter) {
      case 'needsReply':
        filtered = filtered.filter((email) => !!this.getEmailMeta(email).needsReply);
        break;
      case 'highPriority':
        filtered = filtered.filter(
          (email) => (this.getEmailMeta(email).priorityScore ?? 0) >= 80,
        );
        break;
      case 'unread':
        break;
      default:
        if (options.filter) {
          filtered = filtered.filter(
            (email) => this.getEmailMeta(email).category === options.filter,
          );
        }
        break;
    }

    return typeof options.limit === 'number'
      ? filtered.slice(0, options.limit)
      : filtered;
  }

  private getEmailMeta(email: object): {
    category?: string;
    priorityScore?: number;
    needsReply?: boolean;
  } {
    return email as {
      category?: string;
      priorityScore?: number;
      needsReply?: boolean;
    };
  }

  private async attachInsights<T extends { id: string }>(userId: string, emails: T[]) {
    if (!emails.length) return emails;

    const ids = Array.from(new Set(emails.map((email) => email.id).filter(Boolean)));
    const insights = await this.insightsRepo.find({
      where: { userId, emailId: In(ids) },
    });
    const byEmailId = new Map(
      insights.map((insight) => [insight.emailId, insight]),
    );

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

  private async seedIfEmpty(userId: string) {
    const count = await this.repo.count({ where: { userId } });
    if (count > 0) return;

    await this.repo.save([
      {
        userId,
        from: 'demo@company.com',
        subject: 'Welcome to InboxOS',
        snippet: 'This is a seeded email from your backend.',
        body: 'If you can read this, your NestJS + Postgres is working.',
        isRead: false,
      },
      {
        userId,
        from: 'hr@company.com',
        subject: 'Interview Scheduling',
        snippet: 'Can you do Tuesday 2pm?',
        body: 'Please confirm a time that works for you.',
        isRead: false,
      },
    ]);
  }
}
