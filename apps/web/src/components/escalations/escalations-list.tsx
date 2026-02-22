'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  AlertTriangle, 
  AlertOctagon, 
  ChevronDown, 
  ChevronRight, 
  ArrowRight,
  User,
  Clock,
  CheckCircle,
  Bell,
  Zap
} from 'lucide-react';
import { cn, getRiskVariant } from '@/lib/utils';
import { RiskBadge } from '@/components/ui/risk-badge';
import { Button } from '@/components/ui/button';

interface Escalation {
  id: string;
  event_type: string;
  new_value: string | null;
  created_at: string;
  task: {
    id: string;
    title: string;
    status: string;
    due_date: string;
    risk_flag: string | null;
    owner: { id: string; name: string };
  };
  campaign: {
    id: string;
    name: string;
    risk_status: string;
    launch_date: string;
  };
}

interface Props {
  initialEscalations: Escalation[];
}

const STAGE_CONFIG: Record<string, { label: string; color: string; icon: any; border: string }> = {
  escalation_stage_1: { 
    label: 'Stage 1 — Team Alert', 
    color: 'text-risk-soft', 
    icon: Bell,
    border: 'border-l-risk-soft-border'
  },
  escalation_stage_2: { 
    label: 'Stage 2 — Manager Escalation', 
    color: 'text-risk-soft', 
    icon: Zap,
    border: 'border-l-risk-soft-border'
  },
  escalation_stage_3: { 
    label: 'Stage 3 — Founder Escalation', 
    color: 'text-risk-hard', 
    icon: AlertOctagon,
    border: 'border-l-risk-hard-border'
  },
};

// Stage filter values match the valid API ?stage= query param values ('1' | '2' | '3').
const ESCALATION_STAGE_VALUES = ['1', '2', '3'] as const;
type EscalationStageFilter = typeof ESCALATION_STAGE_VALUES[number];
type FilterType = 'all' | EscalationStageFilter | 'resolved';

