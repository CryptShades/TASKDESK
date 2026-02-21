"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RotateCw } from 'lucide-react';

export function LastUpdated() {
  const [minutesAgo, setMinutesAgo] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const handleRefreshEvent = () => setMinutesAgo(0);
    
    // Reset timer on any realtime update
    window.addEventListener('campaign:updated' as any, handleRefreshEvent);
    window.addEventListener('task:updated' as any, handleRefreshEvent);
    window.addEventListener('task:created' as any, handleRefreshEvent);

    const interval = setInterval(() => {
      setMinutesAgo((prev) => prev + 1);
    }, 60_000);

    return () => {
      window.removeEventListener('campaign:updated' as any, handleRefreshEvent);
      window.removeEventListener('task:updated' as any, handleRefreshEvent);
      window.removeEventListener('task:created' as any, handleRefreshEvent);
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-foreground-muted">
        Last updated:{' '}
        {minutesAgo === 0 ? 'Just now' : `${minutesAgo} min ago`}
      </span>
      <button 
        onClick={() => {
          router.refresh();
          setMinutesAgo(0);
        }}
        className="flex items-center gap-1 text-xs text-primary hover:underline"
      >
        <RotateCw className="w-3 h-3" />
        Refresh
      </button>
    </div>
  );
}
