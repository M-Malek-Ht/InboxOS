import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { Account } from './account.entity';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  private readonly log = new Logger(AuthService.name);

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
    const account = await this.accountRepository.findOne({
      where: { provider, providerId },
      relations: ['user'],
    });

    if (account) {
      if (refreshToken && refreshToken !== account.refreshToken) {
        this.log.debug(`Updating ${provider} refresh token for userId=${account.userId}`);
        await this.accountRepository.update(account.id, { refreshToken });
      }
      return account.user;
    }

    const user = await this.usersService.findOrCreate(email);

    await this.accountRepository.save(
      this.accountRepository.create({
        userId: user.id,
        provider,
        providerId,
        refreshToken: refreshToken ?? null,
      }),
    );
    this.log.log(`Linked ${provider} account for userId=${user.id}`);

    return user;
  }

  generateToken(user: User): string {
    return this.jwtService.sign({ sub: user.id, email: user.email });
  }
}
