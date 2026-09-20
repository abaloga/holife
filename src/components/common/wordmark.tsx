import { cn } from '@/lib/utils';
import { APP_NAME } from '@/lib/env';

/**
 * The brand is typographic on purpose: one string, one accent mark, no asset
 * pipeline. Renaming the product is a change to `VITE_APP_NAME` and this file.
 */
export function Wordmark({
  className,
  size = 'default',
}: {
  className?: string;
  size?: 'default' | 'lg';
}) {
  return (
    <span
      className={cn(
        'inline-flex items-baseline font-semibold tracking-[-0.03em] text-foreground',
        size === 'lg' ? 'text-3xl' : 'text-lg',
        className,
      )}
    >
      {APP_NAME}
      <span aria-hidden className="ml-0.5 size-1 translate-y-px rounded-full bg-accent" />
    </span>
  );
}
