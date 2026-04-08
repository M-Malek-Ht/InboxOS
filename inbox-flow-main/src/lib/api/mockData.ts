import { Email, Draft, Category } from '@/lib/types';

// Helper to generate IDs
export const generateId = () => Math.random().toString(36).substring(2, 11);

// Helper to get date strings
const now = new Date();
const todayStr = now.toISOString();
const yesterday = new Date(now.getTime() - 86400000);
const twoDaysAgo = new Date(now.getTime() - 2 * 86400000);
const threeDaysAgo = new Date(now.getTime() - 3 * 86400000);

export const initialEmails: Email[] = [
  {
    id: 'email-1',
    fromName: 'Sarah Chen',
    fromEmail: 'sarah.chen@acme.com',
    subject: 'Q4 Planning Meeting - Action Items Required',
    snippet: 'Hi team, Following up on our Q4 planning session. Please review the attached roadmap and provide your feedback by EOD Friday.',
    bodyText: `Hi team,

Following up on our Q4 planning session yesterday. Here are the key action items we discussed:

1. Engineering needs to provide estimates for the new authentication system by next Monday
2. Design team should share the updated mockups for the dashboard redesign
3. Marketing to prepare the launch timeline for the November release

Please review the attached roadmap document and provide your feedback by EOD Friday. We'll have a follow-up meeting next Tuesday at 2 PM to finalize everything.

Let me know if you have any questions or concerns.

Best,
Sarah`,
    receivedAt: yesterday.toISOString(),
    isRead: false,
    tags: ['planning', 'q4'],
    category: 'Meetings',
    priorityScore: 85,
    needsReply: true,
    summary: 'Q4 planning follow-up with action items for engineering estimates, design mockups, and marketing timeline.',
  },
  {
    id: 'email-2',
    fromName: 'AWS Billing',
    fromEmail: 'no-reply@aws.amazon.com',
    subject: 'Your AWS Bill for October 2024',
    snippet: 'Your monthly AWS bill is ready. Total amount: $2,847.32. View your detailed billing breakdown...',
    bodyText: `Hello,

Your AWS bill for October 2024 is now available.

Account: 1234-5678-9012
Billing Period: October 1-31, 2024
Total Amount: $2,847.32

Service Breakdown:
- EC2: $1,245.00
- RDS: $890.50
- S3: $312.82
- Lambda: $198.00
- Other Services: $201.00

To view your detailed billing statement, please log in to the AWS Management Console.

Payment is due by November 15, 2024.

Thank you for using Amazon Web Services.`,
    receivedAt: twoDaysAgo.toISOString(),
    isRead: true,
    tags: ['aws', 'invoice'],
    category: 'Bills',
    priorityScore: 70,
    needsReply: false,
    summary: 'October AWS bill for $2,847.32 due by November 15.',
  },
  {
    id: 'email-3',
    fromName: 'Michael Torres',
    fromEmail: 'michael.t@client.io',
    subject: 'Urgent: API Integration Issue',
    snippet: 'We\'re experiencing issues with the webhook endpoints. The callbacks are timing out after 30 seconds...',
    bodyText: `Hi there,

We're experiencing critical issues with the webhook integration we set up last week.

The problems we're seeing:
1. Callbacks are timing out after 30 seconds
2. Some events are being dropped without any error response
3. Retry logic doesn't seem to be working as expected

This is blocking our production deployment scheduled for tomorrow. Can we get on a call today to troubleshoot?

Our team is available anytime between 2-6 PM EST.

Thanks,
Michael`,
    receivedAt: new Date(now.getTime() - 3600000).toISOString(),
    isRead: false,
    tags: ['urgent', 'api', 'support'],
    category: 'Support',
    priorityScore: 95,
    needsReply: true,
    summary: 'Critical webhook integration issues blocking production deployment. Needs immediate attention.',
  },
  {
    id: 'email-4',
    fromName: 'TechCrunch Daily',
    fromEmail: 'newsletters@techcrunch.com',
    subject: 'Today in Tech: AI Startups Raise Record Funding',
    snippet: 'Good morning! Here\'s what\'s happening in tech today. AI startups have collectively raised over $15B this quarter...',
    bodyText: `Good morning!

Here's what's happening in tech today:

TOP STORIES

🤖 AI Startups Raise Record Funding
AI startups have collectively raised over $15 billion this quarter, marking a 300% increase from last year. Notable rounds include...

💼 Big Tech Earnings Preview
Apple, Google, and Microsoft report earnings this week. Analysts expect strong cloud revenue growth...

🚀 SpaceX Starship Update
SpaceX successfully completed its latest test flight, bringing the Mars mission one step closer...

Read more at techcrunch.com

You're receiving this because you subscribed to TechCrunch Daily.`,
    receivedAt: todayStr,
    isRead: true,
    tags: ['newsletter'],
    category: 'Newsletters',
    priorityScore: 20,
    needsReply: false,
    summary: 'Daily tech news roundup covering AI funding, big tech earnings, and SpaceX updates.',
  },
  {
    id: 'email-5',
    fromName: 'David Kim',
    fromEmail: 'david@startup.co',
    subject: 'Coffee chat next week?',
    snippet: 'Hey! It\'s been a while since we caught up. Would love to hear what you\'ve been working on. Free for coffee Tuesday?',
    bodyText: `Hey!

It's been a while since we caught up. I saw your post about the new project you're working on - looks really interesting!

Would love to hear more about it over coffee. Are you free Tuesday or Wednesday afternoon next week?

There's a new coffee shop that opened near the office - Brew Lab. Great pour-over.

Let me know what works for you!

Cheers,
David`,
    receivedAt: threeDaysAgo.toISOString(),
    isRead: true,
    tags: ['personal'],
    category: 'Personal',
    priorityScore: 40,
    needsReply: true,
    summary: 'Friend wants to catch up over coffee next Tuesday or Wednesday.',
  },
  {
    id: 'email-6',
    fromName: 'HR Team',
    fromEmail: 'hr@company.com',
    subject: 'Reminder: Benefits Enrollment Deadline',
    snippet: 'This is a reminder that open enrollment ends on November 15th. Please make sure to review and update your benefits selections.',
    bodyText: `Dear Team Member,

This is a friendly reminder that the open enrollment period for 2025 benefits will close on November 15th.

Please take the time to:
- Review your current health insurance plan
- Update dental and vision coverage if needed
- Consider FSA/HSA contributions for next year
- Review life insurance beneficiaries

To access the benefits portal, visit benefits.company.com and log in with your employee credentials.

If you have any questions, please reach out to hr@company.com or schedule a 1-on-1 with our benefits coordinator.

Best regards,
HR Team`,
    receivedAt: twoDaysAgo.toISOString(),
    isRead: false,
    tags: ['hr', 'benefits', 'deadline'],
    category: 'Work',
    priorityScore: 75,
    needsReply: false,
    summary: 'Benefits enrollment deadline reminder for November 15th.',
  },
  {
    id: 'email-7',
    fromName: 'GitHub',
    fromEmail: 'noreply@github.com',
    subject: '[Dependabot] Security Alert: lodash vulnerability',
    snippet: 'A security vulnerability was found in lodash version 4.17.20. We recommend updating to version 4.17.21 or later.',
    bodyText: `Security Alert

A security vulnerability was detected in your repository my-awesome-project.

Affected dependency: lodash
Affected version: 4.17.20
Severity: High

Description:
A prototype pollution vulnerability in lodash could allow an attacker to modify the prototype of Object.

Recommendation:
Update lodash to version 4.17.21 or later.

You can also use Dependabot to automatically update this dependency.

View alert: https://github.com/user/my-awesome-project/security/dependabot/1

GitHub Security`,
    receivedAt: todayStr,
    isRead: false,
    tags: ['security', 'github', 'dependabot'],
    category: 'Work',
    priorityScore: 80,
    needsReply: false,
    summary: 'Security vulnerability in lodash requires update to version 4.17.21.',
  },
  {
    id: 'email-8',
    fromName: 'Emily Watson',
    fromEmail: 'emily.watson@partner.com',
    subject: 'Re: Partnership Proposal',
    snippet: 'Thank you for sending over the proposal. Our team has reviewed it and we\'d like to schedule a call to discuss terms.',
    bodyText: `Hi,

Thank you for sending over the partnership proposal. Our team has had a chance to review it thoroughly.

We're impressed with your platform and believe there's strong potential for collaboration. We'd like to schedule a call to discuss:

1. Revenue sharing terms
2. Technical integration requirements
3. Marketing co-promotion opportunities
4. Timeline for pilot program

Would next Thursday at 10 AM work for your team? We're also available Friday afternoon if that's better.

Looking forward to moving this forward!

Best,
Emily Watson
Head of Partnerships`,
    receivedAt: yesterday.toISOString(),
    isRead: true,
    tags: ['partnership', 'sales'],
    category: 'Work',
    priorityScore: 88,
    needsReply: true,
    summary: 'Partner interested in proposal, wants to schedule call to discuss terms.',
  },
];

