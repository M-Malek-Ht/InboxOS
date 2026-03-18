import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';
declare const MicrosoftStrategy_base: new (...args: any) => any;
export declare class MicrosoftStrategy extends MicrosoftStrategy_base {
    private configService;
    private authService;
    constructor(configService: ConfigService, authService: AuthService);
    validate(accessToken: string, refreshToken: string | undefined, profile: {
        id: string;
        displayName?: string;
        emails?: {
            value: string;
            type?: string;
        }[];
        _json?: {
            mail?: string;
            userPrincipalName?: string;
        };
    }, done: (err: Error | null, user?: unknown) => void): Promise<void>;
}
export {};
