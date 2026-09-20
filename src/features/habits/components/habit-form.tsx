import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Field, Label } from '@/components/ui/field';
import { Input, Textarea } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { ControlledSegmented } from '@/components/form/controlled';
import { toast } from '@/components/ui/toaster';
import { useConfirm } from '@/components/ui/confirm-dialog';
import { cn } from '@/lib/utils';
import { toUserMessage } from '@/lib/errors';
import { DAY_INITIALS, DAY_NAMES } from '@/lib/date';
import { usePreferences } from '@/features/settings/hooks';
import { DEFAULT_HABIT_ICON, HABIT_ICON_KEYS, habitIcon } from '../icons';
import { habitFormSchema, type HabitFormValues } from '../schema';
import { useCreateHabit, useDeleteHabit, useUpdateHabit } from '../hooks';
import type { Habit } from '../api';

interface HabitFormProps {
  habit?: Habit;
  onDone: () => void;
}

export function HabitForm({ habit, onDone }: HabitFormProps) {
  const { weekStartDay } = usePreferences();
  const create = useCreateHabit();
  const update = useUpdateHabit();
  const remove = useDeleteHabit();
  const { confirm, confirmElement } = useConfirm();

  const form = useForm<HabitFormValues>({
    resolver: zodResolver(habitFormSchema),
    defaultValues: {
      name: habit?.name ?? '',
      description: habit?.description ?? '',
      icon: habit?.icon ?? DEFAULT_HABIT_ICON,
      frequency: habit?.frequency ?? 'daily',
      daysOfWeek: habit?.days_of_week ?? [1, 2, 3, 4, 5],
      isActive: habit?.is_active ?? true,
    },
  });

  const [frequency, icon, daysOfWeek] = form.watch(['frequency', 'icon', 'daysOfWeek']);

  // Order the day buttons by the user's week start, not always Sunday first.
  const orderedDays = Array.from({ length: 7 }, (_, index) => (weekStartDay + index) % 7);

  const toggleDay = (day: number) => {
    const next = daysOfWeek.includes(day)
      ? daysOfWeek.filter((value) => value !== day)
      : [...daysOfWeek, day];
    form.setValue('daysOfWeek', next, { shouldValidate: form.formState.isSubmitted });
  };

  const onSubmit = form.handleSubmit(async (values) => {
    const input = {
      name: values.name,
      description: values.description,
      icon: values.icon,
      frequency: values.frequency,
      daysOfWeek: values.daysOfWeek,
      isActive: values.isActive,
    };

    try {
      if (habit) {
        await update.mutateAsync({ id: habit.id, ...input });
        toast.success('Habit updated');
      } else {
        await create.mutateAsync(input);
        toast.success('Habit created');
      }
      onDone();
    } catch (cause) {
      form.setError('root', { message: toUserMessage(cause) });
    }
  });

  const handleDelete = () => {
    if (!habit) return;
    confirm({
      title: `Delete “${habit.name}”?`,
      description: 'Its completion history will be deleted too. This cannot be undone.',
      confirmLabel: 'Delete',
      destructive: true,
      onConfirm: async () => {
        try {
          await remove.mutateAsync(habit.id);
          toast.success('Habit deleted');
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
        label="Habit"
        htmlFor="habit-name"
        error={errors.name?.message ?? errors.root?.message}
      >
        <Input
          id="habit-name"
          placeholder="Morning walk"
          maxLength={80}
          autoFocus={!habit}
          aria-invalid={Boolean(errors.name)}
          {...form.register('name')}
        />
      </Field>

      <Field label="Icon">
        <div
          role="radiogroup"
          aria-label="Habit icon"
          className="grid grid-cols-8 gap-1.5 rounded-lg border border-border bg-card p-2"
        >
          {HABIT_ICON_KEYS.map((key) => {
            const Icon = habitIcon(key);
            const selected = key === icon;
            return (
              <button
                key={key}
                type="button"
                role="radio"
                aria-checked={selected}
                aria-label={key.replace(/-/g, ' ')}
                onClick={() => form.setValue('icon', key)}
                className={cn(
                  'grid aspect-square place-items-center rounded-md transition-colors duration-150',
                  'active:scale-90',
                  selected
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:bg-subtle hover:text-foreground',
                )}
              >
                <Icon className="size-[1.125rem]" aria-hidden />
              </button>
            );
          })}
        </div>
      </Field>

      <Field label="Frequency">
        <ControlledSegmented
          control={form.control}
          name="frequency"
          aria-label="How often"
          options={[
            { value: 'daily' as const, label: 'Every day' },
            { value: 'days_of_week' as const, label: 'Certain days' },
          ]}
        />
      </Field>

      {frequency === 'days_of_week' && (
        <Field label="Days" error={errors.daysOfWeek?.message}>
          <div role="group" aria-label="Days of the week" className="flex gap-1.5">
            {orderedDays.map((day) => {
              const selected = daysOfWeek.includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  aria-pressed={selected}
                  aria-label={DAY_NAMES[day]}
                  onClick={() => toggleDay(day)}
                  className={cn(
                    'h-11 flex-1 rounded-lg border text-[0.8125rem] font-medium transition-colors duration-150',
                    'active:scale-95',
                    selected
                      ? 'border-accent bg-accent text-accent-foreground'
                      : 'border-input bg-card text-muted-foreground hover:bg-subtle',
                  )}
                >
                  {DAY_INITIALS[day]}
                </button>
              );
            })}
          </div>
        </Field>
      )}

      <Field
        label="Description"
        htmlFor="habit-description"
        aside="Optional"
        error={errors.description?.message}
      >
        <Textarea
          id="habit-description"
          rows={2}
          maxLength={500}
          placeholder="What does doing this well look like?"
          {...form.register('description')}
        />
      </Field>

      {habit && (
        <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-card px-3.5 py-3">
          <div className="min-w-0">
            <Label htmlFor="habit-active">Active</Label>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Inactive habits keep their history but stop appearing on Today.
            </p>
          </div>
          <Controller
            control={form.control}
            name="isActive"
            render={({ field }) => (
              <Switch
                id="habit-active"
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />
        </div>
      )}

      <div className="flex gap-2 pt-1">
        {habit && (
          <Button
            type="button"
            variant="subtle"
            size="icon"
            onClick={handleDelete}
            aria-label="Delete habit"
          >
            <Trash2 className="text-destructive" aria-hidden />
          </Button>
        )}
        <Button type="submit" loading={form.formState.isSubmitting} block>
          {habit ? 'Save changes' : 'Create habit'}
        </Button>
      </div>

      {confirmElement}
    </form>
  );
}
