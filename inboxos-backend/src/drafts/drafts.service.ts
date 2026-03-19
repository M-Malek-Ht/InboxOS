import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DraftEntity } from './draft.entity';
import { EmailEntity } from '../emails/email.entity';
import { CreateDraftDto } from './dto/create-draft.dto';

@Injectable()
export class DraftsService {
  constructor(
    @InjectRepository(DraftEntity)
    private readonly draftsRepo: Repository<DraftEntity>,
    @InjectRepository(EmailEntity)
    private readonly emailsRepo: Repository<EmailEntity>,
  ) {}

  /** Returns null instead of throwing when the email isn't in the local DB. */
  async findEmailOrNull(userId: string, emailId: string): Promise<EmailEntity | null> {
    return this.emailsRepo.findOne({ where: { id: emailId, userId } });
  }

  listByEmail(userId: string, emailId: string) {
    return this.draftsRepo.find({
      where: { userId, emailId, status: 'draft' },
      order: { createdAt: 'DESC' },
    });
  }

  /** Returns the latest draft per email (one entry per emailId). */
  async listLatestDrafts(userId: string): Promise<DraftEntity[]> {
    return this.draftsRepo
      .createQueryBuilder('d')
      .where('d.userId = :userId', { userId })
      .andWhere('d.status = :status', { status: 'draft' })
      .distinctOn(['d.emailId'])
      .orderBy('d.emailId')
      .addOrderBy('d.version', 'DESC')
      .getMany();
  }

  /** Save a draft with content already provided (manual edit / paste). */
  async createDirectDraft(userId: string, emailId: string, dto: CreateDraftDto) {
    const latestDraft = await this.draftsRepo.findOne({
      where: { userId, emailId },
      order: { version: 'DESC' },
    });
    const nextVersion = (latestDraft?.version ?? 0) + 1;

    const draft = this.draftsRepo.create({
      userId,
      emailId,
      content: dto.content!,
      version: nextVersion,
      tone: dto.tone ?? 'Professional',
      length: dto.length ?? 'Medium',
      instruction: dto.instruction ?? null,
      status: dto.status ?? 'draft',
    });

    return this.draftsRepo.save(draft);
  }

  async markAsSent(userId: string, draftId: string) {
    await this.draftsRepo.update({ id: draftId, userId }, { status: 'sent' });
  }
}
