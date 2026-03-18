export type TaskStatus = 'Backlog' | 'In Progress' | 'Done';
export type TaskPriority = 'Low' | 'Med' | 'High';
export declare class TaskEntity {
    id: string;
    userId: string;
    title: string;
    description: string;
    status: TaskStatus;
    priority: TaskPriority;
    dueDate: Date | null;
    createdAt: Date;
    updatedAt: Date;
}
