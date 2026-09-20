import { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { CircleCheckBig, Plus } from 'lucide-react';
import { PageBody, PageHeader } from '@/components/layout/page';
import { Section, SectionHeader } from '@/components/common/section';
import { EmptyState } from '@/components/common/empty-state';
import { ErrorState } from '@/components/common/error-state';
import { ListGroup } from '@/components/common/list-row';
import { Button } from '@/components/ui/button';
import { Sheet } from '@/components/ui/sheet';
import { SkeletonRows } from '@/components/ui/skeleton';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { listItem, staggerChildren } from '@/lib/motion';
import { usePreferences } from '@/features/settings/hooks';
import { useGroupedTasks, useToggleTask } from './hooks';
import { TaskRow } from './components/task-row';
import { TaskForm } from './components/task-form';
import type { Task } from './api';


type View = 'today' | 'upcoming' | 'completed';

export function TasksPage() {
  const { today } = usePreferences();
  const { groups, isLoading, isError, error, refetch } = useGroupedTasks();
  const toggle = useToggleTask();
  const reduceMotion = useReducedMotion();

  const [view, setView] = useState<View>('today');
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);

  const sections: { title: string; tasks: Task[]; hideDue?: boolean }[] =
    view === 'today'
      ? [
          { title: 'Overdue', tasks: groups.overdue },
          { title: 'Today', tasks: groups.today, hideDue: true },
        ]
      : view === 'upcoming'
        ? [
            { title: 'Upcoming', tasks: groups.upcoming },
            { title: 'No date', tasks: groups.someday, hideDue: true },
          ]
        : [{ title: 'Completed', tasks: groups.completed }];

  const visible = sections.filter((section) => section.tasks.length > 0);

  return (
    <>
      <PageHeader
        title="Tasks"
        back="/"
        subtitle={groups.openCount > 0 ? `${groups.openCount} open` : undefined}
        action={
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus aria-hidden />
            New
          </Button>
        }
      >
        <SegmentedControl
          value={view}
          onValueChange={setView}
          aria-label="Task view"
          options={[
            { value: 'today', label: 'Today', badge: groups.dueTodayCount },
            {
              value: 'upcoming',
              label: 'Upcoming',
              badge: groups.upcoming.length + groups.someday.length,
            },
            { value: 'completed', label: 'Done' },
          ]}
        />
      </PageHeader>

      <PageBody>
        {isLoading && <SkeletonRows rows={5} className="mt-4" />}

        {!isLoading && isError && (
          <ErrorState error={error} subject="your tasks" onRetry={refetch} />
        )}

        {!isLoading && !isError && visible.length === 0 && (
          <EmptyState
            icon={CircleCheckBig}
            title={
              view === 'completed'
                ? 'Nothing completed yet'
                : view === 'today'
                  ? 'Nothing due today'
                  : 'Nothing scheduled'
            }
            description={
              view === 'completed'
                ? 'Tasks you finish will collect here.'
                : view === 'today'
                  ? 'A clear day. Add something if you need to.'
                  : 'Add a task with a date and it will show up here.'
            }
            action={
              view === 'completed'
                ? undefined
                : { label: 'Add a task', onClick: () => setCreateOpen(true) }
            }
            className="mt-6"
          />
        )}

        {!isLoading &&
          !isError &&
          visible.map((section) => (
            <Section key={section.title}>
              <SectionHeader title={section.title} meta={`${section.tasks.length}`} />
              <ListGroup>
                <motion.div
                  variants={reduceMotion ? undefined : staggerChildren(0.03)}
                  initial="hidden"
                  animate="visible"
                  className="[&>*+*]:border-t [&>*+*]:border-border"
                >
                  <AnimatePresence initial={false}>
                    {section.tasks.map((task) => (
                      <motion.div
                        key={task.id}
                        variants={reduceMotion ? undefined : listItem}
                        exit="exit"
                        layout={!reduceMotion}
                      >
                        <TaskRow
                          task={task}
                          today={today}
                          hideDue={section.hideDue}
                          onToggle={(completed) => toggle.mutate({ id: task.id, completed })}
                          onSelect={() => setEditing(task)}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </motion.div>
              </ListGroup>
            </Section>
          ))}
      </PageBody>

      <Sheet open={createOpen} onOpenChange={setCreateOpen} title="New task">
        <TaskForm
          defaultDueDate={view === 'today' ? today : null}
          onDone={() => setCreateOpen(false)}
        />
      </Sheet>

      <Sheet
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
        title="Edit task"
      >
        {editing && <TaskForm task={editing} onDone={() => setEditing(null)} />}
      </Sheet>
    </>
  );
}
