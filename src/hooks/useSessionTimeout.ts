import { useState, useEffect, useRef, useCallback } from 'react';
import { User, SessionTimeoutPolicy } from '../types';
import { soundAlert } from '../utils/soundAlert';

const DEFAULT_POLICY: SessionTimeoutPolicy = {
  timeoutMinutes: 1440, // 24 hours - testing mode active so you are never logged out
  warningSeconds: 60,
  soundAlertEnabled: false,
  autoLockOnTabBlur: false,
  enforceSoc2Strict: false,
  testingMode: true,
};

const STORAGE_POLICY_KEY = 'caoms_soc2_session_policy';

export interface UseSessionTimeoutProps {
  user: User | null;
  onLogout: (reason?: string) => void;
}

// Global lightweight pub/sub for session remaining seconds
// Allows only targeted components (like SessionGuardIndicator) to re-render on countdown ticks
type CountdownListener = (seconds: number) => void;
const countdownListeners = new Set<CountdownListener>();
let currentRemainingSeconds: number = 1440 * 60;

export function useSessionRemainingSeconds(fallbackSeconds: number = 900): number {
  const [seconds, setSeconds] = useState<number>(() => currentRemainingSeconds || fallbackSeconds);
  useEffect(() => {
    const listener: CountdownListener = (s: number) => {
      setSeconds(s);
    };
    countdownListeners.add(listener);
    return () => {
      countdownListeners.delete(listener);
    };
  }, []);
  return seconds;
}

