import { useMemo } from 'react';
import { useEmails, useTasks, useEvents } from '@/lib/api/hooks';
import { format, startOfDay, endOfDay, addDays } from 'date-fns';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CategoryBadge, PriorityIndicator, StatusBadge } from '@/components/ui/badges';
import { StatCardSkeleton } from '@/components/ui/skeletons';
import { Inbox, CheckSquare, Calendar, AlertCircle, ArrowRight, Mail, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Dashboard() {
  const { data: emailsData, isLoading: emailsLoading } = useEmails({ limit: 40 });
  const { data: tasks, isLoading: tasksLoading } = useTasks();
  const today = new Date();
  const { data: events, isLoading: eventsLoading } = useEvents({
    from: startOfDay(today).toISOString(),
    to: endOfDay(addDays(today, 7)).toISOString(),
  });

  const stats = useMemo(() => {
    const unreadCount = emailsData?.data.filter(e => !e.isRead).length || 0;
    const needsReplyCount = emailsData?.data.filter(e => e.needsReply).length || 0;
    const openTasks = tasks?.filter(t => t.status !== 'Done').length || 0;
    const upcomingEvents = events?.length || 0;
    return { unreadCount, needsReplyCount, openTasks, upcomingEvents };
  }, [emailsData, tasks, events]);

  const highPriorityEmails = emailsData?.data.filter(e => (e.priorityScore ?? 0) >= 80).slice(0, 3);
  const tasksDueSoon = tasks?.filter(t => t.dueDate && t.status !== 'Done').slice(0, 3);
  const upcomingEventsList = events?.slice(0, 3);

  const isLoading = emailsLoading || tasksLoading || eventsLoading;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Good {getGreeting()}</h1>
        <p className="text-muted-foreground">Here's your productivity snapshot for today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          [...Array(4)].map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          <>
            <StatCard icon={Mail} label="Unread Emails" value={stats.unreadCount} href="/inbox" />
            <StatCard icon={AlertCircle} label="Needs Reply" value={stats.needsReplyCount} href="/inbox" color="amber" />
            <StatCard icon={CheckSquare} label="Open Tasks" value={stats.openTasks} href="/workflows" />
            <StatCard icon={Calendar} label="Upcoming Events" value={stats.upcomingEvents} href="/calendar" color="blue" />
          </>
        )}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* High Priority Emails */}
        <Card>
          <CardHeader className="flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-semibold">High Priority</CardTitle>
            <Link to="/inbox"><Button variant="ghost" size="sm">View all <ArrowRight className="ml-1 h-4 w-4" /></Button></Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {highPriorityEmails?.map(email => (
              <div key={email.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium">
                  {email.fromName.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{email.subject}</div>
                  <div className="text-xs text-muted-foreground">{email.fromName}</div>
                </div>
                {email.category && <CategoryBadge category={email.category} />}
              </div>
            ))}
            {(!highPriorityEmails || highPriorityEmails.length === 0) && (
              <p className="text-sm text-muted-foreground text-center py-4">No high priority emails</p>
            )}
          </CardContent>
        </Card>

        {/* Tasks Due Soon */}
        <Card>
          <CardHeader className="flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-semibold">Tasks Due Soon</CardTitle>
            <Link to="/workflows"><Button variant="ghost" size="sm">View all <ArrowRight className="ml-1 h-4 w-4" /></Button></Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {tasksDueSoon?.map(task => (
              <div key={task.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <PriorityIndicator priority={task.priority} />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{task.title}</div>
                  {task.dueDate && <div className="text-xs text-muted-foreground">{format(new Date(task.dueDate), 'MMM d')}</div>}
                </div>
                <StatusBadge status={task.status} />
              </div>
            ))}
            {(!tasksDueSoon || tasksDueSoon.length === 0) && (
              <p className="text-sm text-muted-foreground text-center py-4">No tasks due soon</p>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card>
          <CardHeader className="flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-semibold">Upcoming Events</CardTitle>
            <Link to="/calendar"><Button variant="ghost" size="sm">View all <ArrowRight className="ml-1 h-4 w-4" /></Button></Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingEventsList?.map(event => (
              <div key={event.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{event.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {format(new Date(event.startAt), 'EEE, MMM d · h:mm a')}
                  </div>
                </div>
              </div>
            ))}
            {(!upcomingEventsList || upcomingEventsList.length === 0) && (
              <p className="text-sm text-muted-foreground text-center py-4">No upcoming events</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, href, color }: { icon: any; label: string; value: number; href: string; color?: string }) {
  return (
    <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
      <Link to={href}>
        <Card className="hover:border-muted-foreground/30 transition-colors cursor-pointer">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{label}</span>
              <Icon className={`h-5 w-5 ${color === 'amber' ? 'text-amber-500' : color === 'blue' ? 'text-blue-500' : 'text-muted-foreground'}`} />
            </div>
            <div className="text-3xl font-bold mt-2">{value}</div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}
