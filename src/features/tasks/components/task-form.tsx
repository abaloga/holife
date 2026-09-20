import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CalendarOff, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input, Textarea } from '@/components/ui/input';
import { ControlledDate, ControlledSegmented, ControlledTime } from '@/components/form/controlled';
import { toast } from '@/components/ui/toaster';
import { useConfirm } from '@/components/ui/confirm-dialog';
import { usePreferences } from '@/features/settings/hooks';
import { addDaysToKey, relativeDayLabel } from '@/lib/date';
import { toUserMessage } from '@/lib/errors';
import { PRIORITIES } from '../calculations';
import { taskFormSchema, type TaskFormValues } from '../schema';
import { useCreateTask, useDeleteTask, useUpdateTask } from '../hooks';
import type { Task } from '../api';

interface TaskFormProps {
  task?: Task;
  /** Pre-fills the due date, e.g. when adding from the Today screen. */
  defaultDueDate?: string | null;
  onDone: () => void;
}

export function TaskForm({ task, defaultDueDate, onDone }: TaskFormProps) {
  const { today } = usePreferences();
  const create = useCreateTask();
  const update = useUpdateTask();
  const remove = useDeleteTask();
  const { confirm, confirmElement } = useConfirm();

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: task?.title ?? '',
      notes: task?.notes ?? '',
      dueDate: task ? task.due_date : (defaultDueDate ?? null),
      dueTime: task?.due_time?.slice(0, 5) ?? '',
      priority: String(task?.priority ?? 0) as TaskFormValues['priority'],
    },
  });

  const dueDate = form.watch('dueDate');

  const setDueDate = (value: string | null) => {
    form.setValue('dueDate', value);
    if (value === null) form.setValue('dueTime', '');
  };

  const onSubmit = form.handleSubmit(async (values) => {
    const input = {
      title: values.title,
      notes: values.notes,
      dueDate: values.dueDate || null,
      dueTime: values.dueTime || null,
      priority: Number(values.priority),
    };

    try {
      if (task) {
        await update.mutateAsync({ id: task.id, ...input });
        toast.success('Task updated');
      } else {
        await create.mutateAsync(input);
        toast.success('Task added');
      }
      onDone();
    } catch (cause) {
      form.setError('root', { message: toUserMessage(cause) });
    }
  });

  const handleDelete = () => {
    if (!task) return;
    confirm({
      title: 'Delete this task?',
      description: 'This cannot be undone.',
      confirmLabel: 'Delete',
      destructive: true,
      onConfirm: async () => {
        try {
          await remove.mutateAsync(task.id);
          toast.success('Task deleted');
          onDone();
        } catch (cause) {
          toast.error(toUserMessage(cause));
        }
      },
    });
  };

  const errors = form.formState.errors;

  return (
    <form onSubmit={onSubmit} className="space-y-4 pt-1" noValidate>
      <Field
        label="Task"
        htmlFor="task-title"
        error={errors.title?.message ?? errors.root?.message}
      >
        <Input
          id="task-title"
          placeholder="Book the dentist"
          maxLength={200}
          autoFocus={!task}
          enterKeyHint="done"
          aria-invalid={Boolean(errors.title)}
          {...form.register('title')}
        />
      </Field>

      <Field
        label="Due"
        aside={dueDate ? relativeDayLabel(dueDate, today) : 'No date'}
        htmlFor="task-due-date"
        error={errors.dueDate?.message ?? errors.dueTime?.message}
      >
        <div className="space-y-2">
          <div className="flex gap-2">
            <Button
              type="button"
              variant={dueDate === today ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDueDate(today)}
              className="flex-1"
            >
              Today
            </Button>
            <Button
              type="button"
              variant={dueDate === addDaysToKey(today, 1) ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDueDate(addDaysToKey(today, 1))}
              className="flex-1"
            >
              Tomorrow
            </Button>
            <Button
              type="button"
              variant={dueDate === null ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDueDate(null)}
              aria-label="No due date"
            >
              <CalendarOff aria-hidden />
            </Button>
          </div>

          {dueDate !== null && (
            <div className="grid grid-cols-2 gap-2">
              <ControlledDate control={form.control} name="dueDate" id="task-due-date" />
              <ControlledTime
                control={form.control}
                name="dueTime"
                aria-label="Due time (optional)"
              />
            </div>
          )}
        </div>
      </Field>

      <Field label="Priority">
        <ControlledSegmented
          control={form.control}
          name="priority"
          aria-label="Priority"
          options={PRIORITIES.map((option) => ({
            value: String(option.value),
            label: option.label,
          }))}
        />
      </Field>

      <Field label="Notes" htmlFor="task-notes" aside="Optional" error={errors.notes?.message}>
        <Textarea id="task-notes" rows={2} maxLength={2000} {...form.register('notes')} />
      </Field>

      <div className="flex gap-2 pt-1">
        {task && (
          <Button
            type="button"
            variant="subtle"
            size="icon"
            onClick={handleDelete}
            aria-label="Delete task"
          >
            <Trash2 className="text-destructive" aria-hidden />
          </Button>
        )}
        <Button type="submit" loading={form.formState.isSubmitting} block>
          {task ? 'Save changes' : 'Add task'}
        </Button>
      </div>

      {confirmElement}
    </form>
  );
}
