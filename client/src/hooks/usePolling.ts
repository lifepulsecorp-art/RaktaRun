import { useEffect, useRef } from 'react';

/** Poll without overlapping requests, and stop spending memory/network while hidden. */
export function usePolling(callback: () => void | Promise<void>, intervalMs: number): void {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;
  const isTabVisible = () => document.visibilityState !== 'hidden';

  useEffect(() => {
    let disposed = false;
    let inFlight = false;
    let timeoutId: number | undefined;

    const poll = async () => {
      if (disposed || !isTabVisible() || inFlight) return;
      inFlight = true;
      try {
        await callbackRef.current();
      } catch {
        // Polling callers handle/report their own errors.
      } finally {
        inFlight = false;
        if (!disposed && isTabVisible()) {
          timeoutId = window.setTimeout(poll, intervalMs);
        }
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        if (timeoutId !== undefined) window.clearTimeout(timeoutId);
        timeoutId = undefined;
      } else if (!inFlight) {
        if (timeoutId !== undefined) window.clearTimeout(timeoutId);
        void poll();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    void poll();
    return () => {
      disposed = true;
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [intervalMs]);
}
