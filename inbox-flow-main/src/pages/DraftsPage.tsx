import { useState, useMemo } from 'react';
import { useAllDrafts, useEmails, useEmail, useSendReply, useGenerateDraft, useJob, useDrafts } from '@/lib/api/hooks';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EmptyDrafts } from '@/components/ui/empty-states';
import { JobStatus } from '@/components/ui/badges';
import { toast } from 'sonner';
import {
  FileText,
  Send,
  Sparkles,
  Loader2,
  ChevronDown,
  ChevronUp,
  Mail,
} from 'lucide-react';
import { PageTransition } from '@/components/PageTransition';
import { motion, AnimatePresence } from 'framer-motion';
import { Tone, Length } from '@/lib/types';

const tones: Tone[] = ['Professional', 'Friendly', 'Short', 'Firm', 'Apologetic'];
const lengths: Length[] = ['Short', 'Medium', 'Detailed'];

export default function DraftsPage() {
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const [showRegenerate, setShowRegenerate] = useState(false);
  const [regenTone, setRegenTone] = useState<Tone>('Professional');
  const [regenLength, setRegenLength] = useState<Length>('Medium');
  const [jobId, setJobId] = useState<string | null>(null);

  const { data: allDrafts, refetch: refetchDrafts } = useAllDrafts();
  const { data: emailsData } = useEmails({ limit: 50 });
  const { data: selectedEmail } = useEmail(selectedEmailId);
  const sendReply = useSendReply();
  const generateDraft = useGenerateDraft();
  const { data: job } = useJob(jobId);
  const { refetch: refetchEmailDrafts } = useDrafts(selectedEmailId);

  // Handle job completion
  if (job?.status === 'done' && jobId) {
    setJobId(null);
    refetchDrafts();
    refetchEmailDrafts();
    toast.success('Draft regenerated!');
  } else if (job?.status === 'failed' && jobId) {
    setJobId(null);
    toast.error('Draft generation failed');
  }

  // Match drafts to emails
  const emailsWithDrafts = useMemo(() => {
    if (!allDrafts || !emailsData?.data) return [];
    const draftByEmailId = new Map(allDrafts.map((d: any) => [d.emailId, d]));
    return emailsData.data
      .filter((e) => draftByEmailId.has(e.id))
      .map((e) => ({ ...e, draft: draftByEmailId.get(e.id) }));
  }, [allDrafts, emailsData]);

  const selectedDraft = useMemo(() => {
    if (!allDrafts || !selectedEmailId) return null;
    return allDrafts.find((d: any) => d.emailId === selectedEmailId) ?? null;
  }, [allDrafts, selectedEmailId]);

  const handleSend = async () => {
    if (!selectedEmailId || !selectedDraft) return;
    try {
      await sendReply.mutateAsync({
        emailId: selectedEmailId,
        body: selectedDraft.content,
        draftId: selectedDraft.id,
      });
      toast.success('Reply sent!');
      refetchDrafts();
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to send';
      toast.error(msg);
    }
  };

  const handleRegenerate = async () => {
    if (!selectedEmail) return;
    try {
      const result = await generateDraft.mutateAsync({
        emailId: selectedEmail.id,
        request: {
          tone: regenTone,
          length: regenLength,
          emailFrom: selectedEmail.fromName,
          emailSubject: selectedEmail.subject,
          emailBody: selectedEmail.bodyText,
        },
      });
      setJobId(result.jobId);
    } catch {
      toast.error('Failed to start generation');
    }
  };

  return (
    <PageTransition>
      <div className="h-[calc(100vh-3.5rem)] flex">
        {/* Left panel — draft list */}
        <div className="w-96 flex-shrink-0 border-r border-border overflow-y-auto">
          <div className="p-4 border-b border-border">
            <h1 className="text-lg font-semibold">Drafts</h1>
            <p className="text-sm text-muted-foreground">Auto-generated replies ready to review</p>
          </div>

          {emailsWithDrafts.length === 0 ? (
            <div className="p-6">
              <EmptyDrafts />
            </div>
          ) : (
            <div className="divide-y divide-border">
              {emailsWithDrafts.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setSelectedEmailId(item.id);
                    setShowRegenerate(false);
                  }}
                  className={cn(
                    'w-full text-left p-4 transition-colors hover:bg-muted/50',
                    selectedEmailId === item.id && 'bg-muted',
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium truncate">{item.fromName}</span>
                    <span className="text-xs text-muted-foreground ml-auto flex-shrink-0">
                      {item.draft?.createdAt && format(new Date(item.draft.createdAt), 'MMM d')}
                    </span>
                  </div>
                  <div className="text-sm text-foreground truncate mb-1">{item.subject}</div>
                  <div className="text-xs text-muted-foreground line-clamp-2">
                    {item.draft?.content}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right panel — email + draft detail */}
        <div className="flex-1 overflow-hidden">
          {selectedEmail && selectedDraft ? (
            <motion.div
              key={selectedEmailId}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
              className="h-full flex flex-col"
            >
              {/* Original email header */}
              <div className="border-b border-border p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-medium text-sm">
                    {selectedEmail.fromName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{selectedEmail.fromName}</div>
                    <div className="text-xs text-muted-foreground truncate">{selectedEmail.fromEmail}</div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {format(new Date(selectedEmail.receivedAt), 'MMM d, h:mm a')}
                  </div>
                </div>
                <h2 className="text-base font-semibold">{selectedEmail.subject}</h2>
              </div>

              {/* Scrollable content: email body + draft */}
              <div className="flex-1 overflow-y-auto min-h-0">
                {/* Original email body */}
                <div className="p-5 border-b border-border">
                  <div className="flex items-center gap-2 mb-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Original Email
                    </span>
                  </div>
                  <div className="prose prose-sm prose-neutral dark:prose-invert max-w-none">
                    {selectedEmail.bodyText.split('\n').map((line: string, i: number) => (
                      <p key={i} className={cn(!line && 'h-3')}>
                        {line}
                      </p>
                    ))}
                  </div>
                </div>

                {/* Draft response */}
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span className="text-xs font-medium text-primary uppercase tracking-wider">
                      AI Draft Reply
                    </span>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {selectedDraft.tone} / {selectedDraft.length}
                    </span>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/30 p-4">
                    <div className="prose prose-sm prose-neutral dark:prose-invert max-w-none">
                      {selectedDraft.content.split('\n').map((line: string, i: number) => (
                        <p key={i} className={cn(!line && 'h-3')}>
                          {line}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action bar */}
              <div className="border-t border-border p-4 flex items-center gap-3 flex-shrink-0">
                <Button
                  onClick={handleSend}
                  disabled={sendReply.isPending}
                  className="gap-2"
                >
                  {sendReply.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Send Reply
                    </>
                  )}
                </Button>

                <button
                  onClick={() => setShowRegenerate(!showRegenerate)}
                  className={cn(
                    'flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-md transition-colors',
                    showRegenerate
                      ? 'text-primary bg-primary/10'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
                  )}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Regenerate
                  {showRegenerate ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </button>

                <AnimatePresence>
                  {showRegenerate && (
                    <motion.div
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      className="flex items-center gap-2 overflow-hidden"
                    >
                      <Select value={regenTone} onValueChange={(v) => setRegenTone(v as Tone)}>
                        <SelectTrigger className="h-8 text-xs w-28">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {tones.map((t) => (
                            <SelectItem key={t} value={t}>{t}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={regenLength} onValueChange={(v) => setRegenLength(v as Length)}>
                        <SelectTrigger className="h-8 text-xs w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {lengths.map((l) => (
                            <SelectItem key={l} value={l}>{l}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleRegenerate}
                        disabled={!!jobId}
                        className="gap-1.5 h-8 text-xs"
                      >
                        <Sparkles className={cn('h-3 w-3', jobId && 'animate-spin')} />
                        Go
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {jobId && job && (
                  <div className="ml-auto">
                    <JobStatus status={job.status as 'queued' | 'processing' | 'done' | 'failed'} />
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select a draft to review</p>
                <p className="text-sm mt-1">Drafts are auto-generated for emails that need replies</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
