import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  ArrowRight,
  Sparkles,
  Inbox,
  CheckSquare,
  Calendar,
  Zap,
  Shield,
  Wand2,
  LineChart,
  CheckCircle2,
} from "lucide-react";

const fontImports = `
@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap');
`;

const headingFont = '"Space Grotesk", "Sora", ui-sans-serif';
const bodyFont = '"Manrope", "Sora", ui-sans-serif';

const features = [
  {
    title: "Inbox first triage",
    description: "Sort, label, and prioritize in seconds so the right work moves forward.",
    icon: Inbox,
  },
  {
    title: "Workflow boards",
    description: "Turn emails into tasks and track progress without leaving the inbox.",
    icon: CheckSquare,
  },
  {
    title: "Calendar aware",
    description: "Keep meetings and deadlines in view as you reply and schedule.",
    icon: Calendar,
  },
  {
    title: "Draft momentum",
    description: "Create, refine, and ship replies with fewer clicks and less context switching.",
    icon: Wand2,
  },
  {
    title: "Fast by default",
    description: "Command palette, keyboard shortcuts, and a layout built for speed.",
    icon: Zap,
  },
  {
    title: "Secure by design",
    description: "Clear roles, private workspaces, and predictable flows for teams.",
    icon: Shield,
  },
];

const steps = [
  {
    title: "Connect your inbox",
    description: "Bring email, tasks, and calendar into one shared workflow view.",
  },
  {
    title: "Triage with intent",
    description: "Prioritize what matters and convert threads into clear next steps.",
  },
  {
    title: "Ship work faster",
    description: "Draft, schedule, and close loops without bouncing between tools.",
  },
];

