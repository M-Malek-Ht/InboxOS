import { useState, useEffect } from 'react';
import { Email } from '@/lib/types';
import { useClassifyEmail, useJob, useThread, useDeleteEmail, useUntrashEmail, usePermanentlyDeleteEmail } from '@/lib/api/hooks';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useQueryClient } from '@tanstack/react-query';
import { PriorityIndicator, JobStatus } from '@/components/ui/badges';
import { EmailDetailSkeleton } from '@/components/ui/skeletons';
import { Button } from '@/components/ui/button';
import { ReplyComposer } from './ReplyComposer';
import { toast } from 'sonner';
import {
  X,
  RotateCw,
  FileText,
  Sparkles,
  Send as SendIcon,
  Trash2,
  ArchiveRestore,
} from 'lucide-react';
import { motion } from 'framer-motion';

type EmailListData = { data: Email[]; total: number };

interface EmailDetailPanelProps {
  email: Email | null;
  isLoading?: boolean;
  onClose: () => void;
  mode?: 'inbox' | 'sent' | 'trash';
}

export function EmailDetailPanel({ email, isLoading, onClose, mode = 'inbox' }: EmailDetailPanelProps) {
  const queryClient = useQueryClient();
  const [classifyJobId, setClassifyJobId] = useState<string | null>(null);

  const classifyEmail = useClassifyEmail();
  const deleteEmail = useDeleteEmail();
  const untrashEmail = useUntrashEmail();
  const permanentlyDeleteEmail = usePermanentlyDeleteEmail();
  const { data: threadMessages } = useThread(mode === 'inbox' ? (email?.id ?? null) : null);

  const { data: classifyJob } = useJob(classifyJobId);

  useEffect(() => {
    setClassifyJobId(null);
  }, [email?.id]);

  useEffect(() => {
    if (classifyJob?.status === 'done') {
      if (email?.id && classifyJob.result) {
        const result = classifyJob.result as Record<string, unknown>;
        queryClient.setQueryData<Email>(['email', email.id], (old) =>
          old ? { ...old, ...result } : old,
        );
        queryClient.setQueriesData<EmailListData>({ queryKey: ['emails'] }, (old) => {
          if (!old?.data) return old;
          return {
            ...old,
            data: old.data.map((item) =>
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

  const handleClassify = async () => {
    if (!email) return;
    try {
      const result = await classifyEmail.mutateAsync(email.id);
      setClassifyJobId(result.jobId);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to start classification';
      toast.error(message);
    }
  };

  const handleDelete = async () => {
    if (!email) return;
    try {
      await deleteEmail.mutateAsync(email.id);
      toast.success('Email moved to trash');
      onClose();
    } catch {
      toast.error('Failed to delete email');
    }
  };

  const handleUntrash = async () => {
    if (!email) return;
    try {
      await untrashEmail.mutateAsync(email.id);
      toast.success('Email restored to inbox');
      onClose();
    } catch {
      toast.error('Failed to restore email');
    }
  };

  const handlePermanentDelete = async () => {
    if (!email) return;
    try {
      await permanentlyDeleteEmail.mutateAsync(email.id);
      toast.success('Email permanently deleted');
      onClose();
    } catch {
      toast.error('Failed to permanently delete email');
    }
  };

  if (!email && !isLoading) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Select an email to view details</p>
          <p className="text-sm mt-1">Use arrow keys or j/k to navigate</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <EmailDetailSkeleton />;
  }

  if (!email) return null;

  const receivedDate = new Date(email.receivedAt);
  const priorityLabel =
    email.priorityScore === undefined
      ? null
      : email.priorityScore >= 80
        ? 'High'
        : email.priorityScore >= 50
          ? 'Med'
          : 'Low';

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.2 }}
      className="h-full flex flex-col"
    >
      <div className="p-6 border-b border-border">
        <div className="flex items-start justify-between gap-4 mb-4">
          <h2 className="text-xl font-semibold text-foreground leading-tight">
            {email.subject}
          </h2>
          <div className="flex items-center gap-1 flex-shrink-0">
            {mode === 'trash' && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleUntrash}
                  disabled={untrashEmail.isPending || permanentlyDeleteEmail.isPending}
                  title="Restore to inbox"
                  className="text-muted-foreground hover:text-green-600"
                >
                  <ArchiveRestore className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handlePermanentDelete}
                  disabled={permanentlyDeleteEmail.isPending || untrashEmail.isPending}
                  title="Delete permanently"
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-5 w-5" />
                </Button>
              </>
            )}
            {mode === 'inbox' && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDelete}
                disabled={deleteEmail.isPending}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-5 w-5" />
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
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

        <div className="flex items-center flex-wrap gap-2">
          {priorityLabel && email.priorityScore !== undefined && (
            <PriorityIndicator
              priority={priorityLabel}
              score={email.priorityScore}
              showLabel
            />
          )}

          {classifyJobId && (
            <JobStatus status={classifyJob?.status || 'queued'} />
          )}
        </div>

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

      {mode === 'inbox' && (
        <div className="p-4 border-b border-border flex flex-wrap items-center gap-2">
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
          <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
            <FileText className="h-4 w-4" />
            AI draft now lives directly under this email
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto min-h-0">
        {threadMessages && threadMessages.length > 1 ? (
          <div className="divide-y divide-border">
            {threadMessages.map((msg) => {
              const isFromSender = !msg.isSent;
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

      {mode === 'inbox' && (
        <ReplyComposer
          email={email}
          onSent={() => {
            setTimeout(() => {
              queryClient.invalidateQueries({ queryKey: ['thread', email.id] });
            }, 1500);
            setTimeout(() => {
              queryClient.invalidateQueries({ queryKey: ['thread', email.id] });
            }, 4000);
          }}
        />
      )}
    </motion.div>
  );
}
