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

  listByEmail(emailId: string) {
    return this.draftsRepo.find({
      where: { emailId },
      order: { createdAt: 'DESC' },
    });
  }

  async createForEmail(emailId: string, dto: CreateDraftDto) {
    const email = await this.emailsRepo.findOne({ where: { id: emailId } });
    if (!email) throw new NotFoundException('Email not found');

    const draft = this.draftsRepo.create({
      emailId,
      content: dto.content,
      status: dto.status ?? 'draft',
    });

    return this.draftsRepo.save(draft);
  }
}
