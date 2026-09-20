import { Scale } from 'lucide-react';
import { Section, SectionHeader } from '@/components/common/section';
import { EmptyState } from '@/components/common/empty-state';
import { MetricCard } from '@/components/common/metric';
import { SummaryPill } from '@/components/common/summary-pill';
import { formatWeight, formatWeightDelta } from '@/lib/units';
import { usePreferences } from '@/features/settings/hooks';
import { useQuickAdd } from '@/features/quick-add/quick-add-context';
import { useWeightSummary } from './hooks';

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

export function WeightWidget() {
  const { weightUnit, today } = usePreferences();
  const { summary, isLoading } = useWeightSummary();
  const { open } = useQuickAdd();

  if (isLoading) return null;

  const loggedToday = summary.latest?.date === today;

  return (
    <Section>
      <SectionHeader title="Weight" to="/weight" />
      {summary.latest ? (
        <MetricCard
          to="/weight"
          label="Trend"
          value={formatWeight(summary.latestTrendKg ?? summary.latest.kg, weightUnit, {
            withUnit: false,
          })}
          unit={weightUnit === 'st' ? '' : weightUnit}
          caption={
            summary.week
              ? `${formatWeightDelta(summary.week.deltaKg, weightUnit)} this week`
              : loggedToday
                ? 'Logged today'
                : 'Trend building'
          }
        />
      ) : (
        <EmptyState
          icon={Scale}
          size="compact"
          title="No weigh-ins yet"
          description="Log a few and the trend appears under the day-to-day noise."
          action={{ label: 'Log your weight', onClick: () => open('weight') }}
        />
      )}
    </Section>
  );
}
