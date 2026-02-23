'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { AlertOctagon } from 'lucide-react';

interface AlertItem {
  id: string;
  title: string;
  campaign: { id: string; name: string };
  dependency_gap_hours: number;
}

interface Props {
  initialAlerts: AlertItem[];
}

const HARD_RISK_GAP_HOURS = 24;

export function DependencyAlertFeed({ initialAlerts }: Props) {
  const urgentAlerts = useMemo(
    () =>
      initialAlerts
        .filter((item) => item.dependency_gap_hours >= HARD_RISK_GAP_HOURS)
        .sort((a, b) => b.dependency_gap_hours - a.dependency_gap_hours),
    [initialAlerts]
  );

  return (
    <section className="rounded-[16px] border border-border bg-surface shadow-[var(--panel-shadow)]">
      <header className="border-b border-border px-5 py-4">
        <h2 className="text-xl font-semibold text-foreground">Urgent Escalations</h2>
        <p className="mt-1 text-sm text-foreground-muted">
          Hard-risk dependency chains requiring founder intervention.
        </p>
      </header>

      {urgentAlerts.length === 0 ? (
        <div className="px-5 py-10 text-center">
          <p className="text-sm font-medium text-foreground">No urgent escalations.</p>
          <p className="mt-1 text-sm text-foreground-muted">
            High-risk blockers will appear here when escalation reaches stage 3.
          </p>
        </div>
      ) : (
        <div aria-live="polite" className="divide-y divide-border">
          <div className="mx-5 mt-4 rounded-[10px] border border-risk-hard-border bg-risk-hard-bg/20 px-3 py-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-risk-hard">
              Stage 3 Escalation Active
            </p>
          </div>

          {urgentAlerts.map((alert) => (
            <div key={alert.id} className="flex items-start gap-3 px-5 py-4">
              <AlertOctagon className="mt-0.5 h-4 w-4 shrink-0 text-risk-hard" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">{alert.campaign.name}</p>
                <p className="mt-0.5 text-sm text-foreground-muted">&ldquo;{alert.title}&rdquo;</p>
                <p className="mt-1 text-xs text-risk-hard">Dependency gap: {alert.dependency_gap_hours}h</p>
              </div>
              <Link
                href={`/campaigns/${alert.campaign.id}/tasks/${alert.id}`}
                className="shrink-0 text-xs font-semibold text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary rounded"
              >
                Resolve
              </Link>
            </div>
          ))}

          <div className="px-5 py-3">
            <Link
              href="/escalations"
              className="text-sm font-semibold text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary rounded"
            >
              Open Escalation Center
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}
