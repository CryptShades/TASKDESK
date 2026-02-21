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
  primary: 'border-t-primary',
  soft: 'border-t-risk-soft',
  hard: 'border-t-risk-hard',
  normal: 'border-t-risk-normal',
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
      <div className="rounded-lg border border-border bg-surface p-6">
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
        'rounded-lg border border-border bg-surface p-6 transition-colors',
        `border-t-4 ${variantStyles[variant]}`
      )}
    >
      <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-foreground-muted">
        {label}
      </p>
      <p
        className={cn(
          'mb-1 font-mono text-3xl font-bold text-foreground transition-all duration-100 ease-out',
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
