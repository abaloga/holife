import { Scale } from 'lucide-react';
import { EmptyState } from '@/components/common/empty-state';
import { SummaryPill } from '@/components/common/summary-pill';
import { formatWeight, formatWeightDelta } from '@/lib/units';
import { usePreferences } from '@/features/settings/hooks';
import { useWeightSummary } from './hooks';
import { WeightChart } from './components/weight-chart';

export function WeightSummary() {
  const { weightUnit } = usePreferences();
  const { summary, isLoading } = useWeightSummary();

  if (isLoading || !summary.latest) return null;

  return (
    <SummaryPill
      to="/weight"
      icon={Scale}
      tone="text-chart-2"
      label={formatWeight(summary.latestTrendKg ?? summary.latest.kg, weightUnit)}
    />
  );
}

/** Today's chart widget: the trend line, no list, no form. */
export function WeightTrendWidget() {
  const { weightUnit, today, goalWeightKg } = usePreferences();
  const { summary, isLoading } = useWeightSummary();

  if (isLoading) return null;

  if (summary.trend.length < 2) {
    return (
      <EmptyState
        icon={Scale}
        size="compact"
        title="Not enough data yet"
        description="Log a few weigh-ins and the trend appears here."
      />
    );
  }

  return (
    <div className="flex h-full flex-col">
      <p className="mb-1.5 shrink-0 truncate text-[0.6875rem] text-muted-foreground">
        Trend {formatWeight(summary.latestTrendKg ?? 0, weightUnit)}
        {summary.week && ` · ${formatWeightDelta(summary.week.deltaKg, weightUnit)} this week`}
      </p>
      <div className="min-h-0 flex-1">
        <WeightChart
          points={summary.trend}
          unit={weightUnit}
          goalWeightKg={goalWeightKg}
          rangeDays={30}
          today={today}
          height="fill"
        />
      </div>
    </div>
  );
}
