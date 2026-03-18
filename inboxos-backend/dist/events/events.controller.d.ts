import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
export declare class EventsController {
    private readonly events;
    constructor(events: EventsService);
    list(req: any, from?: string, to?: string): Promise<import("./event.entity").EventEntity[]>;
    create(req: any, dto: CreateEventDto): Promise<import("./event.entity").EventEntity>;
    update(req: any, id: string, dto: UpdateEventDto): Promise<import("./event.entity").EventEntity>;
    remove(req: any, id: string): Promise<{
        ok: boolean;
    }>;
}
