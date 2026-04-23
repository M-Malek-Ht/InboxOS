import { Test, TestingModule } from '@nestjs/testing';
import { EmailsController } from './emails.controller';
import { EmailsService } from './emails.service';
import { JobRunnerService } from '../jobs/job-runner.service';

describe('EmailsController', () => {
  let controller: EmailsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmailsController],
      providers: [
        {
          provide: EmailsService,
          useValue: {
            listForUser: jest.fn(),
            listSentForUser: jest.fn(),
            listTrashForUser: jest.fn(),
            getThread: jest.fn(),
            getForUser: jest.fn(),
            setReadState: jest.fn(),
            updatePriorityScore: jest.fn(),
            getUnclassifiedIds: jest.fn(),
            permanentDeleteEmail: jest.fn(),
            deleteEmail: jest.fn(),
            untrashEmail: jest.fn(),
            sendReply: jest.fn(),
          },
        },
        { provide: JobRunnerService, useValue: { enqueue: jest.fn() } },
      ],
    }).compile();

    controller = module.get<EmailsController>(EmailsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
