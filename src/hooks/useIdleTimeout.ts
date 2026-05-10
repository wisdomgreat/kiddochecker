
import { useEffect, useRef, useCallback } from 'react';

/**
 * useIdleTimeout - A hook to monitor user inactivity and trigger an action.
 * Useful for automatic logout of sensitive admin/staff sessions.
 * 
 * @param onTimeout - Function to call when timeout is reached
 * @param timeoutMs - Timeout duration in milliseconds (default: 30 minutes)
 * @param isActive - Whether the monitor is currently active
 */
export const useIdleTimeout = (
  onTimeout: () => void, 
  timeoutMs: number = 30 * 60 * 1000,
  isActive: boolean = true
) => {
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (isActive) {
      timerRef.current = setTimeout(onTimeout, timeoutMs);
    }
  }, [onTimeout, timeoutMs, isActive]);

  useEffect(() => {
    if (!isActive) {
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    const events = [
      'mousedown', 
      'mousemove', 
      'keypress', 
      'scroll', 
      'touchstart', 
      'click',
      'wheel'
    ];
    
    const handleEvent = () => resetTimer();

    // Register listeners
    events.forEach(event => window.addEventListener(event, handleEvent));
    
    // Initial start
    resetTimer();

    return () => {
      // Cleanup
      events.forEach(event => window.removeEventListener(event, handleEvent));
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [resetTimer, isActive]);

  return { resetTimer };
};
