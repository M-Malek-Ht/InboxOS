import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailsController } from './emails.controller';
import { EmailsService } from './emails.service';
import { EmailEntity } from './email.entity';

@Module({
  imports: [TypeOrmModule.forFeature([EmailEntity])],
  controllers: [EmailsController],
  providers: [EmailsService],
})
export class EmailsModule {}
