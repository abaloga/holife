import { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Flag, Plus } from 'lucide-react';
import { PageBody, PageHeader } from '@/components/layout/page';
import { SectionTabs } from '@/components/layout/section-tabs';
import { Section, SectionHeader } from '@/components/common/section';
import { EmptyState } from '@/components/common/empty-state';
import { ErrorState } from '@/components/common/error-state';
import { Button } from '@/components/ui/button';
import { Sheet } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/toaster';
import { listItem, staggerChildren } from '@/lib/motion';
import { usePreferences } from '@/features/settings/hooks';
import { useGoals, useSetGoalProgress, useSetGoalStatus } from './hooks';
import { GoalCard } from './components/goal-card';
import { GoalForm } from './components/goal-form';
import type { Goal } from './api';

export function GoalsPage() {
  const { today } = usePreferences();
  const { active, achieved, other, goals, isLoading, isError, error, refetch } = useGoals();
  const setProgress = useSetGoalProgress();
  const setStatus = useSetGoalStatus();
  const reduceMotion = useReducedMotion();

  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Goal | null>(null);

  const sections = [
    { title: 'In progress', goals: active },
    { title: 'Achieved', goals: achieved },
    { title: 'Paused', goals: other },
  ].filter((section) => section.goals.length > 0);

  return (
    <>
      <PageHeader
        title="Goals"
        subtitle={active.length > 0 ? `${active.length} in progress` : undefined}
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
        {isLoading && (
          <div className="mt-4 space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-28 w-full rounded-xl" />
            ))}
          </div>
        )}

        {!isLoading && isError && (
          <ErrorState error={error} subject="your goals" onRetry={refetch} />
        )}

        {!isLoading && !isError && goals.length === 0 && (
          <EmptyState
            icon={Flag}
            title="No goals yet"
            description="Goals are the outcomes behind the daily stuff — the reason a habit or a task is worth doing."
            action={{ label: 'Set a goal', onClick: () => setCreateOpen(true) }}
            className="mt-6"
          />
        )}

        {!isLoading &&
          !isError &&
          sections.map((section) => (
            <Section key={section.title}>
              <SectionHeader title={section.title} meta={`${section.goals.length}`} />
              <motion.div
                variants={reduceMotion ? undefined : staggerChildren()}
                initial="hidden"
                animate="visible"
                className="space-y-3"
              >
                {section.goals.map((goal) => (
                  <motion.div key={goal.id} variants={reduceMotion ? undefined : listItem}>
                    <GoalCard
                      goal={goal}
                      today={today}
                      onSelect={() => setEditing(goal)}
                      onAdjust={(value) => setProgress.mutate({ id: goal.id, value })}
                      onMarkAchieved={() => {
                        setStatus.mutate(
                          { id: goal.id, status: 'achieved' },
                          { onSuccess: () => toast.success(`“${goal.title}” achieved`) },
                        );
                      }}
                    />
                  </motion.div>
                ))}
              </motion.div>
            </Section>
          ))}
      </PageBody>

      <Sheet open={createOpen} onOpenChange={setCreateOpen} title="New goal">
        <GoalForm onDone={() => setCreateOpen(false)} />
      </Sheet>

      <Sheet
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
        title="Edit goal"
      >
        {editing && <GoalForm goal={editing} onDone={() => setEditing(null)} />}
      </Sheet>
    </>
  );
}
