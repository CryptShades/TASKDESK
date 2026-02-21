'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  ChevronDown, 
  ChevronRight, 
  Clock, 
  AlertTriangle, 
  Circle, 
  Play, 
  CheckCircle2, 
  Ban,
  ArrowRight
} from 'lucide-react';
import { cn, formatCountdown } from '@/lib/utils';
import { StatusBadge } from '@/components/ui/status-badge';
import { StatusSelector } from '@/components/ui/status-selector';
import type { Database } from '../../../supabase/types';

type TaskStatus = Database['public']['Enums']['task_status'];
type TaskRiskFlag = Database['public']['Enums']['task_risk_flag'];

interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  due_date: string;
  risk_flag: TaskRiskFlag | null;
  campaign: {
    id: string;
    name: string;
    client: {
      id: string;
      name: string;
    } | null;
  };
}

interface Props {
  initialTasks: Task[];
}

const statusIcons: Record<TaskStatus, React.ElementType> = {
  not_started: Circle,
  in_progress: Play,
  completed: CheckCircle2,
  blocked: Ban,
};

export function MyTasksView({ initialTasks }: Props) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState({
    overdue: true,
    upcoming: true,
    future: true,
  });

  const now = useMemo(() => new Date(), []);
  const next7Days = useMemo(() => {
    const d = new Date(now);
    d.setDate(d.getDate() + 7);
    return d;
  }, [now]);

  const sections = useMemo(() => {
    const overdue = tasks.filter(t => t.status !== 'completed' && new Date(t.due_date) < now);
    const thisWeek = tasks.filter(t => t.status !== 'completed' && new Date(t.due_date) >= now && new Date(t.due_date) < next7Days);
    const future = tasks.filter(t => t.status !== 'completed' && new Date(t.due_date) >= next7Days);
    
    return {
      overdue: { label: 'Overdue', tasks: overdue, color: 'text-risk-hard' },
      thisWeek: { label: 'Due Today & This Week', tasks: thisWeek, color: 'text-status-active' },
      future: { label: 'Upcoming', tasks: future, color: 'text-foreground-muted' },
    };
  }, [tasks, now, next7Days]);

  async function handleStatusChange(taskId: string, newStatus: TaskStatus) {
    setUpdatingId(taskId);
    try {
      const res = await fetch(`/api/tasks/${taskId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (!res.ok) throw new Error('Failed to update status');
      
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    } catch (error) {
      console.error('Update failed:', error);
    } finally {
      setUpdatingId(null);
    }
  }

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  if (tasks.filter(t => t.status !== 'completed').length === 0) {
    return (
      <div className="rounded-lg border border-border bg-surface py-12 text-center px-4">
        <p className="text-sm text-foreground-muted">
          No tasks assigned to you. Your campaign manager will assign tasks as campaigns are created.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {Object.entries(sections).map(([key, section]) => {
        if (section.tasks.length === 0 && key !== 'overdue') return null;
        if (section.tasks.length === 0 && key === 'overdue' && !expandedSections.overdue) return null;

        const isExpanded = expandedSections[key as keyof typeof expandedSections];
        const SectionIcon = isExpanded ? ChevronDown : ChevronRight;

        return (
          <div key={key} className="space-y-4">
            <button
              onClick={() => toggleSection(key as keyof typeof expandedSections)}
              className="flex items-center gap-2 group focus:outline-none"
            >
              <SectionIcon className="h-4 w-4 text-foreground-subtle group-hover:text-foreground transition-colors" />
              <h2 className={cn("text-sm font-semibold uppercase tracking-wide", section.color)}>
                {section.label}
                <span className="ml-2 text-foreground-subtle normal-case font-normal">({section.tasks.length})</span>
              </h2>
            </button>

            {isExpanded && (
              <div className="space-y-px bg-border rounded-lg border border-border overflow-hidden">
                {section.tasks.map(task => {
                  const isOverdue = key === 'overdue';
                  const isDueToday = !isOverdue && new Date(task.due_date).toDateString() === now.toDateString();
                  
                  return (
                    <div 
                      key={task.id} 
                      className={cn(
                        "flex flex-wrap items-center gap-4 bg-surface px-4 py-4 hover:bg-surface-raised transition-colors",
                        isOverdue && "bg-risk-hard-bg/5"
                      )}
                    >
                      {/* Status Icon & Dropdown */}
                      <div className="flex-shrink-0 w-44">
                        <StatusSelector
                          currentStatus={task.status}
                          onChange={(s) => handleStatusChange(task.id, s)}
                          disabled={updatingId === task.id}
                        />
                      </div>

                      {/* Task Info */}
                      <div className="flex-1 min-w-[200px]">
                        <Link 
                          href={`/campaigns/${task.campaign.id}/tasks/${task.id}`}
                          className="font-medium text-foreground hover:text-primary transition-colors block truncate"
                        >
                          {task.title}
                        </Link>
                        <p className="text-xs text-foreground-muted truncate">
                          {task.campaign.client?.name} · {task.campaign.name}
                        </p>
                      </div>

                      {/* Due Date & Risk */}
                      <div className="flex items-center gap-6 flex-shrink-0">
                        <div className="text-right">
                          <div className={cn(
                            "flex items-center gap-1.5 text-xs font-medium justify-end",
                            isOverdue ? "text-risk-hard" : isDueToday ? "text-status-active" : "text-foreground-muted"
                          )}>
                            <Clock className="h-3.5 w-3.5" />
                            {isOverdue ? `Overdue by ${formatCountdown(task.due_date)}` : `Due ${formatCountdown(task.due_date)}`}
                          </div>
                          <p className="text-[10px] text-foreground-subtle">
                            {new Date(task.due_date).toLocaleDateString()}
                          </p>
                        </div>

                        <div className="w-24 flex justify-center">
                          {task.risk_flag === 'hard_risk' ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-risk-hard-border bg-risk-hard-bg px-2 py-0.5 text-[10px] font-medium text-risk-hard">
                              High Risk
                            </span>
                          ) : task.risk_flag === 'soft_risk' ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-risk-soft-border bg-risk-soft-bg px-2 py-0.5 text-[10px] font-medium text-risk-soft">
                              At Risk
                            </span>
                          ) : (
                            <span className="text-foreground-subtle text-[10px]">—</span>
                          )}
                        </div>

                        <Link
                          href={`/campaigns/${task.campaign.id}/tasks/${task.id}`}
                          className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary-muted"
                        >
                          Update <ArrowRight className="h-3 w-3" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
