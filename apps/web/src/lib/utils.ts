// Re-export cn() and date helpers from the shared utils package
// so web components can import from '@/lib/utils' without coupling to the package name.
export { cn, formatDate, formatRelativeDate, isOverdue, getInitials } from '@taskdesk/utils';

import type { Database } from '../../supabase/types';

type CampaignRisk = Database['public']['Enums']['campaign_risk'];
type TaskRiskFlag = Database['public']['Enums']['task_risk_flag'];

export function getRiskVariant(
  riskStatus: string | null
): 'normal' | 'soft' | 'hard' | 'blocked' {
  if (!riskStatus) return 'normal';

  switch (riskStatus) {
    case 'normal':
      return 'normal';
    case 'at_risk':
      return 'soft';
    case 'high_risk':
      return 'hard';
    case 'soft_risk':
      return 'soft';
    case 'hard_risk':
      return 'hard';
    default:
      return 'normal';
  }
}

export function formatCountdown(date: string | Date): string {
  const target = new Date(date);
  const now = new Date();
  const diffMs = target.getTime() - now.getTime();
  const diffDays = Math.abs(Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

  if (diffMs > 0) {
    return `in ${diffDays} day${diffDays === 1 ? '' : 's'}`;
  } else {
    return `${diffDays} day${diffDays === 1 ? '' : 's'} overdue`;
  }
}
