import { useState, useCallback } from 'react';
import { Email, Category } from '@/lib/types';
import { useEmails, useMarkEmailRead } from '@/lib/api/hooks';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { CategoryBadge, PriorityIndicator } from '@/components/ui/badges';
import { EmailListSkeleton } from '@/components/ui/skeletons';
import { EmptyInbox } from '@/components/ui/empty-states';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Search, Filter, Mail, MailOpen, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface InboxListProps {
  selectedId?: string;
  onSelect: (email: Email) => void;
}

type FilterType = 'all' | 'unread' | 'needsReply' | 'highPriority' | Category;

const filters: { value: FilterType; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'unread', label: 'Unread' },
  { value: 'needsReply', label: 'Needs Reply' },
  { value: 'highPriority', label: 'High Priority' },
  { value: 'Meetings', label: 'Meetings' },
  { value: 'Work', label: 'Work' },
  { value: 'Personal', label: 'Personal' },
  { value: 'Bills', label: 'Bills' },
  { value: 'Newsletters', label: 'Newsletters' },
  { value: 'Support', label: 'Support' },
];

export function InboxList({ selectedId, onSelect }: InboxListProps) {
  const [filter, setFilter] = useState<FilterType>('all');
  const [search, setSearch] = useState('');

  const { data, isLoading, error } = useEmails({
    filter: filter === 'all' ? undefined : filter,
    search: search || undefined,
  });
  const markRead = useMarkEmailRead();

  const handleSelect = useCallback((email: Email) => {
    if (!email.isRead) {
      markRead.mutate({ id: email.id, isRead: true });
    }
    onSelect(email);
  }, [onSelect, markRead]);

  const activeFilter = filters.find(f => f.value === filter);

  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-destructive">
        <AlertCircle className="mr-2 h-5 w-5" />
        Error loading emails
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Filters Bar */}
      <div className="p-4 border-b border-border space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search emails..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-muted/50 border-transparent focus:bg-background focus:border-input"
          />
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="h-4 w-4" />
                {activeFilter?.label || 'Filter'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuLabel>Filter by</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {filters.map((f) => (
                <DropdownMenuItem
                  key={f.value}
                  onClick={() => setFilter(f.value)}
                  className={cn(filter === f.value && 'bg-accent')}
                >
                  {f.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          {filter !== 'all' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFilter('all')}
              className="text-muted-foreground"
            >
              Clear
            </Button>
          )}
          {data && (
            <span className="ml-auto text-sm text-muted-foreground">
              {data.total} email{data.total !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Email List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <EmailListSkeleton />
        ) : data && data.data.length > 0 ? (
          <AnimatePresence mode="popLayout">
            <div className="divide-y divide-border">
              {data.data.map((email, index) => (
                <motion.div
                  key={email.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ delay: index * 0.02 }}
                >
                  <EmailListItem
                    email={email}
                    isSelected={email.id === selectedId}
                    onClick={() => handleSelect(email)}
                  />
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        ) : (
          <EmptyInbox />
        )}
      </div>
    </div>
  );
}

interface EmailListItemProps {
  email: Email;
  isSelected: boolean;
  onClick: () => void;
}

function EmailListItem({ email, isSelected, onClick }: EmailListItemProps) {
  const timeAgo = formatDistanceToNow(new Date(email.receivedAt), { addSuffix: true });

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left p-4 transition-all duration-150',
        'border-l-2 border-l-transparent',
        'hover:bg-accent/50 hover:border-l-primary/40',
        isSelected && 'bg-accent border-l-primary',
        !email.isRead && 'bg-primary/10'
      )}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className={cn(
          'w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0',
          email.isRead ? 'bg-muted text-muted-foreground' : 'bg-primary text-primary-foreground'
        )}>
          {email.fromName.charAt(0).toUpperCase()}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={cn(
              'font-medium truncate',
              !email.isRead && 'font-semibold'
            )}>
              {email.fromName}
            </span>
            <span className="text-xs text-muted-foreground flex-shrink-0">{timeAgo}</span>
          </div>
          <div className={cn(
            'text-sm truncate mb-1',
            email.isRead ? 'text-muted-foreground' : 'text-foreground font-medium'
          )}>
            {email.subject}
          </div>
          <div className="text-xs text-muted-foreground truncate">{email.snippet}</div>

          {/* Tags row */}
          <div className="flex items-center gap-2 mt-2">
            {!email.isRead && (
              <Mail className="h-3 w-3 text-primary" />
            )}
            {email.category && <CategoryBadge category={email.category} />}
            {email.priorityScore && email.priorityScore >= 80 && (
              <PriorityIndicator priority="High" score={email.priorityScore} />
            )}
            {email.needsReply && (
              <span className="text-xs text-priority-med font-medium">
                Needs Reply
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}
