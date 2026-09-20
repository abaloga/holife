import { Link } from 'react-router-dom';
import { CircleCheckBig } from 'lucide-react';
import { Section, SectionHeader } from '@/components/common/section';
import { EmptyState } from '@/components/common/empty-state';
import { ListGroup } from '@/components/common/list-row';
import { SummaryPill } from '@/components/common/summary-pill';
import { usePreferences } from '@/features/settings/hooks';
import { useQuickAdd } from '@/features/quick-add/quick-add-context';
import { useGroupedTasks, useToggleTask } from './hooks';
import { TaskRow } from './components/task-row';

const TODAY_LIMIT = 6;

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

export function TasksWidget() {
  const { today } = usePreferences();
  const { groups, tasks, isLoading } = useGroupedTasks();
  const toggle = useToggleTask();
  const { open } = useQuickAdd();

  if (isLoading) return null;

  const due = [...groups.overdue, ...groups.today];

  return (
    <Section>
      <SectionHeader
        title="Tasks"
        to="/tasks"
        meta={groups.overdue.length > 0 ? `${groups.overdue.length} overdue` : undefined}
      />
      {due.length === 0 ? (
        <EmptyState
          icon={CircleCheckBig}
          size="compact"
          title={tasks.length === 0 ? 'No tasks yet' : 'Nothing due today'}
          description={
            tasks.length === 0
              ? 'Keep a short list of what actually needs doing.'
              : 'A clear day.'
          }
          action={{ label: 'Add a task', onClick: () => open('task') }}
        />
      ) : (
        <>
          <ListGroup>
            {due.slice(0, TODAY_LIMIT).map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                today={today}
                onToggle={(completed) => toggle.mutate({ id: task.id, completed })}
              />
            ))}
          </ListGroup>
          {due.length > TODAY_LIMIT && (
            <Link
              to="/tasks"
              className="mt-2 inline-block text-[0.8125rem] font-medium text-muted-foreground underline-offset-4 hover:underline"
            >
              {due.length - TODAY_LIMIT} more due
            </Link>
          )}
        </>
      )}
    </Section>
  );
}
