import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEntity } from './event.entity';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(EventEntity)
    private readonly repo: Repository<EventEntity>,
  ) {}

  listForUser(userId: string, from?: string, to?: string) {
    const qb = this.repo
      .createQueryBuilder('event')
      .where('event.userId = :userId', { userId });

    if (from) {
      qb.andWhere('event.endAt >= :from', { from: new Date(from) });
    }
    if (to) {
      qb.andWhere('event.startAt <= :to', { to: new Date(to) });
    }

    return qb.orderBy('event.startAt', 'ASC').getMany();
  }

  async createForUser(userId: string, dto: CreateEventDto) {
    const event = this.repo.create({
      userId,
      title: dto.title,
      startAt: new Date(dto.startAt),
      endAt: new Date(dto.endAt),
      location: dto.location ?? '',
      notes: dto.notes ?? '',
    });
    return this.repo.save(event);
  }

  async updateForUser(userId: string, id: string, dto: UpdateEventDto) {
    const event = await this.repo.findOne({ where: { id, userId } });
    if (!event) throw new NotFoundException('Event not found');

    if (dto.title !== undefined) event.title = dto.title;
    if (dto.startAt !== undefined) event.startAt = new Date(dto.startAt);
    if (dto.endAt !== undefined) event.endAt = new Date(dto.endAt);
    if (dto.location !== undefined) event.location = dto.location ?? '';
    if (dto.notes !== undefined) event.notes = dto.notes ?? '';

    return this.repo.save(event);
  }

  async removeForUser(userId: string, id: string) {
    const res = await this.repo.delete({ id, userId });
    if (res.affected === 0) throw new NotFoundException('Event not found');
    return { ok: true };
  }
}
