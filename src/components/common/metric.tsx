import { Link } from 'react-router-dom';
import { ArrowDownRight, ArrowRight, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export type DeltaTone = 'neutral' | 'positive' | 'negative';

interface StatDeltaProps {
  /** Sign drives the arrow direction; `tone` drives the colour. */
  delta: number;
  label: string;
  /**
   * Deliberately defaults to neutral. Whether a change is "good" depends on the
   * user's goal, and the app should not editorialise about body weight.
   */
  tone?: DeltaTone;
  className?: string;
}

const TONE_CLASS: Record<DeltaTone, string> = {
  neutral: 'text-muted-foreground',
  positive: 'text-success',
  negative: 'text-destructive',
};

export function StatDelta({ delta, label, tone = 'neutral', className }: StatDeltaProps) {
  const flat = Math.abs(delta) < 1e-9;
  const Icon = flat ? ArrowRight : delta > 0 ? ArrowUpRight : ArrowDownRight;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-[0.8125rem] font-medium tnum',
        flat ? 'text-muted-foreground' : TONE_CLASS[tone],
        className,
      )}
    >
      <Icon className="size-3.5 shrink-0" aria-hidden />
      {label}
    </span>
  );
}

interface MetricProps {
  label: string;
  value: React.ReactNode;
  unit?: string;
  caption?: React.ReactNode;
  className?: string;
}

/** Label / big number / caption. The unit is typographically subordinate. */
export function Metric({ label, value, unit, caption, className }: MetricProps) {
  return (
    <div className={cn('min-w-0', className)}>
      <p className="text-xs font-medium uppercase tracking-[0.07em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 flex items-baseline gap-1">
        <span className="tnum text-[1.75rem] font-semibold leading-none tracking-tight">
          {value}
        </span>
        {unit && <span className="text-sm font-medium text-muted-foreground">{unit}</span>}
      </p>
      {caption && <div className="mt-1.5 text-[0.8125rem] text-muted-foreground">{caption}</div>}
    </div>
  );
}

interface MetricCardProps extends MetricProps {
  to?: string;
  children?: React.ReactNode;
}

/** A metric on its own surface, optionally linking into its module. */
export function MetricCard({ to, children, className, ...metric }: MetricCardProps) {
  const body = (
    <>
      <Metric {...metric} />
      {children}
    </>
  );

  if (to) {
    return (
      <Link
        to={to}
        className={cn(
          'block rounded-xl border border-border bg-card p-4 shadow-card',
          'transition-[background-color,transform] duration-150 active:scale-[0.99] hover:bg-subtle/40',
          className,
        )}
      >
        {body}
      </Link>
    );
  }

  return (
    <div className={cn('rounded-xl border border-border bg-card p-4 shadow-card', className)}>
      {body}
    </div>
  );
}
