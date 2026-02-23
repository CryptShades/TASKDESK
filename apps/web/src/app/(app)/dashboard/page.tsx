import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/services/auth/client';
import { getFounderDashboard } from '@/services/dashboard/server';
import { DashboardMetrics } from '@/components/dashboard/dashboard-metrics';
import { CampaignRiskTable } from '@/components/dashboard/campaign-risk-table';
import { DependencyAlertFeed } from '@/components/dashboard/dependency-alert-feed';
import { LastUpdated } from '@/components/dashboard/last-updated';

export default async function DashboardPage() {
  let user: Awaited<ReturnType<typeof getCurrentUser>>;

  try {
    user = await getCurrentUser();
  } catch {
    redirect('/login');
  }

  const data = await getFounderDashboard(user.org_id);

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-6">
      <div className="flex flex-col gap-3 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-[28px] font-semibold leading-tight text-foreground">
            Founder Risk Command Center
          </h1>
          <p className="mt-1 text-sm text-foreground-muted">
            Structured visibility into campaign execution risk and escalation priority.
          </p>
        </div>
        <LastUpdated />
      </div>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">Risk Summary</h2>
        <DashboardMetrics initialMetrics={data.metrics} />
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">Campaign Risk Table</h2>
        <CampaignRiskTable initialData={data.campaigns} />
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">Immediate Attention</h2>
        <DependencyAlertFeed initialAlerts={data.dependency_alerts} />
      </section>
    </div>
  );
}
