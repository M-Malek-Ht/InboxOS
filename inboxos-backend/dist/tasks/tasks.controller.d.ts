import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
export declare class TasksController {
    private readonly tasks;
    constructor(tasks: TasksService);
    list(req: any): Promise<import("./task.entity").TaskEntity[]>;
    create(req: any, dto: CreateTaskDto): Promise<import("./task.entity").TaskEntity>;
    update(req: any, id: string, dto: UpdateTaskDto): Promise<import("./task.entity").TaskEntity>;
    remove(req: any, id: string): Promise<{
        ok: boolean;
    }>;
}
