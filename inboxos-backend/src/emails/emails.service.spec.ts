import { Test, TestingModule } from '@nestjs/testing';
import { EmailsService } from './emails.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EmailEntity } from './email.entity';
import { EmailInsightEntity } from './email-insight.entity';
import { DraftEntity } from '../drafts/draft.entity';
import { User } from '../users/entities/user.entity';
import { GmailService } from './gmail.service';
import { MicrosoftMailService } from './microsoft-mail.service';

describe('EmailsService', () => {
  let service: EmailsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailsService,
        { provide: getRepositoryToken(EmailEntity), useValue: { findOne: jest.fn(), update: jest.fn(), delete: jest.fn(), save: jest.fn(), create: jest.fn(), count: jest.fn(), createQueryBuilder: jest.fn() } },
        { provide: getRepositoryToken(EmailInsightEntity), useValue: { find: jest.fn(), findOne: jest.fn(), delete: jest.fn() } },
        { provide: getRepositoryToken(DraftEntity), useValue: { findOne: jest.fn(), update: jest.fn(), delete: jest.fn() } },
        { provide: getRepositoryToken(User), useValue: { findOne: jest.fn() } },
        { provide: GmailService, useValue: { getAccessTokenForUser: jest.fn() } },
        { provide: MicrosoftMailService, useValue: { getAccessTokenForUser: jest.fn() } },
      ],
    }).compile();

    service = module.get<EmailsService>(EmailsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
