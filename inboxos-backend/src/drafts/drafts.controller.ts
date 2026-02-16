import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DraftsService } from './drafts.service';
import { CreateDraftDto } from './dto/create-draft.dto';
import { JobRunnerService } from '../jobs/job-runner.service';

@Controller('emails/:emailId/drafts')
export class DraftsController {
  constructor(
    private readonly drafts: DraftsService,
    private readonly runner: JobRunnerService,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  list(@Param('emailId') emailId: string) {
    return this.drafts.listByEmail(emailId);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(
    @Param('emailId') emailId: string,
    @Body() dto: CreateDraftDto,
  ) {
    // If content is provided, save directly (manual edit / paste)
    if (dto.content) {
      return this.drafts.createForEmail(emailId, dto);
    }

    // Otherwise, queue an AI generation job
    const email = await this.drafts.getEmailOrFail(emailId);

    const jobId = await this.runner.enqueue('draft', {
      emailId,
      from: email.from,
      subject: email.subject,
      body: email.body ?? '',
      tone: dto.tone,
      length: dto.length,
      instruction: dto.instruction,
    });

    return { jobId };
  }
}
