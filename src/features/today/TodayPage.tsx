import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import {
  CalendarCheck,
  CircleCheckBig,
  Flag,
  Plus,
  Scale,
  Sparkles,
  UtensilsCrossed,
} from 'lucide-react';
import { PageBody, PageHeader } from '@/components/layout/page';
import { Section, SectionHeader } from '@/components/common/section';
import { EmptyState } from '@/components/common/empty-state';
import { ListGroup } from '@/components/common/list-row';
import { Button } from '@/components/ui/button';
import { Skeleton, SkeletonRows } from '@/components/ui/skeleton';
import { Sheet } from '@/components/ui/sheet';
import { formatDateKey, greetingForTime } from '@/lib/date';
import { formatNumber } from '@/lib/format';
import { formatWeight, formatWeightDelta } from '@/lib/units';
import { listItem, staggerChildren } from '@/lib/motion';
import { usePreferences, useProfile } from '@/features/settings/hooks';
import { useWeightSummary } from '@/features/weight/hooks';
import { useTodayNutrition } from '@/features/nutrition/hooks';
import { MacroSummary } from '@/features/nutrition/components/macro-summary';
import { useHabitsOverview, useToggleHabit } from '@/features/habits/hooks';
import { HabitRow } from '@/features/habits/components/habit-row';
import { useGroupedTasks, useToggleTask } from '@/features/tasks/hooks';
import { TaskRow } from '@/features/tasks/components/task-row';
import { useGoals } from '@/features/goals/hooks';
import { GoalCard } from '@/features/goals/components/goal-card';
import { WeightForm } from '@/features/weight/components/weight-form';
import { useQuickAdd } from '@/features/quick-add/quick-add-context';
import { MetricCard } from '@/components/common/metric';

