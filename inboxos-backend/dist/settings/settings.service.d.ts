import { Repository } from 'typeorm';
import { UserSettingsEntity } from './settings.entity';
export declare class SettingsService {
    private readonly repo;
    constructor(repo: Repository<UserSettingsEntity>);
    getForUser(userId: string): Promise<UserSettingsEntity>;
    updateForUser(userId: string, updates: {
        defaultTone?: string;
        defaultLength?: string;
    }): Promise<UserSettingsEntity>;
}
