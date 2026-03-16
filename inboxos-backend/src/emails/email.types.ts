export interface ParsedEmail {
  id: string;
  from: string;
  subject: string;
  snippet: string;
  body: string;
  receivedAt: Date;
  isRead: boolean;
  threadId?: string;
  to?: string;
  messageIdHeader?: string;
  labelIds?: string[];
  isSent?: boolean;
}