export function TodayPage() {
  const { today, weightUnit, timezone } = usePreferences();
  const { data: profile } = useProfile();
  const { open: openQuickAdd } = useQuickAdd();
  const reduceMotion = useReducedMotion();

  const weight = useWeightSummary();
  const nutrition = useTodayNutrition();
  const habits = useHabitsOverview();
  const tasks = useGroupedTasks();
  const goals = useGoals();

  const toggleHabit = useToggleHabit();
  const toggleTask = useToggleTask();
  const [weightSheetOpen, setWeightSheetOpen] = useState(false);
  const navigate = useNavigate();

  const firstName = profile?.display_name?.trim().split(/\s+/)[0];
  const greeting = greetingForTime(new Date(), timezone);

  const loading =
    weight.isLoading || nutrition.isLoading || habits.isLoading || tasks.isLoading;

  const dueTasks = [...tasks.groups.overdue, ...tasks.groups.today];
  const featuredGoals = goals.active.slice(0, 2);
  const caloriesProgress = nutrition.progress.find((item) => item.key === 'calories');

  const isBrandNew =
    !loading &&
    weight.entries.length === 0 &&
    nutrition.meals.length === 0 &&
    habits.views.length === 0 &&
    tasks.tasks.length === 0 &&
    goals.goals.length === 0;

  const loggedWeightToday = weight.summary.latest?.date === today;

  return (
    <>
      <PageHeader
        title={firstName ? `${greeting}, ${firstName}` : greeting}
        subtitle={<time dateTime={today}>{formatDateKey(today, 'EEEE d MMMM')}</time>}
        action={
          <Button
            size="icon-sm"
            variant="ghost"
            onClick={() => openQuickAdd()}
            aria-label="Add an entry"
            className="md:hidden"
          >
            <Plus aria-hidden />
          </Button>
        }
      />

      <PageBody>
        {loading && <TodaySkeleton />}

        {isBrandNew && (
          <EmptyState
            icon={Sparkles}
            title="Let’s get the first thing in"
            description="HoLife gets more useful as it learns your days. Start anywhere — a weigh-in, a meal, or one habit."
            action={{ label: 'Add your first entry', onClick: () => openQuickAdd() }}
            className="mt-6"
          />
        )}

        {!loading && !isBrandNew && (
          <motion.div
            variants={reduceMotion ? undefined : staggerChildren(0.06)}
            initial="hidden"
            animate="visible"
            // Each block is its own animated child, so the rhythm between
            // sections lives here rather than on `Section`'s own margin.
            className="space-y-7"
          >
            {/* ---- Headline metrics ------------------------------------ */}
            <motion.div variants={reduceMotion ? undefined : listItem}>
              <div className="grid grid-cols-2 gap-3">
                {weight.summary.latest ? (
                  <MetricCard
                    to="/track/weight"
                    label="Weight"
                    value={formatWeight(
                      weight.summary.latestTrendKg ?? weight.summary.latest.kg,
                      weightUnit,
                      { withUnit: false },
                    )}
                    unit={weightUnit === 'st' ? '' : weightUnit}
                    caption={
                      weight.summary.week
                        ? `${formatWeightDelta(weight.summary.week.deltaKg, weightUnit)} this week`
                        : loggedWeightToday
                          ? 'Logged today'
                          : 'Trend building'
                    }
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => setWeightSheetOpen(true)}
                    className="flex flex-col items-start justify-center gap-1.5 rounded-xl border border-dashed border-border p-4 text-left transition-colors hover:bg-subtle/50 active:scale-[0.99]"
                  >
                    <Scale className="size-4 text-muted-foreground" aria-hidden />
                    <span className="text-[0.8125rem] font-medium">Log your weight</span>
                    <span className="text-xs text-muted-foreground">Takes seconds</span>
                  </button>
                )}

                <MetricCard
                  to="/track/nutrition"
                  label="Calories left"
                  value={formatNumber(Math.max(0, Math.round(caloriesProgress?.remaining ?? 0)))}
                  unit="kcal"
                  caption={
                    nutrition.meals.length === 0
                      ? 'Nothing logged yet'
                      : `${nutrition.meals.length} ${nutrition.meals.length === 1 ? 'meal' : 'meals'} logged`
                  }
                />
              </div>
            </motion.div>

            {/* ---- Macros --------------------------------------------- */}
            <motion.div variants={reduceMotion ? undefined : listItem}>
              <Section>
                <SectionHeader title="Nutrition" to="/track/nutrition" />
                {nutrition.meals.length === 0 ? (
                  <EmptyState
                    icon={UtensilsCrossed}
                    size="compact"
                    title="No meals logged today"
                    description="Add one and your macros fill in as you go."
                    action={{ label: 'Log a meal', onClick: () => openQuickAdd('meal') }}
                  />
                ) : (
                  <MacroSummary progress={nutrition.progress} size="compact" />
                )}
              </Section>
            </motion.div>

            {/* ---- Habits --------------------------------------------- */}
            {habits.todayViews.length > 0 && (
              <motion.div variants={reduceMotion ? undefined : listItem}>
                <Section>
                  <SectionHeader
                    title="Habits"
                    to="/plan/habits"
                    meta={`${habits.todayViews.filter((view) => view.completedToday).length}/${habits.todayViews.length}`}
                  />
                  <ListGroup>
                    {habits.todayViews.map((view) => (
                      <HabitRow
                        key={view.habit.id}
                        view={view}
                        compact
                        onToggle={(completed) =>
                          toggleHabit.mutate({ habitId: view.habit.id, date: today, completed })
                        }
                      />
                    ))}
                  </ListGroup>
                </Section>
              </motion.div>
            )}

            {habits.views.length === 0 && (
              <motion.div variants={reduceMotion ? undefined : listItem}>
                <Section>
                  <SectionHeader title="Habits" to="/plan/habits" />
                  <EmptyState
                    icon={CalendarCheck}
                    size="compact"
                    title="No habits yet"
                    description="Pick one thing you want to do consistently."
                    action={{ label: 'Create a habit', onClick: () => openQuickAdd('habit') }}
                  />
                </Section>
              </motion.div>
            )}

            {/* ---- Tasks ---------------------------------------------- */}
            <motion.div variants={reduceMotion ? undefined : listItem}>
              <Section>
                <SectionHeader
                  title="Tasks"
                  to="/plan/tasks"
                  meta={
                    tasks.groups.overdue.length > 0
                      ? `${tasks.groups.overdue.length} overdue`
                      : undefined
                  }
                />
                {dueTasks.length === 0 ? (
                  <EmptyState
                    icon={CircleCheckBig}
                    size="compact"
                    title={tasks.tasks.length === 0 ? 'No tasks yet' : 'Nothing due today'}
                    description={
                      tasks.tasks.length === 0
                        ? 'Keep a short list of what actually needs doing.'
                        : 'A clear day.'
                    }
                    action={{ label: 'Add a task', onClick: () => openQuickAdd('task') }}
                  />
                ) : (
                  <ListGroup>
                    {dueTasks.slice(0, 6).map((task) => (
                      <TaskRow
                        key={task.id}
                        task={task}
                        today={today}
                        onToggle={(completed) => toggleTask.mutate({ id: task.id, completed })}
                      />
                    ))}
                  </ListGroup>
                )}
                {dueTasks.length > 6 && (
                  <Link
                    to="/plan/tasks"
                    className="mt-2 inline-block text-[0.8125rem] font-medium text-muted-foreground underline-offset-4 hover:underline"
                  >
                    {dueTasks.length - 6} more due
                  </Link>
                )}
              </Section>
            </motion.div>

            {/* ---- Goals ---------------------------------------------- */}
            {featuredGoals.length > 0 && (
              <motion.div variants={reduceMotion ? undefined : listItem}>
                <Section>
                  <SectionHeader
                    title="Goals"
                    to="/plan/goals"
                    meta={goals.active.length > 2 ? `${goals.active.length} active` : undefined}
                  />
                  <div className="space-y-3">
                    {featuredGoals.map((goal) => (
                      <GoalCard
                        key={goal.id}
                        goal={goal}
                        today={today}
                        onSelect={() => navigate('/plan/goals')}
                      />
                    ))}
                  </div>
                </Section>
              </motion.div>
            )}

            {goals.goals.length === 0 && habits.views.length > 0 && (
              <motion.div variants={reduceMotion ? undefined : listItem}>
                <Section>
                  <SectionHeader title="Goals" to="/plan/goals" />
                  <EmptyState
                    icon={Flag}
                    size="compact"
                    title="No goals set"
                    description="Name what all of this is actually for."
                  />
                </Section>
              </motion.div>
            )}
          </motion.div>
        )}
      </PageBody>

      <Sheet open={weightSheetOpen} onOpenChange={setWeightSheetOpen} title="Log weight">
        <WeightForm onDone={() => setWeightSheetOpen(false)} />
      </Sheet>
    </>
  );
}

function TodaySkeleton() {
  return (
    <div className="mt-2 space-y-7">
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
      </div>
      <div className="flex items-center gap-5">
        <Skeleton className="size-24 rounded-full" />
        <div className="flex-1 space-y-2.5">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-3.5 w-full" />
          ))}
        </div>
      </div>
      <SkeletonRows rows={3} />
    </div>
  );
}
