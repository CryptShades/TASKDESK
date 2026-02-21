import { supabase } from './supabase';
import { useNotificationStore } from '../store';
import { Alert } from 'react-native';

export type RealtimePayload = Record<string, unknown> | null;
export type RealtimeCallback = (event: string, payload: RealtimePayload) => void;

let listeners: RealtimeCallback[] = [];

export function addRealtimeListener(callback: RealtimeCallback) {
  listeners.push(callback);
  return () => {
    listeners = listeners.filter(l => l !== callback);
  };
}

function notifyListeners(event: string, payload: RealtimePayload) {
  listeners.forEach(l => l(event, payload));
}

export function initRealtime(orgId: string, userId: string) {
  // Channel 1 — campaigns (org scope)
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
      (payload) => {
        notifyListeners('campaign:updated', payload.new);
      }
    )
    .subscribe();

  // Channel 2 — notifications (user scope)
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
      (payload) => {
        useNotificationStore.getState().increment();
        notifyListeners('notification:new', payload.new);
      }
    )
    .subscribe();

  return () => {
    campaignsChannel.unsubscribe();
    notificationsChannel.unsubscribe();
  };
}
