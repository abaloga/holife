import { CircleCheckBig } from 'lucide-react';
import { EmptyState } from '@/components/common/empty-state';
import { SummaryPill } from '@/components/common/summary-pill';
import { useGroupedTasks, useTasksThroughput } from './hooks';
import { TasksThroughputChart } from './components/tasks-throughput-chart';

export function TasksSummary() {
  const { groups, isLoading } = useGroupedTasks();

  if (isLoading) return null;

  const due = groups.overdue.length + groups.today.length;
  if (due === 0) return null;

  return (
    <SummaryPill
      to="/tasks"
      icon={CircleCheckBig}
      tone="text-chart-4"
      label={
        groups.overdue.length > 0
          ? `${due} due · ${groups.overdue.length} overdue`
          : `${due} task${due === 1 ? '' : 's'} due`
      }
    />
  );
}

/** Today's chart widget: throughput over time, not today's checklist. */
export function TasksThroughputWidget() {
  const { tasks } = useGroupedTasks();
  const { series, hasCompleted, isLoading } = useTasksThroughput();

  if (isLoading) return null;

  if (!hasCompleted) {
    return (
      <EmptyState
        icon={CircleCheckBig}
        size="compact"
        title={tasks.length === 0 ? 'No tasks yet' : 'Nothing completed yet'}
        description="Finish a few tasks and your throughput appears here."
      />
    );
  }

  const total = series.reduce((sum, day) => sum + day.completed, 0);

  return (
    <div className="flex h-full flex-col">
      <p className="mb-1.5 shrink-0 truncate text-[0.6875rem] text-muted-foreground">
        {total} completed over {series.length} days
      </p>
      <div className="min-h-0 flex-1">
        <TasksThroughputChart series={series} height="fill" />
      </div>
    </div>
  );
}
