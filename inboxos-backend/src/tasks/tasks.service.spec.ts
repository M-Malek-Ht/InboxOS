import { NotFoundException } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { Repository } from 'typeorm';
import { TaskEntity } from './task.entity';

describe('TasksService', () => {
  let service: TasksService;
  let repo: jest.Mocked<Partial<Repository<TaskEntity>>>;

  beforeEach(() => {
    repo = {
      create: jest.fn((v) => v as any),
      save: jest.fn(async (v) => v as any),
      findOne: jest.fn(),
      delete: jest.fn(),
      find: jest.fn(),
    };
    service = new TasksService(repo as Repository<TaskEntity>);
  });

  it('creates task with owner userId', async () => {
    await service.createForUser('user-1', {
      title: 'Secure task',
      dueDate: '2026-03-18T10:00:00.000Z',
    });

    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        title: 'Secure task',
      }),
    );
  });

  it('throws not found when updating task outside owner scope', async () => {
    (repo.findOne as jest.Mock).mockResolvedValue(null);

    await expect(
      service.updateForUser('user-1', 'task-1', { title: 'Nope' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws not found when deleting task outside owner scope', async () => {
    (repo.delete as jest.Mock).mockResolvedValue({ affected: 0 });

    await expect(service.removeForUser('user-1', 'task-1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
