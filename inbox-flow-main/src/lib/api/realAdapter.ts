import { http } from './http';
import type {
  CreateDraftRequest,
  CreateEventRequest,
  CreateTaskRequest,
  Draft,
  Email,
  EventsQueryParams,
  Length,
  Task,
  TasksQueryParams,
  Tone,
  UpdateTaskRequest,
} from '@/lib/types';

interface EmailApiResponse {
  id: string;
  from?: string;
  to?: string;
  subject?: string;
  snippet?: string;
  body?: string;
  receivedAt: string;
  isRead?: boolean;
  needsReply?: boolean;
  priorityScore?: number;
  category?: Email['category'];
  tags?: string[];
  summary?: string;
  isSent?: boolean;
}

interface TaskApiResponse {
  id: string;
  emailId?: string;
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  dueDate?: string | null;
  createdAt: string;
}

interface EventApiResponse {
  id: string;
  emailId?: string;
  title: string;
  startAt: string;
  endAt: string;
  location?: string;
  notes?: string;
  createdAt: string;
}

interface JobApiResponse {
  id: string;
  type: string;
  status: string;
  result: unknown;
  error: string | null;
}

interface SettingsApiResponse {
  defaultTone: string;
  defaultLength: string;
}

type FrontendTaskStatus = 'Backlog' | 'In Progress' | 'Done';
type FrontendTaskPriority = 'Low' | 'Med' | 'High';

function normalizeTaskStatus(status?: string): FrontendTaskStatus {
  switch ((status ?? '').toLowerCase()) {
    case 'done':
      return 'Done';
    case 'in progress':
    case 'in_progress':
    case 'in-progress':
    case 'progress':
      return 'In Progress';
    case 'backlog':
    case 'todo':
    default:
      return 'Backlog';
  }
}

function normalizeTaskPriority(priority?: string): FrontendTaskPriority {
  switch ((priority ?? '').toLowerCase()) {
    case 'high':
      return 'High';
    case 'low':
      return 'Low';
    case 'med':
    case 'medium':
    default:
      return 'Med';
  }
}

function serializeTaskStatus(status?: string) {
  switch (status) {
    case 'Done':
      return 'done';
    case 'In Progress':
      return 'in progress';
    case 'Backlog':
      return 'todo';
    default:
      return status;
  }
}

function serializeTaskPriority(priority?: string) {
  switch (priority) {
    case 'High':
      return 'high';
    case 'Low':
      return 'low';
    case 'Med':
      return 'medium';
    default:
      return priority;
  }
}

