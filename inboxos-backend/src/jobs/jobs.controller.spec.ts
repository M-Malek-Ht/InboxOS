import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';

describe('JobsController', () => {
  let controller: JobsController;
  const jobsService = {
    findByIdForUser: jest.fn(),
  } as unknown as JobsService;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new JobsController(jobsService);
  });

  it('returns only the authenticated user job', async () => {
    (jobsService.findByIdForUser as jest.Mock).mockResolvedValue({
      id: 'job-1',
      type: 'classify',
      status: 'done',
      result: { ok: true },
      error: null,
    });

    const result = await controller.get('job-1', { user: { id: 'user-1' } });

    expect(jobsService.findByIdForUser).toHaveBeenCalledWith('job-1', 'user-1');
    expect(result).toEqual({
      id: 'job-1',
      type: 'classify',
      status: 'done',
      result: { ok: true },
      error: null,
    });
  });
});
