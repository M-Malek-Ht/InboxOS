import { http } from './http';

function mapEmail(e: any) {
  const fromName =
    typeof e.from === 'string' && e.from.includes('@')
      ? e.from.split('@')[0]
      : (e.from ?? 'Unknown');

  return {
    id: e.id,
    from: e.from,
    fromName,
    subject: e.subject ?? '(no subject)',
    snippet: e.snippet ?? '',
    body: e.body ?? '',
    receivedAt: e.receivedAt,

    // fields expected by UI (defaults for now)
    isRead: false,
    needsReply: false,
    priorityScore: 50,
    category: undefined,
  };
}

export const api = {
  getEmails: async (_params: any) => {
    const list = await http.get<any[]>('/emails');
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
  markEmailRead: async (_id: string, _isRead: boolean) => ({ ok: true }),
  classifyEmail: async (_emailId: string) => ({ jobId: 'not-implemented' }),
  extractDates: async (_emailId: string) => ({ jobId: 'not-implemented' }),
  getJob: async (jobId: string) => ({ id: jobId, status: 'done', result: null }),
  resetDemoData: async () => ({ ok: true }),
};
