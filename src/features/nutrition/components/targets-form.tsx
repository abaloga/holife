import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { ControlledNumber } from '@/components/form/controlled';
import { toast } from '@/components/ui/toaster';
import { toUserMessage } from '@/lib/errors';
import { formatNumber } from '@/lib/format';
import { CALORIES_PER_GRAM } from '@/lib/chart';
import { useNutritionTargets, useUpdateNutritionTargets } from '../hooks';
import { nutritionTargetsFormSchema, type NutritionTargetsFormValues } from '../schema';

export function TargetsForm({ onDone }: { onDone: () => void }) {
  const { data: targets } = useNutritionTargets();
  const update = useUpdateNutritionTargets();

  const form = useForm<NutritionTargetsFormValues>({
    resolver: zodResolver(nutritionTargetsFormSchema),
    defaultValues: {
      calories: targets?.calories ?? 2000,
      protein: targets?.protein_g ?? 150,
      carbs: targets?.carbs_g ?? 200,
      fat: targets?.fat_g ?? 65,
    },
  });

  const [protein, carbs, fat] = form.watch(['protein', 'carbs', 'fat']);

  // Shown live so the numbers can be reconciled while they are being set.
  const impliedCalories =
    (protein ?? 0) * CALORIES_PER_GRAM.protein +
    (carbs ?? 0) * CALORIES_PER_GRAM.carbs +
    (fat ?? 0) * CALORIES_PER_GRAM.fat;

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await update.mutateAsync(values);
      toast.success('Targets updated');
      onDone();
    } catch (cause) {
      form.setError('root', { message: toUserMessage(cause) });
    }
  });

  const errors = form.formState.errors;

  return (
    <form onSubmit={onSubmit} className="space-y-4 pt-1" noValidate>
      <Field
        label="Daily calories"
        htmlFor="target-calories"
        error={errors.calories?.message ?? errors.root?.message}
      >
        <ControlledNumber
          control={form.control}
          name="calories"
          id="target-calories"
          suffix="kcal"
          step={50}
          decimals={0}
          min={500}
          max={15000}
          emphasis
        />
      </Field>

      <div className="grid grid-cols-3 gap-3">
        <Field label="Protein" htmlFor="target-protein" error={errors.protein?.message}>
          <ControlledNumber
            control={form.control}
            name="protein"
            id="target-protein"
            suffix="g"
            step={5}
            decimals={0}
            min={0}
            max={1000}
          />
        </Field>
        <Field label="Carbs" htmlFor="target-carbs" error={errors.carbs?.message}>
          <ControlledNumber
            control={form.control}
            name="carbs"
            id="target-carbs"
            suffix="g"
            step={5}
            decimals={0}
            min={0}
            max={2000}
          />
        </Field>
        <Field label="Fat" htmlFor="target-fat" error={errors.fat?.message}>
          <ControlledNumber
            control={form.control}
            name="fat"
            id="target-fat"
            suffix="g"
            step={5}
            decimals={0}
            min={0}
            max={1000}
          />
        </Field>
      </div>

      <p className="text-xs text-muted-foreground">
        Those macros add up to {formatNumber(Math.round(impliedCalories))} kcal. They don’t have to
        match your calorie target exactly. HoLife tracks them independently.
      </p>

      <Button type="submit" loading={form.formState.isSubmitting} block>
        Save targets
      </Button>
    </form>
  );
}
