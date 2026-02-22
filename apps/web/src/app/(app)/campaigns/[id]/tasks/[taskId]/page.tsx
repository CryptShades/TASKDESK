import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import {
  Clock,
  AlertTriangle,
  AlertOctagon,
  Info,
  Activity,
  CheckCircle2,
  Circle,
  Play,
  Ban,
  User,
  Zap,
  Bell,
  RefreshCw,
  Plus,
} from 'lucide-react';
import { getCurrentUser } from '@/services/auth/client';
import { getTaskById } from '@/services/task.service';
import { Avatar } from '@/components/ui/avatar';
import { StatusBadge } from '@/components/ui/status-badge';
import { TaskDetailClient } from './task-detail-client';
import { cn, formatCountdown } from '@/lib/utils';

export const dynamic = 'force-dynamic';

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
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

// Icon and label for each event_type
const eventConfig: Record<
  string,
  { icon: React.ElementType; color: string; label: (e: any) => string }
> = {
  task_created: {
    icon: Plus,
    color: 'text-status-active',
    label: () => 'Task created',
  },
  status_changed: {
    icon: RefreshCw,
    color: 'text-primary',
    label: (e: any) =>
      `Status changed to ${(e.new_value ?? '').replace('_', ' ')}`,
  },
  escalation_stage_1: {
    icon: Bell,
    color: 'text-risk-soft',
    label: () => 'Escalation Stage 1 sent to Task Owner',
  },
  escalation_stage_2: {
    icon: Zap,
    color: 'text-risk-soft',
    label: () => 'Escalation Stage 2 sent to Campaign Manager',
  },
  escalation_stage_3: {
    icon: AlertOctagon,
    color: 'text-risk-hard',
    label: () => 'Escalation Stage 3 — Founder notified',
  },
  risk_flag_set: {
    icon: AlertTriangle,
    color: 'text-risk-soft',
    label: (e: any) => `Risk flag set to ${(e.new_value ?? '').replace('_', ' ')}`,
  },
  overdue_marked: {
    icon: Clock,
    color: 'text-risk-hard',
    label: () => 'Task marked as overdue',
  },
};

function getEventConfig(eventType: string) {
  return (
    eventConfig[eventType] ?? {
      icon: Activity,
      color: 'text-foreground-muted',
      label: (e: any) => e.event_type.replace(/_/g, ' '),
    }
  );
}

interface PageProps {
  params: { id: string; taskId: string };
}

