import { cn } from '@/lib/utils';
import type { Database } from '../../../supabase/types';

type TaskStatus = Database['public']['Enums']['task_status'];

interface StatusBadgeProps {
  status: TaskStatus;
  size?: 'sm' | 'md' | 'lg';
}

const statusConfig: Record<
  TaskStatus,
  { label: string; bg: string; text: string; border: string; dot: string }
> = {
  not_started: {
    label: 'Not Started',
    bg: 'bg-surface-raised',
    text: 'text-foreground-muted',
    border: 'border-border',
    dot: 'bg-foreground-muted',
  },
  in_progress: {
    label: 'In Progress',
    bg: 'bg-primary/10',
    text: 'text-status-active',
    border: 'border-primary/25',
    dot: 'bg-status-active',
  },
  completed: {
    label: 'Completed',
    bg: 'bg-risk-normal-bg',
    text: 'text-risk-normal',
    border: 'border-risk-normal-border',
    dot: 'bg-risk-normal',
  },
  blocked: {
    label: 'Blocked',
    bg: 'bg-risk-blocked-bg',
    text: 'text-risk-blocked',
    border: 'border-risk-blocked-border',
    dot: 'bg-risk-blocked',
  },
};

const sizeStyles = {
  sm: 'px-2 py-0.5 text-xs gap-1.5',
  md: 'px-3 py-1 text-sm gap-2',
  lg: 'px-4 py-2 text-base gap-2.5',
};

const dotSizes = {
  sm: 'h-1.5 w-1.5',
  md: 'h-2 w-2',
  lg: 'h-2.5 w-2.5',
};

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border font-medium',
        config.bg,
        config.text,
        config.border,
        sizeStyles[size]
      )}
    >
      <span className={cn('rounded-full flex-shrink-0', config.dot, dotSizes[size])} />
      {config.label}
    </span>
  );
}
