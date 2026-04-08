// InboxOS Data Types - Production Ready DTOs

export type Category = 'Meetings' | 'Work' | 'Personal' | 'Bills' | 'Newsletters' | 'Support' | 'Other';

export type Tone = 'Professional' | 'Friendly' | 'Short' | 'Firm' | 'Apologetic';

export type Length = 'Short' | 'Medium' | 'Detailed';

export type JobType = 'classify' | 'draft' | 'classify-batch' | 'auto-draft-batch';

export type JobStatus = 'queued' | 'processing' | 'done' | 'failed';

export interface Email {
  id: string;
  from?: string;
  fromName: string;
  fromEmail: string;
  to?: string;
  subject: string;
  snippet: string;
  body?: string;
  bodyText: string;
  receivedAt: string;
  isRead: boolean;
  tags: string[];
  category?: Category;
  priorityScore?: number;
  needsReply?: boolean;
  summary?: string;
  isSent?: boolean;
}

export interface Draft {
  id: string;
  emailId: string;
  version: number;
  tone: Tone;
  length: Length;
  instruction?: string;
  content: string;
  createdAt: string;
}

export interface Job {
  id: string;
  type: JobType;
  status: JobStatus;
  result?: unknown;
  error?: string;
}

// API Request/Response types
export interface EmailsQueryParams {
  filter?: 'unread' | 'needsReply' | 'highPriority' | Category;
  search?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface CreateDraftRequest {
  tone: Tone;
  length: Length;
  instruction?: string;
  emailFrom?: string;
  emailSubject?: string;
  emailBody?: string;
}

// Job response types
export interface JobResponse {
  jobId: string;
}

export interface ClassifyResult {
  category: Category;
  priorityScore: number;
  needsReply: boolean;
  tags: string[];
  summary: string;
}
