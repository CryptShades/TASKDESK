'use client';

import { Circle, Play, CheckCircle2, Ban } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Database } from '../../../supabase/types';

type TaskStatus = Database['public']['Enums']['task_status'];

interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  dependency_id: string | null;
  dependency?: { id: string; title: string; status: TaskStatus } | null;
}

interface Props {
  tasks: Task[];
}

const statusConfig: Record<
  TaskStatus,
  { icon: React.ElementType; color: string; bg: string; ring: string; label: string }
> = {
  not_started: {
    icon: Circle,
    color: 'text-foreground-muted',
    bg: 'bg-surface-raised',
    ring: 'ring-border',
    label: 'Not Started',
  },
  in_progress: {
    icon: Play,
    color: 'text-status-active',
    bg: 'bg-primary/10',
    ring: 'ring-primary/30',
    label: 'In Progress',
  },
  completed: {
    icon: CheckCircle2,
    color: 'text-risk-normal',
    bg: 'bg-risk-normal-bg',
    ring: 'ring-risk-normal-border',
    label: 'Completed',
  },
  blocked: {
    icon: Ban,
    color: 'text-risk-blocked',
    bg: 'bg-risk-blocked-bg',
    ring: 'ring-risk-blocked-border',
    label: 'Blocked',
  },
};

// Topological sort: tasks with no dependencies first, then dependents
function sortByDependency(tasks: Task[]): Task[] {
  const taskMap = new Map(tasks.map((t) => [t.id, t]));
  const sorted: Task[] = [];
  const visited = new Set<string>();

  function visit(task: Task) {
    if (visited.has(task.id)) return;
    // Visit the dependency first
    if (task.dependency_id) {
      const dep = taskMap.get(task.dependency_id);
      if (dep) visit(dep);
    }
    visited.add(task.id);
    sorted.push(task);
  }

  tasks.forEach((t) => visit(t));
  return sorted;
}

export function DependencyChain({ tasks }: Props) {
  // Only show if at least one task has a dependency
  const hasDependencies = tasks.some((t) => t.dependency_id);
  if (!hasDependencies) return null;

  const sorted = sortByDependency(tasks);

  // Build a set of tasks that are depended upon (have children)
  const depIdSet = new Set(tasks.map((t) => t.dependency_id).filter(Boolean));

  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <h3 className="mb-4 text-sm font-semibold text-foreground">Dependency Chain</h3>
      <div className="space-y-0">
        {sorted.map((task, idx) => {
          const config = statusConfig[task.status];
          const Icon = config.icon;
          const isDependent = !!task.dependency_id;
          const isRoot = !isDependent;
          const hasChildren = depIdSet.has(task.id);

          return (
            <div key={task.id} className="relative flex items-start gap-3">
              {/* Vertical connector line for non-root tasks */}
              {isDependent && (
                <div className="absolute -top-3 left-[13px] h-3 w-px bg-border" />
              )}

              {/* Status node */}
              <div className="relative flex-shrink-0 mt-0.5">
                <div
                  className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-full ring-1',
                    config.bg,
                    config.ring
                  )}
                >
                  <Icon className={cn('h-3.5 w-3.5', config.color)} />
                </div>
                {/* Connector line going down if this task has dependents */}
                {hasChildren && (
                  <div className="absolute top-7 left-1/2 h-full -translate-x-1/2 w-px bg-border" />
                )}
              </div>

              {/* Task label */}
              <div
                className={cn(
                  'mb-4 flex-1 rounded-md border px-3 py-2',
                  isRoot ? 'border-border bg-surface-raised' : 'border-border/60 bg-surface ml-2'
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={cn(
                      'text-sm font-medium',
                      task.status === 'completed'
                        ? 'text-foreground-muted line-through'
                        : 'text-foreground'
                    )}
                  >
                    {task.title}
                  </span>
                  <span
                    className={cn(
                      'flex-shrink-0 text-xs font-medium',
                      config.color
                    )}
                  >
                    {config.label}
                  </span>
                </div>
                {task.dependency && (
                  <p className="mt-0.5 text-xs text-foreground-subtle">
                    ↳ After: {task.dependency.title}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
