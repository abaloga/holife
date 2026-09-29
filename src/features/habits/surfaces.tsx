import { CalendarCheck } from 'lucide-react';
import { EmptyState } from '@/components/common/empty-state';
import { SummaryPill } from '@/components/common/summary-pill';
import { formatPercent } from '@/lib/format';
import { useHabitsConsistency, useHabitsOverview } from './hooks';
import { HabitConsistencyChart } from './components/habit-consistency-chart';

export function HabitsSummary() {
  const { todayViews, isLoading } = useHabitsOverview();

  if (isLoading || todayViews.length === 0) return null;

  const done = todayViews.filter((view) => view.completedToday).length;
  if (done === todayViews.length) return null;

  return (
    <SummaryPill
      to="/habits"
      icon={CalendarCheck}
      tone="text-chart-3"
      label={`${todayViews.length - done} habit${todayViews.length - done === 1 ? '' : 's'} left`}
    />
  );
}

/** Today's chart widget: consistency across days, not a checklist for today. */
export function HabitsConsistencyWidget() {
  const { series, hasHabits, isLoading } = useHabitsConsistency();

  if (isLoading) return null;

  if (!hasHabits) {
    return (
      <EmptyState
        icon={CalendarCheck}
        size="compact"
        title="No habits yet"
        description="Pick one thing you want to do consistently and its record shows up here."
      />
    );
  }

  const scheduled = series.reduce((sum, day) => sum + day.scheduled, 0);
  const completed = series.reduce((sum, day) => sum + day.completed, 0);
  const overallRate = scheduled === 0 ? null : completed / scheduled;

  return (
    <div className="flex h-full flex-col">
      <p className="mb-1.5 shrink-0 truncate text-[0.6875rem] text-muted-foreground">
        {overallRate == null
          ? 'Nothing scheduled yet'
          : `${formatPercent(overallRate)} over ${series.length} days`}
      </p>
      <div className="min-h-0 flex-1">
        <HabitConsistencyChart series={series} height="fill" />
      </div>
    </div>
  );
}
