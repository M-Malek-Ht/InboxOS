// InboxOS Data Types - Production Ready DTOs

export type Category = 'Meetings' | 'Work' | 'Personal' | 'Bills' | 'Newsletters' | 'Support' | 'Other';

export type Tone = 'Professional' | 'Friendly' | 'Short' | 'Firm' | 'Apologetic';

export type Length = 'Short' | 'Medium' | 'Detailed';

export type TaskStatus = 'Backlog' | 'In Progress' | 'Done';

export type TaskPriority = 'Low' | 'Med' | 'High';

export type JobType = 'classify' | 'draft' | 'extractDates';

export type JobStatus = 'queued' | 'processing' | 'done' | 'failed';

export interface Email {
  id: string;
  fromName: string;
  fromEmail: string;
  subject: string;
  snippet: string;
  bodyText: string;
  receivedAt: string;
  isRead: boolean;
  tags: string[];
  category?: Category;
  priorityScore?: number;
  needsReply?: boolean;
  summary?: string;
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

export interface Task {
  id: string;
  emailId?: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  createdAt: string;
}

export interface CalendarEvent {
  id: string;
  emailId?: string;
  title: string;
  startAt: string;
  endAt: string;
  location?: string;
  notes?: string;
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
}

export interface CreateTaskRequest {
  emailId?: string;
  title: string;
  description?: string;
  status?: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string;
}

export interface CreateEventRequest {
  emailId?: string;
  title: string;
  startAt: string;
  endAt: string;
  location?: string;
  notes?: string;
}

export interface EventsQueryParams {
  from: string;
  to: string;
}

export interface TasksQueryParams {
  status?: TaskStatus;
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

export interface ExtractDatesResult {
  suggestedEvent: Omit<CalendarEvent, 'id' | 'createdAt'>;
}
