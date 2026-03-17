import { ConfigService } from '@nestjs/config';
import { VerifyCallback } from 'passport-google-oauth20';
import { AuthService } from '../auth.service';
declare const GoogleStrategy_base: any;
export declare class GoogleStrategy extends GoogleStrategy_base {
    private configService;
    private authService;
    constructor(configService: ConfigService, authService: AuthService);
    authorizationParams(): Record<string, string>;
    validate(_accessToken: string, refreshToken: string | undefined, profile: {
        id: string;
        emails: {
            value: string;
        }[];
    }, done: VerifyCallback): Promise<void>;
}
export {};
