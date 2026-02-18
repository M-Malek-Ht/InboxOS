import { Body, Controller, Get, Patch, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SettingsService } from './settings.service';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settings: SettingsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async get(@Request() req: any) {
    return this.settings.getForUser(req.user.id);
  }

  @Patch()
  @UseGuards(JwtAuthGuard)
  async update(
    @Request() req: any,
    @Body() body: { defaultTone?: string; defaultLength?: string },
  ) {
    return this.settings.updateForUser(req.user.id, body);
  }
}
