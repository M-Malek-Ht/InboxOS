import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserSettingsEntity } from './settings.entity';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(UserSettingsEntity)
    private readonly repo: Repository<UserSettingsEntity>,
  ) {}

  async getForUser(userId: string): Promise<UserSettingsEntity> {
    const settings = await this.repo.findOne({ where: { userId } });
    if (settings) return settings;
    // Return defaults without persisting
    return this.repo.create({ userId, defaultTone: 'Professional', defaultLength: 'Medium' });
  }

  async updateForUser(
    userId: string,
    updates: { defaultTone?: string; defaultLength?: string },
  ): Promise<UserSettingsEntity> {
    await this.repo.upsert({ userId, ...updates }, ['userId']);
    return this.getForUser(userId);
  }
}
