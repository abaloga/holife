import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ListRow } from '@/components/common/list-row';
import { CompletionToggle } from '@/components/ui/completion-toggle';
import { relativeDayLabel, type DateKey } from '@/lib/date';
import type { Task } from '../api';

interface TaskRowProps {
  task: Task;
  today: DateKey;
  onToggle: (completed: boolean) => void;
  onSelect?: () => void;
  /** Hides the due-date line when the section header already says it. */
  hideDue?: boolean;
}

const PRIORITY_DOT: Record<number, string> = {
  1: 'bg-chart-2',
  2: 'bg-chart-4',
  3: 'bg-destructive',
};

export function TaskRow({ task, today, onToggle, onSelect, hideDue }: TaskRowProps) {
  const overdue = !task.is_completed && task.due_date != null && task.due_date < today;
  const meta: string[] = [];

  if (!hideDue && task.due_date) meta.push(relativeDayLabel(task.due_date, today));
  if (task.due_time) meta.push(task.due_time.slice(0, 5));

  return (
    <ListRow
      leading={
        <CompletionToggle
          checked={task.is_completed}
          onCheckedChange={onToggle}
          label={`Mark “${task.title}” ${task.is_completed ? 'not done' : 'done'}`}
        />
      }
      onActivate={onSelect}
      activateLabel={onSelect ? `Edit ${task.title}` : undefined}
      trailing={
        task.priority > 0 && !task.is_completed ? (
          <span
            aria-label={`Priority ${task.priority}`}
            className={cn('size-1.5 shrink-0 rounded-full', PRIORITY_DOT[task.priority])}
          />
        ) : undefined
      }
    >
      <p
        className={cn(
          'truncate text-[0.9375rem] transition-colors duration-200',
          task.is_completed && 'text-muted-foreground line-through decoration-muted-foreground/50',
        )}
      >
        {task.title}
      </p>

      {(meta.length > 0 || task.notes) && (
        <p
          className={cn(
            'mt-0.5 flex items-center gap-1 truncate text-xs',
            overdue ? 'text-destructive' : 'text-muted-foreground',
          )}
        >
          {task.due_time && !hideDue && <Clock className="size-3 shrink-0" aria-hidden />}
          {meta.join(' · ')}
          {meta.length > 0 && task.notes && ' · '}
          {task.notes && <span className="truncate">{task.notes}</span>}
        </p>
      )}
    </ListRow>
  );
}
