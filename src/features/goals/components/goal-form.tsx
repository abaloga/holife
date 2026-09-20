import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Field, Label } from '@/components/ui/field';
import { Input, Textarea } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { ControlledDate, ControlledNumber, ControlledSegmented } from '@/components/form/controlled';
import { toast } from '@/components/ui/toaster';
import { useConfirm } from '@/components/ui/confirm-dialog';
import { usePreferences } from '@/features/settings/hooks';
import { relativeDayLabel } from '@/lib/date';
import { toUserMessage } from '@/lib/errors';
import { goalFormSchema, type GoalFormValues } from '../schema';
import { useCreateGoal, useDeleteGoal, useUpdateGoal } from '../hooks';
import type { Goal } from '../api';

interface GoalFormProps {
  goal?: Goal;
  onDone: () => void;
}

const STATUS_OPTIONS = [
  { value: 'active' as const, label: 'Active' },
  { value: 'paused' as const, label: 'Paused' },
  { value: 'achieved' as const, label: 'Achieved' },
];

export function GoalForm({ goal, onDone }: GoalFormProps) {
  const { today } = usePreferences();
  const create = useCreateGoal();
  const update = useUpdateGoal();
  const remove = useDeleteGoal();
  const { confirm, confirmElement } = useConfirm();

  const form = useForm<GoalFormValues>({
    resolver: zodResolver(goalFormSchema),
    defaultValues: {
      title: goal?.title ?? '',
      description: goal?.description ?? '',
      targetDate: goal?.target_date ?? '',
      // `archived` has no button of its own; editing an archived goal shows it
      // as paused, which is the closest thing the UI offers.
      status: goal?.status === 'archived' ? 'paused' : (goal?.status ?? 'active'),
      measurable: goal?.target_value != null,
      startValue: goal?.start_value ?? null,
      currentValue: goal?.current_value ?? null,
      targetValue: goal?.target_value ?? null,
      unit: goal?.unit ?? '',
    },
  });

  const [measurable, targetDate] = form.watch(['measurable', 'targetDate']);

  const onSubmit = form.handleSubmit(async (values) => {
    const input = {
      title: values.title,
      description: values.description,
      targetDate: values.targetDate || null,
      status: values.status,
      startValue: values.measurable ? (values.startValue ?? 0) : null,
      targetValue: values.measurable ? values.targetValue : null,
      currentValue: values.measurable ? (values.currentValue ?? values.startValue ?? 0) : null,
      unit: values.measurable ? values.unit : null,
    };

    try {
      if (goal) {
        await update.mutateAsync({ id: goal.id, ...input });
        toast.success('Goal updated');
      } else {
        await create.mutateAsync(input);
        toast.success('Goal created');
      }
      onDone();
    } catch (cause) {
      form.setError('root', { message: toUserMessage(cause) });
    }
  });

  const handleDelete = () => {
    if (!goal) return;
    confirm({
      title: 'Delete this goal?',
      description: 'This cannot be undone.',
      confirmLabel: 'Delete',
      destructive: true,
      onConfirm: async () => {
        try {
          await remove.mutateAsync(goal.id);
          toast.success('Goal deleted');
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
        label="Goal"
        htmlFor="goal-title"
        error={errors.title?.message ?? errors.root?.message}
      >
        <Input
          id="goal-title"
          placeholder="Run a half marathon"
          maxLength={160}
          autoFocus={!goal}
          aria-invalid={Boolean(errors.title)}
          {...form.register('title')}
        />
      </Field>

      <Field
        label="Why it matters"
        htmlFor="goal-description"
        aside="Optional"
        error={errors.description?.message}
      >
        <Textarea
          id="goal-description"
          rows={2}
          maxLength={2000}
          placeholder="What does reaching this actually give you?"
          {...form.register('description')}
        />
      </Field>

      <Field
        label="Target date"
        htmlFor="goal-date"
        aside={targetDate ? relativeDayLabel(targetDate, today) : 'Optional'}
        error={errors.targetDate?.message}
      >
        <ControlledDate control={form.control} name="targetDate" id="goal-date" />
      </Field>

      <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-card px-3.5 py-3">
        <div className="min-w-0">
          <Label htmlFor="goal-measurable">Track a number</Label>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Adds a progress bar you can nudge from the goals list.
          </p>
        </div>
        <Controller
          control={form.control}
          name="measurable"
          render={({ field }) => (
            <Switch id="goal-measurable" checked={field.value} onCheckedChange={field.onChange} />
          )}
        />
      </div>

      {measurable && (
        <>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Start" htmlFor="goal-start" error={errors.startValue?.message}>
              <ControlledNumber
                control={form.control}
                name="startValue"
                id="goal-start"
                step={1}
                decimals={2}
              />
            </Field>
            <Field label="Now" htmlFor="goal-current" error={errors.currentValue?.message}>
              <ControlledNumber
                control={form.control}
                name="currentValue"
                id="goal-current"
                step={1}
                decimals={2}
              />
            </Field>
            <Field label="Target" htmlFor="goal-target" error={errors.targetValue?.message}>
              <ControlledNumber
                control={form.control}
                name="targetValue"
                id="goal-target"
                step={1}
                decimals={2}
              />
            </Field>
          </div>
          <Field
            label="Unit"
            htmlFor="goal-unit"
            aside="Optional"
            hint="kg, km, books, sessions…"
            error={errors.unit?.message}
          >
            <Input id="goal-unit" maxLength={24} placeholder="km" {...form.register('unit')} />
          </Field>
        </>
      )}

      {goal && (
        <Field label="Status">
          <ControlledSegmented
            control={form.control}
            name="status"
            aria-label="Goal status"
            options={STATUS_OPTIONS}
          />
        </Field>
      )}

      <div className="flex gap-2 pt-1">
        {goal && (
          <Button
            type="button"
            variant="subtle"
            size="icon"
            onClick={handleDelete}
            aria-label="Delete goal"
          >
            <Trash2 className="text-destructive" aria-hidden />
          </Button>
        )}
        <Button type="submit" loading={form.formState.isSubmitting} block>
          {goal ? 'Save changes' : 'Create goal'}
        </Button>
      </div>

      {confirmElement}
    </form>
  );
}
