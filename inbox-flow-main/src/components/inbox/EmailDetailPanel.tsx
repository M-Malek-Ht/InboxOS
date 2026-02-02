import { useState, useEffect } from 'react';
import { Email } from '@/lib/types';
import { useClassifyEmail, useJob, useCreateTask, useExtractDates, useGenerateDraft } from '@/lib/api/hooks';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, format } from 'date-fns';
import { CategoryBadge, PriorityIndicator, JobStatus } from '@/components/ui/badges';
import { EmailDetailSkeleton } from '@/components/ui/skeletons';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  X,
  RotateCw,
  CheckSquare,
  Calendar,
  FileText,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { motion } from 'framer-motion';

interface EmailDetailPanelProps {
  email: Email | null;
  isLoading?: boolean;
  onClose: () => void;
  onGenerateDraft: () => void;
}

export function EmailDetailPanel({ email, isLoading, onClose, onGenerateDraft }: EmailDetailPanelProps) {
  const [classifyJobId, setClassifyJobId] = useState<string | null>(null);
  const [extractJobId, setExtractJobId] = useState<string | null>(null);

  const classifyEmail = useClassifyEmail();
  const createTask = useCreateTask();
  const extractDates = useExtractDates();
  
  const { data: classifyJob } = useJob(classifyJobId);
  const { data: extractJob } = useJob(extractJobId);

  // Reset job IDs when email changes
  useEffect(() => {
    setClassifyJobId(null);
    setExtractJobId(null);
  }, [email?.id]);

  // Handle classify job completion
  useEffect(() => {
    if (classifyJob?.status === 'done') {
      toast.success('Email classified successfully');
      setClassifyJobId(null);
    } else if (classifyJob?.status === 'failed') {
      toast.error('Classification failed');
      setClassifyJobId(null);
    }
  }, [classifyJob?.status]);

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
            <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
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
          size="sm"
          onClick={onGenerateDraft}
          className="gap-2 ml-auto"
        >
          <FileText className="h-4 w-4" />
          Generate Reply
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Email Body */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="prose prose-sm dark:prose-invert max-w-none">
          {email.bodyText.split('\n').map((paragraph, i) => (
            <p key={i} className={cn(!paragraph && 'h-4')}>
              {paragraph}
            </p>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
