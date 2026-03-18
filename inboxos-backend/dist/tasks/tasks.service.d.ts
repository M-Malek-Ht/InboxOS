import { Repository } from 'typeorm';
import { TaskEntity } from './task.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
export declare class TasksService {
    private readonly repo;
    constructor(repo: Repository<TaskEntity>);
    listForUser(userId: string): Promise<TaskEntity[]>;
    createForUser(userId: string, dto: CreateTaskDto): Promise<TaskEntity>;
    updateForUser(userId: string, id: string, dto: UpdateTaskDto): Promise<TaskEntity>;
    removeForUser(userId: string, id: string): Promise<{
        ok: boolean;
    }>;
}
