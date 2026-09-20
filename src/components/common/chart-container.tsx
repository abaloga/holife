import * as React from 'react';
import { cn } from '@/lib/utils';

interface ChartContainerProps {
  /** Screen-reader description of what the chart shows. */
  label: string;
  height?: number;
  className?: string;
  children: React.ReactNode;
}

/**
 * Gives every chart the same box: a fixed height (so nothing reflows while
 * Recharts measures), a consistent surface, and an accessible label. Charts are
 * decorative to assistive tech, because the numbers they visualise are always also
 * present as text nearby.
 */
export function ChartContainer({ label, height = 200, className, children }: ChartContainerProps) {
  return (
    <div
      role="img"
      aria-label={label}
      className={cn('w-full select-none', className)}
      style={{ height }}
    >
      {children}
    </div>
  );
}

interface TooltipShellProps {
  title: string;
  rows: { label: string; value: string; color?: string }[];
}

/** The one tooltip design used by every chart in the app. */
export function ChartTooltip({ title, rows }: TooltipShellProps) {
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-raised">
      <p className="font-medium text-popover-foreground">{title}</p>
      <div className="mt-1.5 space-y-1">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center gap-2">
            {row.color && (
              <span
                aria-hidden
                className="size-2 shrink-0 rounded-full"
                style={{ backgroundColor: row.color }}
              />
            )}
            <span className="text-muted-foreground">{row.label}</span>
            <span className="tnum ml-auto font-medium text-popover-foreground">{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Axis defaults shared by every Recharts surface. */
export const axisProps = {
  stroke: 'var(--chart-grid)',
  tickLine: false,
  axisLine: false,
  tick: { fill: 'var(--muted-foreground)', fontSize: 11 },
} as const;
