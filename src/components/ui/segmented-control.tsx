import { motion, useReducedMotion } from 'motion/react';
import { useId } from 'react';
import { cn } from '@/lib/utils';
import { transitions } from '@/lib/motion';

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  /** Rendered after the label, e.g. an open-task count. */
  badge?: number;
}

interface SegmentedControlProps<T extends string> {
  value: T;
  onValueChange: (value: T) => void;
  options: SegmentedOption<T>[];
  'aria-label': string;
  className?: string;
}

/**
 * Tab-style switch used for view filters. The selected pill is a shared layout
 * element, so moving between segments slides rather than cuts.
 */
export function SegmentedControl<T extends string>({
  value,
  onValueChange,
  options,
  className,
  'aria-label': ariaLabel,
}: SegmentedControlProps<T>) {
  const layoutId = useId();
  const reduceMotion = useReducedMotion();

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        'inline-flex w-full items-center gap-1 rounded-lg bg-subtle p-1',
        className,
      )}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onValueChange(option.value)}
            className={cn(
              'relative flex-1 rounded-md px-3 py-2 text-[0.8125rem] font-medium',
              'transition-colors duration-150',
              selected ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {selected && (
              <motion.span
                layoutId={reduceMotion ? undefined : `segmented-${layoutId}`}
                className="absolute inset-0 rounded-md bg-card shadow-card"
                transition={transitions.spring}
              />
            )}
            <span className="relative flex items-center justify-center gap-1.5">
              {option.label}
              {option.badge != null && option.badge > 0 && (
                <span
                  className={cn(
                    'tnum rounded px-1 text-[0.6875rem] font-semibold',
                    selected ? 'text-accent' : 'text-muted-foreground',
                  )}
                >
                  {option.badge}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
