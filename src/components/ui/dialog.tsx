import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import * as VisuallyHidden from '@radix-ui/react-visually-hidden';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  /** Keeps the title for screen readers but removes it from the layout. */
  hideHeader?: boolean;
  footer?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

/**
 * Radix logs a warning when a dialog renders no description. Clearing the
 * attribute says "this one deliberately has none" instead of pointing at an
 * element that was never rendered.
 */
function noDescription(description: string | undefined) {
  return description ? {} : { 'aria-describedby': undefined };
}

/**
 * A floating dialog, centred on every screen size. Unlike `Sheet`, it never
 * becomes a bottom sheet on a phone — reserved for choices (like picking from
 * a list) that aren't tied to the bottom-anchored patterns `Sheet` exists for.
 */
export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  hideHeader = false,
  footer,
  children,
  className,
}: DialogProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/45 backdrop-blur-[2px] data-[state=open]:animate-fade-in" />
        <DialogPrimitive.Content
          {...noDescription(description)}
          className={cn(
            'fixed left-1/2 top-1/2 z-50 flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2',
            'max-h-[min(44rem,calc(100dvh-4rem))] flex-col overflow-hidden rounded-xl border border-border',
            'bg-popover text-popover-foreground shadow-raised data-[state=open]:animate-fade-in',
            className,
          )}
        >
          <div className="pt-4">
            {hideHeader ? (
              <VisuallyHidden.Root>
                <DialogPrimitive.Title>{title}</DialogPrimitive.Title>
              </VisuallyHidden.Root>
            ) : (
              <div className="flex items-start justify-between gap-4 px-5 pb-3">
                <div className="min-w-0 space-y-0.5">
                  <DialogPrimitive.Title className="text-lg font-semibold tracking-tight">
                    {title}
                  </DialogPrimitive.Title>
                  {description && (
                    <DialogPrimitive.Description className="text-sm text-muted-foreground">
                      {description}
                    </DialogPrimitive.Description>
                  )}
                </div>
              </div>
            )}
          </div>
          <DialogPrimitive.Close
            className={cn(
              'absolute right-3 top-3 grid size-9 place-items-center rounded-lg text-muted-foreground',
              'transition-colors hover:bg-subtle hover:text-foreground',
            )}
            aria-label="Close"
          >
            <X className="size-4" aria-hidden />
          </DialogPrimitive.Close>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5">{children}</div>
          {footer && <div className="border-t border-border bg-popover px-5 py-3.5">{footer}</div>}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
