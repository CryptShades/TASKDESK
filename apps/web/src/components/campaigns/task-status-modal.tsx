'use client';

import { useState, useEffect, useRef } from 'react';
import { X, AlertTriangle, CheckCircle, Circle, Play, CheckCircle2, Ban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Database } from '../../../supabase/types';

type TaskStatus = Database['public']['Enums']['task_status'];

interface DependencyTask {
  id: string;
  title: string;
  status: TaskStatus;
}

interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  dependency_id: string | null;
  dependency?: DependencyTask | null;
}

interface Props {
  task: Task;
  onClose: () => void;
  onSuccess: (updatedTask: { id: string; status: TaskStatus }) => void;
}

const ALLOWED_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  not_started: ['in_progress'],
  in_progress: ['completed', 'blocked'],
  completed: [],
  blocked: ['in_progress'],
};

const statusConfig: Record<
  TaskStatus,
  { label: string; icon: React.ElementType; color: string; bg: string; border: string }
> = {
  not_started: {
    label: 'Not Started',
    icon: Circle,
    color: 'text-foreground-muted',
    bg: 'bg-surface-raised',
    border: 'border-border',
  },
  in_progress: {
    label: 'In Progress',
    icon: Play,
    color: 'text-status-active',
    bg: 'bg-primary/10',
    border: 'border-primary/30',
  },
  completed: {
    label: 'Completed',
    icon: CheckCircle2,
    color: 'text-risk-normal',
    bg: 'bg-risk-normal-bg',
    border: 'border-risk-normal-border',
  },
  blocked: {
    label: 'Blocked',
    icon: Ban,
    color: 'text-risk-blocked',
    bg: 'bg-risk-blocked-bg',
    border: 'border-risk-blocked-border',
  },
};

const ALL_STATUSES: TaskStatus[] = ['not_started', 'in_progress', 'completed', 'blocked'];

export function TaskStatusModal({ task, onClose, onSuccess }: Props) {
  const [selected, setSelected] = useState<TaskStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  const depIncomplete =
    task.dependency &&
    task.dependency.status !== 'completed';

  const allowed = ALLOWED_TRANSITIONS[task.status];

  function isDisabled(status: TaskStatus): { disabled: boolean; reason?: string } {
    if (!allowed.includes(status)) {
      return { disabled: true, reason: `Cannot transition from "${task.status.replace('_', ' ')}" to "${status.replace('_', ' ')}"` };
    }
    if (status === 'in_progress' && depIncomplete) {
      return {
        disabled: true,
        reason: `Complete "${task.dependency!.title}" first`,
      };
    }
    return { disabled: false };
  }

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  async function handleUpdate() {
    if (!selected) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/tasks/${task.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: selected }),
      });
      const json = await res.json();

      if (!res.ok || json.error) {
        setError(json.error?.message ?? 'Failed to update status. Please try again.');
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess({ id: task.id, status: selected });
      }, 600);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="w-full max-w-md rounded-lg border border-border bg-surface shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 id="modal-title" className="text-sm font-semibold text-foreground">
              Update Status
            </h2>
            <p className="mt-0.5 text-xs text-foreground-muted line-clamp-1">
              {task.title}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md text-foreground-muted transition-colors hover:bg-surface-raised hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Dependency warning */}
          {depIncomplete && (
            <div className="flex items-start gap-2 rounded-md border border-risk-soft-border bg-risk-soft-bg px-3 py-2.5">
              <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-risk-soft" />
              <p className="text-xs text-risk-soft">
                Cannot start — <strong>{task.dependency!.title}</strong> not yet completed.
              </p>
            </div>
          )}

          {/* Status options */}
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
              Select new status
            </p>
            <div className="space-y-1.5">
              {ALL_STATUSES.map((status) => {
                const config = statusConfig[status];
                const Icon = config.icon;
                const { disabled, reason } = isDisabled(status);
                const isSelected = selected === status;

                return (
                  <div key={status} title={disabled ? reason : undefined}>
                    <button
                      onClick={() => !disabled && setSelected(status)}
                      disabled={disabled}
                      aria-pressed={isSelected}
                      className={cn(
                        'w-full flex items-center gap-3 rounded-md border px-3 py-2.5 text-left text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary',
                        disabled
                          ? 'opacity-40 cursor-not-allowed border-border bg-surface'
                          : isSelected
                          ? cn(config.bg, config.border, config.color)
                          : 'border-border bg-surface hover:bg-surface-raised text-foreground-muted hover:text-foreground'
                      )}
                    >
                      <Icon className={cn('h-4 w-4 flex-shrink-0', isSelected ? config.color : '')} />
                      <span className="font-medium">{config.label}</span>
                      {status === task.status && (
                        <span className="ml-auto text-xs text-foreground-subtle">(current)</span>
                      )}
                      {disabled && reason && (
                        <span className="ml-auto text-xs text-foreground-subtle truncate max-w-[160px]">
                          {reason}
                        </span>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Success state */}
          {success && (
            <div className="flex items-center gap-2 rounded-md border border-risk-normal-border bg-risk-normal-bg px-3 py-2">
              <CheckCircle className="h-4 w-4 text-risk-normal flex-shrink-0" />
              <p className="text-xs text-risk-normal font-medium">Status updated successfully!</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <p className="text-xs text-risk-hard" role="alert">
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-4">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            loading={loading}
            disabled={!selected || loading || success}
            onClick={handleUpdate}
          >
            Update
          </Button>
        </div>
      </div>
    </div>
  );
}
