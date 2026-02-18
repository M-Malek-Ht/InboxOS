import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
export declare class TasksController {
    private readonly tasks;
    constructor(tasks: TasksService);
    list(): Promise<import("./task.entity").TaskEntity[]>;
    create(dto: CreateTaskDto): Promise<import("./task.entity").TaskEntity>;
    update(id: string, dto: UpdateTaskDto): Promise<import("./task.entity").TaskEntity>;
    remove(id: string): Promise<{
        ok: boolean;
    }>;
}
