import { cn } from '@/lib/utils';
import { LucideIcon, Inbox, FileText, CheckSquare, Calendar } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-4 text-center', className)}>
      {Icon && (
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
          <Icon className="h-8 w-8 text-muted-foreground" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground max-w-sm">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function EmptyInbox() {
  return (
    <EmptyState
      icon={Inbox}
      title="All caught up!"
      description="No emails match your current filters. Check back later or adjust your filters."
    />
  );
}

export function EmptyDrafts() {
  return (
    <EmptyState
      icon={FileText}
      title="No drafts yet"
      description="Generate AI replies from your inbox to see them here."
    />
  );
}

export function EmptyTasks() {
  return (
    <EmptyState
      icon={CheckSquare}
      title="No tasks"
      description="Create tasks from emails or add them manually to stay organized."
    />
  );
}

export function EmptyCalendar() {
  return (
    <EmptyState
      icon={Calendar}
      title="No events"
      description="No events scheduled for this period."
    />
  );
}