/** Strip HTML tags and decode common entities to get readable plain text. */
function stripHtml(html: string): string {
  if (!html) return '';
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function mapEmail(e: EmailApiResponse): Email {
  // Sent items are shown from the recipient perspective ("To: ...").
  const senderOrRecipientRaw = (e.isSent && e.to ? e.to : e.from) ?? 'Unknown';
  const fromRaw = senderOrRecipientRaw;
  let fromName = fromRaw;
  let fromEmail = fromRaw;

  // Try to parse "Name <email>" format
  const match = fromRaw.match(/^(.+?)\s*<(.+?)>$/);
  if (match) {
    fromName = match[1].trim().replace(/^["']|["']$/g, ''); // Remove quotes
    fromEmail = match[2].trim();
  } else if (fromRaw.includes('@')) {
    // Just an email address
    fromName = fromRaw.split('@')[0];
    fromEmail = fromRaw;
  }

  return {
    id: e.id,
    from: e.from,
    fromName,
    fromEmail,
    to: e.to ?? '',
    subject: e.subject ?? '(no subject)',
    snippet: e.snippet ?? '',
    body: e.body ?? '',
    bodyText: stripHtml(e.body ?? ''), // Strip HTML tags for display
    receivedAt: e.receivedAt,

    // AI/classification fields (if not classified yet, keep safe defaults)
    isRead: e.isRead ?? false,
    needsReply: e.needsReply ?? false,
    priorityScore: typeof e.priorityScore === 'number' ? e.priorityScore : undefined,
    category: e.category,
    tags: Array.isArray(e.tags) ? e.tags : [],
    summary: e.summary ?? undefined,
    isSent: e.isSent ?? false,
  };
}

function mapTask(task: TaskApiResponse): Task {
  return {
    ...task,
    status: normalizeTaskStatus(task?.status),
    priority: normalizeTaskPriority(task?.priority),
    dueDate: task?.dueDate ?? undefined,
  };
}

function mapEvent(event: EventApiResponse) {
  return {
    ...event,
    startAt: event?.startAt,
    endAt: event?.endAt,
  };
}

export const api = {
  getEmails: async (params: { filter?: string; search?: string; limit?: number }) => {
    const qs = new URLSearchParams();
    if (params?.filter) qs.set('filter', params.filter);
    if (params?.search) qs.set('search', params.search);
    qs.set('limit', String(params?.limit ?? 40));

    const path = `/emails?${qs.toString()}`;
    const list = await http.get<EmailApiResponse[]>(path);
    const mapped = list.map(mapEmail);
    return { data: mapped, total: mapped.length };
  },

  getEmail: async (id: string) => {
    const e = await http.get<EmailApiResponse>(`/emails/${id}`);
    return mapEmail(e);
  },

  // Thread
  getThread: async (emailId: string) => {
    const list = await http.get<EmailApiResponse[]>(`/emails/${emailId}/thread`);
    return list.map(mapEmail);
  },

  // Drafts (match hooks names)
  getDrafts: (emailId: string) => http.get<Draft[]>(`/emails/${emailId}/drafts`),
  generateDraft: (emailId: string, request: CreateDraftRequest) =>
    http.post<{ jobId: string }>(`/emails/${emailId}/drafts`, request),

  // Tasks (match hooks names)
  getTasks: async (params: TasksQueryParams) => {
    const tasks = await http.get<TaskApiResponse[]>('/tasks');
    const mapped = tasks.map(mapTask);

    if (params?.status) {
      return mapped.filter((task) => task.status === params.status);
    }

    return mapped;
  },
  createTask: async (request: CreateTaskRequest) => {
    const created = await http.post<TaskApiResponse>('/tasks', {
      ...request,
      status: serializeTaskStatus(request?.status),
      priority: serializeTaskPriority(request?.priority),
    });
    return mapTask(created);
  },
  updateTask: async (id: string, request: UpdateTaskRequest) => {
    const updated = await http.patch<TaskApiResponse>(`/tasks/${id}`, {
      ...request,
      status: serializeTaskStatus(request?.status),
      priority: serializeTaskPriority(request?.priority),
    });
    return mapTask(updated);
  },
  deleteTask: (id: string) => http.delete<{ ok: boolean }>(`/tasks/${id}`),

  // Events (match hooks names)
  getEvents: async (params: EventsQueryParams) => {
    const qs = new URLSearchParams();
    if (params?.from) qs.set('from', params.from);
    if (params?.to) qs.set('to', params.to);

    const events = await http.get<EventApiResponse[]>(`/events${qs.toString() ? `?${qs.toString()}` : ''}`);
    return events
      .map(mapEvent)
      .filter((event) => {
        if (!params?.from && !params?.to) return true;

        const start = new Date(event.startAt).getTime();
        const from = params?.from ? new Date(params.from).getTime() : Number.NEGATIVE_INFINITY;
        const to = params?.to ? new Date(params.to).getTime() : Number.POSITIVE_INFINITY;

        return start >= from && start <= to;
      });
  },
  createEvent: async (request: CreateEventRequest) => mapEvent(await http.post<EventApiResponse>('/events', request)),
  updateEvent: async (id: string, request: Partial<CreateEventRequest>) =>
    mapEvent(await http.patch<EventApiResponse>(`/events/${id}`, request)),
  deleteEvent: (id: string) => http.delete<{ ok: boolean }>(`/events/${id}`),

  // Email actions
  markEmailRead: async (id: string, isRead: boolean) =>
    http.patch<EmailApiResponse | { ok: boolean }>(`/emails/${id}`, { isRead }),

  // Reply
  sendReply: async (emailId: string, body: string, draftId?: string) =>
    http.post<{ ok: boolean; provider: string }>(`/emails/${emailId}/reply`, { body, draftId }),

  // Delete (moves to trash)
  deleteEmail: async (emailId: string) =>
    http.delete<{ ok: boolean }>(`/emails/${emailId}`),

  // AI-powered endpoints (async job queue)
  classifyEmail: async (emailId: string) =>
    http.post<{ jobId: string }>(`/emails/${emailId}/classify`, {}),

  classifyBatch: async (emailIds: string[]) =>
    http.post<{ jobId: string | null; count: number }>('/emails/classify-batch', { emailIds }),

  // Job polling
  getJob: async (jobId: string) =>
    http.get<JobApiResponse>(`/jobs/${jobId}`),

  // Settings
  getSettings: async () =>
    http.get<SettingsApiResponse>('/settings'),
  updateSettings: async (updates: { defaultTone?: Tone; defaultLength?: Length }) =>
    http.patch<SettingsApiResponse>('/settings', updates),

  // All drafts (latest per email)
  getAllDrafts: async () => http.get<Draft[]>('/drafts'),

  // Sent emails
  getSentEmails: async (params: { search?: string; limit?: number }) => {
    const qs = new URLSearchParams();
    if (params?.search) qs.set('search', params.search);
    qs.set('limit', String(params?.limit ?? 40));
    const list = await http.get<EmailApiResponse[]>(`/emails/sent?${qs.toString()}`);
    return list.map(mapEmail);
  },

  // Trash emails
  getTrashEmails: async (params: { search?: string; limit?: number }) => {
    const qs = new URLSearchParams();
    if (params?.search) qs.set('search', params.search);
    qs.set('limit', String(params?.limit ?? 40));
    const list = await http.get<EmailApiResponse[]>(`/emails/trash?${qs.toString()}`);
    return list.map(mapEmail);
  },

  // Untrash (restore from trash)
  untrashEmail: async (emailId: string) =>
    http.post<{ ok: boolean }>(`/emails/${emailId}/untrash`, {}),

  // Not yet implemented
  extractDates: async (_emailId: string) => {
    throw new Error('Date extraction is not available in the current backend yet.');
  },
  resetDemoData: async () => {
    throw new Error('Demo data reset is only available in the mock adapter.');
  },
};
