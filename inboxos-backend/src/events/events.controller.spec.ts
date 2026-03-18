import { EventsController } from './events.controller';
import { EventsService } from './events.service';

describe('EventsController', () => {
  let controller: EventsController;
  const eventsService = {
    listForUser: jest.fn(),
    createForUser: jest.fn(),
    updateForUser: jest.fn(),
    removeForUser: jest.fn(),
  } as unknown as EventsService;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new EventsController(eventsService);
  });

  it('lists events for the authenticated user and range', async () => {
    (eventsService.listForUser as jest.Mock).mockResolvedValue([{ id: 'e1' }]);

    const result = await controller.list(
      { user: { id: 'u1' } },
      '2026-03-01T00:00:00.000Z',
      '2026-03-31T23:59:59.999Z',
    );

    expect(eventsService.listForUser).toHaveBeenCalledWith(
      'u1',
      '2026-03-01T00:00:00.000Z',
      '2026-03-31T23:59:59.999Z',
    );
    expect(result).toEqual([{ id: 'e1' }]);
  });

  it('creates event for the authenticated user', async () => {
    const dto = {
      title: 'Calendar sync',
      startAt: '2026-03-18T10:00:00.000Z',
      endAt: '2026-03-18T11:00:00.000Z',
    };
    (eventsService.createForUser as jest.Mock).mockResolvedValue({ id: 'e2' });

    const result = await controller.create({ user: { id: 'u2' } }, dto as any);

    expect(eventsService.createForUser).toHaveBeenCalledWith('u2', dto);
    expect(result).toEqual({ id: 'e2' });
  });

  it('updates event for the authenticated user', async () => {
    const dto = { title: 'Updated title' };
    (eventsService.updateForUser as jest.Mock).mockResolvedValue({ id: 'e3' });

    const result = await controller.update({ user: { id: 'u3' } }, 'e3', dto as any);

    expect(eventsService.updateForUser).toHaveBeenCalledWith('u3', 'e3', dto);
    expect(result).toEqual({ id: 'e3' });
  });

  it('deletes event for the authenticated user', async () => {
    (eventsService.removeForUser as jest.Mock).mockResolvedValue({ ok: true });

    const result = await controller.remove({ user: { id: 'u4' } }, 'e4');

    expect(eventsService.removeForUser).toHaveBeenCalledWith('u4', 'e4');
    expect(result).toEqual({ ok: true });
  });
});
