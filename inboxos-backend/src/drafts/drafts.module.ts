import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DraftsController } from './drafts.controller';
import { DraftsService } from './drafts.service';
import { DraftEntity } from './draft.entity';
import { EmailEntity } from '../emails/email.entity';
import { JobsModule } from '../jobs/jobs.module';

@Module({
  imports: [TypeOrmModule.forFeature([DraftEntity, EmailEntity]), JobsModule],
  controllers: [DraftsController],
  providers: [DraftsService],
})
export class DraftsModule {}
