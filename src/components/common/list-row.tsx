import * as React from 'react';
import { cn } from '@/lib/utils';

interface ListRowProps extends React.HTMLAttributes<HTMLDivElement> {
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  /** Renders as a button row with press feedback. */
  onActivate?: () => void;
  activateLabel?: string;
  interactive?: boolean;
}

/**
 * The shared row used by habits, tasks, meals and weight history.
 *
 * Rows are separated by hairlines inside one bordered group rather than being
 * individual cards. It reads as a list, keeps density high on a phone, and
 * avoids the "everything in a card" look.
 */
export function ListRow({
  leading,
  trailing,
  onActivate,
  activateLabel,
  interactive,
  className,
  children,
  ...props
}: ListRowProps) {
  const isInteractive = interactive ?? Boolean(onActivate);

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-3.5 py-3',
        isInteractive && 'transition-colors duration-150',
        className,
      )}
      {...props}
    >
      {leading}
      {onActivate ? (
        <button
          type="button"
          onClick={onActivate}
          aria-label={activateLabel}
          className={cn(
            'min-w-0 flex-1 text-left transition-opacity duration-150 active:opacity-60',
            'focus-visible:outline-offset-4',
          )}
        >
          {children}
        </button>
      ) : (
        <div className="min-w-0 flex-1">{children}</div>
      )}
      {trailing}
    </div>
  );
}

/** Groups rows into one surface with hairline separators. */
export function ListGroup({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border border-border bg-card shadow-card',
        '[&>*+*]:border-t [&>*+*]:border-border',
        className,
      )}
      {...props}
    />
  );
}
