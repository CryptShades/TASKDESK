'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useUser } from '@/context/user-context';
import { subscribeToOrgChannels, subscribeToUserChannels } from '@/lib/realtime';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface RealtimeContextType {
  isConnected: boolean;
  isReconnecting: boolean;
  subscribeToNotifications: (callback: (payload: any) => void) => () => void;
  subscribeToTasks: (callback: (payload: any) => void) => () => void;
  subscribeToCampaigns: (callback: (payload: any) => void) => () => void;
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const { currentUser } = useUser();
  const [isConnected, setIsConnected] = useState(true);
  const [isReconnecting, setIsReconnecting] = useState(false);

  useEffect(() => {
    if (!currentUser) return;

    const channels: RealtimeChannel[] = [];
    
    // Subscribe to all relevant streams
    if (currentUser.org_id) {
      channels.push(...subscribeToOrgChannels(currentUser.org_id));
    }
    if (currentUser.id) {
      channels.push(subscribeToUserChannels(currentUser.id));
    }

    // Monitor connection status
    let disconnectTimer: NodeJS.Timeout;

    const checkStatus = () => {
      const allConnected = channels.every(c => c.state === 'joined');
      const anyErrored = channels.some(c => c.state === 'errored');
      
      if (allConnected) {
        setIsConnected(true);
        setIsReconnecting(false);
        clearTimeout(disconnectTimer);
      } else if (anyErrored) {
        setIsReconnecting(true);
        // Turn indicator amber only after 10s of instability
        disconnectTimer = setTimeout(() => {
          setIsConnected(false);
        }, 10000);
      }
    };

    const StatusInterval = setInterval(checkStatus, 5000);

    return () => {
      channels.forEach(c => c.unsubscribe());
      clearInterval(StatusInterval);
      clearTimeout(disconnectTimer);
    };
  }, [currentUser]);

  return (
    <RealtimeContext.Provider
      value={{
        isConnected,
        isReconnecting,
        subscribeToNotifications: (callback) => {
          const handler = (e: any) => callback(e.detail);
          window.addEventListener('notification:new', handler);
          return () => window.removeEventListener('notification:new', handler);
        },
        subscribeToTasks: (callback) => {
          const handler = (e: any) => callback(e.detail);
          window.addEventListener('task:updated', handler);
          window.addEventListener('task:created', handler);
          return () => {
            window.removeEventListener('task:updated', handler);
            window.removeEventListener('task:created', handler);
          };
        },
        subscribeToCampaigns: (callback) => {
          const handler = (e: any) => callback(e.detail);
          window.addEventListener('campaign:updated', handler);
          return () => window.removeEventListener('campaign:updated', handler);
        }
      }}
    >
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtime() {
  const context = useContext(RealtimeContext);
  if (context === undefined) {
    throw new Error('useRealtime must be used within a RealtimeProvider');
  }
  return context;
}