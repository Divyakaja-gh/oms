import { useEffect, useState, useCallback } from 'react';

export interface OnlineStatusState {
  isOnline: boolean;
  wasOffline: boolean;
  lastChecked: number;
  checkConnection: () => Promise<boolean>;
}

export function useOnlineStatus(): OnlineStatusState {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });
  const [wasOffline, setWasOffline] = useState<boolean>(false);
  const [lastChecked, setLastChecked] = useState<number>(Date.now());

  const checkConnection = useCallback(async (): Promise<boolean> => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setIsOnline(false);
      setLastChecked(Date.now());
      return false;
    }

    try {
      // Lightweight cache-busting ping to verify real upstream connectivity
      const response = await fetch('/api/health?t=' + Date.now(), {
        method: 'HEAD',
        cache: 'no-store',
      });
      const online = response.ok || response.status < 500;
      setIsOnline(online);
      setLastChecked(Date.now());
      return online;
    } catch {
      // If /api/health fails or times out, rely on navigator.onLine or assume degraded
      const fallback = typeof navigator !== 'undefined' ? navigator.onLine : false;
      setIsOnline(fallback);
      setLastChecked(Date.now());
      return fallback;
    }
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setWasOffline(true);
      setLastChecked(Date.now());
      // Re-verify after brief moment
      setTimeout(() => {
        checkConnection();
      }, 1000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
      setLastChecked(Date.now());
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Periodic heartbeat every 45s to check connectivity
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        checkConnection();
      }
    }, 45000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [checkConnection]);

  return {
    isOnline,
    wasOffline,
    lastChecked,
    checkConnection,
  };
}
