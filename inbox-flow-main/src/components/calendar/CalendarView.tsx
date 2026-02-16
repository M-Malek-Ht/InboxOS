import { useState, useMemo, useCallback } from 'react';
import { CalendarEvent } from '@/lib/types';
import { useEvents, useCreateEvent, useUpdateEvent, useDeleteEvent } from '@/lib/api/hooks';
import { cn } from '@/lib/utils';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  startOfDay,
  addDays,
} from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CalendarSkeleton } from '@/components/ui/skeletons';
import { EmptyCalendar } from '@/components/ui/empty-states';
import { toast } from 'sonner';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  MapPin,
  Clock,
  Trash2,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CalendarViewProps {
  view: 'month' | 'week';
}

export function CalendarView({ view }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  // Calculate date range based on view
  const dateRange = useMemo(() => {
    if (view === 'month') {
      const start = startOfWeek(startOfMonth(currentDate));
      const end = endOfWeek(endOfMonth(currentDate));
      return { from: start.toISOString(), to: end.toISOString() };
    } else {
      const start = startOfWeek(currentDate);
      const end = endOfWeek(currentDate);
      return { from: start.toISOString(), to: end.toISOString() };
    }
  }, [currentDate, view]);

  const { data: events, isLoading } = useEvents(dateRange);

  const navigate = (direction: 'prev' | 'next') => {
    if (view === 'month') {
      setCurrentDate(prev => direction === 'next' ? addMonths(prev, 1) : subMonths(prev, 1));
    } else {
      setCurrentDate(prev => direction === 'next' ? addWeeks(prev, 1) : subWeeks(prev, 1));
    }
  };

  const goToToday = () => setCurrentDate(new Date());

  const handleDayClick = (day: Date) => {
    setSelectedDay(day);
    setCreateModalOpen(true);
  };

  if (isLoading) {
    return <CalendarSkeleton />;
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold">
            {view === 'month' 
              ? format(currentDate, 'MMMM yyyy')
              : `Week of ${format(startOfWeek(currentDate), 'MMM d')}`
            }
          </h2>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={() => navigate('prev')}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="sm" onClick={goToToday}>
              Today
            </Button>
            <Button variant="ghost" size="icon" onClick={() => navigate('next')}>
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
        <Button onClick={() => { setSelectedDay(new Date()); setCreateModalOpen(true); }} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Event
        </Button>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 overflow-auto p-4">
        {view === 'month' ? (
          <MonthGrid
            currentDate={currentDate}
            events={events || []}
            onDayClick={handleDayClick}
            onEventClick={setSelectedEvent}
          />
        ) : (
          <WeekGrid
            currentDate={currentDate}
            events={events || []}
            onDayClick={handleDayClick}
            onEventClick={setSelectedEvent}
          />
        )}
      </div>

      {/* Event Detail Modal */}
      <EventModal
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
      />

      {/* Create Event Modal */}
      <CreateEventModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        defaultDate={selectedDay}
      />
    </div>
  );
}

interface MonthGridProps {
  currentDate: Date;
  events: CalendarEvent[];
  onDayClick: (day: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
}

function MonthGrid({ currentDate, events, onDayClick, onEventClick }: MonthGridProps) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getEventsForDay = (day: Date) => {
    return events.filter(event => isSameDay(new Date(event.startAt), day));
  };

