import { http } from './http';
import type {
  CreateDraftRequest,
  Draft,
  Email,
  Length,
  Tone,
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

const encodePathSegment = (value: string) => encodeURIComponent(value);

/** Strip HTML tags and decode common entities to get readable plain text. */
function stripHtml(html: string): string {
  if (!html) return '';
  return html
    // Remove style/script blocks entirely so CSS/JS text does not leak into bodyText.
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
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
    const e = await http.get<EmailApiResponse>(`/emails/${encodePathSegment(id)}`);
    return mapEmail(e);
  },

  // Thread
  getThread: async (emailId: string) => {
    const list = await http.get<EmailApiResponse[]>(
      `/emails/${encodePathSegment(emailId)}/thread`,
    );
    return list.map(mapEmail);
  },

  // Drafts (match hooks names)
  getDrafts: (emailId: string) => http.get<Draft[]>(`/emails/${encodePathSegment(emailId)}/drafts`),
  generateDraft: (emailId: string, request: CreateDraftRequest) =>
    http.post<{ jobId: string }>(`/emails/${encodePathSegment(emailId)}/drafts`, request),

  // Email actions
  markEmailRead: async (id: string, isRead: boolean) =>
    http.patch<EmailApiResponse | { ok: boolean }>(`/emails/${encodePathSegment(id)}`, { isRead }),

  // Reply
  sendReply: async (emailId: string, body: string, draftId?: string) =>
    http.post<{ ok: boolean; provider: string }>(
      `/emails/${encodePathSegment(emailId)}/reply`,
      { body, draftId },
    ),

  // Delete (moves to trash)
  deleteEmail: async (emailId: string) =>
    http.delete<{ ok: boolean }>(`/emails/${encodePathSegment(emailId)}`),

  // AI-powered endpoints (async job queue)
  classifyEmail: async (emailId: string) =>
    http.post<{ jobId: string }>(`/emails/${encodePathSegment(emailId)}/classify`, {}),

  classifyBatch: async (emailIds: string[]) =>
    http.post<{ jobId: string | null; count: number }>('/emails/classify-batch', { emailIds }),

  // Job polling
  getJob: async (jobId: string) =>
    http.get<JobApiResponse>(`/jobs/${encodePathSegment(jobId)}`),

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
    http.post<{ ok: boolean }>(`/emails/${encodePathSegment(emailId)}/untrash`, {}),

  // Permanently delete (removes from trash forever)
  permanentlyDeleteEmail: async (emailId: string) =>
    http.delete<{ ok: boolean }>(`/emails/${encodePathSegment(emailId)}/permanent`),

  resetDemoData: async () => {
    throw new Error('Demo data reset is only available in the mock adapter.');
  },
};
