import { motion, useReducedMotion } from 'motion/react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { transitions } from '@/lib/motion';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  /** Say what the user will get, not that there is nothing here. */
  description?: string;
  action?: { label: string; onClick: () => void };
  /** `compact` fits inside a Today section; `default` fills a screen. */
  size?: 'compact' | 'default';
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  size = 'default',
  className,
}: EmptyStateProps) {
  const reduceMotion = useReducedMotion();
  const compact = size === 'compact';

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={transitions.soft}
      className={cn(
        'flex flex-col items-center justify-center rounded-xl border border-dashed border-border text-center',
        compact ? 'gap-2 px-5 py-7' : 'gap-3 px-6 py-14',
        className,
      )}
    >
      <span
        className={cn(
          'grid place-items-center rounded-full bg-subtle text-muted-foreground',
          compact ? 'size-9' : 'size-12',
        )}
      >
        <Icon className={compact ? 'size-4' : 'size-5'} aria-hidden />
      </span>
      <div className="space-y-1">
        <p className={cn('font-medium', compact ? 'text-sm' : 'text-[0.9375rem]')}>{title}</p>
        {description && (
          <p className="mx-auto max-w-[28ch] text-[0.8125rem] leading-relaxed text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {action && (
        <Button
          size="sm"
          variant={compact ? 'subtle' : 'default'}
          onClick={action.onClick}
          className="mt-1"
        >
          {action.label}
        </Button>
      )}
    </motion.div>
  );
}
