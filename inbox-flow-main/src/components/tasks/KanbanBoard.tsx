import { useState, useCallback, useMemo } from 'react';
import { Task, TaskStatus, TaskPriority } from '@/lib/types';
import { useTasks, useUpdateTask, useCreateTask, useDeleteTask } from '@/lib/api/hooks';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { PriorityIndicator, StatusBadge } from '@/components/ui/badges';
import { TaskListSkeleton } from '@/components/ui/skeletons';
import { EmptyTasks } from '@/components/ui/empty-states';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  Plus,
  GripVertical,
  Calendar,
  Trash2,
  CheckCircle2,
  Circle,
  Clock,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  useSensor,
  useSensors,
  PointerSensor,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const statuses: TaskStatus[] = ['Backlog', 'In Progress', 'Done'];
const priorities: TaskPriority[] = ['Low', 'Med', 'High'];

interface KanbanBoardProps {
  view: 'kanban' | 'list';
}

export function KanbanBoard({ view }: KanbanBoardProps) {
  const { data: tasks, isLoading } = useTasks();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const tasksByStatus = useMemo(() => {
    if (!tasks) return {};
    return {
      'Backlog': tasks.filter(t => t.status === 'Backlog'),
      'In Progress': tasks.filter(t => t.status === 'In Progress'),
      'Done': tasks.filter(t => t.status === 'Done'),
    };
  }, [tasks]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const taskId = active.id as string;
    const newStatus = over.id as TaskStatus;

    if (statuses.includes(newStatus)) {
      updateTask.mutate({ id: taskId, request: { status: newStatus } });
    }
  };

  const handleStatusChange = (taskId: string, status: TaskStatus) => {
    updateTask.mutate({ id: taskId, request: { status } });
  };

  const handleDelete = async (taskId: string) => {
    await deleteTask.mutateAsync(taskId);
    toast.success('Task deleted');
  };

  const activeTask = tasks?.find(t => t.id === activeId);

  if (isLoading) {
    return <TaskListSkeleton />;
  }

  if (!tasks || tasks.length === 0) {
    return (
      <div className="h-full flex flex-col">
        <div className="p-4 border-b border-border">
          <CreateTaskDialog open={createOpen} onOpenChange={setCreateOpen} />
        </div>
        <EmptyTasks />
      </div>
    );
  }

  if (view === 'list') {
    return (
      <div className="h-full flex flex-col">
        <div className="p-4 border-b border-border">
          <CreateTaskDialog open={createOpen} onOpenChange={setCreateOpen} />
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <AnimatePresence mode="popLayout">
            <div className="space-y-2">
              {tasks.map((task, index) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ delay: index * 0.02 }}
                >
                  <TaskListItem
                    task={task}
                    onStatusChange={handleStatusChange}
                    onDelete={handleDelete}
                  />
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border">
        <CreateTaskDialog open={createOpen} onOpenChange={setCreateOpen} />
      </div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 overflow-x-auto p-4">
          <div className="flex gap-4 h-full min-w-max">
            {statuses.map(status => (
              <KanbanColumn
                key={status}
                status={status}
                tasks={tasksByStatus[status] || []}
                onStatusChange={handleStatusChange}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </div>
        <DragOverlay>
          {activeTask && <TaskCard task={activeTask} isDragging />}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

interface KanbanColumnProps {
  status: TaskStatus;
  tasks: Task[];
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onDelete: (taskId: string) => void;
}

function KanbanColumn({ status, tasks, onStatusChange, onDelete }: KanbanColumnProps) {
  const { setNodeRef } = useSortable({ id: status });

  const statusIcon = {
    'Backlog': <Circle className="h-4 w-4 text-muted-foreground" />,
    'In Progress': <Clock className="h-4 w-4 text-status-progress" />,
    'Done': <CheckCircle2 className="h-4 w-4 text-status-done" />,
  };

  return (
    <div
      ref={setNodeRef}
      className="w-72 flex-shrink-0 flex flex-col bg-muted/30 rounded-xl p-3"
    >
      <div className="flex items-center gap-2 mb-3 px-1">
        {statusIcon[status]}
        <span className="font-medium">{status}</span>
        <span className="ml-auto text-sm text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
          {tasks.length}
        </span>
      </div>
      <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
        <div className="flex-1 space-y-2 min-h-[100px]">
          <AnimatePresence mode="popLayout">
            {tasks.map(task => (
              <motion.div
                key={task.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <SortableTaskCard
                  task={task}
                  onStatusChange={onStatusChange}
                  onDelete={onDelete}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </SortableContext>
    </div>
  );
}

interface SortableTaskCardProps {
  task: Task;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onDelete: (taskId: string) => void;
}

function SortableTaskCard({ task, onStatusChange, onDelete }: SortableTaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <TaskCard
        task={task}
        isDragging={isDragging}
        dragListeners={listeners}
        onDelete={onDelete}
      />
    </div>
  );
}

interface TaskCardProps {
  task: Task;
  isDragging?: boolean;
  dragListeners?: any;
  onDelete?: (taskId: string) => void;
}

function TaskCard({ task, isDragging, dragListeners, onDelete }: TaskCardProps) {
  return (
    <div
      className={cn(
        'bg-card border border-border rounded-lg p-3 hover-lift',
        isDragging && 'shadow-lg ring-2 ring-primary/50 rotate-2'
      )}
    >
      <div className="flex items-start gap-2">
        <button
          className="mt-1 text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing"
          {...dragListeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm mb-1 line-clamp-2">{task.title}</div>
          {task.description && (
            <div className="text-xs text-muted-foreground line-clamp-2 mb-2">
              {task.description}
            </div>
          )}
          <div className="flex items-center gap-2">
            <PriorityIndicator priority={task.priority} showLabel />
            {task.dueDate && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {format(new Date(task.dueDate), 'MMM d')}
              </span>
            )}
          </div>
        </div>
        {onDelete && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-destructive"
            onClick={() => onDelete(task.id)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
}

interface TaskListItemProps {
  task: Task;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onDelete: (taskId: string) => void;
}

function TaskListItem({ task, onStatusChange, onDelete }: TaskListItemProps) {
  return (
    <div className="flex items-center gap-3 p-4 bg-card border border-border rounded-lg hover:border-muted-foreground/30 transition-colors">
      <button
        onClick={() => {
          const nextStatus = task.status === 'Backlog' ? 'In Progress' : 
                            task.status === 'In Progress' ? 'Done' : 'Backlog';
          onStatusChange(task.id, nextStatus);
        }}
        className="flex-shrink-0"
      >
        {task.status === 'Done' ? (
          <CheckCircle2 className="h-5 w-5 text-status-done" />
        ) : task.status === 'In Progress' ? (
          <Clock className="h-5 w-5 text-status-progress" />
        ) : (
          <Circle className="h-5 w-5 text-muted-foreground" />
        )}
      </button>
      <div className="flex-1 min-w-0">
        <div className={cn(
          'font-medium',
          task.status === 'Done' && 'line-through text-muted-foreground'
        )}>
          {task.title}
        </div>
        {task.description && (
          <div className="text-sm text-muted-foreground truncate">
            {task.description}
          </div>
        )}
      </div>
      <div className="flex items-center gap-3">
        <PriorityIndicator priority={task.priority} showLabel />
        <StatusBadge status={task.status} />
        {task.dueDate && (
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {format(new Date(task.dueDate), 'MMM d')}
          </span>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
          onClick={() => onDelete(task.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

interface CreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function CreateTaskDialog({ open, onOpenChange }: CreateTaskDialogProps) {
  const createTask = useCreateTask();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('Med');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    await createTask.mutateAsync({
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
    });
    
    toast.success('Task created');
    setTitle('');
    setDescription('');
    setPriority('Med');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Task
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Task</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              autoFocus
            />
          </div>
          <div>
            <Label>Description (optional)</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add more details..."
              rows={3}
            />
          </div>
          <div>
            <Label>Priority</Label>
            <Select value={priority} onValueChange={(v) => setPriority(v as TaskPriority)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {priorities.map(p => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!title.trim() || createTask.isPending}>
              Create Task
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