export const initialDrafts: Draft[] = [
  {
    id: 'draft-1',
    emailId: 'email-1',
    version: 1,
    tone: 'Professional',
    length: 'Medium',
    content: `Hi Sarah,

Thank you for the comprehensive summary of our Q4 planning session.

I've reviewed the action items and here's my update:

1. Engineering estimates for the authentication system will be ready by Monday as requested. We're currently evaluating two approaches and will include pros/cons for each.

2. I'll coordinate with the design team to ensure the dashboard mockups are shared on schedule.

3. Will follow up with marketing regarding the launch timeline.

I've added the Tuesday follow-up meeting to my calendar. Looking forward to finalizing the roadmap.

Best regards`,
    createdAt: yesterday.toISOString(),
  },
];

// AI Classification templates
export const classificationTemplates: Record<string, { category: Category; priorityScore: number; needsReply: boolean; tags: string[] }> = {
  meeting: { category: 'Meetings', priorityScore: 80, needsReply: true, tags: ['meeting', 'calendar'] },
  urgent: { category: 'Support', priorityScore: 95, needsReply: true, tags: ['urgent', 'support'] },
  bill: { category: 'Bills', priorityScore: 60, needsReply: false, tags: ['invoice', 'payment'] },
  newsletter: { category: 'Newsletters', priorityScore: 20, needsReply: false, tags: ['newsletter'] },
  personal: { category: 'Personal', priorityScore: 50, needsReply: true, tags: ['personal'] },
  work: { category: 'Work', priorityScore: 70, needsReply: false, tags: ['work'] },
};
