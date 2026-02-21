import { CheckCircle2, AlertTriangle, AlertOctagon, Ban } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RiskBadgeProps {
  variant: 'normal' | 'soft' | 'hard' | 'blocked';
  label?: string;
  size?: 'sm' | 'md';
}

const variantConfig = {
  normal: {
    bg: 'bg-risk-normal-bg',
    border: 'border-risk-normal-border',
    text: 'text-risk-normal',
    icon: CheckCircle2,
    defaultLabel: 'On Track',
    ariaLabel: 'Campaign risk status: On Track',
  },
  soft: {
    bg: 'bg-risk-soft-bg',
    border: 'border-risk-soft-border',
    text: 'text-risk-soft',
    icon: AlertTriangle,
    defaultLabel: 'At Risk',
    ariaLabel: 'Campaign risk status: At Risk',
  },
  hard: {
    bg: 'bg-risk-hard-bg',
    border: 'border-risk-hard-border',
    text: 'text-risk-hard',
    icon: AlertOctagon,
    defaultLabel: 'High Risk',
    ariaLabel: 'Campaign risk status: High Risk',
  },
  blocked: {
    bg: 'bg-risk-blocked-bg',
    border: 'border-risk-blocked-border',
    text: 'text-risk-blocked',
    icon: Ban,
    defaultLabel: 'Blocked',
    ariaLabel: 'Campaign risk status: Blocked',
  },
};

export function RiskBadge({ variant, label, size = 'md' }: RiskBadgeProps) {
  const config = variantConfig[variant] as any;
  const Icon = config.icon;
  const displayLabel = label || config.defaultLabel;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors duration-150 ease-out',
        config.bg,
        config.border,
        config.text,
        size === 'sm' && 'px-2 py-0.5 text-xs',
        size === 'md' && 'px-2.5 py-1 text-xs'
      )}
      aria-label={config.ariaLabel}
    >
      <Icon className="h-3 w-3" />
      {displayLabel}
    </span>
  );
}