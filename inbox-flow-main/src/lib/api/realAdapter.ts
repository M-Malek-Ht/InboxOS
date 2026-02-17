import { http } from './http';

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
    bodyText: stripHtml(e.body ?? ''), // Strip HTML tags for display
    receivedAt: e.receivedAt,

    // AI/classification fields (if not classified yet, keep safe defaults)
    isRead: e.isRead ?? false,
    needsReply: e.needsReply ?? false,
    priorityScore: typeof e.priorityScore === 'number' ? e.priorityScore : undefined,
    category: e.category,
    tags: Array.isArray(e.tags) ? e.tags : [],
    summary: e.summary ?? undefined,
  };
}

export const api = {
  getEmails: async (params: any) => {
    const qs = new URLSearchParams();
    if (params?.filter) qs.set('filter', params.filter);
    if (params?.search) qs.set('search', params.search);
    qs.set('limit', String(params?.limit ?? 40));

    const path = `/emails?${qs.toString()}`;
    const list = await http.get<any[]>(path);
    const mapped = list.map(mapEmail);
    return { data: mapped, total: mapped.length };
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

  // Email actions
  markEmailRead: async (id: string, isRead: boolean) =>
    http.patch<any>(`/emails/${id}`, { isRead }),

  // AI-powered endpoints (async job queue)
  classifyEmail: async (emailId: string) =>
    http.post<{ jobId: string }>(`/emails/${emailId}/classify`, {}),

  classifyBatch: async (emailIds: string[]) =>
    http.post<{ jobIds: string[]; count: number }>('/emails/classify-batch', { emailIds }),

  // Job polling
  getJob: async (jobId: string) =>
    http.get<{ id: string; type: string; status: string; result: any; error: string | null }>(`/jobs/${jobId}`),

  // Not yet implemented
  extractDates: async (_emailId: string) => ({ jobId: 'not-implemented' }),
  resetDemoData: async () => ({ ok: true }),
};
