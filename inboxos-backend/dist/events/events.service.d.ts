import { Repository } from 'typeorm';
import { EventEntity } from './event.entity';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
export declare class EventsService {
    private readonly repo;
    constructor(repo: Repository<EventEntity>);
    list(from?: string, to?: string): Promise<EventEntity[]>;
    create(dto: CreateEventDto): Promise<EventEntity>;
    update(id: string, dto: UpdateEventDto): Promise<EventEntity>;
    remove(id: string): Promise<{
        ok: boolean;
    }>;
}
