import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DraftsService } from './drafts.service';

@Controller('drafts')
export class AllDraftsController {
  constructor(private readonly drafts: DraftsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async listAll(@Request() req: any) {
    return this.drafts.listLatestDrafts(req.user.id);
  }
}
