import { lazy, Suspense, useEffect } from 'react';
import { useQuickAdd } from './quick-add-context';

/**
 * Every add form — weight, meal (including the estimator), habit, task — lives
 * behind this boundary. Together they are a meaningful slice of the bundle, and
 * none of it is needed to render a screen.
 *
 * It is prefetched as soon as the browser is idle, so by the time anyone taps
 * the Add button the chunk is already there and the sheet opens instantly.
 */
const LazyQuickAddSheet = lazy(() =>
  import('./quick-add-sheet').then((module) => ({ default: module.QuickAddSheet })),
);

function prefetch() {
  void import('./quick-add-sheet');
}

export function QuickAddSheet() {
  const { view } = useQuickAdd();

  useEffect(() => {
    const idle = window.requestIdleCallback;
    if (typeof idle === 'function') {
      const handle = idle(prefetch, { timeout: 4000 });
      return () => window.cancelIdleCallback?.(handle);
    }
    // Safari has no requestIdleCallback; a short timer is close enough.
    const timer = window.setTimeout(prefetch, 2000);
    return () => window.clearTimeout(timer);
  }, []);

  // Nothing is mounted until the sheet is actually opened.
  if (view === null) return null;

  return (
    <Suspense fallback={null}>
      <LazyQuickAddSheet />
    </Suspense>
  );
}
