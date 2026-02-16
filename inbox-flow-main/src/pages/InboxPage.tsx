import { useState, useCallback } from 'react';
import { Email } from '@/lib/types';
import { InboxList } from '@/components/inbox/InboxList';
import { EmailDetailPanel } from '@/components/inbox/EmailDetailPanel';
import { DraftEditor } from '@/components/drafts/DraftEditor';
import { useEmail } from '@/lib/api/hooks';
import { AnimatePresence } from 'framer-motion';
import { PageTransition } from '@/components/PageTransition';

export default function InboxPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showDraftEditor, setShowDraftEditor] = useState(false);
  
  const { data: selectedEmail, isLoading } = useEmail(selectedId);

  const handleSelect = useCallback((email: Email) => {
    setSelectedId(email.id);
    setShowDraftEditor(false);
  }, []);

  const handleClose = useCallback(() => {
    setSelectedId(null);
    setShowDraftEditor(false);
  }, []);

  return (
    <PageTransition>
    <div className="h-[calc(100vh-3.5rem)] flex">
      {/* Email List */}
      <div className="w-96 flex-shrink-0 border-r border-border overflow-hidden">
        <InboxList selectedId={selectedId || undefined} onSelect={handleSelect} />
      </div>

      {/* Detail Panel */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {showDraftEditor && selectedEmail ? (
            <DraftEditor
              key="draft"
              email={selectedEmail}
              onClose={() => setShowDraftEditor(false)}
            />
          ) : (
            <EmailDetailPanel
              key="detail"
              email={selectedEmail || null}
              isLoading={isLoading}
              onClose={handleClose}
              onGenerateDraft={() => setShowDraftEditor(true)}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
    </PageTransition>
  );
}
