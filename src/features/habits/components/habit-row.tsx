import { Flame } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ListRow } from '@/components/common/list-row';
import { CompletionToggle } from '@/components/ui/completion-toggle';
import { DAY_INITIALS, DAY_NAMES_SHORT, dayOfWeek } from '@/lib/date';
import { formatPercent } from '@/lib/format';
import { describeSchedule } from '../calculations';
import { habitIcon } from '../icons';
import type { HabitView } from '../hooks';

interface HabitRowProps {
  view: HabitView;
  onToggle: (completed: boolean) => void;
  onSelect?: () => void;
  /** Hides the schedule/stat line for the denser Today list. */
  compact?: boolean;
}

export function HabitRow({ view, onToggle, onSelect, compact = false }: HabitRowProps) {
  const { habit, completedToday, streak, stats } = view;
  const Icon = habitIcon(habit.icon);

  return (
    <ListRow
      leading={
        <CompletionToggle
          checked={completedToday}
          onCheckedChange={onToggle}
          label={`Mark ${habit.name} ${completedToday ? 'incomplete' : 'complete'} for today`}
        />
      }
      onActivate={onSelect}
      activateLabel={onSelect ? `Edit ${habit.name}` : undefined}
      trailing={
        streak > 1 ? (
          <span
            className="tnum flex shrink-0 items-center gap-1 text-[0.8125rem] font-medium text-accent"
            title={`${streak} day streak`}
          >
            <Flame className="size-3.5" aria-hidden />
            {streak}
            <span className="sr-only">day streak</span>
          </span>
        ) : undefined
      }
    >
      <div className="flex items-center gap-2">
        <Icon
          className={cn(
            'size-4 shrink-0 transition-colors duration-200',
            completedToday ? 'text-accent' : 'text-muted-foreground',
          )}
          aria-hidden
        />
        <span
          className={cn(
            'truncate text-[0.9375rem] transition-colors duration-200',
            completedToday && 'text-muted-foreground',
          )}
        >
          {habit.name}
        </span>
      </div>

      {!compact && (
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {describeSchedule(habit, DAY_NAMES_SHORT)}
          {stats.rate != null && stats.scheduled >= 3 && (
            <> · {formatPercent(stats.rate)} over {stats.scheduled} days</>
          )}
        </p>
      )}
    </ListRow>
  );
}

/** Seven dots: filled when done, hollow when scheduled, faint when not due. */
export function WeekStrip({ view, className }: { view: HabitView; className?: string }) {
  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      {view.recent.map((day, index) => (
        <span key={day.date} className="flex flex-col items-center gap-1">
          <span
            aria-hidden
            className={cn(
              'block size-2 rounded-full transition-colors duration-200',
              day.completed
                ? 'bg-accent'
                : day.scheduled
                  ? 'border border-border-strong bg-transparent'
                  : 'bg-border/60',
            )}
          />
          <span className="text-[0.5625rem] text-muted-foreground/70">
            {DAY_INITIALS[dayOfWeek(day.date)]}
          </span>
          <span className="sr-only">
            {day.date}: {day.completed ? 'completed' : day.scheduled ? 'not completed' : 'not due'}
            {index === view.recent.length - 1 ? ' (today)' : ''}
          </span>
        </span>
      ))}
    </div>
  );
}
