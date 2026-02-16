import { Injectable, NotFoundException } from '@nestjs/common';
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

  async getEmailOrFail(emailId: string): Promise<EmailEntity> {
    const email = await this.emailsRepo.findOne({ where: { id: emailId } });
    if (!email) throw new NotFoundException('Email not found');
    return email;
  }

  listByEmail(emailId: string) {
    return this.draftsRepo.find({
      where: { emailId },
      order: { createdAt: 'DESC' },
    });
  }

  async createForEmail(emailId: string, dto: CreateDraftDto) {
    await this.getEmailOrFail(emailId);

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
