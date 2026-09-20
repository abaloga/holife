import { useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { toast } from '@/components/ui/toaster';

/**
 * Service-worker lifecycle.
 *
 * Updates are offered rather than forced: reloading underneath someone who is
 * mid-entry would lose what they typed. The toast persists until it's actioned.
 */
export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisterError(error) {
      console.error('Service worker registration failed', error);
    },
  });

  useEffect(() => {
    if (!needRefresh) return;

    toast('A new version of HoLife is ready', {
      duration: Infinity,
      action: {
        label: 'Reload',
        onClick: () => void updateServiceWorker(true),
      },
      onDismiss: () => setNeedRefresh(false),
    });
  }, [needRefresh, setNeedRefresh, updateServiceWorker]);

  return null;
}
