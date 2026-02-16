import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JobEntity } from './job.entity';
import { JobsService } from './jobs.service';
import { JobsController } from './jobs.controller';
import { JobRunnerService } from './job-runner.service';
import { AiModule } from '../ai/ai.module';
import { DraftEntity } from '../drafts/draft.entity';

@Module({
  imports: [TypeOrmModule.forFeature([JobEntity, DraftEntity]), AiModule],
  controllers: [JobsController],
  providers: [JobsService, JobRunnerService],
  exports: [JobsService, JobRunnerService],
})
export class JobsModule {}
