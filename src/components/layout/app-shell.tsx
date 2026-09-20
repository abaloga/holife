import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { pageTransition } from '@/lib/motion';
import { useTheme } from '@/app/theme-provider';
import { useSettings } from '@/features/settings/hooks';
import { QuickAddProvider } from '@/features/quick-add/quick-add-context';
import { QuickAddSheet } from '@/features/quick-add/quick-add-sheet-lazy';
import { BottomNav } from './bottom-nav';
import { Sidebar } from './sidebar';
import { OfflineBanner } from './offline-banner';

/**
 * Pushes the stored theme preference into the theme provider once settings
 * load, so the choice follows the account across devices while the local
 * mirror keeps the first paint correct.
 */
function ThemeSync() {
  const { data: settings } = useSettings();
  const { preference, setPreference } = useTheme();

  useEffect(() => {
    if (settings && settings.theme !== preference) setPreference(settings.theme);
    // Only react to the server value; local changes are already applied.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings?.theme]);

  return null;
}

/** Route changes should start at the top of the new screen, not mid-scroll. */
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname]);
  return null;
}

export function AppShell() {
  const location = useLocation();
  const reduceMotion = useReducedMotion();

  // Sibling tabs within a module shouldn't re-animate the whole page; key the
  // transition on the module segment rather than the full path.
  const transitionKey = location.pathname.split('/').slice(0, 3).join('/');

  return (
    <QuickAddProvider>
      <ThemeSync />
      <ScrollToTop />

      <div className="min-h-dvh bg-background">
        <Sidebar />

        <div className="md:pl-60">
          <OfflineBanner />
          <AnimatePresence mode="wait" initial={false}>
            <motion.main
              key={transitionKey}
              variants={reduceMotion ? undefined : pageTransition}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <Outlet />
            </motion.main>
          </AnimatePresence>
        </div>

        <BottomNav />
      </div>

      <QuickAddSheet />
    </QuickAddProvider>
  );
}
