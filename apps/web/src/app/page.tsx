import { LandingNav } from '@/components/landing/nav';
import { HeroMockup } from '@/components/landing/hero-mockup';
import { FaqAccordion } from '@/components/landing/faq-accordion';
import { ScrollReveal } from '@/components/landing/scroll-reveal';

// ─── Shared primitives ────────────────────────────────────────────────────────

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="mb-4 text-[11px] font-bold uppercase tracking-[0.15em]"
      style={{ color: '#4A5068' }}
    >
      {children}
    </p>
  );
}

function PrimaryCta({ href, children, large }: { href: string; children: React.ReactNode; large?: boolean }) {
  return (
    <a
      href={href}
      className="inline-flex items-center justify-center rounded-lg font-semibold text-white transition-all duration-200"
      style={{
        background: 'linear-gradient(135deg, #3B82F6 0%, #7C3AED 100%)',
        padding: large ? '18px 40px' : '14px 28px',
        fontSize: large ? '18px' : '15px',
      }}
    >
      {children}
    </a>
  );
}

function SecondaryCta({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="inline-flex items-center justify-center rounded-lg font-semibold transition-all duration-200"
      style={{
        background: 'transparent',
        border: '1px solid #1C2030',
        color: '#8A91A8',
        padding: '14px 28px',
        fontSize: '15px',
      }}
    >
      {children}
    </a>
  );
}

