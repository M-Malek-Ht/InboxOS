import { Repository } from 'typeorm';
import { TaskEntity } from './task.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { BaseEntityService } from '../base-entity.service';
export declare class TasksService extends BaseEntityService<TaskEntity, CreateTaskDto, UpdateTaskDto> {
    constructor(repo: Repository<TaskEntity>);
    list(): Promise<TaskEntity[]>;
    create(dto: CreateTaskDto): Promise<TaskEntity>;
    update(id: string, dto: UpdateTaskDto): Promise<TaskEntity>;
}
