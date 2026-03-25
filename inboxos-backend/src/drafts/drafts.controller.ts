import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Request,
  UseGuards,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DraftsService } from './drafts.service';
import { CreateDraftDto } from './dto/create-draft.dto';
import { JobRunnerService } from '../jobs/job-runner.service';

@Controller('emails/:emailId/drafts')
export class DraftsController {
  private static readonly MAX_FROM_CHARS = 320;
  private static readonly MAX_SUBJECT_CHARS = 500;
  private static readonly MAX_BODY_CHARS = 16000;

  constructor(
    private readonly drafts: DraftsService,
    private readonly runner: JobRunnerService,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  list(@Param('emailId') emailId: string, @Request() req: any) {
    return this.drafts.listByEmail(req.user.id, emailId);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(
    @Param('emailId') emailId: string,
    @Request() req: any,
    @Body() dto: CreateDraftDto,
  ) {
    // If content is provided, save directly (manual edit / paste)
    if (dto.content) {
      return this.drafts.createDirectDraft(req.user.id, emailId, dto);
    }

    // Resolve email context: prefer DTO fields (for external Gmail/Microsoft emails),
    // fall back to local DB lookup
    let from = dto.emailFrom;
    let subject = dto.emailSubject;
    let body = dto.emailBody;

    if (!from || !subject) {
      const email = await this.drafts.findEmailOrNull(req.user.id, emailId);
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

    const safeFrom = this.sanitizePromptField(from, DraftsController.MAX_FROM_CHARS);
    const safeSubject = this.sanitizePromptField(subject, DraftsController.MAX_SUBJECT_CHARS);
    const safeBody = this.sanitizePromptField(body ?? '', DraftsController.MAX_BODY_CHARS);

    if (!safeFrom || !safeSubject) {
      throw new BadRequestException(
        'Email context required: provide emailFrom/emailSubject/emailBody in the request body',
      );
    }

    try {
      const jobId = await this.runner.enqueue('draft', {
        userId: req.user.id,
        emailId,
        from: safeFrom,
        subject: safeSubject,
        body: safeBody,
        tone: dto.tone,
        length: dto.length,
        instruction: dto.instruction,
      });

      return { jobId };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to queue draft generation';
      throw new InternalServerErrorException(message);
    }
  }

  private sanitizePromptField(value: unknown, maxChars: number): string {
    const text = typeof value === 'string' ? value : String(value ?? '');
    const withoutNulls = text.replace(/\u0000/g, ' ').trim();
    return withoutNulls.length <= maxChars
      ? withoutNulls
      : withoutNulls.slice(0, maxChars);
  }
}
