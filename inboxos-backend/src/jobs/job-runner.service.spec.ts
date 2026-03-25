declare const describe: any;
declare const it: any;
declare const expect: any;
declare const beforeEach: any;
declare const jest: any;

import { JobRunnerService } from './job-runner.service';
import { JobsService } from './jobs.service';
import { AiService } from '../ai/ai.service';
import { SettingsService } from '../settings/settings.service';

describe('JobRunnerService', () => {
  let service: JobRunnerService;

  const jobs = {
    create: jest.fn(),
    markProcessing: jest.fn(),
    markDone: jest.fn(),
    markFailed: jest.fn(),
  } as unknown as JobsService;

  const ai = {
    classifyEmail: jest.fn(),
    generateDraft: jest.fn(),
    extractDates: jest.fn(),
  } as unknown as AiService;

  const settingsService = {
    getForUser: jest.fn(),
  } as unknown as SettingsService;

  const draftsRepo = {
    findOne: jest.fn(),
    create: jest.fn((v) => v),
    save: jest.fn(),
  };

  const insightsRepo = {
    upsert: jest.fn(),
    find: jest.fn(),
  };

  const eventsRepo = {
    create: jest.fn((v) => v),
    save: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    (jobs.create as any).mockResolvedValue({ id: 'job-1' });
    (jobs.markProcessing as any).mockResolvedValue(undefined);
    (jobs.markDone as any).mockResolvedValue(undefined);
    (jobs.markFailed as any).mockResolvedValue(undefined);
    (ai.classifyEmail as any).mockResolvedValue({
      category: 'Work',
      priorityScore: 90,
      needsReply: true,
      tags: ['urgent'],
      summary: 'hello',
    });
    (insightsRepo.upsert as any).mockResolvedValue(undefined);

    service = new JobRunnerService(
      jobs,
      ai,
      settingsService,
      draftsRepo as any,
      insightsRepo as any,
      eventsRepo as any,
    );
  });

  it('rejects enqueue when payload has no userId', async () => {
    await expect(service.enqueue('classify', { emailId: 'e1' })).rejects.toThrow(
      /Missing userId/, 
    );
  });

  it('stores owner userId on created job', async () => {
    const payload = {
      userId: 'user-1',
      emailId: 'email-1',
      from: 'a@example.com',
      subject: 'Hi',
      body: 'Body',
    };

    await service.enqueue('classify', payload);

    expect(jobs.create).toHaveBeenCalledWith('classify', payload, 'user-1');
  });

  it('marks failed for unknown job type', async () => {
    await (service as any).process('job-x', 'unknown-type', { userId: 'u1' });

    expect(jobs.markFailed).toHaveBeenCalledWith(
      'job-x',
      expect.stringContaining('Unknown job type'),
    );
  });
});
