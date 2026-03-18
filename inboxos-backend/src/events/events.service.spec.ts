import { NotFoundException } from '@nestjs/common';
import { EventsService } from './events.service';
import { Repository } from 'typeorm';
import { EventEntity } from './event.entity';

describe('EventsService', () => {
  let service: EventsService;
  let repo: jest.Mocked<Partial<Repository<EventEntity>>>;

  beforeEach(() => {
    repo = {
      create: jest.fn((v) => v as any),
      save: jest.fn(async (v) => v as any),
      findOne: jest.fn(),
      delete: jest.fn(),
      createQueryBuilder: jest.fn(),
    };
    service = new EventsService(repo as Repository<EventEntity>);
  });

  it('creates event with owner userId', async () => {
    await service.createForUser('user-1', {
      title: 'Standup',
      startAt: '2026-03-18T09:00:00.000Z',
      endAt: '2026-03-18T09:15:00.000Z',
    });

    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        title: 'Standup',
      }),
    );
  });

  it('throws not found when updating event outside owner scope', async () => {
    (repo.findOne as jest.Mock).mockResolvedValue(null);

    await expect(
      service.updateForUser('user-1', 'event-1', { title: 'Nope' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws not found when deleting event outside owner scope', async () => {
    (repo.delete as jest.Mock).mockResolvedValue({ affected: 0 });

    await expect(service.removeForUser('user-1', 'event-1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
