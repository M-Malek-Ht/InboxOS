import { Repository } from 'typeorm';
import { EventEntity } from './event.entity';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
export declare class EventsService {
    private readonly repo;
    constructor(repo: Repository<EventEntity>);
    listForUser(userId: string, from?: string, to?: string): Promise<EventEntity[]>;
    createForUser(userId: string, dto: CreateEventDto): Promise<EventEntity>;
    updateForUser(userId: string, id: string, dto: UpdateEventDto): Promise<EventEntity>;
    removeForUser(userId: string, id: string): Promise<{
        ok: boolean;
    }>;
}
