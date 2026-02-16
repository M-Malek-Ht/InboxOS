import { useState } from 'react';
import { CalendarView } from '@/components/calendar/CalendarView';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, Grid3X3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PageTransition } from '@/components/PageTransition';

export default function CalendarPage() {
  const [view, setView] = useState<'month' | 'week'>('month');

  return (
    <PageTransition>
    <div className="h-[calc(100vh-3.5rem)] flex flex-col">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h2 className="text-lg font-semibold">Calendar</h2>
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setView('month')}
            className={cn('gap-2', view === 'month' && 'bg-background shadow-sm')}
          >
            <Grid3X3 className="h-4 w-4" />
            Month
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setView('week')}
            className={cn('gap-2', view === 'week' && 'bg-background shadow-sm')}
          >
            <CalendarIcon className="h-4 w-4" />
            Week
          </Button>
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        <CalendarView view={view} />
      </div>
    </div>
    </PageTransition>
  );
}
