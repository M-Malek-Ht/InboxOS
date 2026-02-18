import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { Account } from './account.entity';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';
export declare class AuthService {
    private accountRepository;
    private usersService;
    private jwtService;
    constructor(accountRepository: Repository<Account>, usersService: UsersService, jwtService: JwtService);
    validateOrCreateOAuthUser(email: string, provider: string, providerId: string, refreshToken?: string): Promise<User>;
    generateToken(user: User): string;
}
