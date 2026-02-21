import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'active' | 'completed' | 'pending' | 'outline';
  className?: string;
}

const variantStyles = {
  default: 'bg-surface-raised text-foreground border-border',
  active: 'bg-status-active/10 text-status-active border-status-active/20',
  completed: 'bg-status-completed/10 text-status-completed border-status-completed/20',
  pending: 'bg-status-pending/10 text-status-pending border-status-pending/20',
  outline: 'bg-transparent text-foreground-muted border-border hover:text-foreground',
};

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}