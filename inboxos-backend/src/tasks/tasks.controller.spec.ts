import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';

describe('TasksController', () => {
  let controller: TasksController;
  const tasksService = {
    listForUser: jest.fn(),
    createForUser: jest.fn(),
    updateForUser: jest.fn(),
    removeForUser: jest.fn(),
  } as unknown as TasksService;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new TasksController(tasksService);
  });

  it('lists tasks for the authenticated user', async () => {
    (tasksService.listForUser as jest.Mock).mockResolvedValue([{ id: 't1' }]);

    const result = await controller.list({ user: { id: 'u1' } });

    expect(tasksService.listForUser).toHaveBeenCalledWith('u1');
    expect(result).toEqual([{ id: 't1' }]);
  });

  it('creates a task for the authenticated user', async () => {
    const dto = { title: 'Ship Step 5' };
    (tasksService.createForUser as jest.Mock).mockResolvedValue({ id: 't2' });

    const result = await controller.create({ user: { id: 'u2' } }, dto as any);

    expect(tasksService.createForUser).toHaveBeenCalledWith('u2', dto);
    expect(result).toEqual({ id: 't2' });
  });

  it('updates a task for the authenticated user', async () => {
    const dto = { status: 'Done' };
    (tasksService.updateForUser as jest.Mock).mockResolvedValue({ id: 't3', status: 'Done' });

    const result = await controller.update({ user: { id: 'u3' } }, 't3', dto as any);

    expect(tasksService.updateForUser).toHaveBeenCalledWith('u3', 't3', dto);
    expect(result).toEqual({ id: 't3', status: 'Done' });
  });

  it('deletes a task for the authenticated user', async () => {
    (tasksService.removeForUser as jest.Mock).mockResolvedValue({ ok: true });

    const result = await controller.remove({ user: { id: 'u4' } }, 't4');

    expect(tasksService.removeForUser).toHaveBeenCalledWith('u4', 't4');
    expect(result).toEqual({ ok: true });
  });
});
