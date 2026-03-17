import { Controller } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { BaseCrudController } from '../base-crud.controller';
import { TaskEntity } from './task.entity';

@Controller('tasks')
export class TasksController extends BaseCrudController<TaskEntity, CreateTaskDto, UpdateTaskDto> {
  constructor(private readonly tasks: TasksService) {
    super(tasks);
  }

  list() {
    return this.tasks.list();
  }
}
