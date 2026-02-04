import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { Account } from './account.entity';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Account)
    private accountRepository: Repository<Account>,
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateOrCreateOAuthUser(
    email: string,
    provider: string,
    providerId: string,
    refreshToken?: string,
  ): Promise<User> {
    console.log('[AuthService] validateOrCreateOAuthUser called');
    console.log('[AuthService] email:', email);
    console.log('[AuthService] refreshToken received:', refreshToken ? 'YES' : 'NO');

    const account = await this.accountRepository.findOne({
      where: { provider, providerId },
      relations: ['user'],
    });

    if (account) {
      console.log('[AuthService] Existing account found, userId:', account.userId);
      if (refreshToken && refreshToken !== account.refreshToken) {
        console.log('[AuthService] Updating refresh token');
        await this.accountRepository.update(account.id, { refreshToken });
      }
      return account.user;
    }

    console.log('[AuthService] Creating new account');
    const user = await this.usersService.findOrCreate(email);

    await this.accountRepository.save(
      this.accountRepository.create({
        userId: user.id,
        provider,
        providerId,
        refreshToken: refreshToken ?? null,
      }),
    );
    console.log('[AuthService] Account created with userId:', user.id);

    return user;
  }

  generateToken(user: User): string {
    return this.jwtService.sign({ sub: user.id, email: user.email });
  }
}
