import { http } from './http';

function mapEmail(e: any) {
  // Parse "Name <email@example.com>" or just "email@example.com"
  const fromRaw = e.from ?? 'Unknown';
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
    subject: e.subject ?? '(no subject)',
    snippet: e.snippet ?? '',
    body: e.body ?? '',
    bodyText: e.body ?? '', // Frontend expects bodyText
    receivedAt: e.receivedAt,

    // fields expected by UI (defaults for now)
    isRead: e.isRead ?? false,
    needsReply: false,
    priorityScore: 50,
    category: undefined,
    tags: [], // Frontend expects tags array
  };
}

export const api = {
  getEmails: async (params: any) => {
    const qs = new URLSearchParams();
    if (params?.filter) qs.set('filter', params.filter);
    if (params?.search) qs.set('search', params.search);
    if (params?.limit) qs.set('limit', String(params.limit));

    const path = qs.toString() ? `/emails?${qs.toString()}` : '/emails';
    const list = await http.get<any[]>(path);
    return { data: list.map(mapEmail) };
  },

  getEmail: async (id: string) => {
    const e = await http.get<any>(`/emails/${id}`);
    return mapEmail(e);
  },

  // Drafts (match hooks names)
  getDrafts: (emailId: string) => http.get<any[]>(`/emails/${emailId}/drafts`),
  generateDraft: (emailId: string, request: any) =>
    http.post<any>(`/emails/${emailId}/drafts`, request),

  // Tasks (match hooks names)
  getTasks: (_params: any) => http.get<any[]>('/tasks'),
  createTask: (request: any) => http.post<any>('/tasks', request),
  updateTask: (id: string, request: any) => http.patch<any>(`/tasks/${id}`, request),
  deleteTask: (id: string) => http.delete<any>(`/tasks/${id}`),

  // Events (match hooks names)
  getEvents: (_params: any) => http.get<any[]>('/events'),
  createEvent: (request: any) => http.post<any>('/events', request),
  updateEvent: (id: string, request: any) => http.patch<any>(`/events/${id}`, request),
  deleteEvent: (id: string) => http.delete<any>(`/events/${id}`),

  // Still mock / not implemented yet:
  markEmailRead: async (id: string, isRead: boolean) =>
    http.patch<any>(`/emails/${id}`, { isRead }),
  classifyEmail: async (_emailId: string) => ({ jobId: 'not-implemented' }),
  extractDates: async (_emailId: string) => ({ jobId: 'not-implemented' }),
  getJob: async (jobId: string) => ({ id: jobId, status: 'done', result: null }),
  resetDemoData: async () => ({ ok: true }),
};
