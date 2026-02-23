import { cn } from '@/lib/utils';

interface RiskBadgeProps {
  variant: 'normal' | 'soft' | 'hard' | 'blocked';
  label?: string;
  size?: 'sm' | 'md';
}

const variantConfig = {
  normal: {
    bg: 'bg-transparent',
    border: 'border-risk-normal',
    text: 'text-risk-normal',
    defaultLabel: 'Normal',
    ariaLabel: 'Campaign risk status: Normal',
  },
  soft: {
    bg: 'bg-risk-soft',
    border: 'border-risk-soft',
    text: 'text-[#1C1E23]',
    defaultLabel: 'At Risk',
    ariaLabel: 'Campaign risk status: At Risk',
  },
  hard: {
    bg: 'bg-risk-hard',
    border: 'border-risk-hard',
    text: 'text-white',
    defaultLabel: 'High Risk',
    ariaLabel: 'Campaign risk status: High Risk',
  },
  blocked: {
    bg: 'bg-risk-blocked',
    border: 'border-risk-blocked',
    text: 'text-white',
    defaultLabel: 'Blocked',
    ariaLabel: 'Campaign risk status: Blocked',
  },
};

export function RiskBadge({ variant, label, size = 'md' }: RiskBadgeProps) {
  const config = variantConfig[variant] as any;
  const displayLabel = label || config.defaultLabel;

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border text-[12px] font-semibold uppercase tracking-wide transition-colors duration-150 ease-out',
        config.bg,
        config.border,
        config.text,
        size === 'sm' && 'px-2.5 py-1',
        size === 'md' && 'px-3 py-1.5'
      )}
      aria-label={config.ariaLabel}
    >
      {displayLabel}
    </span>
  );
}