export default async function TaskDetailPage({ params }: PageProps) {
  let user: Awaited<ReturnType<typeof getCurrentUser>>;
  try {
    user = await getCurrentUser();
  } catch {
    redirect('/auth/signin');
  }

  let task: Awaited<ReturnType<typeof getTaskById>>;
  try {
    task = await getTaskById(params.taskId, user.org_id);
  } catch {
    notFound();
  }

  const taskAny = task as any;
  const owner = taskAny.owner;
  const dependency = taskAny.dependency ?? null;
  const events: any[] = taskAny.task_events ?? [];

  const isOwner = user.id === task.owner_id;
  const isManagerOrFounder = user.role === 'manager' || user.role === 'founder';

  const isOverdue =
    task.status !== 'completed' && new Date(task.due_date) < new Date();

  // Risk flag explanation — pull from most recent risk_flag_set event
  const riskEvent = events.find((e: any) => e.event_type === 'risk_flag_set');

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div>
        <Link
          href={`/campaigns/${params.id}`}
          className="mb-2 inline-flex items-center gap-1 text-xs text-foreground-muted hover:text-foreground focus:outline-none"
        >
          ← Back to Campaign
        </Link>
        <h1 className="text-2xl font-semibold text-foreground">{task.title}</h1>
      </div>

      {/* Two-column layout */}
      <div className="flex gap-6 flex-col lg:flex-row">
        {/* LEFT COLUMN — 65% */}
        <div className="flex-1 min-w-0 space-y-6">

          {/* Metadata card */}
          <div className="rounded-lg border border-border bg-surface p-5 space-y-4">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">
              Task Info
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Owner */}
              <div className="space-y-1">
                <p className="text-xs text-foreground-subtle flex items-center gap-1">
                  <User className="h-3 w-3" /> Owner
                </p>
                <div className="flex items-center gap-2">
                  <Avatar name={owner?.name ?? 'Unknown'} size="sm" />
                  <span className="text-sm font-medium text-foreground">
                    {owner?.name ?? 'Unknown'}
                  </span>
                </div>
              </div>

              {/* Due Date */}
              <div className="space-y-1">
                <p className="text-xs text-foreground-subtle flex items-center gap-1">
                  <Clock className="h-3 w-3" /> Due Date
                </p>
                <div>
                  <p className={cn('text-sm font-medium', isOverdue ? 'text-risk-hard' : 'text-foreground')}>
                    {formatDate(task.due_date)}
                  </p>
                  <p className={cn('text-xs', isOverdue ? 'text-risk-hard' : 'text-foreground-muted')}>
                    {formatCountdown(task.due_date)}
                  </p>
                </div>
              </div>

              {/* Campaign */}
              <div className="space-y-1">
                <p className="text-xs text-foreground-subtle flex items-center gap-1">
                  <Activity className="h-3 w-3" /> Campaign
                </p>
                <Link
                  href={`/campaigns/${params.id}`}
                  className="text-sm font-medium text-primary hover:underline focus:outline-none"
                >
                  View Campaign →
                </Link>
              </div>
            </div>
          </div>

          {/* Status section */}
          <div className="rounded-lg border border-border bg-surface p-5 space-y-4">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">
              Status
            </h2>
            {isOwner || isManagerOrFounder ? (
              <TaskDetailClient
                task={{
                  id: task.id,
                  title: task.title,
                  status: task.status,
                  dependency_id: task.dependency_id,
                  dependency,
                  owner,
                }}
                currentUserId={user.id}
                campaignId={params.id}
              />
            ) : (
              <div className="space-y-3">
                <StatusBadge status={task.status} size="lg" />
                {dependency && dependency.status !== 'completed' && (
                  <div className="flex items-start gap-2 rounded-md border border-risk-soft-border bg-risk-soft-bg px-3 py-2.5">
                    <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-risk-soft" />
                    <p className="text-sm text-risk-soft">
                      Cannot start — <strong>{dependency.title}</strong> not yet completed.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Dependency info */}
          {dependency && (
            <div className="rounded-lg border border-border bg-surface p-5 space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">
                Dependency
              </h2>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{dependency.title}</p>
                  <div className="mt-1">
                    <StatusBadge status={dependency.status} size="sm" />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN — 35% */}
        <div className="lg:w-80 xl:w-96 space-y-6 flex-shrink-0">

          {/* Risk Info */}
          <div className="rounded-lg border border-border bg-surface p-5 space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-foreground-muted flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5" /> Risk Info
            </h2>
            {task.risk_flag ? (
              <div className="space-y-2">
                {task.risk_flag === 'soft_risk' && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-risk-soft-border bg-risk-soft-bg px-3 py-1 text-xs font-medium text-risk-soft">
                    <AlertTriangle className="h-3.5 w-3.5" /> At Risk
                  </span>
                )}
                {task.risk_flag === 'hard_risk' && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-risk-hard-border bg-risk-hard-bg px-3 py-1 text-xs font-medium text-risk-hard">
                    <AlertOctagon className="h-3.5 w-3.5" /> High Risk
                  </span>
                )}
                {riskEvent && (
                  <p className="text-xs text-foreground-muted">
                    Set by <strong>{riskEvent.actor?.name ?? 'System'}</strong>{' '}
                    {formatRelative(riskEvent.created_at)}.
                  </p>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-foreground-muted">
                <Info className="h-3.5 w-3.5" />
                No risk flag set.
              </div>
            )}
          </div>

          {/* Event Timeline */}
          <div className="rounded-lg border border-border bg-surface p-5">
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-wide text-foreground-muted flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5" /> Event Timeline
            </h2>

            {events.length === 0 ? (
              <p className="text-xs text-foreground-muted">No events recorded yet.</p>
            ) : (
              <div className="space-y-0">
                {events.map((event: any, idx: number) => {
                  const config = getEventConfig(event.event_type);
                  const Icon = config.icon;
                  const isLast = idx === events.length - 1;

                  return (
                    <div key={event.id} className="relative flex gap-3 pb-4">
                      {/* Vertical timeline line */}
                      {!isLast && (
                        <div className="absolute left-[13px] top-6 bottom-0 w-px bg-border" />
                      )}

                      {/* Icon node */}
                      <div className="flex-shrink-0 mt-0.5">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full border border-border bg-surface-raised">
                          <Icon className={cn('h-3.5 w-3.5', config.color)} />
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 pt-0.5">
                        <p className="text-sm text-foreground leading-snug">
                          {config.label(event)}
                          {event.actor && (
                            <span className="text-foreground-muted">
                              {' '}by{' '}
                              <span className="font-medium text-foreground">
                                {event.actor.name}
                              </span>
                            </span>
                          )}
                        </p>
                        <p className="mt-0.5 text-xs text-foreground-subtle">
                          {formatRelative(event.created_at)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
