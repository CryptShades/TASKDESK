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
    <div className="space-y-6 p-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
        <LastUpdated />
      </div>

      {/* Row 1 — Metric cards (4-up on desktop, 2-up on tablet/mobile) */}
      <DashboardMetrics initialMetrics={data.metrics} />

      {/* Row 2 — 65/35 split on desktop, stacked on tablet/mobile */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[65fr_35fr]">
        <CampaignRiskTable initialData={data.campaigns} />
        <DependencyAlertFeed initialAlerts={data.dependency_alerts} />
      </div>
    </div>
  );
}
