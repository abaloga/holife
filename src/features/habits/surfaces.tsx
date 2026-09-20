import { CalendarCheck } from 'lucide-react';
import { Section, SectionHeader } from '@/components/common/section';
import { EmptyState } from '@/components/common/empty-state';
import { ListGroup } from '@/components/common/list-row';
import { SummaryPill } from '@/components/common/summary-pill';
import { usePreferences } from '@/features/settings/hooks';
import { useQuickAdd } from '@/features/quick-add/quick-add-context';
import { useHabitsOverview, useToggleHabit } from './hooks';
import { HabitRow } from './components/habit-row';

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

export function HabitsWidget() {
  const { today } = usePreferences();
  const { views, todayViews, isLoading } = useHabitsOverview();
  const toggle = useToggleHabit();
  const { open } = useQuickAdd();

  if (isLoading) return null;

  const done = todayViews.filter((view) => view.completedToday).length;

  return (
    <Section>
      <SectionHeader
        title="Habits"
        to="/habits"
        meta={todayViews.length > 0 ? `${done}/${todayViews.length}` : undefined}
      />
      {todayViews.length === 0 ? (
        <EmptyState
          icon={CalendarCheck}
          size="compact"
          title={views.length === 0 ? 'No habits yet' : 'Nothing scheduled today'}
          description={
            views.length === 0
              ? 'Pick one thing you want to do consistently.'
              : 'None of your habits fall on today.'
          }
          action={
            views.length === 0
              ? { label: 'Create a habit', onClick: () => open('habit') }
              : undefined
          }
        />
      ) : (
        <ListGroup>
          {todayViews.map((view) => (
            <HabitRow
              key={view.habit.id}
              view={view}
              compact
              onToggle={(completed) =>
                toggle.mutate({ habitId: view.habit.id, date: today, completed })
              }
            />
          ))}
        </ListGroup>
      )}
    </Section>
  );
}
