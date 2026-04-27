import { Link } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';
import { PageTransition } from '@/components/PageTransition';

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="space-y-3">
    <h2 className="text-lg font-semibold text-foreground">{title}</h2>
    <div className="text-sm text-muted-foreground space-y-2 leading-relaxed">{children}</div>
  </section>
);

export default function PrivacyPolicyPage() {
  return (
    <PageTransition>
      <div className="min-h-screen bg-background">
        <div className="max-w-2xl mx-auto px-6 py-12">
          {/* Back link */}
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to sign in
          </Link>

          {/* Header */}
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Privacy Policy</h1>
          </div>
          <p className="text-sm text-muted-foreground mb-10">
            Last updated: April 27, 2026
          </p>

          <div className="space-y-8">
            <Section title="Overview">
              <p>
                InboxOS ("we", "us", or "our") is an AI-powered inbox management tool. This policy explains
                what data we access, how we use it, and your rights as a user. We take your privacy seriously —
                we access only what is necessary and never sell your data.
              </p>
            </Section>

            <Section title="Data We Collect">
              <p><span className="text-foreground font-medium">Account information:</span> Your email address and OAuth provider ID (Google or Microsoft), collected when you sign in. We do not store passwords.</p>
              <p><span className="text-foreground font-medium">OAuth tokens:</span> A refresh token from Google or Microsoft is stored securely in our database. This allows InboxOS to read and send emails on your behalf without requiring you to sign in again.</p>
              <p><span className="text-foreground font-medium">Email content:</span> When you use InboxOS, email subjects, senders, and body text are fetched directly from Gmail or Microsoft Outlook and processed in memory. A local copy may be cached in our database for performance.</p>
              <p><span className="text-foreground font-medium">AI-generated data:</span> Classification results (category, priority score, summary) and AI-drafted replies are stored in our database and linked to your account.</p>
              <p><span className="text-foreground font-medium">Settings:</span> Your preferences (default tone and length for AI drafts) are stored per account.</p>
            </Section>

            <Section title="How We Use Your Data">
              <p><span className="text-foreground font-medium">Email access</span> is used solely to display, classify, and reply to your emails within InboxOS. We do not read your emails for any purpose other than the features you explicitly use.</p>
              <p><span className="text-foreground font-medium">AI processing:</span> Email content (sender, subject, body) is sent to Anthropic's Claude API to generate classifications and draft replies. This data is transmitted securely and subject to Anthropic's privacy terms. We do not use your emails to train AI models.</p>
              <p><span className="text-foreground font-medium">Authentication tokens</span> are used only to make API calls to Google or Microsoft on your behalf.</p>
              <p>We do not use your data for advertising, profiling, or any purpose beyond providing the InboxOS service.</p>
            </Section>

            <Section title="Third-Party Services">
              <p>InboxOS integrates with the following third-party services:</p>
              <ul className="list-disc list-inside space-y-1 pl-2">
                <li><span className="text-foreground font-medium">Google OAuth & Gmail API</span> — for Google account sign-in and email access</li>
                <li><span className="text-foreground font-medium">Microsoft OAuth & Microsoft Graph</span> — for Microsoft account sign-in and email access</li>
                <li><span className="text-foreground font-medium">Anthropic Claude API</span> — for AI email classification and draft generation</li>
                <li><span className="text-foreground font-medium">Vercel</span> — hosting and serverless infrastructure</li>
              </ul>
              <p>Each of these services operates under their own privacy policies. Email content shared with Anthropic for AI processing is governed by <a href="https://www.anthropic.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2 hover:opacity-80">Anthropic's Privacy Policy</a>.</p>
            </Section>

            <Section title="Data Storage & Security">
              <p>Your data is stored in a PostgreSQL database hosted on a managed cloud provider. All connections use TLS encryption in transit. OAuth refresh tokens are stored at rest and protected by database-level access controls.</p>
              <p>Authentication uses short-lived JWTs (1-hour expiry) delivered via HTTP-only cookies, which cannot be accessed by JavaScript and are protected against common XSS attacks.</p>
            </Section>

            <Section title="Data Retention">
              <p>Your data is retained as long as your account is active. Email caches, AI insights, and drafts are associated with your account and remain until you delete them or your account is removed.</p>
              <p>We do not currently offer a self-serve account deletion flow. To request deletion of all your data, contact us at the address below.</p>
            </Section>

            <Section title="Your Rights">
              <p>You have the right to:</p>
              <ul className="list-disc list-inside space-y-1 pl-2">
                <li>Access the data we hold about you</li>
                <li>Request correction of inaccurate data</li>
                <li>Request deletion of your account and all associated data</li>
                <li>Revoke InboxOS's access to your Google or Microsoft account at any time via your account's connected apps settings</li>
              </ul>
              <p>Revoking OAuth access in Google or Microsoft will immediately prevent InboxOS from accessing your emails. Cached data in our database will remain until you request deletion.</p>
            </Section>

            <Section title="Changes to This Policy">
              <p>We may update this policy from time to time. When we do, we will update the "last updated" date at the top of this page. Continued use of InboxOS after changes constitutes acceptance of the updated policy.</p>
            </Section>

            <Section title="Contact">
              <p>
                Questions about this policy or requests regarding your data can be sent to{' '}
                <a href="mailto:hteitmalik@gmail.com" className="text-primary underline underline-offset-2 hover:opacity-80">
                  hteitmalik@gmail.com
                </a>
                .
              </p>
            </Section>
          </div>

          <div className="mt-12 pt-8 border-t border-border text-xs text-muted-foreground text-center">
            © {new Date().getFullYear()} InboxOS. All rights reserved.
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
