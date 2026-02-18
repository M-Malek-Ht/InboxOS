import { AuthService } from './auth.service';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    googleAuth(): Promise<void>;
    googleCallback(req: any, res: any): Promise<void>;
    microsoftAuth(): Promise<void>;
    microsoftCallback(req: any, res: any): Promise<void>;
    getProfile(req: any): Promise<any>;
    logout(res: any): Promise<void>;
    failed(): Promise<void>;
}
