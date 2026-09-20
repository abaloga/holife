import { AnimatePresence, motion } from 'motion/react';
import { CloudOff } from 'lucide-react';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { transitions } from '@/lib/motion';

/**
 * Explains *why* things might look stale rather than letting the app silently
 * serve yesterday's cache. Sits under the header so it never covers a control.
 */
export function OfflineBanner() {
  const online = useOnlineStatus();

  return (
    <AnimatePresence initial={false}>
      {!online && (
        <motion.div
          role="status"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={transitions.soft}
          className="overflow-hidden bg-subtle"
        >
          <p className="page-x flex items-center justify-center gap-2 py-1.5 text-xs text-subtle-foreground">
            <CloudOff className="size-3.5" aria-hidden />
            Offline, showing your last synced data
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
