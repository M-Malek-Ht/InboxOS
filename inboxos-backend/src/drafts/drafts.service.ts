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
  async findEmailOrNull(emailId: string): Promise<EmailEntity | null> {
    return this.emailsRepo.findOne({ where: { id: emailId } });
  }

  listByEmail(emailId: string) {
    return this.draftsRepo.find({
      where: { emailId },
      order: { createdAt: 'DESC' },
    });
  }

  /** Save a draft with content already provided (manual edit / paste). */
  async createDirectDraft(emailId: string, dto: CreateDraftDto) {
    const latestDraft = await this.draftsRepo.findOne({
      where: { emailId },
      order: { version: 'DESC' },
    });
    const nextVersion = (latestDraft?.version ?? 0) + 1;

    const draft = this.draftsRepo.create({
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
}