export function useSessionTimeout({ user, onLogout }: UseSessionTimeoutProps) {
  // Load policy from localStorage if available, ensuring testingMode is enabled by default
  const [policy, setPolicy] = useState<SessionTimeoutPolicy>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_POLICY_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { 
          ...DEFAULT_POLICY, 
          ...parsed,
          testingMode: parsed.testingMode !== undefined ? parsed.testingMode : true,
          timeoutMinutes: parsed.testingMode !== false ? 1440 : (parsed.timeoutMinutes || 15),
          soundAlertEnabled: false
        };
      }
    } catch {
      // Ignore
    }
    return DEFAULT_POLICY;
  });

  const [isWarningOpen, setIsWarningOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  const lastActivityRef = useRef<number>(Date.now());
  const remainingSecondsRef = useRef<number>(policy.timeoutMinutes * 60);
  const isWarningOpenRef = useRef<boolean>(false);
  const hasPlayedChimeRef = useRef<boolean>(false);
  const isLoggingOutRef = useRef<boolean>(false);
  const throttleTimeoutRef = useRef<number | null>(null);

  // Keep warning ref in sync
  isWarningOpenRef.current = isWarningOpen;

  // Reset timer silently on user activity without triggering React re-renders
  const handleUserActivity = useCallback(() => {
    if (!user || isLoggingOutRef.current) return;

    const now = Date.now();
    // Throttle activity updates to once every 1000ms
    if (!throttleTimeoutRef.current) {
      throttleTimeoutRef.current = window.setTimeout(() => {
        throttleTimeoutRef.current = null;
      }, 1000);

      // Only auto-reset if warning modal is NOT actively open
      if (!isWarningOpenRef.current) {
        lastActivityRef.current = now;
      }
    }
  }, [user]);

  // Extend session explicitly (e.g. from warning modal or drawer button)
  const extendSession = useCallback(async () => {
    const now = Date.now();
    lastActivityRef.current = now;
    if (isWarningOpenRef.current) {
      setIsWarningOpen(false);
      isWarningOpenRef.current = false;
    }
    hasPlayedChimeRef.current = false;
    setIsSimulating(false);

    if (policy.soundAlertEnabled) {
      soundAlert.playSuccessChime();
    }

    // Ping backend to record session heartbeat/extension
    if (user) {
      try {
        await fetch('/api/auth/session-heartbeat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mocked-soc2-jwt-token',
          },
          body: JSON.stringify({
            userId: user.id,
            userName: user.name,
            userRole: user.role,
            reason: 'USER_EXTENDED_ACTIVE_SESSION',
          }),
        });
      } catch {
        // Safe fail
      }
    }
  }, [user, policy.soundAlertEnabled]);

  // Immediate manual lock
  const lockNow = useCallback(async (reason: string = 'MANUAL_LOCK') => {
    if (isLoggingOutRef.current) return;
    isLoggingOutRef.current = true;
    if (isWarningOpenRef.current) {
      setIsWarningOpen(false);
      isWarningOpenRef.current = false;
    }

    if (user) {
      try {
        await fetch('/api/auth/session-timeout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mocked-soc2-jwt-token',
          },
          body: JSON.stringify({
            userId: user.id,
            userName: user.name,
            userRole: user.role,
            reason: reason,
            inactivitySeconds: Math.floor((Date.now() - lastActivityRef.current) / 1000),
            soc2Criterion: 'CC6.1 - Logical Access Controls',
          }),
        });
      } catch {
        // Safe fail
      }
    }

    onLogout(reason);
  }, [user, onLogout]);

  // Simulate inactivity warning (10-15s simulation for SOC2 testing)
  const simulateInactivity = useCallback((countdownSeconds: number = 10) => {
    setIsSimulating(true);
    hasPlayedChimeRef.current = false;
    // Fast forward last activity so only `countdownSeconds` remain
    const targetRemainingMs = countdownSeconds * 1000;
    const artificialLastActivity = Date.now() - (policy.timeoutMinutes * 60 * 1000 - targetRemainingMs);
    lastActivityRef.current = artificialLastActivity;
    remainingSecondsRef.current = countdownSeconds;
    currentRemainingSeconds = countdownSeconds;
    countdownListeners.forEach(fn => fn(countdownSeconds));
    
    if (!isWarningOpenRef.current) {
      setIsWarningOpen(true);
      isWarningOpenRef.current = true;
    }

    if (policy.soundAlertEnabled) {
      soundAlert.playWarningChime();
      hasPlayedChimeRef.current = true;
    }
  }, [policy.timeoutMinutes, policy.soundAlertEnabled]);

  // Update policy configuration
  const updatePolicy = useCallback(async (newPolicy: Partial<SessionTimeoutPolicy>) => {
    setPolicy((prev) => {
      const updated = { ...prev, ...newPolicy };
      try {
        localStorage.setItem(STORAGE_POLICY_KEY, JSON.stringify(updated));
      } catch {
        // Ignore
      }
      return updated;
    });

    if (user && (user.role === 'admin' || user.role === 'partner')) {
      try {
        await fetch('/api/auth/session-policy', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mocked-soc2-jwt-token',
          },
          body: JSON.stringify({
            ...policy,
            ...newPolicy,
            updatedBy: user.name,
          }),
        });
      } catch {
        // Ignore
      }
    }
  }, [user, policy]);

  // Bind global activity listeners
  useEffect(() => {
    if (!user) {
      isLoggingOutRef.current = false;
      return;
    }

    const events: (keyof WindowEventMap)[] = [
      'mousemove',
      'mousedown',
      'keydown',
      'touchstart',
      'scroll',
      'wheel',
      'click',
    ];

    const onEvent = () => handleUserActivity();

    events.forEach((ev) => {
      window.addEventListener(ev, onEvent, { passive: true });
    });

    // Tab visibility handling
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        handleUserActivity();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      events.forEach((ev) => {
        window.removeEventListener(ev, onEvent);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (throttleTimeoutRef.current) {
        clearTimeout(throttleTimeoutRef.current);
      }
    };
  }, [user, handleUserActivity]);

  // Master 1-second interval timer: Notifies isolated subscribers, never forces AppInner to re-render
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const timeoutMs = policy.timeoutMinutes * 60 * 1000;
      const warningMs = policy.warningSeconds * 1000;
      const elapsedMs = now - lastActivityRef.current;
      const remainingMs = Math.max(0, timeoutMs - elapsedMs);
      const remainingSecs = Math.ceil(remainingMs / 1000);

      remainingSecondsRef.current = remainingSecs;
      currentRemainingSeconds = remainingSecs;

      // Broadcast countdown to lightweight subscribers (SessionGuardIndicator)
      countdownListeners.forEach((fn) => fn(remainingSecs));

      // Check if we entered the warning window (suppressed in testing mode unless simulating)
      if (isSimulating || policy.testingMode === false) {
        if (remainingMs <= warningMs && remainingMs > 0) {
          if (!isWarningOpenRef.current) {
            setIsWarningOpen(true);
            isWarningOpenRef.current = true;
          }
          if (policy.soundAlertEnabled && !hasPlayedChimeRef.current) {
            soundAlert.playWarningChime();
            hasPlayedChimeRef.current = true;
          }
        } else if (remainingMs > warningMs) {
          if (isWarningOpenRef.current) {
            setIsWarningOpen(false);
            isWarningOpenRef.current = false;
          }
          hasPlayedChimeRef.current = false;
        }
      } else {
        if (isWarningOpenRef.current) {
          setIsWarningOpen(false);
          isWarningOpenRef.current = false;
        }
      }

      // Check if session has expired
      if (remainingMs <= 0 && !isLoggingOutRef.current) {
        if (isSimulating) {
          lockNow('SIMULATED_SOC2_TEST');
        } else if (policy.testingMode !== false) {
          // Testing mode active: Keep session alive seamlessly, never lock user out
          const renewed = Date.now();
          lastActivityRef.current = renewed;
          remainingSecondsRef.current = policy.timeoutMinutes * 60;
          currentRemainingSeconds = remainingSecondsRef.current;
          if (isWarningOpenRef.current) {
            setIsWarningOpen(false);
            isWarningOpenRef.current = false;
          }
        } else {
          lockNow('INACTIVITY_TIMEOUT');
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [user, policy.timeoutMinutes, policy.warningSeconds, policy.soundAlertEnabled, policy.testingMode, isSimulating, lockNow]);

  return {
    policy,
    remainingSeconds: remainingSecondsRef.current,
    isWarningOpen,
    isSettingsOpen,
    isSimulating,
    setIsSettingsOpen,
    setIsWarningOpen,
    extendSession,
    lockNow,
    simulateInactivity,
    updatePolicy,
  };
}

