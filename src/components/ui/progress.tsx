import { motion, useReducedMotion } from 'motion/react';
import { cn, clamp, safeRatio } from '@/lib/utils';
import { transitions } from '@/lib/motion';

interface ProgressBarProps {
  value: number;
  max: number;
  className?: string;
  /** Any Tailwind background utility. App colours live at the call site. */
  indicatorClassName?: string;
  size?: 'sm' | 'default' | 'lg';
  /** Marks the portion beyond `max` in a muted overflow colour. */
  showOverflow?: boolean;
  label?: string;
}

const BAR_HEIGHTS = { sm: 'h-1', default: 'h-1.5', lg: 'h-2.5' } as const;

export function ProgressBar({
  value,
  max,
  className,
  indicatorClassName = 'bg-accent',
  size = 'default',
  showOverflow = true,
  label,
}: ProgressBarProps) {
  const ratio = safeRatio(value, max);
  const filled = clamp(ratio, 0, 1);
  const over = showOverflow && ratio > 1;

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={max}
      // Fractional targets (a 0–1 goal ratio) would otherwise round to 0 or 1.
      aria-valuenow={max <= 1 ? Number(value.toFixed(2)) : Math.round(value)}
      aria-label={label}
      className={cn('w-full overflow-hidden rounded-full bg-muted', BAR_HEIGHTS[size], className)}
    >
      <motion.div
        className={cn('h-full rounded-full', over ? 'bg-warning' : indicatorClassName)}
        initial={false}
        animate={{ width: `${filled * 100}%` }}
        transition={transitions.soft}
      />
    </div>
  );
}

interface ProgressRingProps {
  value: number;
  max: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  /** A CSS colour, usually `var(--chart-n)`. */
  color?: string;
  trackClassName?: string;
  children?: React.ReactNode;
  label?: string;
}

/**
 * The ring caps its arc at 100% but switches colour when exceeded, so going
 * over a target is legible without the geometry lying about the number.
 */
export function ProgressRing({
  value,
  max,
  size = 96,
  strokeWidth = 8,
  className,
  color = 'var(--accent)',
  trackClassName = 'stroke-muted',
  children,
  label,
}: ProgressRingProps) {
  const reduceMotion = useReducedMotion();
  const ratio = safeRatio(value, max);
  const filled = clamp(ratio, 0, 1);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <div
      className={cn('relative shrink-0', className)}
      style={{ width: size, height: size }}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={Math.round(value)}
      aria-label={label}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className={trackClassName}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          stroke={ratio > 1 ? 'var(--warning)' : color}
          strokeDasharray={circumference}
          initial={reduceMotion ? false : { strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference * (1 - filled) }}
          transition={reduceMotion ? { duration: 0 } : { ...transitions.soft, duration: 0.6 }}
        />
      </svg>
      {children && (
        <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
      )}
    </div>
  );
}
