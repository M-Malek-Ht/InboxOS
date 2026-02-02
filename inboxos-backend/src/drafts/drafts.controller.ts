import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { DraftsService } from './drafts.service';
import { CreateDraftDto } from './dto/create-draft.dto';

@Controller('emails/:emailId/drafts')
export class DraftsController {
  constructor(private readonly drafts: DraftsService) {}

  @Get()
  list(@Param('emailId') emailId: string) {
    return this.drafts.listByEmail(emailId);
  }

  @Post()
  create(@Param('emailId') emailId: string, @Body() dto: CreateDraftDto) {
    return this.drafts.createForEmail(emailId, dto);
  }
}
