import { cn } from '@/lib/utils';
import { formatWeight, formatWeightDelta, kgToDisplay } from '@/lib/units';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { StatDelta } from '@/components/common/metric';
import { relativeDayDistance } from '@/lib/date';
import type { DateKey } from '@/lib/date';
import type { WeightUnit } from '@/types/database';
import type { WeightSummary } from '../calculations';

/**
 * The headline number is the *trend*, with the last raw reading shown beneath
 * it. That ordering is deliberate: the trend is the thing that actually
 * answers "am I going anywhere?".
 */
export function WeightHeadline({
  summary,
  unit,
  today,
  className,
}: {
  summary: WeightSummary;
  unit: WeightUnit;
  today: DateKey;
  className?: string;
}) {
  const { latest, latestTrendKg } = summary;
  if (!latest || latestTrendKg == null) return null;

  const showTrend = summary.trend.length >= 3;
  const headlineKg = showTrend ? latestTrendKg : latest.kg;

  return (
    <div className={cn('min-w-0', className)}>
      <p className="text-xs font-medium uppercase tracking-[0.07em] text-muted-foreground">
        {showTrend ? 'Trend weight' : 'Latest weight'}
      </p>
      <p className="mt-1 flex items-baseline gap-1.5">
        {unit === 'st' ? (
          // Stones and pounds is two numbers with two units, so render it as text
          // rather than pretending it is a single tweenable value.
          <span className="tnum text-[2.5rem] font-semibold leading-none tracking-[-0.03em]">
            {formatWeight(headlineKg, unit)}
          </span>
        ) : (
          <>
            <AnimatedNumber
              value={kgToDisplay(headlineKg, unit)}
              format={(value) => value.toFixed(1)}
              className="text-[2.5rem] font-semibold leading-none tracking-[-0.03em]"
            />
            <span className="text-base font-medium text-muted-foreground">{unit}</span>
          </>
        )}
      </p>
      <p className="mt-2 text-[0.8125rem] text-muted-foreground">
        {showTrend ? (
          <>
            Last logged {formatWeight(latest.kg, unit)}
            {summary.daysSinceLast != null && summary.daysSinceLast > 0 && (
              <> · {relativeDayDistance(latest.date, today)}</>
            )}
          </>
        ) : (
          <>Log a few more days and a trend line will appear.</>
        )}
      </p>
    </div>
  );
}

interface ChangeGridProps {
  summary: WeightSummary;
  unit: WeightUnit;
  className?: string;
}

/**
 * Period changes are only rendered once there is enough history for them to
 * mean something. An empty slot is more honest than a number built from two
 * weigh-ins.
 */
export function WeightChangeGrid({ summary, unit, className }: ChangeGridProps) {
  const cells: { label: string; delta: number; hint?: string }[] = [];

  if (summary.sinceLastKg != null) {
    cells.push({ label: 'Since last', delta: summary.sinceLastKg });
  }
  if (summary.week) {
    cells.push({
      label: 'Past week',
      delta: summary.week.deltaKg,
      hint: `${summary.week.spanDays}d of data`,
    });
  }
  if (summary.month) {
    cells.push({
      label: 'Past month',
      delta: summary.month.deltaKg,
      hint: `${summary.month.spanDays}d of data`,
    });
  }
  if (summary.toGoalKg != null) {
    cells.push({ label: 'To goal', delta: summary.toGoalKg });
  }

  if (cells.length === 0) return null;

  return (
    <dl className={cn('grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4', className)}>
      {cells.map((cell) => (
        <div key={cell.label} className="min-w-0">
          <dt className="text-[0.6875rem] font-medium uppercase tracking-[0.07em] text-muted-foreground">
            {cell.label}
          </dt>
          <dd className="mt-0.5 truncate">
            {/* Tone stays neutral: whether a change is good depends on the
                user's goal, and the app should not editorialise about it. */}
            <StatDelta
              delta={cell.delta}
              label={formatWeightDelta(cell.delta, unit)}
              className="text-[0.9375rem] font-semibold text-foreground"
            />
          </dd>
          {cell.hint && (
            <p className="mt-0.5 text-[0.6875rem] text-muted-foreground/70">{cell.hint}</p>
          )}
        </div>
      ))}
    </dl>
  );
}
