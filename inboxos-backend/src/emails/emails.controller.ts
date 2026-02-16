import { Body, Controller, Get, Param, Post, NotFoundException, Patch, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { EmailsService } from './emails.service';
import { JobRunnerService } from '../jobs/job-runner.service';

@Controller('emails')
export class EmailsController {
  constructor(
    private readonly emails: EmailsService,
    private readonly runner: JobRunnerService,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async list(
    @Request() req: any,
    @Query('filter') filter?: string,
    @Query('search') search?: string,
    @Query('limit') limit?: string,
  ) {
    return this.emails.listForUser(req.user.id, {
      filter,
      search,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async get(@Param('id') id: string, @Request() req: any) {
    const email = await this.emails.getForUser(req.user.id, id);
    if (!email) throw new NotFoundException('Email not found');
    return email;
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async setRead(
    @Param('id') id: string,
    @Body() body: { isRead: boolean },
    @Request() req: any,
  ) {
    return this.emails.setReadState(req.user.id, id, !!body.isRead);
  }

  @Post(':id/classify')
  @UseGuards(JwtAuthGuard)
  async classify(@Param('id') id: string, @Request() req: any) {
    const email = await this.emails.getForUser(req.user.id, id);
    if (!email) throw new NotFoundException('Email not found');

    const jobId = await this.runner.enqueue('classify', {
      from: email.from,
      subject: email.subject,
      body: email.body ?? '',
    });

    return { jobId };
  }
}
