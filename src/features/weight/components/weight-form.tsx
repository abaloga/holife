import { useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { DateField } from '@/components/ui/date-field';
import { toast } from '@/components/ui/toaster';
import { useConfirm } from '@/components/ui/confirm-dialog';
import { usePreferences } from '@/features/settings/hooks';
import { relativeDayLabel } from '@/lib/date';
import { kgToDisplay, kgToStonesAndPounds } from '@/lib/units';
import { round } from '@/lib/utils';
import { toUserMessage } from '@/lib/errors';
import { createWeightFormSchema, weightValuesToKg, type WeightFormValues } from '../schema';
import { useCreateWeightEntry, useDeleteWeightEntry, useUpdateWeightEntry } from '../hooks';
import type { WeightEntry } from '../api';
import { WeightInput } from './weight-input';

interface WeightFormProps {
  /** Omit to create a new entry. */
  entry?: WeightEntry;
  /** Pre-fills the weight when creating, e.g. from the last known value. */
  seedKg?: number | null;
  onDone: () => void;
}

/**
 * Logging a weight is meant to take about three seconds: the field is focused
 * and pre-filled with the last reading, and the date already says today.
 */
export function WeightForm({ entry, seedKg, onDone }: WeightFormProps) {
  const { timezone, weightUnit, today } = usePreferences();
  const create = useCreateWeightEntry();
  const update = useUpdateWeightEntry();
  const remove = useDeleteWeightEntry();
  const { confirm, confirmElement } = useConfirm();

  const schema = useMemo(() => createWeightFormSchema(weightUnit), [weightUnit]);

  const defaultValues = useMemo<WeightFormValues>(() => {
    const initialKg = entry ? Number(entry.weight_kg) : (seedKg ?? null);
    const stones = initialKg != null ? kgToStonesAndPounds(initialKg) : null;

    return {
      weight:
        initialKg == null
          ? (null as unknown as number)
          : weightUnit === 'st'
            ? (stones?.stones ?? 0)
            : round(kgToDisplay(initialKg, weightUnit), 1),
      pounds: stones?.pounds ?? null,
      date: entry?.local_date ?? today,
      note: entry?.note ?? '',
    };
  }, [entry, seedKg, weightUnit, today]);

  const form = useForm<WeightFormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const date = form.watch('date');
  const pounds = form.watch('pounds');

  const onSubmit = form.handleSubmit(async (values) => {
    const input = {
      weightKg: round(weightValuesToKg(values, weightUnit), 3),
      date: values.date,
      note: values.note,
      timezone,
    };

    try {
      if (entry) {
        await update.mutateAsync({ id: entry.id, ...input });
        toast.success('Weight updated');
      } else {
        await create.mutateAsync(input);
        toast.success('Weight logged');
      }
      onDone();
    } catch (cause) {
      form.setError('root', { message: toUserMessage(cause) });
    }
  });

  const handleDelete = () => {
    if (!entry) return;
    confirm({
      title: 'Delete this entry?',
      description: 'It will be removed from your history and your trend.',
      confirmLabel: 'Delete',
      destructive: true,
      onConfirm: async () => {
        try {
          await remove.mutateAsync(entry.id);
          toast.success('Entry deleted');
          onDone();
        } catch (cause) {
          toast.error(toUserMessage(cause));
        }
      },
    });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4 pt-1" noValidate>
      <Field
        label="Weight"
        error={
          form.formState.errors.weight?.message ??
          form.formState.errors.pounds?.message ??
          form.formState.errors.root?.message
        }
      >
        <Controller
          control={form.control}
          name="weight"
          render={({ field }) => (
            <WeightInput
              unit={weightUnit}
              value={field.value ?? null}
              onValueChange={field.onChange}
              pounds={pounds ?? null}
              onPoundsChange={(value) => form.setValue('pounds', value)}
              autoFocus={!entry}
            />
          )}
        />
      </Field>

      <Field
        label="Date"
        htmlFor="weight-date"
        aside={relativeDayLabel(date, today)}
        error={form.formState.errors.date?.message}
      >
        <Controller
          control={form.control}
          name="date"
          render={({ field }) => (
            <DateField
              id="weight-date"
              value={field.value}
              onValueChange={field.onChange}
              max={today}
            />
          )}
        />
      </Field>

      <Field
        label="Note"
        htmlFor="weight-note"
        aside="Optional"
        error={form.formState.errors.note?.message}
      >
        <Input
          id="weight-note"
          placeholder="Morning, after gym…"
          maxLength={500}
          {...form.register('note')}
        />
      </Field>

      <div className="flex gap-2 pt-1">
        {entry && (
          <Button
            type="button"
            variant="subtle"
            size="icon"
            onClick={handleDelete}
            aria-label="Delete entry"
          >
            <Trash2 className="text-destructive" aria-hidden />
          </Button>
        )}
        <Button type="submit" loading={form.formState.isSubmitting} block>
          {entry ? 'Save changes' : 'Log weight'}
        </Button>
      </div>

      {confirmElement}
    </form>
  );
}
