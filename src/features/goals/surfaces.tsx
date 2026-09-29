import { Flag } from 'lucide-react';
import { EmptyState } from '@/components/common/empty-state';
import { SummaryPill } from '@/components/common/summary-pill';
import { useGoals } from './hooks';
import { goalProgress } from './calculations';
import { GoalsProgressChart } from './components/goals-progress-chart';

/** Bars stop being legible in a small square past this many goals. */
const GOALS_SHOWN = 4;

export function GoalsSummary() {
  const { active, isLoading } = useGoals();

  if (isLoading || active.length === 0) return null;

  return (
    <SummaryPill
      to="/goals"
      icon={Flag}
      tone="text-chart-5"
      label={`${active.length} goal${active.length === 1 ? '' : 's'} active`}
    />
  );
}

/** Today's chart widget: progress bars across goals, not the goal list itself. */
export function GoalsProgressWidget() {
  const { active, goals, isLoading } = useGoals();

  if (isLoading) return null;

  const quantitative = active.flatMap((goal) => {
    const progress = goalProgress(goal);
    return progress == null ? [] : [{ id: goal.id, title: goal.title, progress }];
  });

  if (quantitative.length === 0) {
    return (
      <EmptyState
        icon={Flag}
        size="compact"
        title={goals.length === 0 ? 'No goals set' : 'Nothing to chart yet'}
        description={
          goals.length === 0
            ? 'Name what all of this is actually for.'
            : 'Give a goal a target and current value to chart its progress.'
        }
      />
    );
  }

  return <GoalsProgressChart goals={quantitative.slice(0, GOALS_SHOWN)} height="fill" />;
}
