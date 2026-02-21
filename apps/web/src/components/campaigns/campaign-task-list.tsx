'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Circle,
  Play,
  CheckCircle2,
  Ban,
  AlertTriangle,
  AlertOctagon,
  CheckCircle,
  Clock,
} from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { cn, formatCountdown } from '@/lib/utils';
import { useUser } from '@/context/user-context';
import { useRealtime } from '@/context/realtime-context';
import { TaskStatusModal } from './task-status-modal';
import type { Database } from '../../../supabase/types';

type TaskStatus = Database['public']['Enums']['task_status'];
type TaskRiskFlag = Database['public']['Enums']['task_risk_flag'];

interface Owner {
  id: string;
  name: string;
}

interface DependencyTask {
  id: string;
  title: string;
  status: TaskStatus;
}

interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  due_date: string;
  risk_flag: TaskRiskFlag | null;
  dependency_id: string | null;
  owner_id: string;
  owner: Owner;
  dependency: DependencyTask | null;
}

interface Props {
  campaignId: string;
  initialTasks: Task[];
}

const statusIcons: Record<TaskStatus, { icon: React.ElementType; color: string }> = {
  not_started: { icon: Circle, color: 'text-foreground-muted' },
  in_progress: { icon: Play, color: 'text-status-active' },
  completed: { icon: CheckCircle2, color: 'text-risk-normal' },
  blocked: { icon: Ban, color: 'text-risk-blocked' },
};

function isOverdueTask(due_date: string, status: TaskStatus): boolean {
  return status !== 'completed' && new Date(due_date) < new Date();
}

export function CampaignTaskList({ campaignId, initialTasks }: Props) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [modalTask, setModalTask] = useState<Task | null>(null);
  const { currentUser } = useUser();
  const { isConnected } = useRealtime();

  const refreshTask = useCallback(async (taskId: string) => {
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/tasks/${taskId}`);
      if (!res.ok) return;
      const { data } = await res.json();
      if (!data) return;
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, ...data } : t))
      );
    } catch {
      // ignore
    }
  }, [campaignId]);

  useEffect(() => {
    const handleUpdate = (e: any) => {
      const payload = e.detail;
      const record = payload.new || payload.old;
      if (!record || record.campaign_id !== campaignId) return;

      if (payload.eventType === 'UPDATE') {
        setTasks((prev) =>
          prev.map((t) => (t.id === record.id ? { ...t, ...record } : t))
        );
        refreshTask(record.id);
      } else if (payload.eventType === 'DELETE') {
        setTasks((prev) => prev.filter((t) => t.id !== record.id));
      }
    };

    const handleCreated = (e: any) => {
      const record = e.detail;
      if (record.campaign_id !== campaignId) return;
      refreshTask(record.id);
    };

    window.addEventListener('task:updated' as any, handleUpdate);
    window.addEventListener('task:created' as any, handleCreated);

    return () => {
      window.removeEventListener('task:updated' as any, handleUpdate);
      window.removeEventListener('task:created' as any, handleCreated);
    };
  }, [campaignId, refreshTask]);

  const canAddTask = currentUser?.role === 'founder' || currentUser?.role === 'manager';

  if (tasks.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-surface py-12 text-center px-6">
        <p className="text-sm text-foreground-muted">
          No tasks in this campaign. Add tasks to start tracking execution risk.
        </p>
        {canAddTask && (
          <Link
            href={`/campaigns/${campaignId}/tasks/new`}
            className="mt-3 inline-flex text-sm font-medium text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary rounded"
          >
            Add Task
          </Link>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="rounded-lg border border-border bg-surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-foreground-muted w-10">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-foreground-muted">
                  Task
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-foreground-muted">
                  Owner
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-foreground-muted">
                  Due Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-foreground-muted">
                  Dependency
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-foreground-muted">
                  Risk
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-foreground-muted pr-4">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {tasks.map((task) => {
                const { icon: StatusIcon, color } = statusIcons[task.status];
                const overdue = isOverdueTask(task.due_date, task.status);
                const isOwner = currentUser?.id === task.owner_id;
                const depCompleted = task.dependency?.status === 'completed';

                return (
                  <tr
                    key={task.id}
                    className="transition-colors hover:bg-surface-raised/50"
                  >
                    {/* Status icon */}
                    <td className="px-4 py-3">
                      <StatusIcon className={cn('h-4 w-4', color)} />
                    </td>

                    {/* Title */}
                    <td className="px-4 py-3">
                      <Link
                        href={`/campaigns/${campaignId}/tasks/${task.id}`}
                        className="font-medium text-foreground hover:text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary rounded"
                      >
                        {task.title}
                      </Link>
                    </td>

                    {/* Owner */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Avatar name={task.owner.name} size="sm" />
                        <span className="text-foreground-muted">{task.owner.name}</span>
                      </div>
                    </td>

                    {/* Due Date */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <Clock className={cn('h-3.5 w-3.5', overdue ? 'text-risk-hard' : 'text-foreground-muted')} />
                        <span
                          className={cn(
                            'text-sm',
                            overdue ? 'text-risk-hard font-medium' : 'text-foreground-muted'
                          )}
                          title={new Date(task.due_date).toLocaleString()}
                        >
                          {formatCountdown(task.due_date)}
                        </span>
                      </div>
                    </td>

                    {/* Dependency */}
                    <td className="px-4 py-3">
                      {task.dependency ? (
                        <div className="flex items-center gap-1.5 text-foreground-muted">
                          <span className="text-foreground-subtle">↳</span>
                          <span className="text-xs">After {task.dependency.title}</span>
                          {depCompleted ? (
                            <CheckCircle className="h-3.5 w-3.5 text-risk-normal flex-shrink-0" />
                          ) : (
                            <AlertTriangle className="h-3.5 w-3.5 text-risk-soft flex-shrink-0" />
                          )}
                        </div>
                      ) : (
                        <span className="text-foreground-subtle text-xs">—</span>
                      )}
                    </td>

                    {/* Risk Flag */}
                    <td className="px-4 py-3">
                      {task.risk_flag === 'soft_risk' && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-risk-soft-border bg-risk-soft-bg px-2 py-0.5 text-xs font-medium text-risk-soft">
                          <AlertTriangle className="h-3 w-3" />
                          At Risk
                        </span>
                      )}
                      {task.risk_flag === 'hard_risk' && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-risk-hard-border bg-risk-hard-bg px-2 py-0.5 text-xs font-medium text-risk-hard">
                          <AlertOctagon className="h-3 w-3" />
                          High Risk
                        </span>
                      )}
                      {!task.risk_flag && (
                        <span className="text-foreground-subtle text-xs">—</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-right">
                      {isOwner && (
                        <button
                          onClick={() => setModalTask(task)}
                          className="inline-flex h-7 items-center rounded-md border border-border bg-surface-raised px-3 text-xs font-medium text-foreground-muted transition-colors hover:bg-surface-overlay hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                          Update
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {modalTask && (
        <TaskStatusModal
          task={modalTask}
          onClose={() => setModalTask(null)}
          onSuccess={(updatedTask) => {
            setTasks((prev) =>
              prev.map((t) => (t.id === updatedTask.id ? { ...t, status: updatedTask.status } : t))
            );
            setModalTask(null);
          }}
        />
      )}
    </>
  );
}
