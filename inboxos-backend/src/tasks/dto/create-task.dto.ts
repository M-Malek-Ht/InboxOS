import { IsIn, IsOptional, IsString, MinLength, IsDateString } from 'class-validator';
import type { TaskPriority, TaskStatus } from '../task.entity';

export class CreateTaskDto {
  @IsString()
  @MinLength(1)
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsIn(['Backlog', 'In Progress', 'Done'])
  status?: TaskStatus;

  @IsOptional()
  @IsIn(['Low', 'Med', 'High'])
  priority?: TaskPriority;

  @IsOptional()
  @IsDateString()
  dueDate?: string; // ISO string
}
