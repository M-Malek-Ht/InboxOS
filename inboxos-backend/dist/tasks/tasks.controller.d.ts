import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { BaseCrudController } from '../base-crud.controller';
import { TaskEntity } from './task.entity';
export declare class TasksController extends BaseCrudController<TaskEntity, CreateTaskDto, UpdateTaskDto> {
    private readonly tasks;
    constructor(tasks: TasksService);
    list(): any;
}
