'use client';

import { useState, useEffect } from 'react';
import { Bell, CheckCircle2 } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { NotificationInbox } from '@/components/notifications/notification-inbox';
import { useUser } from '@/context/user-context';
import type { Database } from '../../../../supabase/types';

type Notification = Database['public']['Tables']['notifications']['Row'] & {
  task: { id: string; title: string } | null;
  campaign: { id: string; name: string } | null;
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useUser();

  useEffect(() => {
    async function loadNotifications() {
      try {
        const res = await fetch('/api/notifications');
        const { data } = await res.json();
        setNotifications(data || []);
      } catch (err) {
        console.error('Failed to load notifications:', err);
      } finally {
        setLoading(false);
      }
    }
    
    if (currentUser) {
      loadNotifications();
    }
  }, [currentUser]);

  async function handleMarkAllRead() {
    try {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      await fetch('/api/notifications/read-all', { method: 'PATCH' });
    } catch (err) {
      console.error('Mark all read failed:', err);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <PageHeader 
        title="Notifications" 
        subtitle="Stay updated on task assignments, due dates, and campaign escalations."
        action={
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleMarkAllRead}
            disabled={notifications.every(n => n.read) || notifications.length === 0}
            className="text-foreground-muted hover:text-foreground"
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Mark all as read
          </Button>
        }
      />
      
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-surface-raised animate-pulse rounded-lg" />
          ))}
        </div>
      ) : (
        <NotificationInbox initialNotifications={notifications} />
      )}
    </div>
  );
}
