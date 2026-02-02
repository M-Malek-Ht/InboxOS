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
  @IsIn(['todo', 'in_progress', 'done'])
  status?: TaskStatus;

  @IsOptional()
  @IsIn(['low', 'medium', 'high'])
  priority?: TaskPriority;

  @IsOptional()
  @IsDateString()
  dueDate?: string; // ISO string
}
