"use client";

import { CheckCircle2, Clock, Play, Ban } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Database } from '../../../supabase/types';

type TaskStatus = Database['public']['Enums']['task_status'];

interface StatusSelectorProps {
  currentStatus: TaskStatus;
  onChange: (status: TaskStatus) => void;
  disabled?: boolean;
}

const statusConfig = {
  not_started: {
    label: 'Not Started',
    icon: Clock,
    color: 'text-status-pending',
  },
  in_progress: {
    label: 'In Progress',
    icon: Play,
    color: 'text-status-active',
  },
  completed: {
    label: 'Completed',
    icon: CheckCircle2,
    color: 'text-risk-normal',
  },
  blocked: {
    label: 'Blocked',
    icon: Ban,
    color: 'text-risk-blocked',
  },
};

export function StatusSelector({ currentStatus, onChange, disabled = false }: StatusSelectorProps) {
  return (
    <div className="flex gap-1 rounded-md border border-border bg-surface p-1">
      {(Object.keys(statusConfig) as TaskStatus[]).map((status) => {
        const config = statusConfig[status];
        const Icon = config.icon;
        const isSelected = currentStatus === status;

        return (
          <button
            key={status}
            onClick={() => !disabled && onChange(status)}
            disabled={disabled}
            className={cn(
              'flex items-center gap-2 rounded px-3 py-2 text-sm font-medium transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background',
              'disabled:pointer-events-none disabled:opacity-50',
              isSelected
                ? 'bg-primary text-primary-foreground'
                : 'text-foreground-muted hover:bg-surface-raised hover:text-foreground'
            )}
            aria-label={`Set status to ${config.label}`}
            aria-pressed={isSelected}
          >
            <Icon className="h-4 w-4" />
            <span className="hidden sm:inline">{config.label}</span>
          </button>
        );
      })}
    </div>
  );
}