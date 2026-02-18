import { Repository } from 'typeorm';
import { TaskEntity } from './task.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
export declare class TasksService {
    private readonly repo;
    constructor(repo: Repository<TaskEntity>);
    list(): Promise<TaskEntity[]>;
    create(dto: CreateTaskDto): Promise<TaskEntity>;
    update(id: string, dto: UpdateTaskDto): Promise<TaskEntity>;
    remove(id: string): Promise<{
        ok: boolean;
    }>;
}
