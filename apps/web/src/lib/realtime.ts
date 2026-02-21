import { createClient } from './supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

export type RealtimeEvent = 
  | 'campaign:updated'
  | 'task:updated'
  | 'task:created'
  | 'notification:new';

export type RealtimePayload = Record<string, unknown> | null;

export function dispatchRealtimeEvent(event: RealtimeEvent, payload: RealtimePayload) {
  if (typeof window === 'undefined') return;
  
  const customEvent = new CustomEvent(event, {
    detail: payload,
    bubbles: true,
    cancelable: true,
  });
  
  window.dispatchEvent(customEvent);
}

export function subscribeToOrgChannels(orgId: string): RealtimeChannel[] {
  const supabase = createClient();

  // Channel 1 — campaigns
  const campaignsChannel = supabase
    .channel(`org:${orgId}:campaigns`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'campaigns',
        filter: `org_id=eq.${orgId}`,
      },
      (payload) => dispatchRealtimeEvent('campaign:updated', payload.new)
    )
    .subscribe();

  // Channel 2 — tasks
  const tasksChannel = supabase
    .channel(`org:${orgId}:tasks`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'tasks',
        filter: `org_id=eq.${orgId}`,
      },
      (payload) => dispatchRealtimeEvent('task:created', payload.new)
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'tasks',
        filter: `org_id=eq.${orgId}`,
      },
      (payload) => dispatchRealtimeEvent('task:updated', payload)
    )
    .subscribe();

  return [campaignsChannel, tasksChannel];
}

export function subscribeToUserChannels(userId: string): RealtimeChannel {
  const supabase = createClient();

  // Channel 3 — notifications
  const notificationsChannel = supabase
    .channel(`user:${userId}:notifications`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => dispatchRealtimeEvent('notification:new', payload.new)
    )
    .subscribe();

  return notificationsChannel;
}
