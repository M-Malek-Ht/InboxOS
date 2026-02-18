import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
export declare class EventsController {
    private readonly events;
    constructor(events: EventsService);
    list(from?: string, to?: string): Promise<import("./event.entity").EventEntity[]>;
    create(dto: CreateEventDto): Promise<import("./event.entity").EventEntity>;
    update(id: string, dto: UpdateEventDto): Promise<import("./event.entity").EventEntity>;
    remove(id: string): Promise<{
        ok: boolean;
    }>;
}
