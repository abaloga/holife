import { Toaster as SonnerToaster, toast } from 'sonner';
import { useEffect, useState } from 'react';

/**
 * Toasts sit above the bottom navigation on phones so they never cover the tab
 * bar or the home indicator.
 */
export function Toaster() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <SonnerToaster
      position="bottom-center"
      offset={92}
      gap={8}
      visibleToasts={3}
      toastOptions={{
        unstyled: false,
        classNames: {
          toast:
            'group flex items-center gap-3 rounded-xl border border-border bg-popover px-4 py-3 text-sm text-popover-foreground shadow-raised',
          title: 'font-medium',
          description: 'text-muted-foreground text-[0.8125rem]',
          actionButton: 'rounded-md bg-primary px-2.5 py-1 text-xs text-primary-foreground',
          cancelButton: 'rounded-md bg-subtle px-2.5 py-1 text-xs',
          error: 'border-destructive/30',
        },
      }}
    />
  );
}

export { toast };
