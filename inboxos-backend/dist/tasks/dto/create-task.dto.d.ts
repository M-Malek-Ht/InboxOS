import type { TaskPriority, TaskStatus } from '../task.entity';
export declare class CreateTaskDto {
    title: string;
    description?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    dueDate?: string;
}
