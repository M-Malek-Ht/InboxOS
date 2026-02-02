import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmailEntity } from './email.entity';

@Injectable()
export class EmailsService {
  constructor(
    @InjectRepository(EmailEntity)
    private readonly repo: Repository<EmailEntity>,
  ) {}

  list() {
    return this.repo.find({ order: { receivedAt: 'DESC' } });
  }

  get(id: string) {
    return this.repo.findOne({ where: { id } });
  }

  async seedIfEmpty() {
    const count = await this.repo.count();
    if (count > 0) return;

    await this.repo.save([
      {
        from: 'demo@company.com',
        subject: 'Welcome to InboxOS',
        snippet: 'This is a seeded email from your backend.',
        body: 'If you can read this, your NestJS + Postgres is working.',
      },
      {
        from: 'hr@company.com',
        subject: 'Interview Scheduling',
        snippet: 'Can you do Tuesday 2pm?',
        body: 'Please confirm a time that works for you.',
      },
    ]);
  }
}
