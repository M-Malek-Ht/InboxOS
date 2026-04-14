import { useState, useCallback, useEffect } from 'react';
import { Email } from '@/lib/types';
import { InboxList } from '@/components/inbox/InboxList';
import { EmailDetailPanel } from '@/components/inbox/EmailDetailPanel';
import { useEmail, useEmails, useAutoClassify } from '@/lib/api/hooks';
import { AnimatePresence } from 'framer-motion';
import { PageTransition } from '@/components/PageTransition';
import { useLocation, useNavigate } from 'react-router-dom';

export default function InboxPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  const { data: emailsData } = useEmails({ limit: 40 });
  useAutoClassify(emailsData?.data);

  const { data: selectedEmail, isLoading } = useEmail(selectedId);

  const routeSelectedId = (location.state as { selectedEmailId?: string } | null)?.selectedEmailId;

  useEffect(() => {
    if (!routeSelectedId || routeSelectedId === selectedId) return;

    setSelectedId(routeSelectedId);
    navigate(location.pathname, { replace: true, state: {} });
  }, [routeSelectedId, selectedId, navigate, location.pathname]);

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
        <InboxList selectedId={selectedId || undefined} onSelect={handleSelect} />
      </div>

      {/* Detail Panel */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          <EmailDetailPanel
            key={selectedEmail?.id || 'detail'}
            email={selectedEmail || null}
            isLoading={isLoading}
            onClose={handleClose}
          />
        </AnimatePresence>
      </div>
    </div>
    </PageTransition>
  );
}
