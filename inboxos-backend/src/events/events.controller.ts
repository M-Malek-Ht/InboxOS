import { Controller, Get, Query } from '@nestjs/common';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { BaseCrudController } from '../base-crud.controller';
import { EventEntity } from './event.entity';

@Controller('events')
export class EventsController extends BaseCrudController<EventEntity, CreateEventDto, UpdateEventDto> {
  constructor(private readonly events: EventsService) {
    super(events);
  }

  @Get()
  list(@Query('from') from?: string, @Query('to') to?: string) {
    return this.events.list(from, to);
  }
}
