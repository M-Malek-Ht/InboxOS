import { useDrafts, useEmails } from '@/lib/api/hooks';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyDrafts } from '@/components/ui/empty-states';
import { FileText } from 'lucide-react';
import { PageTransition } from '@/components/PageTransition';

export default function DraftsPage() {
  const { data: emails } = useEmails({ limit: 50 });
  const emailsWithDrafts = emails?.data.filter(e => e.id) || [];

  return (
    <PageTransition>
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Drafts</h1>
        <p className="text-muted-foreground">AI-generated reply drafts organized by email</p>
      </div>

      <div className="space-y-4">
        {emailsWithDrafts.length > 0 ? (
          emailsWithDrafts.slice(0, 5).map(email => (
            <DraftCard key={email.id} emailId={email.id} subject={email.subject} fromName={email.fromName} />
          ))
        ) : (
          <EmptyDrafts />
        )}
      </div>
    </div>
    </PageTransition>
  );
}

function DraftCard({ emailId, subject, fromName }: { emailId: string; subject: string; fromName: string }) {
  const { data: drafts } = useDrafts(emailId);

  if (!drafts || drafts.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          Re: {subject}
        </CardTitle>
        <p className="text-sm text-muted-foreground">To: {fromName}</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {drafts.map(draft => (
            <div key={draft.id} className="p-3 rounded-lg bg-muted/50 text-sm">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                <span className="font-medium">v{draft.version}</span>
                <span>•</span>
                <span>{draft.tone}</span>
                <span>•</span>
                <span>{draft.length}</span>
                <span className="ml-auto">{format(new Date(draft.createdAt), 'MMM d, h:mm a')}</span>
              </div>
              <p className="line-clamp-3">{draft.content}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
