import {
  Email, Draft, Job,
  EmailsQueryParams, PaginatedResponse, CreateDraftRequest,
  JobResponse, ClassifyResult, Category
} from '@/lib/types';
import {
  initialEmails, initialDrafts,
  generateId
} from './mockData';

// Simulated latency (ms)
const API_DELAY = 300;
const JOB_PROCESSING_TIME = 2000;

// In-memory store
class MockStore {
  emails: Email[] = [...initialEmails];
  drafts: Draft[] = [...initialDrafts];
  jobs: Map<string, Job> = new Map();

  reset() {
    this.emails = [...initialEmails];
    this.drafts = [...initialDrafts];
    this.jobs.clear();
  }
}

export const store = new MockStore();

// Utility to simulate async delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Email endpoints
export async function getEmails(params: EmailsQueryParams = {}): Promise<PaginatedResponse<Email>> {
  await delay(API_DELAY);
  
  let filtered = [...store.emails];
  
  // Apply filters
  if (params.filter) {
    switch (params.filter) {
      case 'unread':
        filtered = filtered.filter(e => !e.isRead);
        break;
      case 'needsReply':
        filtered = filtered.filter(e => e.needsReply);
        break;
      case 'highPriority':
        filtered = filtered.filter(e => (e.priorityScore ?? 0) >= 80);
        break;
      default:
        // Category filter
        filtered = filtered.filter(e => e.category === params.filter);
    }
  }
  
  // Apply search
  if (params.search) {
    const searchLower = params.search.toLowerCase();
    filtered = filtered.filter(e =>
      e.subject.toLowerCase().includes(searchLower) ||
      e.fromName.toLowerCase().includes(searchLower) ||
      e.fromEmail.toLowerCase().includes(searchLower) ||
      e.bodyText.toLowerCase().includes(searchLower)
    );
  }
  
  // Sort by date (newest first)
  filtered.sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime());
  
  // Pagination
  const page = params.page ?? 1;
  const limit = params.limit ?? 20;
  const start = (page - 1) * limit;
  const end = start + limit;
  const paginatedData = filtered.slice(start, end);
  
  return {
    data: paginatedData,
    total: filtered.length,
    page,
    limit,
    hasMore: end < filtered.length,
  };
}

export async function getEmail(id: string): Promise<Email | null> {
  await delay(API_DELAY);
  return store.emails.find(e => e.id === id) || null;
}

export async function markEmailRead(id: string, isRead: boolean): Promise<Email | null> {
  await delay(API_DELAY / 2);
  const email = store.emails.find(e => e.id === id);
  if (email) {
    email.isRead = isRead;
  }
  return email || null;
}

// Classification job (async)
export async function classifyEmail(emailId: string): Promise<JobResponse> {
  await delay(API_DELAY / 2);
  
  const jobId = generateId();
  const job: Job = {
    id: jobId,
    type: 'classify',
    status: 'queued',
  };
  store.jobs.set(jobId, job);
  
  // Simulate async processing
  setTimeout(() => {
    job.status = 'processing';
  }, 500);
  
  setTimeout(() => {
    const email = store.emails.find(e => e.id === emailId);
    if (email) {
      // Generate mock classification result
      const result: ClassifyResult = {
        category: detectCategory(email.subject + ' ' + email.bodyText),
        priorityScore: Math.floor(Math.random() * 40) + 60,
        needsReply: email.bodyText.includes('?') || email.bodyText.toLowerCase().includes('please'),
        tags: generateTags(email.subject + ' ' + email.bodyText),
        summary: email.snippet,
      };
      
      // Update email
      email.category = result.category;
      email.priorityScore = result.priorityScore;
      email.needsReply = result.needsReply;
      email.tags = result.tags;
      email.summary = result.summary;
      
      job.status = 'done';
      job.result = result;
    } else {
      job.status = 'failed';
      job.error = 'Email not found';
    }
  }, JOB_PROCESSING_TIME);
  
  return { jobId };
}

