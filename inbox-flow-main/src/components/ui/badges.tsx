import { Category, TaskPriority, TaskStatus } from '@/lib/types';
import { cn } from '@/lib/utils';

interface CategoryBadgeProps {
  category: Category;
  className?: string;
}

export function CategoryBadge({ category, className }: CategoryBadgeProps) {
  const categoryClasses: Record<Category, string> = {
    Meetings: 'category-meetings',
    Work: 'category-work',
    Personal: 'category-personal',
    Bills: 'category-bills',
    Newsletters: 'category-newsletters',
    Support: 'category-support',
    Other: 'category-other',
  };

  return (
    <span className={cn('category-badge', categoryClasses[category], className)}>
      {category}
    </span>
  );
}

interface PriorityIndicatorProps {
  priority: TaskPriority;
  score?: number;
  showLabel?: boolean;
  className?: string;
}

export function PriorityIndicator({ priority, score, showLabel, className }: PriorityIndicatorProps) {
  const priorityClasses: Record<TaskPriority, string> = {
    High: 'priority-high',
    Med: 'priority-med',
    Low: 'priority-low',
  };

  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <div className={cn('w-2 h-2 rounded-full bg-current', priorityClasses[priority])} />
      {showLabel && <span className="text-xs font-medium">{priority}</span>}
      {score !== undefined && (
        <span className="text-xs text-muted-foreground">{score}</span>
      )}
    </div>
  );
}

interface StatusBadgeProps {
  status: TaskStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const statusClasses: Record<TaskStatus, string> = {
    Backlog: 'status-backlog',
    'In Progress': 'status-progress',
    Done: 'status-done',
  };

  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full', statusClasses[status], className)}>
      {status}
    </span>
  );
}

interface JobStatusProps {
  status: 'queued' | 'processing' | 'done' | 'failed';
  className?: string;
}

export function JobStatus({ status, className }: JobStatusProps) {
  const statusConfig = {
    queued: { label: 'Queued', className: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
    processing: { label: 'Processing', className: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 animate-pulse-subtle' },
    done: { label: 'Done', className: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' },
    failed: { label: 'Failed', className: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' },
  };

  const config = statusConfig[status];

  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full', config.className, className)}>
      {config.label}
    </span>
  );
}
