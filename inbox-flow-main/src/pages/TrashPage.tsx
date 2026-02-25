import { useState, useCallback } from 'react';
import { Email } from '@/lib/types';
import { useTrashEmails } from '@/lib/api/hooks';
import { EmailDetailPanel } from '@/components/inbox/EmailDetailPanel';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { EmailListSkeleton } from '@/components/ui/skeletons';
import { Input } from '@/components/ui/input';
import { Search, Trash2, AlertTriangle, AlertCircle } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { PageTransition } from '@/components/PageTransition';

export default function TrashPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const { data: emails, isLoading, error } = useTrashEmails({
    search: search || undefined,
    limit: 40,
  });

  const selectedEmail = emails?.find((e: Email) => e.id === selectedId) ?? null;

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
            {/* Search + Banner */}
            <div className="p-4 border-b border-border space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search trash..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 bg-muted/50 border-transparent focus:bg-background focus:border-input"
                />
              </div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 border border-border text-xs text-muted-foreground">
                <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                <span>Emails in trash are automatically deleted after 30 days</span>
              </div>
              {emails && (
                <div className="text-sm text-muted-foreground">
                  {emails.length} email{emails.length !== 1 ? 's' : ''} in trash
                </div>
              )}
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <EmailListSkeleton />
              ) : error ? (
                <div className="flex flex-col items-center justify-center h-full text-destructive gap-2">
                  <AlertCircle className="h-8 w-8 opacity-70" />
                  <p className="text-sm">Failed to load trash</p>
                </div>
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
                              {email.fromName.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium truncate">
                                  {email.fromName}
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
                  <Trash2 className="h-12 w-12 mb-4 opacity-50" />
                  <p>Trash is empty</p>
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
              email={selectedEmail}
              isLoading={false}
              onClose={handleClose}
              mode="trash"
            />
          </AnimatePresence>
        </div>
      </div>
    </PageTransition>
  );
}
