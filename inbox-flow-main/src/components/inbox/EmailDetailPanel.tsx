import { useState, useEffect } from 'react';
import { Email } from '@/lib/types';
import { useClassifyEmail, useJob, useCreateTask, useExtractDates, useGenerateDraft, useThread } from '@/lib/api/hooks';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, format } from 'date-fns';
import { useQueryClient } from '@tanstack/react-query';
import { CategoryBadge, PriorityIndicator, JobStatus } from '@/components/ui/badges';
import { EmailDetailSkeleton } from '@/components/ui/skeletons';
import { Button } from '@/components/ui/button';
import { ReplyComposer } from './ReplyComposer';
import { toast } from 'sonner';
import {
  X,
  RotateCw,
  CheckSquare,
  Calendar,
  FileText,
  ArrowRight,
  Reply,
  Sparkles,
  Send as SendIcon,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface EmailDetailPanelProps {
  email: Email | null;
  isLoading?: boolean;
  onClose: () => void;
  onGenerateDraft: () => void;
}

export function EmailDetailPanel({ email, isLoading, onClose, onGenerateDraft }: EmailDetailPanelProps) {
  const queryClient = useQueryClient();
  const [classifyJobId, setClassifyJobId] = useState<string | null>(null);
  const [extractJobId, setExtractJobId] = useState<string | null>(null);
  const [showReply, setShowReply] = useState(false);

  const classifyEmail = useClassifyEmail();
  const createTask = useCreateTask();
  const extractDates = useExtractDates();
  const { data: threadMessages } = useThread(email?.id ?? null);

  const { data: classifyJob } = useJob(classifyJobId);
  const { data: extractJob } = useJob(extractJobId);

  // Reset state when email changes
  useEffect(() => {
    setClassifyJobId(null);
    setExtractJobId(null);
    setShowReply(false);
  }, [email?.id]);

  // Handle classify job completion
  useEffect(() => {
    if (classifyJob?.status === 'done') {
      if (email?.id && classifyJob.result) {
        const result = classifyJob.result as Record<string, unknown>;
        queryClient.setQueryData(['email', email.id], (old: any) =>
          old ? { ...old, ...result } : old,
        );
        queryClient.setQueriesData({ queryKey: ['emails'] }, (old: any) => {
          if (!old?.data) return old;
          return {
            ...old,
            data: old.data.map((item: any) =>
              item.id === email.id ? { ...item, ...result } : item,
            ),
          };
        });
      }
      queryClient.invalidateQueries({ queryKey: ['emails'] });
      if (email?.id) {
        queryClient.invalidateQueries({ queryKey: ['email', email.id] });
      }
      toast.success('Email classified successfully');
      setClassifyJobId(null);
    } else if (classifyJob?.status === 'failed') {
      toast.error(classifyJob.error ? `Classification failed: ${classifyJob.error}` : 'Classification failed');
      setClassifyJobId(null);
    }
  }, [classifyJob?.status, classifyJob?.result, classifyJob?.error, email?.id, queryClient]);

  // Handle extract dates job completion
  useEffect(() => {
    if (extractJob?.status === 'done') {
      toast.success('Dates extracted! Check calendar for suggested event.');
      setExtractJobId(null);
    } else if (extractJob?.status === 'failed') {
      toast.error('Date extraction failed');
      setExtractJobId(null);
    }
  }, [extractJob?.status]);

  const handleClassify = async () => {
    if (!email) return;
    const result = await classifyEmail.mutateAsync(email.id);
    setClassifyJobId(result.jobId);
  };

  const handleCreateTask = async () => {
    if (!email) return;
    await createTask.mutateAsync({
      emailId: email.id,
      title: `Follow up: ${email.subject}`,
      description: email.snippet,
      priority: email.priorityScore && email.priorityScore >= 80 ? 'High' : 'Med',
    });
    toast.success('Task created');
  };

  const handleExtractDates = async () => {
    if (!email) return;
    const result = await extractDates.mutateAsync(email.id);
    setExtractJobId(result.jobId);
  };

  if (!email && !isLoading) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Select an email to view details</p>
          <p className="text-sm mt-1">Use ↑↓ or j/k to navigate</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <EmailDetailSkeleton />;
  }

  if (!email) return null;

  const receivedDate = new Date(email.receivedAt);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.2 }}
      className="h-full flex flex-col"
    >
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-start justify-between gap-4 mb-4">
          <h2 className="text-xl font-semibold text-foreground leading-tight">
            {email.subject}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="flex-shrink-0">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-medium">
            {email.fromName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="font-medium">{email.fromName}</div>
            <div className="text-sm text-muted-foreground">{email.fromEmail}</div>
          </div>
          <div className="ml-auto text-sm text-muted-foreground">
            {format(receivedDate, 'MMM d, yyyy h:mm a')}
          </div>
        </div>

        {/* Classification info */}
        <div className="flex items-center flex-wrap gap-2">
          {email.category && <CategoryBadge category={email.category} />}
          {email.priorityScore !== undefined && (
            <PriorityIndicator 
              priority={email.priorityScore >= 80 ? 'High' : email.priorityScore >= 50 ? 'Med' : 'Low'} 
              score={email.priorityScore}
              showLabel
            />
          )}
          {email.needsReply && (
            <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-priority-med/15 text-priority-med">
              Needs Reply
            </span>
          )}
          {email.tags.map(tag => (
            <span 
              key={tag}
              className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-muted text-muted-foreground"
            >
              {tag}
            </span>
          ))}
          
          {(classifyJobId || extractJobId) && (
            <JobStatus status={classifyJob?.status || extractJob?.status || 'queued'} />
          )}
        </div>

        {/* Summary */}
        {email.summary && (
          <div className="mt-4 p-3 rounded-lg bg-muted/50 border border-border">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-1">
              <Sparkles className="h-3 w-3" />
              AI Summary
            </div>
            <p className="text-sm text-foreground">{email.summary}</p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="p-4 border-b border-border flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleClassify}
          disabled={!!classifyJobId}
          className="gap-2"
        >
          <RotateCw className={cn('h-4 w-4', classifyJobId && 'animate-spin')} />
          Re-classify
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleCreateTask}
          disabled={createTask.isPending}
          className="gap-2"
        >
          <CheckSquare className="h-4 w-4" />
          Create Task
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExtractDates}
          disabled={!!extractJobId}
          className="gap-2"
        >
          <Calendar className={cn('h-4 w-4', extractJobId && 'animate-spin')} />
          Extract Dates
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onGenerateDraft}
          className="gap-2"
        >
          <FileText className="h-4 w-4" />
          Full Editor
          <ArrowRight className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          onClick={() => setShowReply(true)}
          disabled={showReply}
          className="gap-2 ml-auto"
        >
          <Reply className="h-4 w-4" />
          Reply
        </Button>
      </div>

      {/* Conversation Thread */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {threadMessages && threadMessages.length > 1 ? (
          <div className="divide-y divide-border">
            {threadMessages.map((msg: any) => {
              // If the message's from matches the original email's from, it's from the sender
              // Otherwise it's from the current user (a sent reply)
              const isFromSender = msg.fromEmail?.toLowerCase() === email.fromEmail?.toLowerCase();
              return (
                <div
                  key={msg.id}
                  className={cn(
                    'px-6 py-4',
                    !isFromSender && 'bg-primary/[0.03]',
                  )}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className={cn(
                      'w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium',
                      isFromSender
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    )}>
                      {isFromSender ? (
                        msg.fromName.charAt(0).toUpperCase()
                      ) : (
                        <SendIcon className="h-3 w-3" />
                      )}
                    </div>
                    <span className="text-sm font-medium">
                      {isFromSender ? msg.fromName : 'You'}
                    </span>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {format(new Date(msg.receivedAt), 'MMM d, h:mm a')}
                    </span>
                  </div>
                  <div className="pl-9 prose prose-sm prose-neutral dark:prose-invert max-w-none">
                    {(msg.bodyText || '').split('\n').map((line: string, i: number) => (
                      <p key={i} className={cn(!line && 'h-3')}>
                        {line}
                      </p>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-6">
            <div className="prose prose-sm prose-neutral dark:prose-invert max-w-none">
              {email.bodyText.split('\n').map((paragraph, i) => (
                <p key={i} className={cn(!paragraph && 'h-4')}>
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Reply Composer */}
      <AnimatePresence>
        {showReply && (
          <ReplyComposer
            email={email}
            onSent={() => {
              setShowReply(false);
              queryClient.invalidateQueries({ queryKey: ['thread', email.id] });
            }}
            onClose={() => setShowReply(false)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
