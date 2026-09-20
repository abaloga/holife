import { useEffect, useState } from 'react';

/**
 * Recomputes a value on a timer. Used so the app's idea of "today" and its
 * greeting roll over while the app sits open across midnight, instead of
 * needing a reload.
 */
export function useIntervalValue<T>(compute: () => T, intervalMs: number): T {
  const [value, setValue] = useState(compute);

  useEffect(() => {
    const tick = () => {
      const next = compute();
      setValue((current) => (Object.is(current, next) ? current : next));
    };

    tick();
    const id = window.setInterval(tick, intervalMs);
    const onVisible = () => {
      if (document.visibilityState === 'visible') tick();
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
    };
    // `compute` must be stable. Callers memoise it, which is why re-running on
    // its identity is correct rather than something to suppress.
  }, [intervalMs, compute]);

  return value;
}
