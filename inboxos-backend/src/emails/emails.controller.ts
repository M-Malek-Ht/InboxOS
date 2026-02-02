import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { EmailsService } from './emails.service';

@Controller('emails')
export class EmailsController {
  constructor(private readonly emails: EmailsService) {}

  @Get()
  async list() {
    await this.emails.seedIfEmpty();
    return this.emails.list();
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    const email = await this.emails.get(id);
    if (!email) throw new NotFoundException('Email not found');
    return email;
  }
}
