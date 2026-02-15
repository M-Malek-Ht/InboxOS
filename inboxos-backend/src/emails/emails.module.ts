import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailsController } from './emails.controller';
import { EmailsService } from './emails.service';
import { GmailService } from './gmail.service';
import { MicrosoftMailService } from './microsoft-mail.service';
import { EmailEntity } from './email.entity';
import { Account } from '../auth/account.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([EmailEntity, Account]),
    ConfigModule,
  ],
  controllers: [EmailsController],
  providers: [EmailsService, GmailService, MicrosoftMailService],
})
export class EmailsModule {}
