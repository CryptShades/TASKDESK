'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
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
  task_counts: { total: number; pending: number; overdue: number; blocked: number };
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

function rowTintClass(status: RiskStatus, isFlashing: boolean): string {
  if (isFlashing) {
    return 'bg-surface-overlay';
  }

  if (status === 'high_risk') {
    return 'bg-risk-hard-bg/25';
  }

  if (status === 'at_risk') {
    return 'bg-risk-soft-bg/20';
  }

  return 'bg-transparent';
}

export function CampaignRiskTable({ initialData }: Props) {
  const [campaigns, setCampaigns] = useState<Campaign[]>(() =>
    sortCampaigns(initialData)
  );
  const [flashIds, setFlashIds] = useState<Set<string>>(new Set());

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
    return sortCampaigns(campaigns);
  }, [campaigns]);

  if (campaigns.length === 0) {
    return (
      <div className="flex flex-col rounded-[16px] border border-border bg-surface shadow-[var(--panel-shadow)]">
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-xl font-semibold text-foreground">Campaign Risk</h2>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center py-14 text-center">
          <p className="text-base font-medium text-foreground">No active campaigns.</p>
          <p className="mt-1 text-sm text-foreground-muted">
            Create a campaign to begin monitoring execution risk.
          </p>
          <Link
            href="/campaigns/new"
            className="mt-4 text-sm font-semibold text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary rounded"
          >
            Create Campaign
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[16px] border border-border bg-surface shadow-[var(--panel-shadow)]">
      <div className="border-b border-border px-5 py-4">
        <h2 className="text-xl font-semibold text-foreground">Campaign Risk</h2>
        <p className="mt-1 text-sm text-foreground-muted">
          Ranked by severity and launch proximity.
        </p>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-xs font-medium">Campaign</TableHead>
            <TableHead className="text-xs font-medium">Client</TableHead>
            <TableHead className="text-xs font-medium">Risk</TableHead>
            <TableHead className="text-xs font-medium">Launch</TableHead>
            <TableHead className="text-xs font-medium text-right">Pending</TableHead>
            <TableHead className="text-xs font-medium text-right">Blocked</TableHead>
            <TableHead className="text-xs font-medium text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody aria-live="polite">
          {sortedCampaigns.map((campaign) => {
            const isFlashing = flashIds.has(campaign.id);
            const passed = isLaunchPassed(campaign.launch_date);

            return (
              <TableRow
                key={campaign.id}
                className={cn('transition-colors duration-150', rowTintClass(campaign.risk_status, isFlashing))}
              >
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
                  <RiskBadge variant={riskToVariant(campaign.risk_status)} size="sm" />
                </TableCell>

                <TableCell className="py-3">
                  <div className="text-sm">
                    <p
                      className={cn(
                        'font-medium',
                        passed ? 'text-risk-hard' : 'text-foreground'
                      )}
                    >
                      {formatAbsoluteDate(campaign.launch_date)}
                    </p>
                    <p className={cn('text-xs', passed ? 'text-risk-hard' : 'text-foreground-muted')}>
                      {formatLaunchDate(campaign.launch_date)}
                    </p>
                  </div>
                </TableCell>

                <TableCell className="py-3 text-right">
                  <span
                    className={cn(
                      'text-sm font-medium',
                      campaign.task_counts.pending > 0
                        ? 'text-foreground'
                        : 'text-foreground-muted'
                    )}
                  >
                    {campaign.task_counts.pending}
                  </span>
                </TableCell>

                <TableCell className="py-3 text-right">
                  <span
                    className={cn(
                      'text-sm font-medium',
                      campaign.task_counts.blocked > 0 ? 'text-risk-blocked' : 'text-foreground-muted'
                    )}
                  >
                    {campaign.task_counts.blocked}
                  </span>
                </TableCell>

                <TableCell className="py-3 text-right">
                  <Link
                    href={`/campaigns/${campaign.id}`}
                    className="text-xs font-semibold text-primary transition-colors hover:underline focus:outline-none focus:ring-2 focus:ring-primary rounded underline-offset-4"
                  >
                    View
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
