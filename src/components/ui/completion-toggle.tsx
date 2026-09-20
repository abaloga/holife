import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { cn } from '@/lib/utils';
import { transitions } from '@/lib/motion';

interface CompletionToggleProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
  size?: 'sm' | 'default' | 'lg';
  disabled?: boolean;
  className?: string;
}

const SIZES = {
  sm: { box: 'size-8', circle: 'size-[1.125rem]', stroke: 2.4 },
  default: { box: 'size-11', circle: 'size-[1.375rem]', stroke: 2.2 },
  lg: { box: 'size-12', circle: 'size-7', stroke: 2 },
} as const;

/**
 * The shared "mark it done" control for habits and tasks.
 *
 * The tick draws rather than appears, and a ring pulses outward once on
 * completion: enough to feel earned, short enough not to delay the next tap.
 * The hit area is always at least 32px and usually 44px.
 */
export function CompletionToggle({
  checked,
  onCheckedChange,
  label,
  size = 'default',
  disabled,
  className,
}: CompletionToggleProps) {
  const reduceMotion = useReducedMotion();
  const { box, circle, stroke } = SIZES[size];

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        'relative grid shrink-0 place-items-center rounded-full',
        'transition-transform duration-150 active:scale-90',
        'disabled:pointer-events-none disabled:opacity-50',
        box,
        className,
      )}
    >
      {/* Pulse ring, mounted only while transitioning into the checked state. */}
      <AnimatePresence>
        {checked && !reduceMotion && (
          <motion.span
            key="pulse"
            aria-hidden
            className="absolute rounded-full border-2 border-accent"
            style={{ width: '1.375rem', height: '1.375rem' }}
            initial={{ scale: 1, opacity: 0.7 }}
            animate={{ scale: 2.1, opacity: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
          />
        )}
      </AnimatePresence>

      <motion.span
        className={cn(
          'grid place-items-center rounded-full border-2 transition-colors duration-200',
          circle,
          checked ? 'border-accent bg-accent' : 'border-border-strong bg-transparent',
        )}
        animate={reduceMotion ? undefined : { scale: checked ? [1, 1.18, 1] : 1 }}
        transition={transitions.pop}
      >
        <svg viewBox="0 0 24 24" fill="none" className="size-[70%]" aria-hidden>
          <motion.path
            d="M5 12.5L10 17.5L19 7"
            stroke="var(--accent-foreground)"
            strokeWidth={stroke * 1.2}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={false}
            animate={{ pathLength: checked ? 1 : 0, opacity: checked ? 1 : 0 }}
            transition={
              reduceMotion
                ? { duration: 0 }
                : { pathLength: { duration: 0.24, ease: 'easeOut' }, opacity: { duration: 0.1 } }
            }
          />
        </svg>
      </motion.span>
    </button>
  );
}
