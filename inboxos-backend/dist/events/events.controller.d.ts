import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { BaseCrudController } from '../base-crud.controller';
import { EventEntity } from './event.entity';
export declare class EventsController extends BaseCrudController<EventEntity, CreateEventDto, UpdateEventDto> {
    private readonly events;
    constructor(events: EventsService);
    list(from?: string, to?: string): Promise<EventEntity[]>;
}
