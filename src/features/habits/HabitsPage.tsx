import { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { CalendarCheck, Plus } from 'lucide-react';
import { PageBody, PageHeader } from '@/components/layout/page';
import { SectionTabs } from '@/components/layout/section-tabs';
import { Section, SectionHeader } from '@/components/common/section';
import { EmptyState } from '@/components/common/empty-state';
import { ErrorState } from '@/components/common/error-state';
import { ListGroup } from '@/components/common/list-row';
import { Button } from '@/components/ui/button';
import { Sheet } from '@/components/ui/sheet';
import { SkeletonRows } from '@/components/ui/skeleton';
import { ProgressBar } from '@/components/ui/progress';
import { listItem, staggerChildren } from '@/lib/motion';
import { usePreferences } from '@/features/settings/hooks';
import { useHabitsOverview, useToggleHabit } from './hooks';
import { HabitRow, WeekStrip } from './components/habit-row';
import { HabitForm } from './components/habit-form';
import type { Habit } from './api';

export function HabitsPage() {
  const { today } = usePreferences();
  const { views, activeViews, todayViews, isLoading, isError, error, refetch } =
    useHabitsOverview();
  const toggle = useToggleHabit();
  const reduceMotion = useReducedMotion();

  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Habit | null>(null);

  const inactive = views.filter((view) => !view.habit.is_active);
  const doneToday = todayViews.filter((view) => view.completedToday).length;

  return (
    <>
      <PageHeader
        title="Habits"
        subtitle={
          todayViews.length > 0
            ? `${doneToday} of ${todayViews.length} done today`
            : undefined
        }
        action={
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus aria-hidden />
            New
          </Button>
        }
      >
        <SectionTabs section="plan" />
      </PageHeader>

      <PageBody>
        {isLoading && <SkeletonRows rows={4} className="mt-4" />}

        {!isLoading && isError && (
          <ErrorState error={error} subject="your habits" onRetry={refetch} />
        )}

        {!isLoading && !isError && views.length === 0 && (
          <EmptyState
            icon={CalendarCheck}
            title="No habits yet"
            description="Start with one or two things you want to do consistently. You can always add more."
            action={{ label: 'Create a habit', onClick: () => setCreateOpen(true) }}
            className="mt-6"
          />
        )}

        {!isLoading && !isError && views.length > 0 && (
          <>
            {todayViews.length > 0 && (
              <Section>
                <SectionHeader title="Due today" meta={`${doneToday}/${todayViews.length}`} />
                <ProgressBar
                  value={doneToday}
                  max={todayViews.length}
                  className="mb-3"
                  label={`${doneToday} of ${todayViews.length} habits done today`}
                />
                <ListGroup>
                  {todayViews.map((view) => (
                    <HabitRow
                      key={view.habit.id}
                      view={view}
                      compact
                      onToggle={(completed) =>
                        toggle.mutate({ habitId: view.habit.id, date: today, completed })
                      }
                      onSelect={() => setEditing(view.habit)}
                    />
                  ))}
                </ListGroup>
              </Section>
            )}

            <Section>
              <SectionHeader title="All habits" meta={`${activeViews.length} active`} />
              <motion.div
                variants={reduceMotion ? undefined : staggerChildren()}
                initial="hidden"
                animate="visible"
                className="space-y-2.5"
              >
                {activeViews.map((view) => (
                  <motion.div
                    key={view.habit.id}
                    variants={reduceMotion ? undefined : listItem}
                    className="rounded-xl border border-border bg-card shadow-card"
                  >
                    <HabitRow
                      view={view}
                      onToggle={(completed) =>
                        toggle.mutate({ habitId: view.habit.id, date: today, completed })
                      }
                      onSelect={() => setEditing(view.habit)}
                    />
                    <div className="flex items-center justify-between gap-3 border-t border-border px-3.5 py-2.5">
                      <WeekStrip view={view} />
                      <span className="text-right text-[0.6875rem] leading-tight text-muted-foreground">
                        {view.weekStats.scheduled > 0 && (
                          <span className="tnum block">
                            {view.weekStats.completed}/{view.weekStats.scheduled} this week
                          </span>
                        )}
                        {view.bestStreak > 1 && (
                          <span className="tnum block">Best run {view.bestStreak}</span>
                        )}
                        {view.weekStats.scheduled === 0 && view.bestStreak <= 1 && 'Last 7 days'}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </Section>

            {inactive.length > 0 && (
              <Section>
                <SectionHeader title="Paused" meta={`${inactive.length}`} />
                <ListGroup className="opacity-70">
                  {inactive.map((view) => (
                    <HabitRow
                      key={view.habit.id}
                      view={view}
                      compact
                      onToggle={(completed) =>
                        toggle.mutate({ habitId: view.habit.id, date: today, completed })
                      }
                      onSelect={() => setEditing(view.habit)}
                    />
                  ))}
                </ListGroup>
              </Section>
            )}
          </>
        )}
      </PageBody>

      <Sheet open={createOpen} onOpenChange={setCreateOpen} title="New habit">
        <HabitForm onDone={() => setCreateOpen(false)} />
      </Sheet>

      <Sheet
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
        title="Edit habit"
      >
        {editing && <HabitForm habit={editing} onDone={() => setEditing(null)} />}
      </Sheet>
    </>
  );
}
