import { motion, useReducedMotion } from 'motion/react';
import { CalendarCheck, CircleCheckBig, Scale, UtensilsCrossed, type LucideIcon } from 'lucide-react';
import { Sheet } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { listItem, staggerChildren } from '@/lib/motion';
import { WeightForm } from '@/features/weight/components/weight-form';
import { MealForm } from '@/features/nutrition/components/meal-form';
import { HabitForm } from '@/features/habits/components/habit-form';
import { TaskForm } from '@/features/tasks/components/task-form';
import { useWeightSummary } from '@/features/weight/hooks';
import { usePreferences } from '@/features/settings/hooks';
import { useQuickAdd, type QuickAddAction } from './quick-add-context';

interface ActionDefinition {
  id: QuickAddAction;
  label: string;
  hint: string;
  icon: LucideIcon;
  /** Tailwind text colour for the icon; keeps the grid from being monotone. */
  tone: string;
}

/**
 * The central Add button's menu. Adding a future action (workout, water,
 * measurement, journal) means one entry here, one case in the switch below and
 * one entry in `QuickAddAction`.
 */
const QUICK_ADD_ACTIONS: ActionDefinition[] = [
  { id: 'weight', label: 'Weight', hint: 'Log a weigh-in', icon: Scale, tone: 'text-chart-2' },
  {
    id: 'meal',
    label: 'Meal',
    hint: 'Calories and macros',
    icon: UtensilsCrossed,
    tone: 'text-chart-1',
  },
  {
    id: 'habit',
    label: 'Habit',
    hint: 'Something to repeat',
    icon: CalendarCheck,
    tone: 'text-chart-3',
  },
  {
    id: 'task',
    label: 'Task',
    hint: 'Something to do',
    icon: CircleCheckBig,
    tone: 'text-chart-4',
  },
];

const TITLES: Record<QuickAddAction, { title: string; description?: string }> = {
  weight: { title: 'Log weight', description: 'Takes a couple of seconds.' },
  meal: { title: 'Log a meal', description: 'Enter the numbers, or estimate them.' },
  habit: { title: 'New habit' },
  task: { title: 'New task' },
};

export function QuickAddSheet() {
  const { view, open, close, back } = useQuickAdd();
  const { today } = usePreferences();

  const isMenu = view === 'menu';
  const header = view && view !== 'menu' ? TITLES[view] : { title: 'Add', description: undefined };

  return (
    <Sheet
      open={view !== null}
      onOpenChange={(next) => !next && close()}
      title={isMenu ? 'Add to today' : header.title}
      description={isMenu ? 'What do you want to record?' : header.description}
      footer={
        !isMenu ? (
          <Button variant="subtle" onClick={back} block>
            Back
          </Button>
        ) : undefined
      }
    >
      {isMenu ? <ActionGrid onPick={open} /> : null}
      {view === 'weight' && <QuickWeightForm onDone={close} />}
      {view === 'meal' && <MealForm onDone={close} />}
      {view === 'habit' && <HabitForm onDone={close} />}
      {view === 'task' && <TaskForm defaultDueDate={today} onDone={close} />}
    </Sheet>
  );
}

/** Split out so the weight query only runs when this form is actually shown. */
function QuickWeightForm({ onDone }: { onDone: () => void }) {
  const { summary } = useWeightSummary();
  return <WeightForm seedKg={summary.latest?.kg ?? null} onDone={onDone} />;
}

function ActionGrid({ onPick }: { onPick: (action: QuickAddAction) => void }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      variants={reduceMotion ? undefined : staggerChildren(0.04)}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-2 gap-2.5 pt-1"
    >
      {QUICK_ADD_ACTIONS.map((action) => {
        const Icon = action.icon;
        return (
          <motion.button
            key={action.id}
            type="button"
            variants={reduceMotion ? undefined : listItem}
            onClick={() => onPick(action.id)}
            className={cn(
              'flex flex-col items-start gap-2 rounded-xl border border-border bg-card p-4 text-left',
              'transition-[background-color,transform] duration-150 active:scale-[0.97] hover:bg-subtle/60',
            )}
          >
            <Icon className={cn('size-5', action.tone)} aria-hidden />
            <span className="min-w-0">
              <span className="block text-[0.9375rem] font-medium">{action.label}</span>
              <span className="block text-xs text-muted-foreground">{action.hint}</span>
            </span>
          </motion.button>
        );
      })}
    </motion.div>
  );
}
