import { useState, useRef, useEffect, useCallback } from 'react';
import { Email, Tone, Length } from '@/lib/types';
import { useSendReply, useGenerateDraft, useJob, useDrafts } from '@/lib/api/hooks';
import { useModKey } from '@/lib/hooks/useOS';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { JobStatus } from '@/components/ui/badges';
import { toast } from 'sonner';
import {
  Send,
  X,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ReplyComposerProps {
  email: Email;
  onSent: () => void;
  onClose: () => void;
}

const tones: Tone[] = ['Professional', 'Friendly', 'Short', 'Firm', 'Apologetic'];
const lengths: Length[] = ['Short', 'Medium', 'Detailed'];

export function ReplyComposer({ email, onSent, onClose }: ReplyComposerProps) {
  const [content, setContent] = useState('');
  const [showAiAssist, setShowAiAssist] = useState(false);
  const [selectedTone, setSelectedTone] = useState<Tone>('Professional');
  const [selectedLength, setSelectedLength] = useState<Length>('Medium');
  const [jobId, setJobId] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const modKey = useModKey();

  const sendReply = useSendReply();
  const generateDraft = useGenerateDraft();
  const { data: job } = useJob(jobId);
  const { data: drafts, refetch: refetchDrafts } = useDrafts(email.id);

  // Auto-focus textarea on mount
  useEffect(() => {
    setTimeout(() => textareaRef.current?.focus(), 100);
  }, []);

  // Auto-resize textarea
  const autoResize = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 144)}px`; // max ~6 rows
  }, []);

  useEffect(() => {
    autoResize();
  }, [content, autoResize]);

  // Handle AI draft completion
  useEffect(() => {
    if (job?.status === 'done') {
      refetchDrafts().then(({ data }) => {
        if (data && data.length > 0) {
          setContent(data[0].content);
        }
      });
      setJobId(null);
      toast.success('AI draft ready — edit and send!');
    } else if (job?.status === 'failed') {
      toast.error('Draft generation failed');
      setJobId(null);
    }
  }, [job?.status, refetchDrafts]);

  const handleGenerate = async () => {
    try {
      const result = await generateDraft.mutateAsync({
        emailId: email.id,
        request: {
          tone: selectedTone,
          length: selectedLength,
          emailFrom: email.fromName,
          emailSubject: email.subject,
          emailBody: email.bodyText,
        },
      });
      setJobId(result.jobId);
    } catch {
      toast.error('Failed to start AI generation');
    }
  };

  const handleSend = async () => {
    if (!content.trim() || sendReply.isPending) return;
    try {
      await sendReply.mutateAsync({ emailId: email.id, body: content.trim() });
      setSent(true);
      toast.success('Reply sent!');
      setTimeout(() => onSent(), 1200);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to send reply';
      toast.error(message);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  if (sent) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="border-t border-border bg-status-done/5 p-6 flex items-center justify-center gap-3"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          <CheckCircle2 className="h-6 w-6 text-status-done" />
        </motion.div>
        <span className="font-medium text-status-done">Reply sent successfully</span>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      className="border-t-2 border-primary/30 bg-muted/30 max-h-[50vh] overflow-y-auto flex-shrink-0"
    >
      {/* Header */}
      <div className="px-4 pt-2 pb-1 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
            <Send className="h-3 w-3 text-primary" />
          </div>
          <span className="text-sm font-medium text-foreground">
            Reply to {email.fromName}
          </span>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Textarea */}
      <div className="px-4 pb-1">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Write your reply..."
          rows={2}
          className={cn(
            'w-full resize-none rounded-lg border border-border bg-background px-3 py-2.5',
            'text-sm text-foreground placeholder:text-muted-foreground',
            'focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50',
            'transition-all duration-150',
          )}
        />
      </div>

      {/* AI Assist Toggle */}
      <div className="px-4 pb-1">
        <button
          onClick={() => setShowAiAssist(!showAiAssist)}
          className={cn(
            'flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-md transition-colors',
            showAiAssist
              ? 'text-primary bg-primary/10'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
          )}
        >
          <Sparkles className="h-3 w-3" />
          AI Assist
          {showAiAssist ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>

        <AnimatePresence>
          {showAiAssist && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="pt-3 pb-1 flex items-end gap-3">
                <div className="flex-1 grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-[11px] text-muted-foreground">Tone</Label>
                    <Select value={selectedTone} onValueChange={(v) => setSelectedTone(v as Tone)}>
                      <SelectTrigger className="h-8 text-xs mt-0.5">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {tones.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-[11px] text-muted-foreground">Length</Label>
                    <Select value={selectedLength} onValueChange={(v) => setSelectedLength(v as Length)}>
                      <SelectTrigger className="h-8 text-xs mt-0.5">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {lengths.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleGenerate}
                  disabled={!!jobId}
                  className="gap-1.5 h-8 text-xs"
                >
                  <Sparkles className={cn('h-3 w-3', jobId && 'animate-spin')} />
                  Generate
                </Button>
              </div>

              {jobId && job && (
                <div className="flex items-center justify-center gap-2 py-2">
                  <JobStatus status={job.status} />
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer / Send */}
      <div className="px-4 pb-2 flex items-center justify-between">
        <span className="text-[11px] text-muted-foreground">
          {modKey}+Enter to send
        </span>
        <Button
          size="sm"
          onClick={handleSend}
          disabled={!content.trim() || sendReply.isPending}
          className="gap-2 min-w-[100px]"
        >
          {sendReply.isPending ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send className="h-3.5 w-3.5" />
              Send Reply
            </>
          )}
        </Button>
      </div>
    </motion.div>
  );
}
