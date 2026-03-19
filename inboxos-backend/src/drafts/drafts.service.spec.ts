import { Test, TestingModule } from '@nestjs/testing';
import { DraftsService } from './drafts.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DraftEntity } from './draft.entity';
import { EmailEntity } from '../emails/email.entity';

describe('DraftsService', () => {
  let service: DraftsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DraftsService,
        { provide: getRepositoryToken(DraftEntity), useValue: { find: jest.fn(), findOne: jest.fn(), create: jest.fn(), save: jest.fn(), update: jest.fn(), createQueryBuilder: jest.fn() } },
        { provide: getRepositoryToken(EmailEntity), useValue: { findOne: jest.fn() } },
      ],
    }).compile();

    service = module.get<DraftsService>(DraftsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
