import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DraftEntity } from './draft.entity';
import { EmailEntity } from '../emails/email.entity';
import { CreateDraftDto } from './dto/create-draft.dto';
import { AiService } from '../ai/ai.service';

@Injectable()
export class DraftsService {
  constructor(
    @InjectRepository(DraftEntity)
    private readonly draftsRepo: Repository<DraftEntity>,
    @InjectRepository(EmailEntity)
    private readonly emailsRepo: Repository<EmailEntity>,
    private readonly ai: AiService,
  ) {}

  listByEmail(emailId: string) {
    return this.draftsRepo.find({
      where: { emailId },
      order: { createdAt: 'DESC' },
    });
  }

  async createForEmail(emailId: string, dto: CreateDraftDto) {
    const email = await this.emailsRepo.findOne({ where: { id: emailId } });
    if (!email) throw new NotFoundException('Email not found');

    // Auto-increment version per email
    const latestDraft = await this.draftsRepo.findOne({
      where: { emailId },
      order: { version: 'DESC' },
    });
    const nextVersion = (latestDraft?.version ?? 0) + 1;

    const tone = dto.tone ?? 'Professional';
    const length = dto.length ?? 'Medium';

    // If no content provided, generate with AI
    let content = dto.content;
    if (!content) {
      content = await this.ai.generateDraft(
        { from: email.from, subject: email.subject, body: email.body },
        { tone, length, instruction: dto.instruction },
      );
    }

    const draft = this.draftsRepo.create({
      emailId,
      content,
      version: nextVersion,
      tone,
      length,
      instruction: dto.instruction ?? null,
      status: dto.status ?? 'draft',
    });

    return this.draftsRepo.save(draft);
  }
}
