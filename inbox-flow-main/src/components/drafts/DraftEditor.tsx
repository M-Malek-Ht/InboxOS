import { useState, useCallback, useEffect } from 'react';
import { Email, Tone, Length } from '@/lib/types';
import { useDrafts, useGenerateDraft, useJob } from '@/lib/api/hooks';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { JobStatus } from '@/components/ui/badges';
import { Skeleton } from '@/components/ui/skeletons';
import { toast } from 'sonner';
import {
  X,
  RefreshCw,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DraftEditorProps {
  email: Email;
  onClose: () => void;
}

const tones: Tone[] = ['Professional', 'Friendly', 'Short', 'Firm', 'Apologetic'];
const lengths: Length[] = ['Short', 'Medium', 'Detailed'];

export function DraftEditor({ email, onClose }: DraftEditorProps) {
  const [selectedTone, setSelectedTone] = useState<Tone>('Professional');
  const [selectedLength, setSelectedLength] = useState<Length>('Medium');
  const [instruction, setInstruction] = useState('');
  const [jobId, setJobId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const { data: drafts, isLoading: draftsLoading, refetch } = useDrafts(email.id);
  const generateDraft = useGenerateDraft();
  const { data: job } = useJob(jobId);

  const latestDraft = drafts?.[0];
  const [selectedVersion, setSelectedVersion] = useState<number>(latestDraft?.version || 1);

  // Update selected version when drafts load
  useEffect(() => {
    if (drafts && drafts.length > 0) {
      setSelectedVersion(drafts[0].version);
    }
  }, [drafts]);

  // Handle job completion
  useEffect(() => {
    if (job?.status === 'done') {
      toast.success('Draft generated!');
      refetch();
      setJobId(null);
    } else if (job?.status === 'failed') {
      toast.error(job.error ? `Draft generation failed: ${job.error}` : 'Draft generation failed');
      setJobId(null);
    }
  }, [job?.status, job?.error, refetch]);

  const handleGenerate = async () => {
    try {
      const result = await generateDraft.mutateAsync({
        emailId: email.id,
        request: {
          tone: selectedTone,
          length: selectedLength,
          instruction: instruction || undefined,
          // Send email context so backend can generate drafts for external emails
          emailFrom: email.fromName,
          emailSubject: email.subject,
          emailBody: email.bodyText,
        },
      });
      setJobId(result.jobId);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to start draft generation';
      toast.error(message);
    }
  };

  const selectedDraft = drafts?.find(d => d.version === selectedVersion);

  const handleCopy = () => {
    if (selectedDraft) {
      navigator.clipboard.writeText(selectedDraft.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const navigateVersion = (direction: 'prev' | 'next') => {
    if (!drafts) return;
    const currentIndex = drafts.findIndex(d => d.version === selectedVersion);
    if (direction === 'prev' && currentIndex < drafts.length - 1) {
      setSelectedVersion(drafts[currentIndex + 1].version);
    } else if (direction === 'next' && currentIndex > 0) {
      setSelectedVersion(drafts[currentIndex - 1].version);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="h-full flex flex-col"
    >
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Draft Reply</h3>
          <p className="text-sm text-muted-foreground truncate">Re: {email.subject}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Configuration */}
      <div className="p-4 border-b border-border space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-xs">Tone</Label>
            <Select value={selectedTone} onValueChange={(v) => setSelectedTone(v as Tone)}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {tones.map(tone => (
                  <SelectItem key={tone} value={tone}>{tone}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Length</Label>
            <Select value={selectedLength} onValueChange={(v) => setSelectedLength(v as Length)}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {lengths.map(length => (
                  <SelectItem key={length} value={length}>{length}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div>
          <Label className="text-xs">Additional Instructions (optional)</Label>
          <Textarea
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            placeholder="e.g., Mention the deadline is flexible, ask about their availability..."
            className="mt-1 resize-none"
            rows={2}
          />
        </div>

        <Button 
          onClick={handleGenerate} 
          disabled={!!jobId}
          className="w-full gap-2"
        >
          <Sparkles className={cn('h-4 w-4', jobId && 'animate-spin')} />
          {drafts && drafts.length > 0 ? 'Regenerate Draft' : 'Generate Draft'}
        </Button>

        {jobId && job && (
          <div className="flex items-center justify-center gap-2">
            <JobStatus status={job.status} />
          </div>
        )}
      </div>

      {/* Draft Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {draftsLoading ? (
          <div className="p-4 space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ) : drafts && drafts.length > 0 ? (
          <>
            {/* Version Navigation */}
            <div className="p-3 border-b border-border flex items-center justify-between bg-muted/30">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigateVersion('prev')}
                disabled={drafts.findIndex(d => d.version === selectedVersion) >= drafts.length - 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium">
                Version {selectedVersion} of {drafts.length}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigateVersion('next')}
                disabled={drafts.findIndex(d => d.version === selectedVersion) <= 0}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Draft Info */}
            {selectedDraft && (
              <div className="px-4 py-2 text-xs text-muted-foreground border-b border-border flex items-center gap-4">
                <span>{selectedDraft.tone} tone</span>
                <span>{selectedDraft.length}</span>
                <span className="ml-auto">
                  {format(new Date(selectedDraft.createdAt), 'MMM d, h:mm a')}
                </span>
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              <AnimatePresence mode="wait">
                {selectedDraft && (
                  <motion.div
                    key={selectedDraft.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="prose prose-sm prose-neutral dark:prose-invert max-w-none"
                  >
                    {selectedDraft.content.split('\n').map((line, i) => (
                      <p key={i} className={cn(!line && 'h-4')}>
                        {line}
                      </p>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Actions */}
            <div className="p-4 border-t border-border flex gap-2">
              <Button variant="outline" className="flex-1 gap-2" onClick={handleCopy}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Copied!' : 'Copy Draft'}
              </Button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground text-center p-4">
            <div>
              <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No drafts yet</p>
              <p className="text-sm mt-1">Click "Generate Draft" to create one</p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
