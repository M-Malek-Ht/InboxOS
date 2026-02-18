import { useState, useCallback } from 'react';
import { Email } from '@/lib/types';
import { useSentEmails, useEmail } from '@/lib/api/hooks';
import { EmailDetailPanel } from '@/components/inbox/EmailDetailPanel';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { EmailListSkeleton } from '@/components/ui/skeletons';
import { Input } from '@/components/ui/input';
import { Search, Send } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { PageTransition } from '@/components/PageTransition';

export default function SentPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const { data: emails, isLoading } = useSentEmails({
    search: search || undefined,
    limit: 40,
  });

  const { data: selectedEmail, isLoading: emailLoading } = useEmail(selectedId);

  const handleSelect = useCallback((email: Email) => {
    setSelectedId(email.id);
  }, []);

  const handleClose = useCallback(() => {
    setSelectedId(null);
  }, []);

  return (
    <PageTransition>
      <div className="h-[calc(100vh-3.5rem)] flex">
        {/* Email List */}
        <div className="w-96 flex-shrink-0 border-r border-border overflow-hidden">
          <div className="h-full flex flex-col">
            {/* Search */}
            <div className="p-4 border-b border-border">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search sent emails..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 bg-muted/50 border-transparent focus:bg-background focus:border-input"
                />
              </div>
              {emails && (
                <div className="mt-2 text-sm text-muted-foreground">
                  {emails.length} sent email{emails.length !== 1 ? 's' : ''}
                </div>
              )}
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <EmailListSkeleton />
              ) : emails && emails.length > 0 ? (
                <AnimatePresence mode="popLayout">
                  <div className="divide-y divide-border">
                    {emails.map((email: Email, index: number) => (
                      <motion.div
                        key={email.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ delay: index * 0.02 }}
                      >
                        <button
                          onClick={() => handleSelect(email)}
                          className={cn(
                            'w-full text-left p-4 transition-all duration-150',
                            'border-l-2 border-l-transparent',
                            'hover:bg-accent/50 hover:border-l-primary/40',
                            email.id === selectedId && 'bg-accent border-l-primary',
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-sm font-medium flex-shrink-0">
                              <Send className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium truncate text-sm text-muted-foreground">
                                  To: {email.fromName}
                                </span>
                                <span className="text-xs text-muted-foreground flex-shrink-0">
                                  {formatDistanceToNow(new Date(email.receivedAt), { addSuffix: true })}
                                </span>
                              </div>
                              <div className="text-sm truncate mb-1 text-muted-foreground">
                                {email.subject}
                              </div>
                              <div className="text-xs text-muted-foreground truncate">{email.snippet}</div>
                            </div>
                          </div>
                        </button>
                      </motion.div>
                    ))}
                  </div>
                </AnimatePresence>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <Send className="h-12 w-12 mb-4 opacity-50" />
                  <p>No sent emails</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Detail Panel */}
        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            <EmailDetailPanel
              key="detail"
              email={selectedEmail || null}
              isLoading={emailLoading}
              onClose={handleClose}
              mode="sent"
            />
          </AnimatePresence>
        </div>
      </div>
    </PageTransition>
  );
}
