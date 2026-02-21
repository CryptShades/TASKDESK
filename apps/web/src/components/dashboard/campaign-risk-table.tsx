'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRealtime } from '@/context/realtime-context';
import { RiskBadge } from '@/components/ui/risk-badge';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

type RiskStatus = 'normal' | 'at_risk' | 'high_risk';

interface Campaign {
  id: string;
  name: string;
  risk_status: RiskStatus;
  client: { id: string; name: string };
  launch_date: string;
  task_counts: { total: number; overdue: number; blocked: number };
}

interface Props {
  initialData: Campaign[];
}

const RISK_ORDER: Record<RiskStatus, number> = {
  high_risk: 0,
  at_risk: 1,
  normal: 2,
};

function sortCampaigns(campaigns: Campaign[]): Campaign[] {
  return [...campaigns].sort((a, b) => {
    const riskDiff = RISK_ORDER[a.risk_status] - RISK_ORDER[b.risk_status];
    if (riskDiff !== 0) return riskDiff;
    return new Date(a.launch_date).getTime() - new Date(b.launch_date).getTime();
  });
}

function riskToVariant(status: RiskStatus): 'normal' | 'soft' | 'hard' {
  if (status === 'high_risk') return 'hard';
  if (status === 'at_risk') return 'soft';
  return 'normal';
}

