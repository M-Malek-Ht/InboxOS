import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailsController } from './emails.controller';
import { EmailsService } from './emails.service';
import { GmailService } from './gmail.service';
import { MicrosoftMailService } from './microsoft-mail.service';
import { EmailEntity } from './email.entity';
import { EmailInsightEntity } from './email-insight.entity';
import { Account } from '../auth/account.entity';
import { User } from '../users/entities/user.entity';
import { JobsModule } from '../jobs/jobs.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([EmailEntity, EmailInsightEntity, Account, User]),
    ConfigModule,
    JobsModule,
  ],
  controllers: [EmailsController],
  providers: [EmailsService, GmailService, MicrosoftMailService],
})
export class EmailsModule {}
