'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Bell, 
  AlertTriangle, 
  AlertOctagon, 
  ShieldAlert, 
  Clock, 
  Circle,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useRealtime } from '@/context/realtime-context';
import type { Database } from '../../../supabase/types';

type Notification = Database['public']['Tables']['notifications']['Row'] & {
  task: { id: string; title: string } | null;
  campaign: { id: string; name: string } | null;
};

interface Props {
  initialNotifications: Notification[];
}

const config: Record<string, { icon: React.ElementType; color: string }> = {
  reminder: { icon: Bell, color: 'text-blue-500' },
  escalation_stage_1: { icon: AlertTriangle, color: 'text-risk-soft' },
  escalation_stage_2: { icon: AlertTriangle, color: 'text-risk-soft' },
  escalation_stage_3: { icon: AlertOctagon, color: 'text-risk-hard' },
  risk_alert: { icon: ShieldAlert, color: 'text-risk-hard' },
  overdue: { icon: Clock, color: 'text-risk-hard' },
  default: { icon: Bell, color: 'text-foreground-muted' },
};

export function NotificationInbox({ initialNotifications }: Props) {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const { subscribeToNotifications } = useRealtime();

  const handleNotification = useCallback((payload: { eventType: string; new: Record<string, unknown>; old: Record<string, unknown> }) => {
    if (payload.eventType === 'INSERT') {
      // In a real app, we'd fetch the joined data for the new notification
      // For now, we'll just prepend it (it might lack joined info until refresh)
      setNotifications(prev => [payload.new as unknown as Notification, ...prev]);
    } else if (payload.eventType === 'UPDATE') {
      setNotifications(prev => prev.map(n => n.id === (payload.new as any).id ? { ...n, ...(payload.new as any) } : n));
    }
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToNotifications(handleNotification);
    return unsubscribe;
  }, [subscribeToNotifications, handleNotification]);

  async function markRead(id: string) {
    try {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      await fetch(`/api/notifications/${id}`, { method: 'PATCH', body: JSON.stringify({ read: true }) });
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  }

  function formatTimestamp(dateStr: string) {
    const date = new Date(dateStr);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    const diffMs = now.getTime() - date.getTime();
    const isRecent = diffMs < 24 * 60 * 60 * 1000;
    
    if (isRecent) {
      return `${Math.floor(diffMs / 3600000)}h ago`;
    }
    
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
  }

  if (notifications.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-surface py-12 text-center">
        <p className="text-sm text-foreground-muted">No notifications yet.</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border bg-surface rounded-lg border border-border overflow-hidden">
      {notifications.map(n => {
        const itemConfig = config[n.type] || config.default;
        const Icon = itemConfig.icon;
        const link = n.task_id 
          ? `/campaigns/${n.campaign_id}/tasks/${n.task_id}` 
          : n.campaign_id 
            ? `/campaigns/${n.campaign_id}` 
            : null;

        return (
          <div 
            key={n.id}
            className={cn(
              "group relative flex items-start gap-4 p-4 transition-colors",
              n.read ? "bg-surface" : "bg-surface-raised"
            )}
          >
            {/* Status Indicator */}
            <div className="flex-shrink-0 mt-1.5">
              <div className={cn(
                "h-2 w-2 rounded-full",
                n.read ? "bg-gray-300" : (n.type.includes('escalation') || n.type === 'risk_alert' || n.type === 'overdue' ? "bg-risk-hard" : "bg-blue-500")
              )} />
            </div>

            {/* Icon */}
            <div className={cn("mt-1 flex-shrink-0", itemConfig.color)}>
              <Icon className="h-5 w-5" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pr-12">
              <p className={cn(
                "text-sm",
                n.read ? "text-foreground-muted" : "text-foreground font-medium"
              )}>
                {n.message}
              </p>
              
              {(n.task || n.campaign) && (
                <div className="mt-1.5 flex items-center gap-2">
                  <span className="text-[10px] text-foreground-subtle uppercase tracking-wider font-bold">Context:</span>
                  {link ? (
                    <Link 
                      href={link}
                      onClick={() => !n.read && markRead(n.id)}
                      className="text-xs text-primary hover:underline flex items-center gap-1"
                    >
                      {n.task?.title || n.campaign?.name}
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  ) : (
                    <span className="text-xs text-foreground-muted">
                      {n.task?.title || n.campaign?.name}
                    </span>
                  )}
                </div>
              )}
              
              <p className="mt-1 text-[10px] text-foreground-subtle">
                {formatTimestamp(n.created_at)}
              </p>
            </div>

            {/* Action Group */}
            <div className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity">
              {!n.read && (
                <button 
                  onClick={() => markRead(n.id)}
                  className="p-1 rounded hover:bg-surface-overlay text-foreground-subtle hover:text-foreground"
                  title="Mark as read"
                >
                  <Circle className="h-4 w-4 fill-current" />
                </button>
              )}
            </div>
            
            {!n.read && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2 group-hover:hidden">
                <ChevronRight className="h-4 w-4 text-foreground-subtle" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
