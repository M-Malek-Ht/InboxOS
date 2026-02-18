import { User } from '../users/entities/user.entity';
export declare class Account {
    id: string;
    userId: string;
    user: User;
    provider: string;
    providerId: string;
    refreshToken: string | null;
    createdAt: Date;
}
