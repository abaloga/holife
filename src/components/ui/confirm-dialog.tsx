import * as React from 'react';
import * as AlertDialogPrimitive from '@radix-ui/react-alert-dialog';
import { cn } from '@/lib/utils';
import { buttonVariants } from './button';

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
}

/**
 * Used for anything that discards data. Deliberately a centred alert on every
 * size, because a destructive choice should not be dismissible by a stray swipe.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <AlertDialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialogPrimitive.Portal>
        <AlertDialogPrimitive.Overlay className="fixed inset-0 z-[60] bg-black/50 data-[state=open]:animate-fade-in" />
        <AlertDialogPrimitive.Content
          className={cn(
            'fixed left-1/2 top-1/2 z-[60] w-[calc(100%-2.5rem)] max-w-sm -translate-x-1/2 -translate-y-1/2',
            'rounded-xl border border-border bg-popover p-5 text-popover-foreground shadow-raised',
            'data-[state=open]:animate-fade-in',
          )}
        >
          <AlertDialogPrimitive.Title className="text-base font-semibold tracking-tight">
            {title}
          </AlertDialogPrimitive.Title>
          {description && (
            <AlertDialogPrimitive.Description className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              {description}
            </AlertDialogPrimitive.Description>
          )}
          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <AlertDialogPrimitive.Cancel
              className={cn(buttonVariants({ variant: 'subtle' }), 'sm:min-w-24')}
            >
              {cancelLabel}
            </AlertDialogPrimitive.Cancel>
            <AlertDialogPrimitive.Action
              onClick={onConfirm}
              className={cn(
                buttonVariants({ variant: destructive ? 'destructive' : 'default' }),
                'sm:min-w-24',
              )}
            >
              {confirmLabel}
            </AlertDialogPrimitive.Action>
          </div>
        </AlertDialogPrimitive.Content>
      </AlertDialogPrimitive.Portal>
    </AlertDialogPrimitive.Root>
  );
}

/** Small helper so a screen can wire up a confirm without local boilerplate. */
export function useConfirm() {
  const [state, setState] = React.useState<{
    props: Omit<ConfirmDialogProps, 'open' | 'onOpenChange'>;
  } | null>(null);

  const confirm = React.useCallback(
    (props: Omit<ConfirmDialogProps, 'open' | 'onOpenChange'>) => setState({ props }),
    [],
  );

  const element = state ? (
    <ConfirmDialog
      {...state.props}
      open
      onOpenChange={(open) => {
        if (!open) setState(null);
      }}
      onConfirm={() => {
        state.props.onConfirm();
        setState(null);
      }}
    />
  ) : null;

  return { confirm, confirmElement: element };
}
