import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import { cn } from '@/lib/utils';

interface AnimatedNumberProps {
  value: number;
  /** Renders the tweened value — keeps unit formatting at the call site. */
  format?: (value: number) => string;
  decimals?: number;
  durationMs?: number;
  className?: string;
}

/**
 * Counts from the previous value to the new one. Used where a number changing
 * *is* the feedback — daily calories, streak counts, goal progress.
 *
 * Skips straight to the target under `prefers-reduced-motion`, and on first
 * render, so screens do not spin up from zero every time they mount.
 */
export function AnimatedNumber({
  value,
  format,
  decimals = 0,
  durationMs = 550,
  className,
}: AnimatedNumberProps) {
  const reduceMotion = useReducedMotion();
  const [display, setDisplay] = useState(value);
  const previous = useRef(value);
  const frame = useRef<number>();

  useEffect(() => {
    const from = previous.current;
    const to = value;
    previous.current = value;

    if (reduceMotion || from === to) {
      setDisplay(to);
      return;
    }

    const start = performance.now();
    const step = (now: number) => {
      const progress = Math.min((now - start) / durationMs, 1);
      // easeOutCubic: fast arrival, gentle settle.
      const eased = 1 - (1 - progress) ** 3;
      setDisplay(from + (to - from) * eased);
      if (progress < 1) frame.current = requestAnimationFrame(step);
    };

    frame.current = requestAnimationFrame(step);
    return () => {
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, [value, durationMs, reduceMotion]);

  const text = format ? format(display) : display.toFixed(decimals);

  return (
    <span className={cn('tnum', className)}>{text}</span>
  );
}
