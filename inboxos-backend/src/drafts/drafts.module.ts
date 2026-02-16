import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DraftsController } from './drafts.controller';
import { DraftsService } from './drafts.service';
import { DraftEntity } from './draft.entity';
import { EmailEntity } from '../emails/email.entity';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [TypeOrmModule.forFeature([DraftEntity, EmailEntity]), AiModule],
  controllers: [DraftsController],
  providers: [DraftsService],
})
export class DraftsModule {}
