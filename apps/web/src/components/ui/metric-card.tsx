import { cn } from '@/lib/utils';

interface MetricCardProps {
  label: string;
  value: number | string;
  variant?: 'primary' | 'soft' | 'hard' | 'normal';
  description?: string;
  loading?: boolean;
  /** Override value text color — e.g. 'text-risk-hard' when value > 0 */
  valueClassName?: string;
}

const variantStyles = {
  primary: 'border-primary',
  soft: 'border-risk-soft',
  hard: 'border-risk-hard',
  normal: 'border-risk-normal',
};

export function MetricCard({
  label,
  value,
  variant = 'primary',
  description,
  loading = false,
  valueClassName,
}: MetricCardProps) {
  if (loading) {
    return (
      <div className="rounded-[16px] border border-border bg-surface p-5 shadow-[var(--panel-shadow)]">
        <div className="skeleton mb-2 h-4 w-20 rounded" />
        <div className="skeleton mb-1 h-8 w-16 rounded" />
        <div className="skeleton h-3 w-24 rounded" />
      </div>
    );
  }

  return (
    <div
      role="region"
      aria-label={`${label} count`}
      className={cn(
        'rounded-[16px] border bg-surface p-5 shadow-[var(--panel-shadow)] transition-colors',
        variantStyles[variant]
      )}
    >
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-foreground-muted">
        {label}
      </p>
      <p
        className={cn(
          'mb-1 text-[28px] font-semibold leading-tight text-foreground transition-all duration-100 ease-out',
          valueClassName
        )}
      >
        {value}
      </p>
      {description && (
        <p className="text-xs text-foreground-subtle">{description}</p>
      )}
    </div>
  );
}
