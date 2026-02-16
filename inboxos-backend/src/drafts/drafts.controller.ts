import { Body, Controller, Get, Param, Post, UseGuards, BadRequestException } from '@nestjs/common';
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
      return this.drafts.createDirectDraft(emailId, dto);
    }

    // Resolve email context: prefer DTO fields (for external Gmail/Microsoft emails),
    // fall back to local DB lookup
    let from = dto.emailFrom;
    let subject = dto.emailSubject;
    let body = dto.emailBody;

    if (!from || !subject) {
      const email = await this.drafts.findEmailOrNull(emailId);
      if (email) {
        from = from ?? email.from;
        subject = subject ?? email.subject;
        body = body ?? email.body ?? '';
      }
    }

    if (!from || !subject) {
      throw new BadRequestException(
        'Email context required: provide emailFrom/emailSubject/emailBody in the request body',
      );
    }

    const jobId = await this.runner.enqueue('draft', {
      emailId,
      from,
      subject,
      body: body ?? '',
      tone: dto.tone,
      length: dto.length,
      instruction: dto.instruction,
    });

    return { jobId };
  }
}