function RiskBadge({
  level,
  label,
  pulse,
}: {
  level: 'green' | 'amber' | 'red' | 'violet';
  label: string;
  pulse?: boolean;
}) {
  const colors = {
    green:  { bg: 'rgba(34,197,94,0.10)',   border: 'rgba(34,197,94,0.28)',   text: '#22C55E', dot: '#22C55E' },
    amber:  { bg: 'rgba(245,158,11,0.10)',  border: 'rgba(245,158,11,0.28)',  text: '#F59E0B', dot: '#F59E0B' },
    red:    { bg: 'rgba(239,68,68,0.10)',   border: 'rgba(239,68,68,0.28)',   text: '#EF4444', dot: '#EF4444' },
    violet: { bg: 'rgba(124,58,237,0.10)',  border: 'rgba(124,58,237,0.28)', text: '#7C3AED', dot: '#7C3AED' },
  }[level];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-[11px] font-semibold ${pulse ? 'animate-risk-glow' : ''}`}
      style={{ background: colors.bg, border: `1px solid ${colors.border}`, color: colors.text }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: colors.dot }} />
      {label}
    </span>
  );
}

function GlassCard({ children, className = '', style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`glass-card rounded-xl ${className}`}
      style={style}
    >
      {children}
    </div>
  );
}

function SectionWrapper({
  id,
  children,
  className = '',
  style,
}: {
  id?: string;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <section
      id={id}
      className={`relative overflow-hidden ${className}`}
      style={style}
    >
      <div className="relative z-10 mx-auto max-w-[1200px] px-5 py-24 md:px-20 md:py-32">
        {children}
      </div>
    </section>
  );
}

// ─── Section 1: Hero ─────────────────────────────────────────────────────────

function Hero() {
  return (
    <section
      id="hero"
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden dot-grid"
      style={{ background: '#080A0F' }}
    >
      {/* Glow orbs */}
      <div className="orb-blue" style={{ top: '-100px', right: '-100px' }} />
      <div className="orb-violet" style={{ bottom: '-80px', left: '-80px' }} />

      <div className="relative z-10 mx-auto flex w-full max-w-[1200px] flex-col items-center px-5 pb-24 pt-40 text-center md:px-20 md:pt-48">
        {/* Eyebrow pill */}
        <div
          className="mb-8 inline-flex items-center gap-2 rounded-full px-4 py-1.5"
          style={{
            background: 'rgba(6, 182, 212, 0.06)',
            border: '1px solid rgba(6, 182, 212, 0.2)',
          }}
        >
          <span className="h-1.5 w-1.5 rounded-full animate-live-pulse" style={{ background: '#06B6D4' }} />
          <span
            className="text-[11px] font-semibold uppercase tracking-[0.15em]"
            style={{ color: '#06B6D4' }}
          >
            Campaign Risk Detection
          </span>
        </div>

        {/* Headline */}
        <h1
          className="mx-auto max-w-4xl font-bold leading-[1.05] tracking-tight"
          style={{ color: '#F0F2F8', fontSize: 'clamp(40px, 6vw, 68px)' }}
        >
          Know Which Campaigns<br />
          Are About To Go Wrong —{' '}
          <span className="gradient-text">Before Your Client Does.</span>
        </h1>

        {/* Subheadline */}
        <p
          className="mx-auto mt-6 max-w-[560px] leading-relaxed"
          style={{ color: '#8A91A8', fontSize: '20px' }}
        >
          Taskdesk detects stalled tasks, dependency delays, and execution risk
          automatically — so founders stop chasing updates and start preventing chaos.
        </p>

        {/* CTAs */}
        <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
          <PrimaryCta href="#pricing">Request Early Access</PrimaryCta>
          <SecondaryCta href="#how-it-works">See How It Works ↓</SecondaryCta>
        </div>

        {/* Dashboard mockup */}
        <div className="mt-20 w-full">
          <HeroMockup />
        </div>
      </div>
    </section>
  );
}

// ─── Section 2: The Problem ───────────────────────────────────────────────────

function TheProblem() {
  const bullets = [
    { icon: '⏱', text: '1–2 hours daily lost manually chasing task status across tools and Slack threads' },
    { icon: '🔗', text: 'Dependency stalls discovered live on client calls, not the day before' },
    { icon: '📅', text: 'Scope creep surfaces too late — after commitments have already been made' },
    { icon: '🚨', text: 'Launch-day scrambles caused by risks that existed for 72 hours undetected' },
  ];

  return (
    <SectionWrapper id="problem" style={{ background: '#0D1017', borderTop: '1px solid #1C2030' }}>
      <div className="mx-auto max-w-[900px]">
        <ScrollReveal>
          <Eyebrow>The Problem</Eyebrow>
          <h2
            className="font-bold leading-[1.1] tracking-tight"
            style={{ color: '#F0F2F8', fontSize: 'clamp(32px, 4vw, 48px)' }}
          >
            Your Agency Isn&apos;t Losing Clients<br />
            Because of{' '}
            <span className="gradient-text">Bad Work.</span>
          </h2>
        </ScrollReveal>

        <ScrollReveal delay={80}>
          <div className="mt-10 space-y-5">
            <p className="text-lg leading-relaxed" style={{ color: '#8A91A8' }}>
              You&apos;re losing them to silence.
            </p>
            <p className="text-lg leading-relaxed" style={{ color: '#8A91A8' }}>
              A task goes quiet. A dependency waits. A deadline arrives and nobody flagged
              the breakdown happening three days earlier. By the time you know, the client
              already feels it.
            </p>
          </div>
        </ScrollReveal>

        <div className="mt-12 space-y-4">
          {bullets.map((b, i) => (
            <ScrollReveal key={i} delay={120 + i * 80}>
              <div
                className="flex items-start gap-4 rounded-xl p-5"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderLeft: '3px solid rgba(59, 130, 246, 0.3)',
                }}
              >
                <span className="shrink-0 text-xl">{b.icon}</span>
                <p className="text-base leading-relaxed" style={{ color: '#8A91A8' }}>
                  {b.text}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>

        {/* Pull quote */}
        <ScrollReveal delay={240}>
          <GlassCard
            className="mt-14 px-8 py-7"
            style={{ borderLeft: '3px solid #3B82F6' }}
          >
            <p
              className="text-xl italic leading-relaxed"
              style={{ color: '#8A91A8' }}
            >
              &ldquo;Chaos doesn&apos;t announce itself.
              <br />
              It shows up in churn.&rdquo;
            </p>
          </GlassCard>
        </ScrollReveal>
      </div>
    </SectionWrapper>
  );
}

// ─── Section 3: The Solution ──────────────────────────────────────────────────

function TheSolution() {
  const features = [
    { icon: '⚡', title: 'Inactivity Detection', desc: 'Flags tasks with no updates beyond a configurable threshold' },
    { icon: '🔗', title: 'Dependency Tracking', desc: 'Knows when upstream work is blocking downstream delivery' },
    { icon: '📣', title: 'Overdue Escalation', desc: 'Moves unresolved tasks up the escalation chain automatically' },
    { icon: '📊', title: 'Risk Scoring', desc: 'Each campaign gets a live risk level: On Track / At Risk / High Risk' },
    { icon: '📋', title: 'Founder Digest', desc: 'Daily summary of everything at risk, nothing else' },
  ];

  return (
    <SectionWrapper id="solution" style={{ background: '#080A0F', borderTop: '1px solid #1C2030' }}>
      <div className="grid grid-cols-1 gap-16 lg:grid-cols-2 lg:items-center">
        {/* Left: copy */}
        <div>
          <ScrollReveal>
            <Eyebrow>The Solution</Eyebrow>
            <h2
              className="font-bold leading-[1.1] tracking-tight"
              style={{ color: '#F0F2F8', fontSize: 'clamp(30px, 3.5vw, 44px)' }}
            >
              Automated Risk Detection<br />
              For Campaign-Driven Agencies
            </h2>
            <p className="mt-5 text-lg leading-relaxed" style={{ color: '#8A91A8' }}>
              Taskdesk runs in the background of every campaign. It watches task activity,
              tracks dependencies, and calculates execution risk — then surfaces issues to
              the right person before they become problems.
            </p>
          </ScrollReveal>

          <div className="mt-10 space-y-4">
            {features.map((f, i) => (
              <ScrollReveal key={f.title} delay={80 + i * 60}>
                <div className="flex items-start gap-4">
                  <span
                    className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-base"
                    style={{ background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.15)' }}
                  >
                    {f.icon}
                  </span>
                  <div>
                    <p className="font-semibold" style={{ color: '#F0F2F8' }}>{f.title}</p>
                    <p className="mt-0.5 text-sm leading-relaxed" style={{ color: '#8A91A8' }}>{f.desc}</p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>

        {/* Right: side-by-side comparison */}
        <ScrollReveal delay={100}>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            {/* Left panel: typical task manager */}
            <div
              className="w-full rounded-xl p-5"
              style={{
                background: 'rgba(13,16,23,0.7)',
                border: '1px solid #1C2030',
                opacity: 0.65,
              }}
            >
              <p className="mb-4 text-[11px] font-bold uppercase tracking-widest" style={{ color: '#4A5068' }}>
                Task Manager
              </p>
              {['Apex Rebrand', 'PPC Campaign', 'SEO Sprint', 'Website Launch'].map((name) => (
                <div key={name} className="mb-2 flex items-center gap-2">
                  <span className="text-xs" style={{ color: '#22C55E' }}>✓</span>
                  <span className="text-sm" style={{ color: '#8A91A8' }}>{name}</span>
                  <span className="ml-auto text-xs font-medium" style={{ color: '#22C55E' }}>Done</span>
                </div>
              ))}
              <p className="mt-4 text-center text-xs" style={{ color: '#4A5068' }}>
                All tasks complete 🎉
              </p>
              <p className="mt-3 text-center text-[10px]" style={{ color: '#4A5068' }}>
                What your task manager shows you.
              </p>
            </div>

            {/* VS divider */}
            <div className="flex shrink-0 items-center sm:flex-col sm:py-8">
              <span
                className="rounded-full px-2 py-1 text-xs font-bold"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid #1C2030',
                  color: '#4A5068',
                }}
              >
                VS
              </span>
            </div>

            {/* Right panel: Taskdesk */}
            <div
              className="w-full rounded-xl p-5"
              style={{
                background: 'rgba(13,16,23,0.9)',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                boxShadow: '0 0 30px rgba(59, 130, 246, 0.06)',
              }}
            >
              <p className="mb-4 text-[11px] font-bold uppercase tracking-widest" style={{ color: '#3B82F6' }}>
                Taskdesk
              </p>
              <div className="space-y-3">
                {[
                  { name: 'Apex Rebrand', risk: 'red', label: 'HIGH' },
                  { name: 'PPC Campaign', risk: 'amber', label: 'RISK' },
                  { name: 'SEO Sprint', risk: 'amber', label: 'RISK' },
                  { name: 'Website Launch', risk: 'green', label: 'OK' },
                ].map((row) => (
                  <div key={row.name} className="flex items-center gap-2">
                    <RiskBadge
                      level={row.risk as 'red' | 'amber' | 'green'}
                      label={row.label}
                      pulse={row.risk === 'red'}
                    />
                    <span className="text-sm" style={{ color: '#F0F2F8' }}>{row.name}</span>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-center text-[10px]" style={{ color: '#4A5068' }}>
                What Taskdesk shows you.
              </p>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </SectionWrapper>
  );
}

// ─── Section 4: How It Works ──────────────────────────────────────────────────

function HowItWorks() {
  const steps = [
    {
      icon: '📁',
      title: 'Create Your Campaign',
      desc: 'Define your campaign, set a deadline, add team members. Takes 3 minutes. No onboarding call required.',
    },
    {
      icon: '🔗',
      title: 'Assign Tasks + Dependencies',
      desc: 'Map out your task structure. Mark which tasks depend on others. Taskdesk understands your execution graph.',
    },
    {
      icon: '🛡️',
      title: 'Taskdesk Monitors Automatically',
      desc: 'From the moment tasks are live, Taskdesk tracks activity, detects stalls, calculates risk, and escalates issues — without any manual input.',
    },
  ];

  return (
    <SectionWrapper id="how-it-works" style={{ background: '#0D1017', borderTop: '1px solid #1C2030' }}>
      <div className="text-center">
        <ScrollReveal>
          <Eyebrow>How It Works</Eyebrow>
          <h2
            className="font-bold leading-[1.1] tracking-tight"
            style={{ color: '#F0F2F8', fontSize: 'clamp(30px, 3.5vw, 44px)' }}
          >
            Up and running in minutes.<br />
            Risk analysis in hours.
          </h2>
        </ScrollReveal>

        {/* 3-step flow */}
        <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
          {steps.map((step, i) => (
            <ScrollReveal key={step.title} delay={i * 100}>
              <div className="relative flex flex-col items-center text-center">
                {/* Connector line (desktop) */}
                {i < steps.length - 1 && (
                  <div
                    className="absolute left-[calc(50%+80px)] top-8 hidden h-px md:block"
                    style={{
                      width: 'calc(100% - 40px)',
                      background: 'linear-gradient(90deg, rgba(59,130,246,0.4) 0%, rgba(59,130,246,0.1) 100%)',
                      right: 'calc(-50% - 40px)',
                    }}
                  />
                )}

                {/* Step number */}
                <div
                  className="mb-1 text-[10px] font-bold uppercase tracking-widest"
                  style={{ color: '#3B82F6' }}
                >
                  Step {String(i + 1).padStart(2, '0')}
                </div>

                {/* Icon circle */}
                <div
                  className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl text-2xl"
                  style={{
                    background: 'rgba(59, 130, 246, 0.08)',
                    border: '1px solid rgba(59, 130, 246, 0.15)',
                    boxShadow: '0 0 24px rgba(59, 130, 246, 0.1)',
                  }}
                >
                  {step.icon}
                </div>

                <h3 className="mb-3 text-lg font-semibold" style={{ color: '#F0F2F8' }}>
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: '#8A91A8' }}>
                  {step.desc}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>

        {/* Callout card */}
        <ScrollReveal delay={200}>
          <GlassCard
            className="mx-auto mt-14 max-w-2xl px-8 py-6"
            style={{ borderLeft: '3px solid #06B6D4' }}
          >
            <p className="text-lg leading-relaxed" style={{ color: '#8A91A8' }}>
              &ldquo;No daily standups to pull updates. No Slack threads to chase.
              No surprises in client reviews.&rdquo;
            </p>
          </GlassCard>
        </ScrollReveal>
      </div>
    </SectionWrapper>
  );
}

// ─── Section 5: Risk Engine Breakdown ────────────────────────────────────────

function RiskEngine() {
  const cards = [
    {
      accent: '#F59E0B',
      icon: '⚠️',
      title: 'Soft Risk',
      badge: { level: 'amber' as const, label: 'WATCH' },
      triggers: [
        'Task inactive beyond threshold',
        'Dependency has no recent progress',
        'Deadline within 48h with incomplete tasks',
      ],
      result: 'Campaign moves to "At Risk" state. Owner receives automated alert.',
    },
    {
      accent: '#EF4444',
      icon: '🔴',
      title: 'Hard Risk',
      badge: { level: 'red' as const, label: 'ACT NOW', pulse: true },
      triggers: [
        'Task blocked for more than 24 hours',
        'Dependency overdue with no resolution',
        'Campaign deadline breached',
      ],
      result: 'Escalation fires. Manager and Founder are notified. Audit trail created.',
    },
    {
      accent: '#7C3AED',
      icon: '↗️',
      title: 'Escalation Chain',
      badge: { level: 'violet' as const, label: 'AUTO' },
      triggers: [
        '1. Task Owner notified first',
        '2. Campaign Manager if unresolved',
        '3. Founder digest if issue persists',
      ],
      result: 'Full audit log captured at every step.',
    },
  ];

  return (
    <SectionWrapper id="risk-engine" style={{ background: '#080A0F', borderTop: '1px solid #1C2030' }}>
      <div className="text-center">
        <ScrollReveal>
          <Eyebrow>Risk Engine</Eyebrow>
          <h2
            className="font-bold leading-[1.1] tracking-tight"
            style={{ color: '#F0F2F8', fontSize: 'clamp(30px, 3.5vw, 44px)' }}
          >
            Two risk states. One escalation path.
            <br />
            Zero manual work.
          </h2>
        </ScrollReveal>

        <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
          {cards.map((card, i) => (
            <ScrollReveal key={card.title} delay={i * 100}>
              <GlassCard
                className="flex flex-col p-6 text-left"
                style={{ borderTop: `2px solid ${card.accent}` }}
              >
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{card.icon}</span>
                    <h3 className="font-semibold" style={{ color: '#F0F2F8' }}>{card.title}</h3>
                  </div>
                  <RiskBadge level={card.badge.level} label={card.badge.label} pulse={card.badge.pulse} />
                </div>

                <p className="mb-3 text-[10px] font-bold uppercase tracking-widest" style={{ color: '#4A5068' }}>
                  Triggered by:
                </p>
                <ul className="mb-5 space-y-1.5">
                  {card.triggers.map((t) => (
                    <li key={t} className="flex items-start gap-2 text-sm" style={{ color: '#8A91A8' }}>
                      <span className="mt-1 shrink-0 h-1 w-1 rounded-full" style={{ background: card.accent }} />
                      {t}
                    </li>
                  ))}
                </ul>

                <div
                  className="mt-auto rounded-lg p-3 text-sm leading-snug"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', color: '#8A91A8' }}
                >
                  {card.result}
                </div>
              </GlassCard>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal delay={200}>
          <p className="mt-12 text-lg" style={{ color: '#8A91A8' }}>
            Built on rules, not AI guesses.{' '}
            <span style={{ color: '#F0F2F8' }}>Deterministic risk logic your team can trust.</span>
          </p>
        </ScrollReveal>
      </div>
    </SectionWrapper>
  );
}

// ─── Section 6: Founder Dashboard ────────────────────────────────────────────

function FounderDashboard() {
  const statCards = [
    { label: 'Active Campaigns', value: '12', color: '#3B82F6', border: '#3B82F6' },
    { label: 'At Risk', value: '4', color: '#F59E0B', border: '#F59E0B', sub: '▲ 2 from yesterday' },
    { label: 'High Risk', value: '2', color: '#EF4444', border: '#EF4444', sub: '🔴 Action Required' },
    { label: 'Tasks Stalled Today', value: '7', color: '#4A5068', border: 'transparent' },
  ];

  const alerts = [
    { risk: 'red', name: 'Apex Fintech Q1 Rebrand', label: 'HIGH RISK', desc: 'Copy review task blocked 26h · Escalated to manager' },
    { risk: 'amber', name: 'Momentum Capital PPC Sprint', label: 'AT RISK', desc: 'Ad creative dependency stalled · Deadline in 2 days' },
  ];

  const features = [
    { icon: '☀️', title: 'Morning Digest', desc: 'Summary of all risks delivered daily at 8am' },
    { icon: '📡', title: 'Escalation Visibility', desc: 'See who was notified and when' },
    { icon: '🎯', title: 'No Context Switching', desc: 'All risk signals in one place' },
    { icon: '🔍', title: 'Drill Down', desc: 'Click any campaign to see the full dependency map' },
  ];

  return (
    <SectionWrapper id="dashboard" style={{ background: '#0D1017', borderTop: '1px solid #1C2030' }}>
      <div className="grid grid-cols-1 gap-16 lg:grid-cols-2 lg:items-center">
        {/* Copy left */}
        <div>
          <ScrollReveal>
            <Eyebrow>Founder View</Eyebrow>
            <h2
              className="font-bold leading-[1.1] tracking-tight"
              style={{ color: '#F0F2F8', fontSize: 'clamp(30px, 3.5vw, 44px)' }}
            >
              Replace 2 hours of daily chasing
              <br />
              with{' '}
              <span className="gradient-text">2 minutes of clarity.</span>
            </h2>
            <p className="mt-5 text-lg leading-relaxed" style={{ color: '#8A91A8' }}>
              Every morning, Taskdesk shows you exactly what needs your attention. Not a
              list of 200 tasks. The 3 things that could break this week.
            </p>
          </ScrollReveal>

          <div className="mt-10 space-y-5">
            {features.map((f, i) => (
              <ScrollReveal key={f.title} delay={80 + i * 60}>
                <div className="flex items-start gap-3">
                  <span className="text-lg">{f.icon}</span>
                  <div>
                    <span className="font-semibold" style={{ color: '#F0F2F8' }}>{f.title}</span>
                    <span style={{ color: '#4A5068' }}> — </span>
                    <span className="text-sm" style={{ color: '#8A91A8' }}>{f.desc}</span>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>

        {/* Dashboard mockup right */}
        <ScrollReveal delay={120}>
          <div
            className="overflow-hidden rounded-xl"
            style={{ background: '#0D1017', border: '1px solid #1C2030', boxShadow: '0 0 60px rgba(59,130,246,0.07)' }}
          >
            {/* Stat cards */}
            <div className="grid grid-cols-2 border-b" style={{ borderColor: '#1C2030' }}>
              {statCards.map((s, i) => (
                <div
                  key={s.label}
                  className="flex flex-col gap-1.5 p-4"
                  style={{
                    borderRight: i % 2 === 0 ? '1px solid #1C2030' : undefined,
                    borderBottom: i < 2 ? '1px solid #1C2030' : undefined,
                    borderTop: `2px solid ${s.border}`,
                  }}
                >
                  <p className="text-3xl font-bold font-mono" style={{ color: s.color }}>{s.value}</p>
                  <p className="text-xs" style={{ color: '#4A5068' }}>{s.label}</p>
                  {s.sub && <p className="text-[10px]" style={{ color: s.color }}>{s.sub}</p>}
                </div>
              ))}
            </div>

            {/* Alerts panel */}
            <div className="p-4">
              <div className="mb-3 flex items-center gap-2">
                <span className="text-sm">⚡</span>
                <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: '#F59E0B' }}>
                  Requires Action
                </p>
              </div>
              <div className="space-y-2">
                {alerts.map((alert) => (
                  <div
                    key={alert.name}
                    className="rounded-lg p-3"
                    style={{
                      background: alert.risk === 'red' ? 'rgba(239,68,68,0.04)' : 'rgba(245,158,11,0.04)',
                      border: `1px solid ${alert.risk === 'red' ? 'rgba(239,68,68,0.12)' : 'rgba(245,158,11,0.12)'}`,
                    }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <RiskBadge
                          level={alert.risk as 'red' | 'amber'}
                          label={alert.label}
                          pulse={alert.risk === 'red'}
                        />
                        <span className="text-sm font-medium truncate" style={{ color: '#F0F2F8' }}>
                          {alert.name}
                        </span>
                      </div>
                    </div>
                    <p className="mt-1.5 text-xs" style={{ color: '#4A5068' }}>{alert.desc}</p>
                    <p className="mt-2 text-[10px] font-medium" style={{ color: '#3B82F6' }}>View Campaign →</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </SectionWrapper>
  );
}

// ─── Section 7: Comparison Table ─────────────────────────────────────────────

function Comparison() {
  const rows = [
    { feature: 'Tracks tasks and deadlines', asana: '✓ Yes', taskdesk: '✓ Yes', asanaColor: '#22C55E', tdColor: '#22C55E' },
    { feature: 'Detects execution risk automatically', asana: '✗ No', taskdesk: '✓ Yes', asanaColor: '#4A5068', tdColor: '#22C55E' },
    { feature: 'Enforces task dependencies', asana: 'Partial', taskdesk: '✓ Yes', asanaColor: '#4A5068', tdColor: '#22C55E' },
    { feature: 'Escalates issues without manual input', asana: '✗ No', taskdesk: '✓ Yes', asanaColor: '#4A5068', tdColor: '#22C55E' },
    { feature: 'Founder risk digest view', asana: '✗ No', taskdesk: '✓ Yes', asanaColor: '#4A5068', tdColor: '#22C55E' },
    { feature: 'Built for 5–15 person agencies', asana: 'Generic', taskdesk: '✓ Purpose-built', asanaColor: '#4A5068', tdColor: '#22C55E' },
    { feature: 'Risk-level scoring per campaign', asana: '✗ No', taskdesk: '✓ Yes', asanaColor: '#4A5068', tdColor: '#22C55E' },
  ];

  return (
    <SectionWrapper id="comparison" style={{ background: '#080A0F', borderTop: '1px solid #1C2030' }}>
      <div className="text-center">
        <ScrollReveal>
          <Eyebrow>Comparison</Eyebrow>
          <h2
            className="font-bold leading-[1.1] tracking-tight"
            style={{ color: '#F0F2F8', fontSize: 'clamp(30px, 3.5vw, 44px)' }}
          >
            Built for risk detection.
            <br />
            Not task collection.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed" style={{ color: '#8A91A8' }}>
            Asana and ClickUp are excellent tools for organizing work. Taskdesk is built
            for something different: knowing when work is about to fail.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={100}>
          <div className="mx-auto mt-14 max-w-3xl overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th
                    className="py-4 pl-5 pr-4 text-left text-sm font-semibold"
                    style={{ color: '#4A5068', borderBottom: '1px solid #1C2030' }}
                  >
                    Feature
                  </th>
                  <th
                    className="px-4 py-4 text-center text-sm font-semibold"
                    style={{ color: '#4A5068', borderBottom: '1px solid #1C2030' }}
                  >
                    Asana / ClickUp
                  </th>
                  <th
                    className="px-4 py-4 text-center text-sm font-semibold"
                    style={{
                      borderBottom: '1px solid rgba(59,130,246,0.3)',
                      borderLeft: '1px solid rgba(59,130,246,0.15)',
                      background: 'rgba(59,130,246,0.04)',
                    }}
                  >
                    <span className="gradient-text">Taskdesk</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr
                    key={row.feature}
                    style={{ background: i % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent' }}
                  >
                    <td
                      className="py-4 pl-5 pr-4 text-left text-sm"
                      style={{ color: '#8A91A8', borderBottom: '1px solid #1C2030' }}
                    >
                      {row.feature}
                    </td>
                    <td
                      className="px-4 py-4 text-center text-sm"
                      style={{ color: row.asanaColor, borderBottom: '1px solid #1C2030' }}
                    >
                      {row.asana}
                    </td>
                    <td
                      className="px-4 py-4 text-center text-sm font-medium"
                      style={{
                        color: row.tdColor,
                        borderBottom: '1px solid rgba(59,130,246,0.1)',
                        borderLeft: '1px solid rgba(59,130,246,0.1)',
                        background: 'rgba(59,130,246,0.03)',
                      }}
                    >
                      {row.taskdesk}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={150}>
          <p className="mt-12 text-xl font-medium" style={{ color: '#F0F2F8' }}>
            You don&apos;t need another task manager.
            <br />
            <span style={{ color: '#8A91A8' }}>You need to know what&apos;s about to break.</span>
          </p>
        </ScrollReveal>
      </div>
    </SectionWrapper>
  );
}

// ─── Section 8: Who It's For ──────────────────────────────────────────────────

function WhoItsFor() {
  const cards = [
    {
      icon: '🧭',
      title: 'For Founders',
      intro: 'You manage 8–20 campaigns and you\'re the last person to know when one is in trouble.',
      body: 'Taskdesk gives you a daily risk view so you can stay strategic without being in the weeds.',
      bullets: ['No more surprise client calls', 'No more chasing team status', 'Full visibility in under 2 minutes'],
    },
    {
      icon: '🗂️',
      title: 'For Campaign Managers',
      intro: 'You\'re responsible for delivery, but you can\'t watch every task every day.',
      body: 'Taskdesk monitors your campaigns continuously and alerts you before dependencies break timelines.',
      bullets: ['Proactive, not reactive', 'Escalation handled automatically', 'Focus on decisions, not monitoring'],
    },
    {
      icon: '✅',
      title: 'For Team Members',
      intro: 'You do the work. You shouldn\'t need to file status reports to prove it.',
      body: 'Taskdesk measures activity, not updates. Your work speaks for itself.',
      bullets: ['Clear task ownership', 'Dependency visibility', 'No micromanagement overhead'],
    },
  ];

  return (
    <SectionWrapper id="audience" style={{ background: '#0D1017', borderTop: '1px solid #1C2030' }}>
      <div className="text-center">
        <ScrollReveal>
          <Eyebrow>Target Audience</Eyebrow>
          <h2
            className="font-bold leading-[1.1] tracking-tight"
            style={{ color: '#F0F2F8', fontSize: 'clamp(30px, 3.5vw, 44px)' }}
          >
            Built for every seat in your agency.
          </h2>
        </ScrollReveal>

        <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
          {cards.map((card, i) => (
            <ScrollReveal key={card.title} delay={i * 100}>
              <GlassCard className="flex flex-col p-7 text-left h-full">
                <span className="mb-4 text-3xl">{card.icon}</span>
                <h3 className="mb-3 text-lg font-semibold" style={{ color: '#F0F2F8' }}>{card.title}</h3>
                <p className="mb-3 text-sm leading-relaxed" style={{ color: '#8A91A8' }}>{card.intro}</p>
                <p className="mb-5 text-sm leading-relaxed" style={{ color: '#8A91A8' }}>{card.body}</p>
                <ul className="mt-auto space-y-2">
                  {card.bullets.map((b) => (
                    <li key={b} className="flex items-center gap-2 text-sm" style={{ color: '#8A91A8' }}>
                      <span style={{ color: '#3B82F6' }}>·</span> {b}
                    </li>
                  ))}
                </ul>
              </GlassCard>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </SectionWrapper>
  );
}

// ─── Section 9: Security & Architecture ──────────────────────────────────────

function Security() {
  const pillars = [
    { icon: '🗄️', title: 'Supabase Backend', desc: 'PostgreSQL on Supabase with enterprise-grade availability' },
    { icon: '🔒', title: 'Row-Level Security', desc: 'Every query is scoped. Users only access their own data' },
    { icon: '📋', title: 'Event Audit Logs', desc: 'Every escalation, status change, and access event is recorded' },
    { icon: '⚡', title: 'Real-Time Updates', desc: 'Supabase Realtime ensures risk signals appear instantly' },
    { icon: '📱', title: 'Web + Mobile', desc: 'Full-featured web app plus native mobile via Expo React Native' },
    { icon: '🏠', title: 'Isolated Workspaces', desc: "Each company's data is fully isolated at the database level" },
  ];

  return (
    <SectionWrapper id="security" style={{ background: '#080A0F', borderTop: '1px solid #1C2030' }}>
      <div className="grid grid-cols-1 gap-16 lg:grid-cols-2 lg:items-center">
        {/* Left: copy */}
        <ScrollReveal>
          <Eyebrow>Security & Infrastructure</Eyebrow>
          <h2
            className="font-bold leading-[1.1] tracking-tight"
            style={{ color: '#F0F2F8', fontSize: 'clamp(30px, 3.5vw, 44px)' }}
          >
            Built for client data.
            <br />
            Architected for trust.
          </h2>
          <p className="mt-5 text-lg leading-relaxed" style={{ color: '#8A91A8' }}>
            Taskdesk handles sensitive campaign data for client-facing agencies. Security
            isn&apos;t optional — it&apos;s built into the foundation.
          </p>

          {/* Trust badges */}
          <div className="mt-10 flex flex-wrap items-center gap-4">
            {['Supabase', 'PostgreSQL', 'Expo'].map((badge) => (
              <div
                key={badge}
                className="rounded-lg px-4 py-2 text-sm font-medium"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  color: '#4A5068',
                }}
              >
                {badge}
              </div>
            ))}
          </div>
        </ScrollReveal>

        {/* Right: tech pillars grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {pillars.map((p, i) => (
            <ScrollReveal key={p.title} delay={60 + i * 60}>
              <div
                className="rounded-xl p-4"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <div className="mb-2 flex items-center gap-2.5">
                  <span className="text-lg">{p.icon}</span>
                  <p className="text-sm font-semibold" style={{ color: '#F0F2F8' }}>{p.title}</p>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: '#8A91A8' }}>{p.desc}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </SectionWrapper>
  );
}

// ─── Section 10: Testimonials ─────────────────────────────────────────────────

function Testimonials() {
  const testimonials = [
    {
      quote: 'We were running 14 campaigns with a team of 9. Every Monday I\'d spend 2 hours just figuring out what was actually at risk. Taskdesk replaced that with a single view. The clarity is worth it alone.',
      name: 'Jordan M.',
      role: 'Founder, Performance Agency',
      meta: '12-person team · 14 active campaigns',
      initials: 'JM',
      color: '#3B82F6',
    },
    {
      quote: 'The escalation system changed how our team operates. Nobody waits for a standup anymore. If something stalls, Taskdesk catches it and the right person already knows.',
      name: 'Sarah K.',
      role: 'Campaign Director, Growth Studio',
      meta: '8-person team · Digital marketing agency',
      initials: 'SK',
      color: '#7C3AED',
    },
    {
      quote: 'I stopped dreading client calls. Before Taskdesk, every call was a potential surprise. Now I walk in knowing exactly where we stand on every active project.',
      name: 'Alex R.',
      role: 'Co-founder, Dev & Marketing Agency',
      meta: '11-person team · 20 active campaigns',
      initials: 'AR',
      color: '#06B6D4',
    },
  ];

  return (
    <SectionWrapper id="testimonials" style={{ background: '#0D1017', borderTop: '1px solid #1C2030' }}>
      <div className="text-center">
        <ScrollReveal>
          <Eyebrow>Early Feedback</Eyebrow>
          <h2
            className="font-bold leading-[1.1] tracking-tight"
            style={{ color: '#F0F2F8', fontSize: 'clamp(30px, 3.5vw, 44px)' }}
          >
            Operators who stopped discovering
            <br />
            risk in client calls.
          </h2>
        </ScrollReveal>

        <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <ScrollReveal key={t.name} delay={i * 100}>
              <GlassCard className="flex flex-col p-7 text-left h-full">
                {/* Decorative quote */}
                <span
                  className="mb-4 block text-5xl font-bold leading-none"
                  style={{
                    background: `linear-gradient(135deg, ${t.color} 0%, rgba(255,255,255,0.05) 100%)`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  &ldquo;
                </span>
                <p className="mb-6 flex-1 text-sm leading-relaxed" style={{ color: '#8A91A8' }}>
                  {t.quote}
                </p>
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                    style={{ background: t.color }}
                  >
                    {t.initials}
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: '#F0F2F8' }}>{t.name}</p>
                    <p className="text-xs" style={{ color: '#4A5068' }}>{t.role}</p>
                  </div>
                </div>
                <p className="mt-3 text-[10px]" style={{ color: '#4A5068' }}>{t.meta}</p>
              </GlassCard>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </SectionWrapper>
  );
}

// ─── Section 11: FAQ ──────────────────────────────────────────────────────────

function Faq() {
  return (
    <SectionWrapper id="faq" style={{ background: '#080A0F', borderTop: '1px solid #1C2030' }}>
      <div className="mx-auto max-w-[720px]">
        <ScrollReveal>
          <Eyebrow>FAQ</Eyebrow>
          <h2
            className="mb-12 font-bold leading-[1.1] tracking-tight"
            style={{ color: '#F0F2F8', fontSize: 'clamp(30px, 3.5vw, 44px)' }}
          >
            Straight answers.
          </h2>
        </ScrollReveal>
        <FaqAccordion />
      </div>
    </SectionWrapper>
  );
}

// ─── Section 12: Pricing ──────────────────────────────────────────────────────

function Pricing() {
  const included = [
    'Unlimited Users',
    'Unlimited Campaigns',
    'Full Risk Detection Engine',
    'Escalation System',
    'Founder Dashboard',
    'Web + Mobile App',
    'Priority Support',
  ];

  return (
    <SectionWrapper id="pricing" style={{ background: '#0D1017', borderTop: '1px solid #1C2030' }}>
      <div className="text-center">
        <ScrollReveal>
          <Eyebrow>Pricing</Eyebrow>
          <h2
            className="font-bold leading-[1.1] tracking-tight"
            style={{ color: '#F0F2F8', fontSize: 'clamp(30px, 3.5vw, 44px)' }}
          >
            One plan. One team.
            <br />
            Unlimited campaigns.
          </h2>
          <p className="mx-auto mt-4 max-w-md text-lg leading-relaxed" style={{ color: '#8A91A8' }}>
            Per company subscription. No per-seat pricing. No feature gating.
            Everything included from day one.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={100}>
          <div
            className="mx-auto mt-14 max-w-md overflow-hidden rounded-2xl"
            style={{
              background: '#111520',
              border: '1px solid #1C2030',
              borderTop: '2px solid transparent',
              backgroundClip: 'padding-box',
              boxShadow: '0 0 60px rgba(59, 130, 246, 0.1), 0 0 0 1px rgba(59,130,246,0.15)',
            }}
          >
            {/* Gradient top border */}
            <div
              className="h-0.5 w-full"
              style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #7C3AED 100%)' }}
            />

            <div className="p-10">
              {/* Badge */}
              <div className="mb-6 flex justify-center">
                <span
                  className="rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest"
                  style={{
                    background: 'rgba(59,130,246,0.08)',
                    border: '1px solid rgba(59,130,246,0.2)',
                    color: '#3B82F6',
                  }}
                >
                  ✦ Early Access
                </span>
              </div>

              <h3 className="mb-1 text-2xl font-bold" style={{ color: '#F0F2F8' }}>
                Founding Member Pricing
              </h3>
              <p className="mb-8 text-4xl font-bold" style={{ color: '#8A91A8' }}>
                Coming Soon
              </p>

              {/* Feature list */}
              <ul className="mb-8 space-y-3 text-left">
                {included.map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm" style={{ color: '#8A91A8' }}>
                    <span style={{ color: '#22C55E' }}>✓</span>
                    {item}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <a
                href="mailto:hello@taskdesk.app"
                className="block w-full rounded-lg py-4 text-center text-sm font-semibold text-white transition-all duration-200"
                style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #7C3AED 100%)' }}
              >
                Join Early Access — Lock Your Spot
              </a>

              <p className="mt-5 text-center text-xs" style={{ color: '#4A5068' }}>
                &ldquo;Early access members get founding pricing locked for life.&rdquo;
              </p>
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={150}>
          <p className="mt-6 text-sm" style={{ color: '#4A5068' }}>
            No credit card required to join the waitlist.
          </p>
        </ScrollReveal>
      </div>
    </SectionWrapper>
  );
}

// ─── Section 13: Final CTA ────────────────────────────────────────────────────

function FinalCta() {
  return (
    <section
      id="get-started"
      className="relative overflow-hidden"
      style={{ background: '#080A0F', borderTop: '1px solid rgba(59, 130, 246, 0.12)' }}
    >
      {/* Center glow orb */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{
          width: '800px',
          height: '800px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, rgba(124, 58, 237, 0.06) 40%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />

      <div className="relative z-10 mx-auto max-w-[1200px] px-5 py-36 text-center md:px-20">
        <ScrollReveal>
          <h2
            className="mx-auto max-w-3xl font-bold leading-[1.05] tracking-tight"
            style={{ color: '#F0F2F8', fontSize: 'clamp(36px, 5vw, 72px)' }}
          >
            Stop Discovering Risk
            <br />
            During{' '}
            <span className="gradient-text">Client Calls.</span>
          </h2>
        </ScrollReveal>

        <ScrollReveal delay={80}>
          <p
            className="mx-auto mt-6 max-w-lg text-xl leading-relaxed"
            style={{ color: '#8A91A8' }}
          >
            Join agencies already using Taskdesk to replace reactive firefighting
            with proactive risk control.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={140}>
          <div className="mt-10">
            <PrimaryCta href="mailto:hello@taskdesk.app" large>
              Get Early Access to Taskdesk →
            </PrimaryCta>
          </div>
          <p className="mt-5 text-sm" style={{ color: '#4A5068' }}>
            Free to join · No credit card required · Founding pricing locked for early members
          </p>
        </ScrollReveal>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer() {
  const cols = [
    {
      title: 'Product',
      links: ['How It Works', 'Features', 'Pricing', 'Changelog'],
    },
    {
      title: 'Company',
      links: ['About', 'Security', 'Privacy Policy', 'Terms of Service'],
    },
    {
      title: 'Resources',
      links: ['Contact', 'FAQ', 'Documentation'],
    },
  ];

  return (
    <footer style={{ background: '#080A0F', borderTop: '1px solid #1C2030' }}>
      <div className="mx-auto max-w-[1200px] px-5 pb-10 pt-16 md:px-20">
        {/* Top row */}
        <div className="mb-12 flex flex-col justify-between gap-6 sm:flex-row sm:items-start">
          <div>
            <span className="text-sm font-bold tracking-[-0.01em]" style={{ color: '#F0F2F8' }}>
              TASKDESK
            </span>
            <p className="mt-1 text-xs" style={{ color: '#4A5068' }}>
              Campaign Risk Detection
            </p>
          </div>
          <a
            href="#pricing"
            className="inline-flex items-center rounded-lg px-4 py-2 text-[13px] font-semibold text-white"
            style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #7C3AED 100%)' }}
          >
            Request Early Access
          </a>
        </div>

        {/* Link columns */}
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-4">
          {cols.map((col) => (
            <div key={col.title}>
              <p className="mb-4 text-[11px] font-bold uppercase tracking-widest" style={{ color: '#4A5068' }}>
                {col.title}
              </p>
              <ul className="space-y-3">
                {col.links.map((link) => (
                  <li key={link}>
                    <a href="#" className="hover-muted text-sm">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Social */}
          <div>
            <p className="mb-4 text-[11px] font-bold uppercase tracking-widest" style={{ color: '#4A5068' }}>
              Social
            </p>
            <ul className="space-y-3">
              {[
                { label: 'LinkedIn', icon: '↗' },
                { label: 'Twitter / X', icon: '↗' },
              ].map((s) => (
                <li key={s.label}>
                  <a href="#" className="hover-muted flex items-center gap-1.5 text-sm">
                    {s.label} <span className="text-xs">{s.icon}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="mt-14 flex flex-col items-start justify-between gap-4 border-t pt-6 text-xs sm:flex-row sm:items-center"
          style={{ borderColor: '#1C2030', color: '#4A5068' }}
        >
          <p>© 2026 Taskdesk. All rights reserved.</p>
          <div className="flex gap-5">
            {['Privacy', 'Terms', 'Security'].map((l) => (
              <a key={l} href="#" className="transition-colors hover:text-[#8A91A8]">{l}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <>
      <LandingNav />
      <main>
        <Hero />
        <TheProblem />
        <TheSolution />
        <HowItWorks />
        <RiskEngine />
        <FounderDashboard />
        <Comparison />
        <WhoItsFor />
        <Security />
        <Testimonials />
        <Faq />
        <Pricing />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}
