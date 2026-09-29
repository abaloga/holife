import { UtensilsCrossed } from 'lucide-react';
import { EmptyState } from '@/components/common/empty-state';
import { SummaryPill } from '@/components/common/summary-pill';
import { formatNumber } from '@/lib/format';
import { useCalorieHistory, useTodayNutrition } from './hooks';
import { CaloriesHistoryChart } from './components/calories-history-chart';

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

/** Today's chart widget: calories over time, not a form for logging them. */
export function NutritionCaloriesWidget() {
  const { series, target, hasData, isLoading } = useCalorieHistory();

  if (isLoading) return null;

  if (!hasData) {
    return (
      <EmptyState
        icon={UtensilsCrossed}
        size="compact"
        title="No meals logged yet"
        description="Log a few meals and your calorie history appears here."
      />
    );
  }

  const average = series.reduce((sum, day) => sum + day.calories, 0) / series.length;

  return (
    <div className="flex h-full flex-col">
      <p className="mb-1.5 shrink-0 truncate text-[0.6875rem] text-muted-foreground">
        Avg {formatNumber(Math.round(average))} kcal/day
        {target > 0 && ` · target ${formatNumber(target)}`}
      </p>
      <div className="min-h-0 flex-1">
        <CaloriesHistoryChart days={series} target={target} height="fill" />
      </div>
    </div>
  );
}
