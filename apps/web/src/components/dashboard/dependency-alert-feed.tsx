'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, AlertOctagon } from 'lucide-react';
import { useRealtime } from '@/context/realtime-context';
import { cn } from '@/lib/utils';

interface AlertItem {
  id: string;
  title: string;
  campaign: { id: string; name: string };
  dependency_gap_hours: number;
}

interface Props {
  initialAlerts: AlertItem[];
}

const MAX_VISIBLE = 8;

/** Gap > 24h escalates to high-risk severity */
function alertSeverity(gapHours: number): 'soft' | 'hard' {
  return gapHours > 24 ? 'hard' : 'soft';
}

async function fetchAlerts(): Promise<AlertItem[]> {
  try {
    const res = await fetch('/api/dashboard/dependency-alerts');
    if (!res.ok) return [];
    const body = await res.json();
    return body.data ?? [];
  } catch {
    return [];
  }
}

export function DependencyAlertFeed({ initialAlerts }: Props) {
  const [allAlerts, setAllAlerts] = useState<AlertItem[]>(initialAlerts);
  const [flashIds, setFlashIds] = useState<Set<string>>(new Set());
  const { isConnected } = useRealtime();

  useEffect(() => {
    const handleUpdate = async (e: any) => {
      const payload = e.detail;
      const { eventType, new: next, old: prev } = payload;

      // Task picked up / resolved → remove from feed immediately
      if (
        eventType === 'UPDATE' &&
        next?.id &&
        prev?.status === 'not_started' &&
        next.status !== 'not_started'
      ) {
        setAllAlerts((current) => current.filter((a) => a.id !== next.id));
      }

      // A dependency completed → new gaps may have appeared; refresh from server
      if (
        eventType === 'UPDATE' &&
        next?.status === 'completed' &&
        prev?.status !== 'completed'
      ) {
        const fresh = await fetchAlerts();
        if (fresh.length === 0) return;

        setAllAlerts((current) => {
          const currentIds = new Set(current.map((a) => a.id));
          const newItems = fresh.filter((a) => !currentIds.has(a.id));
          const existingItems = fresh.filter((a) => currentIds.has(a.id));
          // New items bubble to top
          const merged = [...newItems, ...existingItems];

          if (newItems.length > 0) {
            const ids = newItems.map((a) => a.id);
            setFlashIds((prev) => new Set([...prev, ...ids]));
            setTimeout(() => {
              setFlashIds((prev) => {
                const n = new Set(prev);
                ids.forEach((id) => n.delete(id));
                return n;
              });
            }, 200);
          }

          return merged;
        });
      }
    };

    window.addEventListener('task:updated' as any, handleUpdate);
    return () => window.removeEventListener('task:updated' as any, handleUpdate);
  }, []);

  const visible = allAlerts.slice(0, MAX_VISIBLE);
  const hasMore = allAlerts.length > MAX_VISIBLE;

  return (
    <div className="flex flex-col rounded-lg border border-border bg-surface">
      <div className="border-b border-border px-6 py-4">
        <h2 className="text-[10px] font-bold uppercase tracking-widest text-foreground-muted">Dependency Alerts</h2>
      </div>

      {visible.length === 0 ? (
        <div className="flex flex-1 items-center justify-center py-12">
          <p className="px-6 text-center text-sm text-foreground-muted">
            No dependency alerts. All task chains are flowing.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-border" aria-live="assertive">
          {visible.map((alert) => {
            const severity = alertSeverity(alert.dependency_gap_hours);
            const Icon = severity === 'hard' ? AlertOctagon : AlertTriangle;
            const isNew = flashIds.has(alert.id);

            return (
              <div
                key={alert.id}
                className={cn(
                  'flex items-start gap-3 px-4 py-3 transition-colors duration-200',
                  isNew && 'bg-risk-normal-bg'
                )}
              >
                <Icon
                  className={cn(
                    'mt-0.5 h-4 w-4 shrink-0',
                    severity === 'hard' ? 'text-risk-hard' : 'text-risk-soft'
                  )}
                  aria-hidden="true"
                />

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {alert.campaign.name}
                  </p>
                  <p className="truncate text-sm text-foreground-muted">
                    &ldquo;{alert.title}&rdquo;
                  </p>
                  <p className="mt-0.5 text-xs text-foreground-subtle">
                    Gap {alert.dependency_gap_hours}h
                  </p>
                </div>

                <Link
                  href={`/campaigns/${alert.campaign.id}`}
                  className="shrink-0 text-xs text-foreground-muted transition-colors hover:text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary rounded"
                  aria-label={`View campaign ${alert.campaign.name}`}
                >
                  View →
                </Link>
              </div>
            );
          })}

          {hasMore && (
            <div className="border-t border-border px-4 py-3">
              <Link
                href="/escalations"
                className="text-sm text-foreground-muted transition-colors hover:text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary rounded"
              >
                See all escalations →
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