function detectCategory(text: string): Category {
  const lower = text.toLowerCase();
  if (lower.includes('meeting') || lower.includes('calendar') || lower.includes('schedule')) return 'Meetings';
  if (lower.includes('invoice') || lower.includes('bill') || lower.includes('payment')) return 'Bills';
  if (lower.includes('newsletter') || lower.includes('digest') || lower.includes('unsubscribe')) return 'Newsletters';
  if (lower.includes('support') || lower.includes('help') || lower.includes('urgent')) return 'Support';
  if (lower.includes('personal') || lower.includes('coffee') || lower.includes('catch up')) return 'Personal';
  return 'Work';
}

function generateTags(text: string): string[] {
  const tags: string[] = [];
  const lower = text.toLowerCase();
  if (lower.includes('urgent')) tags.push('urgent');
  if (lower.includes('deadline')) tags.push('deadline');
  if (lower.includes('meeting')) tags.push('meeting');
  if (lower.includes('follow up') || lower.includes('follow-up')) tags.push('follow-up');
  if (lower.includes('action')) tags.push('action-required');
  return tags.length ? tags : ['general'];
}

// Draft endpoints
export async function getDrafts(emailId: string): Promise<Draft[]> {
  await delay(API_DELAY);
  return store.drafts.filter(d => d.emailId === emailId).sort((a, b) => b.version - a.version);
}

export async function generateDraft(emailId: string, request: CreateDraftRequest): Promise<JobResponse> {
  await delay(API_DELAY / 2);
  
  const jobId = generateId();
  const job: Job = {
    id: jobId,
    type: 'draft',
    status: 'queued',
  };
  store.jobs.set(jobId, job);
  
  setTimeout(() => {
    job.status = 'processing';
  }, 500);
  
  setTimeout(() => {
    const email = store.emails.find(e => e.id === emailId);
    if (email) {
      const existingDrafts = store.drafts.filter(d => d.emailId === emailId);
      const newVersion = existingDrafts.length + 1;
      
      const draft: Draft = {
        id: generateId(),
        emailId,
        version: newVersion,
        tone: request.tone,
        length: request.length,
        instruction: request.instruction,
        content: generateDraftContent(email, request),
        createdAt: new Date().toISOString(),
      };
      
      store.drafts.push(draft);
      job.status = 'done';
      job.result = draft;
    } else {
      job.status = 'failed';
      job.error = 'Email not found';
    }
  }, JOB_PROCESSING_TIME);
  
  return { jobId };
}

function generateDraftContent(email: Email, request: CreateDraftRequest): string {
  const greeting = request.tone === 'Friendly' ? `Hey ${email.fromName.split(' ')[0]}!` :
                   request.tone === 'Professional' ? `Dear ${email.fromName},` :
                   request.tone === 'Short' ? `Hi,` :
                   request.tone === 'Firm' ? `${email.fromName},` :
                   `Dear ${email.fromName},`;
  
  const lengthText = request.length === 'Short' ? 'Thank you for your email. I\'ll get back to you shortly.' :
                     request.length === 'Medium' ? `Thank you for reaching out regarding "${email.subject}". I've reviewed the details and wanted to follow up.\n\nI'll look into this and provide a comprehensive response soon.` :
                     `Thank you for your email regarding "${email.subject}". I appreciate you taking the time to share this information.\n\nI've carefully reviewed the details you've provided. Here are my thoughts:\n\n1. I understand the importance of this matter\n2. I'll coordinate with the relevant team members\n3. We should be able to address this promptly\n\nPlease let me know if you need any additional information in the meantime.`;
  
  const closing = request.tone === 'Friendly' ? '\n\nCheers!' :
                  request.tone === 'Professional' ? '\n\nBest regards,' :
                  request.tone === 'Short' ? '\n\nThanks,' :
                  request.tone === 'Firm' ? '\n\nRegards,' :
                  '\n\nSincerely apologize for any inconvenience,';
  
  return `${greeting}\n\n${lengthText}${closing}`;
}

// Job polling
export async function getJob(jobId: string): Promise<Job | null> {
  await delay(100); // Quick response for polling
  return store.jobs.get(jobId) || null;
}

// Reset demo data
export async function resetDemoData(): Promise<void> {
  await delay(API_DELAY);
  store.reset();
}
