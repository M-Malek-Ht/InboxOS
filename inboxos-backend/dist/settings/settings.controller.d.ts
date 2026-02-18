import { SettingsService } from './settings.service';
export declare class SettingsController {
    private readonly settings;
    constructor(settings: SettingsService);
    get(req: any): Promise<import("./settings.entity").UserSettingsEntity>;
    update(req: any, body: {
        defaultTone?: string;
        defaultLength?: string;
    }): Promise<import("./settings.entity").UserSettingsEntity>;
}
