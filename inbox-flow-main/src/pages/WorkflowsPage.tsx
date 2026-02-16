import { useState } from 'react';
import { KanbanBoard } from '@/components/tasks/KanbanBoard';
import { Button } from '@/components/ui/button';
import { LayoutGrid, List } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PageTransition } from '@/components/PageTransition';

export default function WorkflowsPage() {
  const [view, setView] = useState<'kanban' | 'list'>('kanban');

  return (
    <PageTransition>
    <div className="h-[calc(100vh-3.5rem)] flex flex-col">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h2 className="text-lg font-semibold">Tasks</h2>
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setView('kanban')}
            className={cn('gap-2', view === 'kanban' && 'bg-background shadow-sm')}
          >
            <LayoutGrid className="h-4 w-4" />
            Board
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setView('list')}
            className={cn('gap-2', view === 'list' && 'bg-background shadow-sm')}
          >
            <List className="h-4 w-4" />
            List
          </Button>
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        <KanbanBoard view={view} />
      </div>
    </div>
    </PageTransition>
  );
}
