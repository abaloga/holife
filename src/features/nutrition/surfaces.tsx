import { UtensilsCrossed } from 'lucide-react';
import { Section, SectionHeader } from '@/components/common/section';
import { EmptyState } from '@/components/common/empty-state';
import { SummaryPill } from '@/components/common/summary-pill';
import { formatNumber } from '@/lib/format';
import { useQuickAdd } from '@/features/quick-add/quick-add-context';
import { useTodayNutrition } from './hooks';
import { MacroSummary } from './components/macro-summary';

export function NutritionSummary() {
  const { meals, progress, isLoading } = useTodayNutrition();

  if (isLoading || meals.length === 0) return null;

  const calories = progress.find((item) => item.key === 'calories');

  return (
    <SummaryPill
      to="/nutrition"
      icon={UtensilsCrossed}
      tone="text-chart-1"
      label={`${formatNumber(Math.max(0, Math.round(calories?.remaining ?? 0)))} kcal left`}
    />
  );
}

export function NutritionWidget() {
  const { meals, progress, isLoading } = useTodayNutrition();
  const { open } = useQuickAdd();

  if (isLoading) return null;

  return (
    <Section>
      <SectionHeader
        title="Nutrition"
        to="/nutrition"
        meta={
          meals.length > 0
            ? `${meals.length} ${meals.length === 1 ? 'meal' : 'meals'}`
            : undefined
        }
      />
      {meals.length === 0 ? (
        <EmptyState
          icon={UtensilsCrossed}
          size="compact"
          title="No meals logged today"
          description="Add one and your macros fill in as you go."
          action={{ label: 'Log a meal', onClick: () => open('meal') }}
        />
      ) : (
        <MacroSummary progress={progress} size="compact" />
      )}
    </Section>
  );
}
