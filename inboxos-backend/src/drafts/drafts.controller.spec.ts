import { Test, TestingModule } from '@nestjs/testing';
import { DraftsController } from './drafts.controller';
import { DraftsService } from './drafts.service';
import { JobRunnerService } from '../jobs/job-runner.service';

describe('DraftsController', () => {
  let controller: DraftsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DraftsController],
      providers: [
        { provide: DraftsService, useValue: { listByEmail: jest.fn(), createDirectDraft: jest.fn(), findEmailOrNull: jest.fn() } },
        { provide: JobRunnerService, useValue: { enqueue: jest.fn() } },
      ],
    }).compile();

    controller = module.get<DraftsController>(DraftsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
