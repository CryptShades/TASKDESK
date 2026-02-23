'use client';

import { MetricCard } from '@/components/ui/metric-card';

interface Metrics {
  active_count: number;
  at_risk_count: number;
  high_risk_count: number;
  stalled_tasks_count: number;
}

interface Props {
  initialMetrics: Metrics;
}

export function DashboardMetrics({ initialMetrics }: Props) {
  const metrics = initialMetrics;

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <MetricCard
        label="High Risk"
        value={metrics.high_risk_count}
        variant="hard"
        description="Requires immediate founder attention"
        valueClassName={metrics.high_risk_count > 0 ? 'text-risk-hard' : undefined}
      />
      <MetricCard
        label="At Risk"
        value={metrics.at_risk_count}
        variant="soft"
        description="Needs proactive intervention"
        valueClassName={metrics.at_risk_count > 0 ? 'text-risk-soft' : undefined}
      />
      <MetricCard
        label="Normal"
        value={metrics.active_count}
        variant="normal"
        description="Running within expected plan"
        valueClassName={metrics.active_count > 0 ? 'text-risk-normal' : undefined}
      />
    </div>
  );
}