const stats = [
  { label: "Unified workspace", value: "Inbox, tasks, calendar" },
  { label: "Views", value: "Dashboard, inbox, workflows" },
  { label: "Modes", value: "Light and dark themes" },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background text-foreground" style={{ fontFamily: bodyFont }}>
      <style>{fontImports}</style>

      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_50%_at_20%_5%,hsl(var(--primary)/0.18),transparent_60%)]" />
        <div className="pointer-events-none absolute -top-24 right-0 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-72 w-72 rounded-full bg-muted/50 blur-3xl" />

        <header className="relative z-10 border-b border-border/60 bg-background/70 backdrop-blur">
          <div className="container flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-base font-semibold" style={{ fontFamily: headingFont }}>
                  InboxOS
                </span>
                <span className="text-xs text-muted-foreground">Inbox Flow frontend</span>
              </div>
            </div>

            <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
              <a href="#features" className="hover:text-foreground transition-colors">
                Features
              </a>
              <a href="#demo" className="hover:text-foreground transition-colors">
                Demo
              </a>
              <a href="#workflow" className="hover:text-foreground transition-colors">
                Workflow
              </a>
            </nav>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/login">Login</Link>
              </Button>
              <Button size="sm" asChild>
                <Link to="/login">
                  Open demo
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </header>

        <main className="relative z-10">
          <section className="container grid gap-10 py-20 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div className="space-y-6 animate-fade-in">
              <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                Frontend only demo
              </Badge>
              <h1
                className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl"
                style={{ fontFamily: headingFont }}
              >
                Turn inbox chaos into a calm, focused workflow.
              </h1>
              <p className="text-lg text-muted-foreground max-w-xl">
                InboxOS is the control center for teams who live in email. Triage,
                draft, and move work forward without the tab switching.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Button size="lg" asChild>
                  <Link to="/login">
                    Login to the demo
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <a href="#demo">See the preview</a>
                </Button>
              </div>
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Unified inbox, tasks, and calendar
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Built for fast triage
                </div>
              </div>
            </div>

            <Card className="relative overflow-hidden border-border/60 bg-card/80 shadow-xl animate-fade-in">
              <div className="flex items-center gap-2 border-b border-border/60 px-5 py-3 text-xs text-muted-foreground">
                <span className="h-2.5 w-2.5 rounded-full bg-destructive/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-primary/60" />
                <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/40" />
                <span className="ml-2">InboxOS demo workspace</span>
              </div>
              <div className="grid gap-0 lg:grid-cols-[210px_1fr]">
                <div className="border-r border-border/60 bg-muted/40 p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Priority
                  </div>
                  <div className="mt-3 space-y-2 text-sm">
                    {["New funding deck", "Q2 hiring plan", "Customer escalation", "Design review"].map((item) => (
                      <div key={item} className="rounded-md bg-background px-3 py-2 shadow-sm">
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold">Project Phoenix rollout</div>
                      <div className="text-xs text-muted-foreground">From Ava Harper - 10:12 AM</div>
                    </div>
                    <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                      Needs reply
                    </Badge>
                  </div>
                  <div className="rounded-lg border border-border/60 bg-background p-4 text-sm text-muted-foreground">
                    Hi team, can we finalize the rollout checklist? I need confirmation on
                    owner assignments and the launch schedule.
                  </div>
                  <div className="grid gap-2">
                    <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Next actions
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="h-2 w-2 rounded-full bg-primary" />
                      Assign owners and due dates
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="h-2 w-2 rounded-full bg-primary" />
                      Draft reply with schedule
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </section>

          <section id="features" className="container py-16">
            <div className="flex flex-col gap-3 max-w-2xl">
              <Badge variant="outline" className="w-fit border-primary/40 text-primary">
                Features
              </Badge>
              <h2 className="text-3xl font-semibold" style={{ fontFamily: headingFont }}>
                Everything you need to keep work moving from the inbox.
              </h2>
              <p className="text-muted-foreground">
                Designed for the way teams actually triage, respond, and convert email into progress.
              </p>
            </div>
            <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {features.map((feature, index) => (
                <Card
                  key={feature.title}
                  className="border-border/60 bg-card/80 p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md animate-fade-in"
                  style={{ animationDelay: `${index * 80}ms` }}
                >
                  <feature.icon className="h-5 w-5 text-primary" />
                  <h3 className="mt-4 text-lg font-semibold">{feature.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{feature.description}</p>
                </Card>
              ))}
            </div>
          </section>

          <section id="demo" className="container py-16">
            <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
              <div className="space-y-5">
                <Badge variant="outline" className="w-fit border-primary/40 text-primary">
                  Demo inbox
                </Badge>
                <h2 className="text-3xl font-semibold" style={{ fontFamily: headingFont }}>
                  A calm workspace that feels fast and familiar.
                </h2>
                <p className="text-muted-foreground">
                  InboxOS organizes your work by intent. Draft responses, move emails to workflows,
                  and keep scheduling context in view.
                </p>
                <div className="space-y-3 text-sm text-muted-foreground">
                  {stats.map((stat) => (
                    <div key={stat.label} className="flex items-center justify-between border-b border-border/50 pb-2">
                      <span>{stat.label}</span>
                      <span className="text-foreground font-medium">{stat.value}</span>
                    </div>
                  ))}
                </div>
                <Button asChild>
                  <Link to="/login">
                    Try the demo
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
              <Card className="border-border/60 bg-gradient-to-br from-background to-muted/60 p-6 shadow-lg">
                <div className="grid gap-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold">Inbox health</div>
                    <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                      Updated
                    </Badge>
                  </div>
                  <div className="grid gap-3 md:grid-cols-3">
                    {[
                      { label: "Unread", value: "14" },
                      { label: "Needs reply", value: "6" },
                      { label: "In progress", value: "9" },
                    ].map((item) => (
                      <div key={item.label} className="rounded-lg border border-border/60 bg-background p-4">
                        <div className="text-xs text-muted-foreground">{item.label}</div>
                        <div className="text-xl font-semibold">{item.value}</div>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-lg border border-border/60 bg-background p-4 text-sm text-muted-foreground">
                    Next up: Review escalation notes, sync with product, and send scheduling replies.
                  </div>
                </div>
              </Card>
            </div>
          </section>

          <section id="workflow" className="container py-16">
            <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
              <div className="space-y-5">
                <Badge variant="outline" className="w-fit border-primary/40 text-primary">
                  Workflow
                </Badge>
                <h2 className="text-3xl font-semibold" style={{ fontFamily: headingFont }}>
                  A simple loop that keeps the day moving.
                </h2>
                <p className="text-muted-foreground">
                  From the moment new messages arrive, InboxOS keeps your focus on the next best action.
                </p>
                <div className="grid gap-4">
                  {steps.map((step, index) => (
                    <div key={step.title} className="flex gap-4">
                      <div className="mt-1 h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold">
                        {index + 1}
                      </div>
                      <div>
                        <div className="text-base font-semibold">{step.title}</div>
                        <div className="text-sm text-muted-foreground">{step.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <Card className="border-border/60 bg-card/80 p-6 shadow-lg">
                <div className="grid gap-4">
                  <div className="flex items-center gap-3">
                    <LineChart className="h-5 w-5 text-primary" />
                    <div>
                      <div className="text-sm font-semibold">Workflow clarity</div>
                      <div className="text-xs text-muted-foreground">Keep work visible and on track.</div>
                    </div>
                  </div>
                  <div className="grid gap-3">
                    {[
                      "Capture every request in one place",
                      "Assign owners with quick action buttons",
                      "Move cards as status changes",
                    ].map((item) => (
                      <div key={item} className="flex items-center gap-2 text-sm">
                        <span className="h-2 w-2 rounded-full bg-primary" />
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </div>
          </section>

          <section className="container pb-20">
            <Card className="border-border/60 bg-primary text-primary-foreground p-10 shadow-xl">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-2">
                  <h2 className="text-3xl font-semibold" style={{ fontFamily: headingFont }}>
                    Ready to explore the InboxOS demo?
                  </h2>
                  <p className="text-primary-foreground/80">
                    Login to the frontend demo and see how the workflow feels end to end.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button variant="secondary" size="lg" asChild>
                    <Link to="/login">Login</Link>
                  </Button>
                  <Button variant="ghost" size="lg" asChild>
                    <a href="#features" className="text-primary-foreground">
                      Review features
                    </a>
                  </Button>
                </div>
              </div>
            </Card>
          </section>
        </main>

        <footer className="border-t border-border/60 bg-background/80">
          <div className="container flex flex-col gap-4 py-8 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
            <div>
              InboxOS - Inbox Flow frontend demo. Built for our product concept.
            </div>
            <div className="flex gap-4">
              <a href="#features" className="hover:text-foreground transition-colors">
                Features
              </a>
              <a href="#demo" className="hover:text-foreground transition-colors">
                Demo
              </a>
              <Link to="/login" className="hover:text-foreground transition-colors">
                Login
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Index;
