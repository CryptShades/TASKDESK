'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';
import { RiskBadge } from '@/components/ui/risk-badge';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { getRiskVariant, formatCountdown, cn } from '@/lib/utils';
import type { CampaignWithStats } from '@/services/campaign.service';

type RiskStatus = 'normal' | 'at_risk' | 'high_risk';
type FilterStatus = 'all' | RiskStatus;

interface Props {
  initialData: CampaignWithStats[];
}

const RISK_ORDER: Record<RiskStatus, number> = {
  high_risk: 0,
  at_risk: 1,
  normal: 2,
};

function sortCampaigns(campaigns: CampaignWithStats[]): CampaignWithStats[] {
  return [...campaigns].sort((a, b) => {
    const riskDiff =
      RISK_ORDER[a.risk_status as RiskStatus] -
      RISK_ORDER[b.risk_status as RiskStatus];
    if (riskDiff !== 0) return riskDiff;
    return new Date(a.launch_date).getTime() - new Date(b.launch_date).getTime();
  });
}

function isLaunchPassed(dateStr: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(dateStr) < today;
}

function ProgressBar({ total, overdue, blocked }: { total: number; overdue: number; blocked: number }) {
  const healthy = Math.max(0, total - overdue - blocked);
  const pct = total > 0 ? Math.round((healthy / total) * 100) : 0;
  const barColor =
    overdue > 0 ? 'bg-risk-hard' : blocked > 0 ? 'bg-risk-soft' : 'bg-risk-normal';

  return (
    <div className="flex flex-col gap-1">
      <span className="font-mono text-xs text-foreground">
        {healthy} / {total} tasks
      </span>
      {total > 0 && (
        <div className="h-1.5 w-24 overflow-hidden rounded-full bg-surface-raised">
          <div
            className={cn('h-full rounded-full transition-all', barColor)}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  );
}

export function CampaignListTable({ initialData }: Props) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');

  const sorted = useMemo(() => sortCampaigns(initialData), [initialData]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return sorted.filter((c) => {
      if (statusFilter !== 'all' && c.risk_status !== statusFilter) return false;
      if (q) {
        const matchName = c.name.toLowerCase().includes(q);
        const matchClient = c.client?.name?.toLowerCase().includes(q) ?? false;
        if (!matchName && !matchClient) return false;
      }
      return true;
    });
  }, [sorted, search, statusFilter]);

  if (initialData.length === 0) {
    return (
      <div className="flex flex-col rounded-lg border border-border bg-surface">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-base font-semibold text-foreground">All Campaigns</h2>
          <Link
            href="/campaigns/new"
            className="inline-flex h-8 items-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-muted focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
          >
            + New Campaign
          </Link>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center py-20 text-center">
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
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-6 py-4">
        <h2 className="text-base font-semibold text-foreground">All Campaigns</h2>
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-foreground-muted" />
            <input
              type="search"
              placeholder="Search campaigns…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 w-52 rounded-md border border-border bg-input pl-8 pr-3 text-sm text-foreground placeholder:text-foreground-muted focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as FilterStatus)}
            className="h-8 rounded-md border border-border bg-input px-3 text-sm text-foreground focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All</option>
            <option value="high_risk">High Risk</option>
            <option value="at_risk">At Risk</option>
            <option value="normal">On Track</option>
          </select>
          <Link
            href="/campaigns/new"
            className="inline-flex h-8 items-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-muted focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
          >
            + New
          </Link>
        </div>
      </div>

      {/* No-results empty state */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-sm text-foreground-muted">
            No campaigns match your filters.
          </p>
          <button
            onClick={() => { setSearch(''); setStatusFilter('all'); }}
            className="mt-2 text-sm font-medium text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary rounded"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-[10px] font-bold uppercase tracking-widest">Risk</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-widest">Campaign</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-widest">Client</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-widest">Launch</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-widest">Progress</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-widest text-right">Overdue</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody aria-live="polite">
            {filtered.map((campaign) => {
              const passed = isLaunchPassed(campaign.launch_date);
              const variant = getRiskVariant(campaign.risk_status);

              return (
                <TableRow key={campaign.id}>
                  <TableCell className="py-3">
                    <RiskBadge variant={variant} size="sm" />
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
                      title={new Date(campaign.launch_date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    >
                      {formatCountdown(campaign.launch_date)}
                    </span>
                  </TableCell>

                  <TableCell className="py-3">
                    <ProgressBar
                      total={campaign.task_stats.total}
                      overdue={campaign.task_stats.overdue}
                      blocked={campaign.task_stats.blocked}
                    />
                  </TableCell>

                  <TableCell className="py-3 text-right">
                    <span
                      className={cn(
                        'font-mono text-sm',
                        campaign.task_stats.overdue > 0
                          ? 'text-risk-hard'
                          : 'text-foreground-muted'
                      )}
                    >
                      {campaign.task_stats.overdue}
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
      )}
    </div>
  );
}