  return (
    <div className="grid grid-cols-7 gap-1">
      {/* Weekday headers */}
      {weekDays.map(day => (
        <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
          {day}
        </div>
      ))}
      
      {/* Days */}
      {days.map(day => {
        const dayEvents = getEventsForDay(day);
        const isCurrentMonth = isSameMonth(day, currentDate);
        
        return (
          <div
            key={day.toISOString()}
            onClick={() => onDayClick(day)}
            className={cn(
              'min-h-24 p-2 border border-border rounded-lg cursor-pointer transition-colors',
              'hover:border-muted-foreground/30',
              !isCurrentMonth && 'bg-muted/30 text-muted-foreground',
              isToday(day) && 'border-primary bg-primary/10'
            )}
          >
            <div className={cn(
              'text-sm font-medium mb-1',
              isToday(day) && 'text-primary'
            )}>
              {format(day, 'd')}
            </div>
            <div className="space-y-1">
              {dayEvents.slice(0, 3).map(event => (
                <button
                  key={event.id}
                  onClick={(e) => { e.stopPropagation(); onEventClick(event); }}
                  className="w-full text-left text-xs p-1 rounded bg-primary/10 text-primary truncate hover:bg-primary/20 transition-colors"
                >
                  {format(new Date(event.startAt), 'h:mm a')} {event.title}
                </button>
              ))}
              {dayEvents.length > 3 && (
                <div className="text-xs text-muted-foreground">
                  +{dayEvents.length - 3} more
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface WeekGridProps {
  currentDate: Date;
  events: CalendarEvent[];
  onDayClick: (day: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
}

function WeekGrid({ currentDate, events, onDayClick, onEventClick }: WeekGridProps) {
  const weekStart = startOfWeek(currentDate);
  const days = eachDayOfInterval({ start: weekStart, end: addDays(weekStart, 6) });
  const hours = Array.from({ length: 12 }, (_, i) => i + 8); // 8 AM to 8 PM

  const getEventsForDayAndHour = (day: Date, hour: number) => {
    return events.filter(event => {
      const eventDate = new Date(event.startAt);
      return isSameDay(eventDate, day) && eventDate.getHours() === hour;
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="grid grid-cols-8 border-b border-border">
        <div className="p-2 text-center text-sm font-medium text-muted-foreground" />
        {days.map(day => (
          <div
            key={day.toISOString()}
            className={cn(
              'p-2 text-center border-l border-border',
              isToday(day) && 'bg-primary/10'
            )}
          >
            <div className="text-sm font-medium">{format(day, 'EEE')}</div>
            <div className={cn(
              'text-2xl font-semibold',
              isToday(day) && 'text-primary'
            )}>
              {format(day, 'd')}
            </div>
          </div>
        ))}
      </div>

      {/* Time Grid */}
      <div className="flex-1 overflow-y-auto">
        {hours.map(hour => (
          <div key={hour} className="grid grid-cols-8 border-b border-border min-h-16">
            <div className="p-2 text-xs text-muted-foreground text-right pr-4">
              {format(new Date().setHours(hour, 0), 'h a')}
            </div>
            {days.map(day => {
              const hourEvents = getEventsForDayAndHour(day, hour);
              return (
                <div
                  key={day.toISOString()}
                  onClick={() => onDayClick(day)}
                  className={cn(
                    'border-l border-border p-1 cursor-pointer hover:bg-muted/30',
                    isToday(day) && 'bg-primary/10'
                  )}
                >
                  {hourEvents.map(event => (
                    <button
                      key={event.id}
                      onClick={(e) => { e.stopPropagation(); onEventClick(event); }}
                      className="w-full text-left text-xs p-1 rounded bg-primary text-primary-foreground truncate hover:bg-primary/90 transition-colors"
                    >
                      {event.title}
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

interface EventModalProps {
  event: CalendarEvent | null;
  onClose: () => void;
}

function EventModal({ event, onClose }: EventModalProps) {
  const deleteEvent = useDeleteEvent();

  const handleDelete = async () => {
    if (!event) return;
    await deleteEvent.mutateAsync(event.id);
    toast.success('Event deleted');
    onClose();
  };

  if (!event) return null;

  const startDate = new Date(event.startAt);
  const endDate = new Date(event.endAt);

  return (
    <Dialog open={!!event} onOpenChange={() => onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="pr-8">{event.title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <div>
              <div className="font-medium text-foreground">
                {format(startDate, 'EEEE, MMMM d, yyyy')}
              </div>
              <div className="text-sm">
                {format(startDate, 'h:mm a')} - {format(endDate, 'h:mm a')}
              </div>
            </div>
          </div>
          
          {event.location && (
            <div className="flex items-center gap-3 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span className="text-foreground">{event.location}</span>
            </div>
          )}
          
          {event.notes && (
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-sm">{event.notes}</p>
            </div>
          )}
          
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteEvent.isPending}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface CreateEventModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultDate: Date | null;
}

function CreateEventModal({ open, onOpenChange, defaultDate }: CreateEventModalProps) {
  const createEvent = useCreateEvent();
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('11:00');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !defaultDate) return;

    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    
    const startAt = new Date(defaultDate);
    startAt.setHours(startHour, startMin, 0, 0);
    
    const endAt = new Date(defaultDate);
    endAt.setHours(endHour, endMin, 0, 0);

    await createEvent.mutateAsync({
      title: title.trim(),
      startAt: startAt.toISOString(),
      endAt: endAt.toISOString(),
      location: location.trim() || undefined,
      notes: notes.trim() || undefined,
    });
    
    toast.success('Event created');
    setTitle('');
    setLocation('');
    setNotes('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Event</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Event title"
              autoFocus
            />
          </div>
          
          {defaultDate && (
            <div className="text-sm text-muted-foreground">
              {format(defaultDate, 'EEEE, MMMM d, yyyy')}
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Start Time</Label>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div>
              <Label>End Time</Label>
              <Input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>
          
          <div>
            <Label>Location (optional)</Label>
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Add location"
            />
          </div>
          
          <div>
            <Label>Notes (optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes..."
              rows={3}
            />
          </div>
          
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!title.trim() || createEvent.isPending}>
              Create Event
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