export function EscalationsList({ initialEscalations }: Props) {
  const [filter, setFilter] = useState<FilterType>('all');
  const [showResolved, setShowResolved] = useState(false);

  const { active, resolved } = useMemo(() => {
    const active = initialEscalations.filter(e => e.task.status !== 'completed');
    const resolved = initialEscalations.filter(e => e.task.status === 'completed');
    return { active, resolved };
  }, [initialEscalations]);

  const filteredEscalations = useMemo(() => {
    let list = filter === 'resolved' ? resolved : active;
    if (filter !== 'all' && filter !== 'resolved') {
      list = list.filter(e => e.event_type === `escalation_stage_${filter}`);
    }
    return list;
  }, [active, resolved, filter]);

  const groupedByStage = useMemo(() => {
    const grouped: Record<string, Escalation[]> = {
      escalation_stage_3: [],
      escalation_stage_2: [],
      escalation_stage_1: [],
    };
    
    filteredEscalations.forEach(e => {
      if (grouped[e.event_type]) {
        grouped[e.event_type].push(e);
      }
    });

    return grouped;
  }, [filteredEscalations]);

  const tabs: { id: FilterType; label: string; count?: number }[] = [
    { id: 'all', label: 'All', count: active.length },
    { id: '1', label: 'Stage 1', count: active.filter(e => e.event_type === 'escalation_stage_1').length },
    { id: '2', label: 'Stage 2', count: active.filter(e => e.event_type === 'escalation_stage_2').length },
    { id: '3', label: 'Stage 3', count: active.filter(e => e.event_type === 'escalation_stage_3').length },
    { id: 'resolved', label: 'Resolved', count: resolved.length },
  ];

  function formatRelative(dateStr: string) {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHrs = Math.floor(diffMs / 3600000);
    if (diffHrs < 1) return 'less than 1h ago';
    return `${diffHrs}h ago`;
  }

  function getTriggerSummary(e: Escalation) {
    const isOverdue = new Date(e.task.due_date) < new Date();
    const launchPassed = new Date(e.campaign.launch_date) < new Date();
    
    let summary = `Task overdue`;
    if (launchPassed) {
      summary += ` · Launch passed`;
    } else {
      const diffMs = new Date(e.campaign.launch_date).getTime() - new Date().getTime();
      const diffHrs = Math.floor(diffMs / 3600000);
      summary += ` · Launch in ${diffHrs}h`;
    }
    return summary;
  }

  return (
    <div className="space-y-6">
      {/* Filter Tabs */}
      <div className="flex items-center justify-between border-b border-border">
        <div className="flex gap-6 overflow-x-auto pb-px">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={cn(
                "pb-3 text-sm font-medium transition-colors whitespace-nowrap border-b-2 px-1 relative",
                filter === tab.id 
                  ? "border-primary text-primary" 
                  : "border-transparent text-foreground-muted hover:text-foreground"
              )}
            >
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className={cn(
                  "ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] bg-surface-raised border border-border",
                  filter === tab.id ? "text-primary" : "text-foreground-muted"
                )}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {initialEscalations.length === 0 ? (
        <div className="rounded-lg border border-border bg-surface py-12 text-center px-4">
          <p className="text-sm text-foreground-muted">
            No active escalations. All campaigns are progressing normally.
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          {Object.entries(groupedByStage).map(([stageType, escalations]) => {
            if (escalations.length === 0) return null;
            const config = STAGE_CONFIG[stageType];

            return (
              <div key={stageType} className="space-y-4">
                <h2 className={cn("text-[10px] font-bold uppercase tracking-widest flex items-center gap-2", config.color)}>
                  <config.icon className="h-3.5 w-3.5" />
                  {config.label}
                </h2>

                <div className="grid gap-4">
                  {escalations.map(escalation => (
                    <div 
                      key={escalation.id} 
                      className={cn(
                        "group relative rounded-lg border border-border bg-surface p-5 transition-shadow hover:shadow-md border-l-[3px]",
                        config.border
                      )}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <RiskBadge variant={getRiskVariant(escalation.campaign.risk_status)} />
                            <h3 className="text-base font-semibold text-foreground">
                              {escalation.campaign.name}
                            </h3>
                          </div>
                          
                          <p className="text-sm text-foreground-muted">
                            {getTriggerSummary(escalation)}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="text-xs text-foreground-subtle flex items-center gap-1 justify-end">
                            <Clock className="h-3 w-3" />
                            Triggered: {new Date(escalation.created_at).toLocaleString()}
                          </p>
                          <div className="mt-1 flex items-center gap-2 justify-end">
                            <span className="text-xs text-foreground-muted flex items-center gap-1">
                              <User className="h-3 w-3" /> Owner: {escalation.task.owner.name}
                            </span>
                            {escalation.event_type === 'escalation_stage_3' && (
                              <span className="text-[10px] font-medium text-risk-hard bg-risk-hard-bg/10 px-2 py-0.5 rounded">
                                Manager notified: {formatRelative(escalation.created_at)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-foreground-muted">Targeting:</span>
                          <Link 
                            href={`/campaigns/${escalation.campaign.id}/tasks/${escalation.task.id}`}
                            className="text-xs font-medium text-foreground hover:text-primary transition-colors flex items-center gap-1"
                          >
                            {escalation.task.title} <ArrowRight className="h-3 w-3" />
                          </Link>
                        </div>
                        
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/campaigns/${escalation.campaign.id}`}>
                            View Campaign <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {filter === 'all' && resolved.length > 0 && (
            <div className="border-t border-border pt-6">
              <button
                onClick={() => setShowResolved(!showResolved)}
                className="flex items-center gap-2 text-sm font-medium text-foreground-muted hover:text-foreground transition-colors"
              >
                {showResolved ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                Show {resolved.length} resolved escalations
              </button>
              
              {showResolved && (
                <div className="mt-4 grid gap-4 opacity-75">
                  {resolved.map(escalation => (
                    <div 
                      key={escalation.id} 
                      className="rounded-lg border border-border bg-surface-raised p-4 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-4 w-4 text-risk-normal" />
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {escalation.campaign.name}
                          </p>
                          <p className="text-xs text-foreground-muted">
                            {escalation.task.title} marked completed.
                          </p>
                        </div>
                      </div>
                      <Link 
                        href={`/campaigns/${escalation.campaign.id}`}
                        className="text-xs font-medium text-primary hover:underline"
                      >
                        View Details
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
