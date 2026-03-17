import { Repository } from 'typeorm';
import { EventEntity } from './event.entity';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { BaseEntityService } from '../base-entity.service';
export declare class EventsService extends BaseEntityService<EventEntity, CreateEventDto, UpdateEventDto> {
    constructor(repo: Repository<EventEntity>);
    list(from?: string, to?: string): any;
    create(dto: CreateEventDto): Promise<any>;
    update(id: string, dto: UpdateEventDto): Promise<any>;
}
