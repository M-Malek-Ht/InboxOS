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

  list(from?: string, to?: string) {
    // Simple version for now: return all
    // Later we’ll filter by date range if from/to provided.
    return this.repo.find({ order: { startAt: 'ASC' } });
  }

  async create(dto: CreateEventDto) {
    const event = this.repo.create({
      title: dto.title,
      startAt: new Date(dto.startAt),
      endAt: new Date(dto.endAt),
      location: dto.location ?? '',
      notes: dto.notes ?? '',
    });
    return this.repo.save(event);
  }

  async update(id: string, dto: UpdateEventDto) {
    const event = await this.repo.findOne({ where: { id } });
    if (!event) throw new NotFoundException('Event not found');

    if (dto.title !== undefined) event.title = dto.title;
    if (dto.startAt !== undefined) event.startAt = new Date(dto.startAt);
    if (dto.endAt !== undefined) event.endAt = new Date(dto.endAt);
    if (dto.location !== undefined) event.location = dto.location ?? '';
    if (dto.notes !== undefined) event.notes = dto.notes ?? '';

    return this.repo.save(event);
  }

  async remove(id: string) {
    const res = await this.repo.delete({ id });
    if (res.affected === 0) throw new NotFoundException('Event not found');
    return { ok: true };
  }
}
