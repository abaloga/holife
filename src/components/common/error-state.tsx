import { CloudOff, RotateCw, TriangleAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { toUserMessage } from '@/lib/errors';

interface ErrorStateProps {
  error: unknown;
  onRetry?: () => void;
  /** Names the thing that failed: "your weight history". */
  subject?: string;
  size?: 'compact' | 'default';
  className?: string;
}

/**
 * Says what failed and what to do about it. An offline failure is a different
 * situation from a server error and is worded as such.
 */
export function ErrorState({
  error,
  onRetry,
  subject = 'this',
  size = 'default',
  className,
}: ErrorStateProps) {
  const offline = typeof navigator !== 'undefined' && navigator.onLine === false;
  const Icon = offline ? CloudOff : TriangleAlert;
  const compact = size === 'compact';

  const title = offline ? "You're offline" : `Couldn't load ${subject}`;
  const detail = offline
    ? 'Anything already downloaded is still shown. New data will load when you reconnect.'
    : toUserMessage(error);

  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center justify-center rounded-xl border border-dashed text-center',
        offline ? 'border-border' : 'border-destructive/30',
        compact ? 'gap-2 px-5 py-7' : 'gap-3 px-6 py-12',
        className,
      )}
    >
      <span
        className={cn(
          'grid place-items-center rounded-full',
          compact ? 'size-9' : 'size-12',
          offline ? 'bg-subtle text-muted-foreground' : 'bg-destructive/10 text-destructive',
        )}
      >
        <Icon className={compact ? 'size-4' : 'size-5'} aria-hidden />
      </span>
      <div className="space-y-1">
        <p className={cn('font-medium', compact ? 'text-sm' : 'text-[0.9375rem]')}>{title}</p>
        <p className="mx-auto max-w-[34ch] text-[0.8125rem] leading-relaxed text-muted-foreground">
          {detail}
        </p>
      </div>
      {onRetry && (
        <Button size="sm" variant="subtle" onClick={onRetry} className="mt-1">
          <RotateCw aria-hidden />
          Try again
        </Button>
      )}
    </div>
  );
}
