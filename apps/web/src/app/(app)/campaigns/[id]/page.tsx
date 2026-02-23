import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser } from '@/services/auth/client';
import { getCampaignById } from '@/services/campaign.service';
import { RiskBadge } from '@/components/ui/risk-badge';
import { CampaignTaskList } from '@/components/campaigns/campaign-task-list';
import { DependencyChain } from '@/components/campaigns/dependency-chain';
import { getRiskVariant, formatCountdown, cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatRelative(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  return `${diffDays}d ago`;
}

interface StatChipProps {
  label: string;
  value: number;
  highlight?: 'red' | 'purple';
}

function StatChip({ label, value, highlight }: StatChipProps) {
  return (
    <div className="flex items-center gap-2 px-4">
      <span
        className={cn(
          'font-mono text-xl font-semibold',
          highlight === 'red' && value > 0 ? 'text-risk-hard' :
          highlight === 'purple' && value > 0 ? 'text-risk-blocked' :
          'text-foreground'
        )}
      >
        {value}
      </span>
      <span className="text-xs text-foreground-muted">{label}</span>
    </div>
  );
}

export default async function CampaignDetailPage({
  params,
}: {
  params: { id: string };
}) {
  let user: Awaited<ReturnType<typeof getCurrentUser>>;
  try {
    user = await getCurrentUser();
  } catch {
    redirect('/login');
  }

  let campaign: Awaited<ReturnType<typeof getCampaignById>>;
  try {
    campaign = await getCampaignById(params.id, user.org_id);
  } catch {
    notFound();
  }

  const tasks = (campaign as any).tasks ?? [];
  const client = (campaign as any).client;

  // Compute stats
  const now = new Date();
  const totalTasks = tasks.length;
  const completedCount = tasks.filter((t: any) => t.status === 'completed').length;
  const overdueCount = tasks.filter(
    (t: any) => t.status !== 'completed' && new Date(t.due_date) < now
  ).length;
  const blockedCount = tasks.filter((t: any) => t.status === 'blocked').length;

  const isFounderOrManager = user.role === 'founder' || user.role === 'manager';
  const isFounder = user.role === 'founder';
  const riskVariant = getRiskVariant(campaign.risk_status);

  const launchPassed = new Date(campaign.launch_date) < now;

  return (
    <div className="space-y-6 p-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          {/* Back link */}
          <Link
            href="/campaigns"
            className="mb-2 inline-flex items-center gap-1 text-xs text-foreground-muted hover:text-foreground focus:outline-none"
          >
            ← All Campaigns
          </Link>
          <h1 className="text-2xl font-semibold text-foreground">{campaign.name}</h1>
          <p className="mt-1 text-sm text-foreground-muted">
            <span>{client?.name ?? 'Unknown Client'}</span>
            <span className="mx-1.5 text-foreground-subtle">·</span>
            <span>
              Launch:{' '}
              <span
                className={cn(
                  'font-medium',
                  launchPassed ? 'text-risk-hard' : 'text-foreground'
                )}
              >
                {formatDate(campaign.launch_date)}
              </span>{' '}
              <span
                className={cn(
                  'text-xs',
                  launchPassed ? 'text-risk-hard' : 'text-foreground-muted'
                )}
              >
                ({formatCountdown(campaign.launch_date)})
              </span>
            </span>
          </p>
        </div>

        {/* Right side: risk badge + actions */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-col items-end gap-1">
            <RiskBadge variant={riskVariant} />
            <span className="text-xs text-foreground-muted">
              Last recalculated: {formatRelative(campaign.updated_at)}
            </span>
          </div>

          {isFounderOrManager && (
            <Link
              href={`/campaigns/${campaign.id}/tasks/new`}
              className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-muted focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
            >
              + Add Task
            </Link>
          )}

          {isFounder && (
            <Link
              href={`/campaigns/${campaign.id}/delete`}
              className="inline-flex h-9 items-center rounded-md border border-risk-hard-border bg-risk-hard-bg px-4 text-sm font-medium text-risk-hard transition-colors hover:bg-risk-hard hover:text-white focus:outline-none focus:ring-2 focus:ring-risk-hard focus:ring-offset-2 focus:ring-offset-background"
            >
              Delete
            </Link>
          )}
        </div>
      </div>

      {/* Stats Bar */}
      <div className="flex items-center divide-x divide-border rounded-lg border border-border bg-surface">
        <StatChip label="Total Tasks" value={totalTasks} />
        <StatChip label="Completed" value={completedCount} />
        <StatChip label="Overdue" value={overdueCount} highlight="red" />
        <StatChip label="Blocked" value={blockedCount} highlight="purple" />
      </div>

      {/* Task List */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground-muted">
          Tasks
        </h2>
        <CampaignTaskList campaignId={campaign.id} initialTasks={tasks} />
      </div>

      {/* Dependency Chain */}
      {tasks.some((t: any) => t.dependency_id) && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground-muted">
            Dependencies
          </h2>
          <DependencyChain tasks={tasks} />
        </div>
      )}
    </div>
  );
}
