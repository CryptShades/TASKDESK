import Link from 'next/link';
import {
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Zap,
  Bell,
  GitBranch,
  BarChart3,
  Smartphone,
  ArrowRight,
  Shield,
} from 'lucide-react';

// ─── Nav ────────────────────────────────────────────────────────────────────

function Nav() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded bg-primary text-xs font-bold text-primary-foreground">
            T
          </span>
          <span className="text-sm font-semibold tracking-tight text-foreground">Taskdesk</span>
        </div>

        <nav className="hidden items-center gap-6 md:flex">
          <a href="#the-problem" className="text-sm text-foreground-muted transition-colors hover:text-foreground">
            The Problem
          </a>
          <a href="#how-it-works" className="text-sm text-foreground-muted transition-colors hover:text-foreground">
            How It Works
          </a>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm font-medium text-foreground-muted transition-colors hover:text-foreground"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="inline-flex h-8 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Get started
          </Link>
        </div>
      </div>
    </header>
  );
}

// ─── Hero ────────────────────────────────────────────────────────────────────

function RiskPill({
  variant,
  label,
}: {
  variant: 'normal' | 'soft' | 'hard';
  label: string;
}) {
  const styles = {
    normal: 'bg-risk-normal-bg border-risk-normal-border text-risk-normal',
    soft:   'bg-risk-soft-bg border-risk-soft-border text-risk-soft',
    hard:   'bg-risk-hard-bg border-risk-hard-border text-risk-hard',
  }[variant];

  const Icon = {
    normal: CheckCircle2,
    soft: AlertTriangle,
    hard: AlertOctagon,
  }[variant];

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${styles}`}>
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}

function HeroMockup() {
  const rows = [
    { name: 'Q2 Product Launch', client: 'Acme Corp', risk: 'hard' as const, label: 'High Risk', overdue: 4 },
    { name: 'Spring Email Series', client: 'Bright Labs', risk: 'soft' as const, label: 'At Risk', overdue: 1 },
    { name: 'Brand Refresh', client: 'Nova SaaS', risk: 'normal' as const, label: 'On Track', overdue: 0 },
  ];

  return (
    <div className="relative mx-auto w-full max-w-2xl overflow-hidden rounded-lg border border-border bg-surface shadow-2xl">
      {/* Window chrome */}
      <div className="flex items-center gap-2 border-b border-border bg-surface-raised px-4 py-3">
        <span className="h-3 w-3 rounded-full bg-risk-hard-border" />
        <span className="h-3 w-3 rounded-full bg-risk-soft-border" />
        <span className="h-3 w-3 rounded-full bg-risk-normal-border" />
        <span className="ml-2 text-xs text-foreground-muted">taskdesk.app / dashboard</span>
      </div>

      {/* Metric strip */}
      <div className="grid grid-cols-4 gap-px border-b border-border bg-border">
        {[
          { label: 'ACTIVE CAMPAIGNS', value: '12', color: 'text-primary' },
          { label: 'AT RISK', value: '2', color: 'text-risk-soft' },
          { label: 'HIGH RISK', value: '1', color: 'text-risk-hard' },
          { label: 'STALLED TODAY', value: '5', color: 'text-foreground-muted' },
        ].map((m) => (
          <div key={m.label} className="flex flex-col gap-1 bg-surface px-4 py-3">
            <span className="text-[9px] font-bold uppercase tracking-widest text-foreground-subtle">{m.label}</span>
            <span className={`font-mono text-2xl font-bold ${m.color}`}>{m.value}</span>
          </div>
        ))}
      </div>

      {/* Campaign risk table */}
      <div className="px-4 py-3">
        <p className="mb-2 text-[9px] font-bold uppercase tracking-widest text-foreground-muted">Campaign Risk</p>
        <div className="space-y-1">
          {rows.map((row) => (
            <div
              key={row.name}
              className="flex items-center justify-between rounded-md px-3 py-2 hover:bg-surface-raised"
            >
              <div className="flex min-w-0 items-center gap-3">
                <RiskPill variant={row.risk} label={row.label} />
                <span className="truncate text-sm font-medium text-foreground">{row.name}</span>
              </div>
              <div className="flex shrink-0 items-center gap-4 pl-4">
                <span className="hidden text-xs text-foreground-muted sm:block">{row.client}</span>
                {row.overdue > 0 ? (
                  <span className="font-mono text-xs font-semibold text-risk-hard">{row.overdue} overdue</span>
                ) : (
                  <span className="font-mono text-xs text-foreground-subtle">—</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Fade-out at the bottom to imply more content */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-surface to-transparent" />
    </div>
  );
}

function Hero() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-20 md:py-28">
      <div className="flex flex-col items-center text-center">
        {/* Badge */}
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary-muted bg-primary-muted/30 px-3 py-1">
          <Zap className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-medium text-primary">Campaign risk detection</span>
        </div>

        <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl">
          Know Which Campaigns Are About to Fail —{' '}
          <span className="text-primary">Before Your Client Does</span>
        </h1>

        <p className="mt-5 max-w-xl text-base leading-relaxed text-foreground-muted md:text-lg">
          Taskdesk automatically detects stalled tasks, dependency delays, and silent execution risks across all your client campaigns. No more manual chasing. No more surprises during client reviews.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/signup"
            className="inline-flex h-11 items-center gap-2 rounded-md bg-primary px-6 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Get Early Access
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="#how-it-works"
            className="inline-flex h-11 items-center rounded-md border border-border bg-surface px-6 text-sm font-semibold text-foreground transition-colors hover:bg-surface-raised"
          >
            See How It Works
          </Link>
        </div>

        <ul className="mt-8 space-y-3 text-left max-w-md">
          <li className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
            <span className="text-foreground">Detect stalled tasks before deadlines break</span>
          </li>
          <li className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
            <span className="text-foreground">Automatic escalation without manual chasing</span>
          </li>
          <li className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
            <span className="text-foreground">One founder dashboard for campaign risk visibility</span>
          </li>
        </ul>
      </div>

      {/* Dashboard preview */}
      <div className="mt-16">
        <HeroMockup />
      </div>
    </section>
  );
}

// ─── The Problem ────────────────────────────────────────────────────────────────

function TheProblem() {
  return (
    <section id="the-problem" className="border-t border-border bg-surface">
      <div className="mx-auto max-w-4xl px-6 py-20 text-center">
        <h2 className="text-3xl font-bold tracking-tight text-foreground mb-8">
          Your Problem Isn&apos;t Task Management. It&apos;s Silent Execution Risk.
        </h2>

        <div className="space-y-6 text-left max-w-2xl mx-auto">
          <p className="text-lg text-foreground-muted leading-relaxed">
            Tasks get delayed silently. Dependencies stall without notice. Founders spend 1-2 hours daily chasing updates via WhatsApp, Google Sheets, or ClickUp.
          </p>
          <p className="text-lg text-foreground-muted leading-relaxed">
            Your tools track tasks but don&apos;t surface risk. You discover problems too late — during client calls, when it&apos;s already costing you.
          </p>
          <p className="text-xl font-semibold text-foreground mt-8">
            Tracking is not visibility. Visibility is foresight.
          </p>
        </div>
      </div>
    </section>
  );
}

// ─── Real-World Scenario ──────────────────────────────────────────────────────

function RealWorldScenario() {
  return (
    <section className="border-t border-border">
      <div className="mx-auto max-w-4xl px-6 py-20">
        <h2 className="text-3xl font-bold tracking-tight text-foreground text-center mb-8">
          Real-World Scenario: The ₹2 Lakh Margin That Slipped Away
        </h2>

        <div className="space-y-6 text-left max-w-2xl mx-auto">
          <p className="text-lg text-foreground-muted leading-relaxed">
            Consider a 12-person performance marketing agency running 10 active campaigns. Slack is active, dashboards show green. But one critical dependency stalls — a creative asset delayed by a freelancer.
          </p>
          <p className="text-lg text-foreground-muted leading-relaxed">
            The deadline passes unnoticed. The client escalates.
          </p>
          <p className="text-lg text-foreground-muted leading-relaxed">
            Result: ₹2 lakh in margin lost to rushed fixes. Reputation damage from missed commitments. Founder stress from firefighting.
          </p>
          <p className="text-lg text-foreground-muted leading-relaxed">
            The team worked hard, but the system failed to flag the risk early.
          </p>
          <p className="text-xl font-semibold text-foreground mt-8">
            The issue wasn&apos;t the team. It was the absence of automated escalation.
          </p>
        </div>
      </div>
    </section>
  );
}

// ─── The Solution ──────────────────────────────────────────────────────────────

function TheSolution() {
  return (
    <section className="border-t border-border bg-surface">
      <div className="mx-auto max-w-4xl px-6 py-20 text-center">
        <h2 className="text-3xl font-bold tracking-tight text-foreground mb-8">
          Taskdesk Is a Risk Detection Engine — Not Another PM Tool.
        </h2>

        <div className="space-y-6 text-left max-w-2xl mx-auto">
          <p className="text-lg text-foreground-muted leading-relaxed">
            Taskdesk doesn&apos;t help you manage tasks. It helps you prevent failure.
          </p>
          <p className="text-lg text-foreground-muted leading-relaxed">
            Every task is event-logged. Dependencies are enforced automatically. The system detects 24-hour inactivity, overdue items, and blocked durations. Campaign-level risk scoring surfaces problems before they escalate. Structured 3-stage escalation ensures nothing gets dropped silently.
          </p>
          <p className="text-lg text-foreground-muted leading-relaxed">
            Taskdesk complements your existing tools. It adds the risk layer they lack.
          </p>
        </div>
      </div>
    </section>
  );
}

// ─── How It Works ────────────────────────────────────────────────────────────

const STEPS = [
  {
    number: '01',
    title: 'Create Campaign',
    description: 'Set up your client project with tasks and dependencies',
  },
  {
    number: '02',
    title: 'Assign Tasks',
    description: 'Distribute work to your team with clear ownership',
  },
  {
    number: '03',
    title: 'System Monitors Execution Automatically',
    description: 'No manual tracking required',
  },
  {
    number: '04',
    title: 'Get Risk Alerts Before Deadlines Break',
    description: 'Early warnings prevent failure',
  },
];

function HowItWorks() {
  return (
    <section id="how-it-works" className="border-t border-border">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            How It Works
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <div key={step.number} className="relative flex flex-col">
              {/* Connector line between steps */}
              {i < STEPS.length - 1 && (
                <div className="absolute left-[calc(100%+16px)] top-5 hidden h-px w-8 bg-border md:block" />
              )}
              <div className="mb-4 font-mono text-3xl font-bold text-foreground-subtle">{step.number}</div>
              <h3 className="mb-2 text-base font-semibold text-foreground">{step.title}</h3>
              <p className="text-sm leading-relaxed text-foreground-muted">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Founder Dashboard ────────────────────────────────────────────────────────

function FounderDashboard() {
  return (
    <section className="border-t border-border bg-surface">
      <div className="mx-auto max-w-4xl px-6 py-20 text-center">
        <h2 className="text-3xl font-bold tracking-tight text-foreground mb-8">
          One Glance. Total Campaign Health.
        </h2>

        <div className="space-y-6 text-left max-w-2xl mx-auto">
          <p className="text-lg text-foreground-muted leading-relaxed">
            The founder dashboard shows:
          </p>
          <ul className="space-y-2 text-lg text-foreground-muted">
            <li>• Total Active Campaigns</li>
            <li>• Campaigns At Risk</li>
            <li>• High Risk Campaigns</li>
            <li>• Stalled Tasks</li>
            <li>• Dependency Delays</li>
          </ul>
          <p className="text-lg text-foreground-muted leading-relaxed">
            Founders don&apos;t need more dashboards. They need a decision surface that answers: &quot;What do I need to fix today?&quot;
          </p>
        </div>
      </div>
    </section>
  );
}

// ─── Differentiation ──────────────────────────────────────────────────────────

function Differentiation() {
  return (
    <section className="border-t border-border">
      <div className="mx-auto max-w-4xl px-6 py-20">
        <h2 className="text-3xl font-bold tracking-tight text-foreground text-center mb-8">
          Taskdesk vs. Traditional Tools
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-border">
            <thead>
              <tr className="bg-surface">
                <th className="border border-border p-4 text-left font-semibold">Feature</th>
                <th className="border border-border p-4 text-left font-semibold">Taskdesk</th>
                <th className="border border-border p-4 text-left font-semibold">ClickUp/Asana/Google Sheets</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-border p-4">Risk Detection</td>
                <td className="border border-border p-4">Automatic campaign-level scoring</td>
                <td className="border border-border p-4">Manual status updates only</td>
              </tr>
              <tr className="bg-surface">
                <td className="border border-border p-4">Escalation</td>
                <td className="border border-border p-4">3-stage automated process</td>
                <td className="border border-border p-4">No built-in escalation</td>
              </tr>
              <tr>
                <td className="border border-border p-4">Dependency Enforcement</td>
                <td className="border border-border p-4">Automatic blocking and alerts</td>
                <td className="border border-border p-4">Manual dependency tracking</td>
              </tr>
              <tr className="bg-surface">
                <td className="border border-border p-4">Founder Dashboard</td>
                <td className="border border-border p-4">Risk-focused decision surface</td>
                <td className="border border-border p-4">Generic task views</td>
              </tr>
              <tr>
                <td className="border border-border p-4">Daily Check-in</td>
                <td className="border border-border p-4">2-minute risk overview</td>
                <td className="border border-border p-4">Hours of manual review</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className="text-center mt-8 text-lg text-foreground-muted">
          Taskdesk complements — it doesn&apos;t replace — your existing workflow.
        </p>
      </div>
    </section>
  );
}

// ─── Design Principles ────────────────────────────────────────────────────────

function DesignPrinciples() {
  return (
    <section className="border-t border-border bg-surface">
      <div className="mx-auto max-w-4xl px-6 py-20 text-center">
        <h2 className="text-3xl font-bold tracking-tight text-foreground mb-8">
          Built for Founders, Not Engineers
        </h2>

        <div className="space-y-6 text-left max-w-2xl mx-auto">
          <ul className="space-y-3 text-lg text-foreground-muted">
            <li>• Opinionated workflow that matches how agencies actually work</li>
            <li>• Clear signals, not noise — only what matters to founders</li>
            <li>• Minimal configuration — works out of the box</li>
            <li>• No vanity notifications — only actionable alerts</li>
            <li>• Designed for daily founder check-in, not constant monitoring</li>
          </ul>
        </div>
      </div>
    </section>
  );
}

// ─── Who It's For ─────────────────────────────────────────────────────────────

function WhoItsFor() {
  return (
    <section className="border-t border-border">
      <div className="mx-auto max-w-4xl px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight text-foreground mb-4">
            Who It&apos;s For
          </h2>
          <p className="text-lg text-foreground-muted">
            For 5–15 person agencies managing 8–20 campaigns with founder-led operations.
          </p>
          <p className="text-lg text-foreground-muted mt-4">
            If you&apos;re a founder spending hours chasing task updates and fearing client escalations, Taskdesk is built for you.
          </p>
        </div>

        <div className="text-center">
          <h3 className="text-2xl font-bold tracking-tight text-foreground mb-4">
            Who It&apos;s Not For
          </h3>
          <p className="text-lg text-foreground-muted">
            Not for freelancers, enterprises, or teams wanting CRM/analytics.
          </p>
          <p className="text-lg text-foreground-muted mt-4">
            If you&apos;re looking for generic task management or complex integrations, Taskdesk isn&apos;t it. We focus on one thing: preventing campaign failure through automated risk detection.
          </p>
        </div>
      </div>
    </section>
  );
}

// ─── Social Proof ─────────────────────────────────────────────────────────────

function SocialProof() {
  return (
    <section className="border-t border-border bg-surface">
      <div className="mx-auto max-w-4xl px-6 py-20 text-center">
        <h2 className="text-3xl font-bold tracking-tight text-foreground mb-8">
          What Founders Are Saying
        </h2>

        <div className="space-y-8">
          <blockquote className="text-lg text-foreground-muted italic">
            &quot;[Founder Name], 10-person performance agency: &apos;Taskdesk caught a ₹1.5 lakh risk before our client did. That&apos;s the difference between profit and loss.&apos;&quot;
          </blockquote>
          <blockquote className="text-lg text-foreground-muted italic">
            &quot;[Founder Name], 8-person consulting firm: &apos;Finally, a tool that tells me what&apos;s actually at risk, not just what&apos;s overdue.&apos;&quot;
          </blockquote>
          <p className="text-lg text-foreground-muted">
            *Early beta metrics: 85% reduction in manual status chasing. 92% of risks detected before client impact.*
          </p>
        </div>
      </div>
    </section>
  );
}

// ─── CTA Banner ───────────────────────────────────────────────────────────────

function CtaBanner() {
  return (
    <section className="border-t border-border bg-surface">
      <div className="mx-auto max-w-6xl px-6 py-20 text-center">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">
          Stop Discovering Risk During Client Calls.
        </h2>
        <p className="mt-4 text-base text-foreground-muted">
          Start Detecting Campaign Risk Today.
        </p>
        <p className="mt-4 text-sm text-foreground-subtle">
          If you only use Taskdesk to create tasks, it failed. If you open it daily to see what&apos;s at risk — it worked.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/signup"
            className="inline-flex h-11 items-center gap-2 rounded-md bg-primary px-8 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Start Detecting Campaign Risk Today
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 text-xs text-foreground-subtle sm:flex-row">
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded bg-primary text-[10px] font-bold text-primary-foreground">
            T
          </span>
          <span className="font-medium text-foreground-muted">Taskdesk</span>
        </div>
        <p>© 2026 Taskdesk. Campaign execution risk detection for service agencies.</p>
        <div className="flex gap-4">
          <Link href="/login" className="transition-colors hover:text-foreground-muted">Sign in</Link>
          <Link href="/signup" className="transition-colors hover:text-foreground-muted">Sign up</Link>
        </div>
      </div>
    </footer>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <TheProblem />
        <RealWorldScenario />
        <TheSolution />
        <HowItWorks />
        <FounderDashboard />
        <Differentiation />
        <DesignPrinciples />
        <WhoItsFor />
        <SocialProof />
        <CtaBanner />
      </main>
      <Footer />
    </>
  );
}