function formatLaunchDate(dateStr: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  const diffDays = Math.round(
    (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (diffDays < 0) return 'Launch passed';
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  return `in ${diffDays} days`;
}

function formatAbsoluteDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function isLaunchPassed(dateStr: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(dateStr) < today;
}

/** Inline style for the subtle row background tint — uses CSS custom properties */
function rowTintStyle(
  status: RiskStatus,
  isFlashing: boolean
): React.CSSProperties {
  if (isFlashing) {
    // Brighter pulse during the 200ms flash window
    if (status === 'high_risk')
      return { backgroundColor: 'hsl(var(--risk-hard-bg) / 0.4)', transition: 'background-color 200ms ease-out' };
    if (status === 'at_risk')
      return { backgroundColor: 'hsl(var(--risk-soft-bg) / 0.4)', transition: 'background-color 200ms ease-out' };
    return { backgroundColor: 'hsl(var(--risk-normal-bg) / 0.3)', transition: 'background-color 200ms ease-out' };
  }
  if (status === 'high_risk')
    return { backgroundColor: 'hsl(var(--risk-hard-bg) / 0.05)', transition: 'background-color 200ms ease-out' };
  if (status === 'at_risk')
    return { backgroundColor: 'hsl(var(--risk-soft-bg) / 0.05)', transition: 'background-color 200ms ease-out' };
  return { transition: 'background-color 200ms ease-out' };
}

export function CampaignRiskTable({ initialData }: Props) {
  const [campaigns, setCampaigns] = useState<Campaign[]>(() =>
    sortCampaigns(initialData)
  );
  const [flashIds, setFlashIds] = useState<Set<string>>(new Set());
  const { isConnected } = useRealtime();

  useEffect(() => {
    const handleUpdate = (e: any) => {
      const next = e.detail;
      if (!next?.id) return;

      setCampaigns((current) => {
        const idx = current.findIndex((c) => c.id === next.id);
        if (idx === -1) return current;
        const copy = [...current];
        copy[idx] = {
          ...copy[idx],
          risk_status: next.risk_status ?? copy[idx].risk_status,
          name: next.name ?? copy[idx].name,
          launch_date: next.launch_date ?? copy[idx].launch_date,
        };
        return sortCampaigns(copy);
      });

      // Trigger 200ms row flash
      const id: string = next.id;
      setFlashIds((prev) => new Set([...prev, id]));
      setTimeout(() => {
        setFlashIds((prev) => {
          const n = new Set(prev);
          n.delete(id);
          return n;
        });
      }, 200);
    };

    window.addEventListener('campaign:updated' as any, handleUpdate);
    return () => window.removeEventListener('campaign:updated' as any, handleUpdate);
  }, []);

  const sortedCampaigns = useMemo(() => {
    return [...campaigns].sort((a, b) => {
      const riskOrder = { high_risk: 0, at_risk: 1, normal: 2 };
      const valA = riskOrder[a.risk_status as keyof typeof riskOrder] ?? 3;
      const valB = riskOrder[b.risk_status as keyof typeof riskOrder] ?? 3;
      if (valA !== valB) return valA - valB;
      const overdueA = a.task_counts?.overdue ?? 0;
      const overdueB = b.task_counts?.overdue ?? 0;
      return overdueB - overdueA;
    });
  }, [campaigns]);

  if (campaigns.length === 0) {
    return (
      <div className="flex flex-col rounded-lg border border-border bg-surface">
        <div className="border-b border-border px-6 py-4">
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-foreground-muted">Campaign Risk</h2>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center py-16 text-center">
          <p className="text-sm text-foreground-muted">
            No active campaigns. Create your first campaign to start tracking execution risk.
          </p>
          <Link
            href="/campaigns/new"
            className="mt-3 text-sm font-medium text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary rounded"
          >
            Create Campaign
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-surface">
      <div className="border-b border-border px-6 py-4">
        <h2 className="text-[10px] font-bold uppercase tracking-widest text-foreground-muted">Campaign Risk</h2>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-[10px] font-bold uppercase tracking-widest">Risk</TableHead>
            <TableHead className="text-[10px] font-bold uppercase tracking-widest">Campaign</TableHead>
            <TableHead className="text-[10px] font-bold uppercase tracking-widest">Client</TableHead>
            <TableHead className="text-[10px] font-bold uppercase tracking-widest">Launch</TableHead>
            <TableHead className="text-[10px] font-bold uppercase tracking-widest text-right">Tasks</TableHead>
            <TableHead className="text-[10px] font-bold uppercase tracking-widest text-right px-4">Overdue</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody aria-live="polite">
          {sortedCampaigns.map((campaign) => {
            const isFlashing = flashIds.has(campaign.id);
            const passed = isLaunchPassed(campaign.launch_date);

            return (
              <TableRow
                key={campaign.id}
                style={rowTintStyle(campaign.risk_status, isFlashing)}
              >
                <TableCell className="py-3">
                  <RiskBadge
                    variant={riskToVariant(campaign.risk_status)}
                    size="sm"
                  />
                </TableCell>

                <TableCell className="py-3">
                  <Link
                    href={`/campaigns/${campaign.id}`}
                    className="text-sm font-medium text-foreground hover:underline focus:outline-none focus:ring-2 focus:ring-primary rounded"
                  >
                    {campaign.name}
                  </Link>
                </TableCell>

                <TableCell className="py-3">
                  <span className="text-sm text-foreground-muted">
                    {campaign.client?.name ?? '—'}
                  </span>
                </TableCell>

                <TableCell className="py-3">
                  <span
                    className={cn(
                      'text-sm',
                      passed ? 'text-risk-hard' : 'text-foreground-muted'
                    )}
                    title={formatAbsoluteDate(campaign.launch_date)}
                  >
                    {formatLaunchDate(campaign.launch_date)}
                  </span>
                </TableCell>

                <TableCell className="py-3 text-right">
                  <span className="font-mono text-sm text-foreground">
                    {campaign.task_counts.total}
                  </span>
                </TableCell>

                <TableCell className="py-3 text-right">
                  <span
                    className={cn(
                      'font-mono text-sm',
                      campaign.task_counts.overdue > 0
                        ? 'text-risk-hard'
                        : 'text-foreground-muted'
                    )}
                  >
                    {campaign.task_counts.overdue}
                  </span>
                </TableCell>

                <TableCell className="py-3">
                  <Link
                    href={`/campaigns/${campaign.id}`}
                    className="text-xs font-semibold text-foreground-muted transition-colors hover:text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary rounded underline-offset-4"
                  >
                    View Campaign →
                  </Link>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
