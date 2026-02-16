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
    queued: { label: 'Queued', className: 'bg-muted text-muted-foreground' },
    processing: { label: 'Processing', className: 'bg-primary/10 text-primary animate-pulse-subtle' },
    done: { label: 'Done', className: 'bg-status-done/15 text-status-done' },
    failed: { label: 'Failed', className: 'bg-destructive/10 text-destructive' },
  };

  const config = statusConfig[status];

  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full', config.className, className)}>
      {config.label}
    </span>
  );
}
