import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AnimatePresence, motion } from 'motion/react';
import { Sparkles, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input, Textarea } from '@/components/ui/input';
import { toast } from '@/components/ui/toaster';
import { useConfirm } from '@/components/ui/confirm-dialog';
import {
  ControlledDate,
  ControlledNumber,
  ControlledSegmented,
  ControlledTime,
} from '@/components/form/controlled';
import { usePreferences } from '@/features/settings/hooks';
import { useUserId } from '@/features/auth/auth-context';
import { relativeDayLabel, timeInTimezone } from '@/lib/date';
import { transitions } from '@/lib/motion';
import { toUserMessage } from '@/lib/errors';
import { formatNumber } from '@/lib/format';
import { MACRO_UNIT } from '@/lib/chart';
import { calorieDiscrepancy } from '../calculations';
import { MEAL_SLOTS, mealFormSchema, slotForHour, type MealFormValues } from '../schema';
import { useCreateMeal, useDeleteMeal, useUpdateMeal } from '../hooks';
import { uploadMealImage, type MealEntry } from '../api';
import type { MacroEstimate } from '../estimate-schema';
import type { EstimateConfidence } from '@/types/database';
import { EstimateNotice, MacroEstimator } from './macro-estimator';
import { MealImage } from './meal-image';

interface MealFormProps {
  meal?: MealEntry;
  onDone: () => void;
}

interface EstimateState {
  confidence: EstimateConfidence;
  assumptions: string[];
  model: string;
}

export function MealForm({ meal, onDone }: MealFormProps) {
  const userId = useUserId();
  const { timezone, today } = usePreferences();
  const create = useCreateMeal();
  const update = useUpdateMeal();
  const remove = useDeleteMeal();
  const { confirm, confirmElement } = useConfirm();

  const form = useForm<MealFormValues>({
    resolver: zodResolver(mealFormSchema),
    defaultValues: {
      name: meal?.name ?? '',
      date: meal?.local_date ?? today,
      time: meal ? timeInTimezone(meal.eaten_at, timezone) : timeInTimezone(new Date(), timezone),
      // Pre-select from the user's own clock, not the device's.
      slot: meal?.slot ?? slotForHour(Number(timeInTimezone(new Date(), timezone).slice(0, 2))),
      calories: meal ? Number(meal.calories) : (null as unknown as number),
      protein: meal ? Number(meal.protein_g) : (null as unknown as number),
      carbs: meal ? Number(meal.carbs_g) : (null as unknown as number),
      fat: meal ? Number(meal.fat_g) : (null as unknown as number),
      notes: meal?.notes ?? '',
    },
  });

  const [estimatorOpen, setEstimatorOpen] = useState(false);
  const [estimate, setEstimate] = useState<EstimateState | null>(
    meal?.source === 'ai_estimate' && meal.estimate_confidence
      ? {
          confidence: meal.estimate_confidence,
          assumptions: meal.estimate_assumptions ?? [],
          model: meal.estimate_model ?? '',
        }
      : null,
  );
  const [pendingImage, setPendingImage] = useState<File | null>(null);
  const [pendingImageUrl, setPendingImageUrl] = useState<string | null>(null);

  useEffect(
    () => () => {
      if (pendingImageUrl) URL.revokeObjectURL(pendingImageUrl);
    },
    [pendingImageUrl],
  );

  const [date, calories, protein, carbs, fat] = form.watch([
    'date',
    'calories',
    'protein',
    'carbs',
    'fat',
  ]);

  const totals = {
    calories: calories ?? 0,
    protein: protein ?? 0,
    carbs: carbs ?? 0,
    fat: fat ?? 0,
  };
  const discrepancy = calorieDiscrepancy(totals);
  const showDiscrepancy =
    discrepancy != null && Math.abs(discrepancy) > Math.max(120, totals.calories * 0.2);

  const applyEstimate = (result: MacroEstimate, model: string, image: File | null) => {
    if (!form.getValues('name').trim()) form.setValue('name', result.mealName);
    form.setValue('calories', Math.round(result.calories), { shouldValidate: true });
    form.setValue('protein', Math.round(result.proteinGrams * 10) / 10, { shouldValidate: true });
    form.setValue('carbs', Math.round(result.carbohydrateGrams * 10) / 10, {
      shouldValidate: true,
    });
    form.setValue('fat', Math.round(result.fatGrams * 10) / 10, { shouldValidate: true });

    setEstimate({ confidence: result.confidence, assumptions: result.assumptions, model });
    setEstimatorOpen(false);

    if (image) {
      setPendingImage(image);
      setPendingImageUrl((current) => {
        if (current) URL.revokeObjectURL(current);
        return URL.createObjectURL(image);
      });
    }
  };

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      // Upload first: a failed upload should not leave a meal row pointing at
      // an object that was never stored.
      let imagePath = meal?.image_path ?? null;
      if (pendingImage) imagePath = await uploadMealImage(userId, pendingImage);

      const input = {
        name: values.name,
        date: values.date,
        time: values.time,
        slot: values.slot,
        calories: values.calories,
        protein: values.protein,
        carbs: values.carbs,
        fat: values.fat,
        notes: values.notes,
        imagePath,
        source: estimate ? ('ai_estimate' as const) : ('manual' as const),
        estimateConfidence: estimate?.confidence ?? null,
        estimateAssumptions: estimate?.assumptions ?? null,
        estimateModel: estimate?.model ?? null,
        timezone,
      };

      if (meal) {
        await update.mutateAsync({ id: meal.id, ...input });
        toast.success('Meal updated');
      } else {
        await create.mutateAsync(input);
        toast.success('Meal logged');
      }
      onDone();
    } catch (cause) {
      form.setError('root', { message: toUserMessage(cause) });
    }
  });

  const handleDelete = () => {
    if (!meal) return;
    confirm({
      title: 'Delete this meal?',
      description: "It will be removed from the day's totals.",
      confirmLabel: 'Delete',
      destructive: true,
      onConfirm: async () => {
        try {
          await remove.mutateAsync(meal);
          toast.success('Meal deleted');
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
      {!estimatorOpen && !estimate && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          block
          onClick={() => setEstimatorOpen(true)}
        >
          <Sparkles aria-hidden />
          Don’t know the macros? Estimate them
        </Button>
      )}

      <AnimatePresence initial={false}>
        {estimatorOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={transitions.soft}
            className="overflow-hidden"
          >
            <MacroEstimator
              initialDescription={form.getValues('name')}
              onEstimate={applyEstimate}
              onCancel={() => setEstimatorOpen(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {estimate && (
        <EstimateNotice
          confidence={estimate.confidence}
          assumptions={estimate.assumptions}
          onDismiss={() => setEstimate(null)}
        />
      )}

      <Field
        label="Meal"
        htmlFor="meal-name"
        error={errors.name?.message ?? errors.root?.message}
      >
        <Input
          id="meal-name"
          placeholder="Chicken salad"
          maxLength={160}
          autoFocus={!meal}
          enterKeyHint="next"
          aria-invalid={Boolean(errors.name)}
          {...form.register('name')}
        />
      </Field>

      <Field label="When">
        <ControlledSegmented
          control={form.control}
          name="slot"
          aria-label="Meal type"
          options={MEAL_SLOTS.map((option) => ({ value: option.value, label: option.label }))}
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field
          label="Date"
          htmlFor="meal-date"
          aside={relativeDayLabel(date, today)}
          error={errors.date?.message}
        >
          <ControlledDate control={form.control} name="date" id="meal-date" />
        </Field>
        <Field label="Time" htmlFor="meal-time" error={errors.time?.message}>
          <ControlledTime control={form.control} name="time" id="meal-time" />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field
          label="Calories"
          htmlFor="meal-calories"
          className="col-span-2"
          error={errors.calories?.message}
        >
          <ControlledNumber
            control={form.control}
            name="calories"
            id="meal-calories"
            suffix="kcal"
            step={10}
            decimals={0}
            min={0}
            max={20000}
          />
        </Field>
        <Field label="Protein" htmlFor="meal-protein" error={errors.protein?.message}>
          <ControlledNumber
            control={form.control}
            name="protein"
            id="meal-protein"
            suffix={MACRO_UNIT.protein}
            step={5}
            decimals={1}
            min={0}
            max={2000}
          />
        </Field>
        <Field label="Carbs" htmlFor="meal-carbs" error={errors.carbs?.message}>
          <ControlledNumber
            control={form.control}
            name="carbs"
            id="meal-carbs"
            suffix={MACRO_UNIT.carbs}
            step={5}
            decimals={1}
            min={0}
            max={2000}
          />
        </Field>
        <Field label="Fat" htmlFor="meal-fat" error={errors.fat?.message}>
          <ControlledNumber
            control={form.control}
            name="fat"
            id="meal-fat"
            suffix={MACRO_UNIT.fat}
            step={5}
            decimals={1}
            min={0}
            max={2000}
          />
        </Field>
      </div>

      {showDiscrepancy && discrepancy != null && (
        <p className="text-xs text-muted-foreground">
          The macros above work out to about {formatNumber(totals.calories - discrepancy)} kcal.
          That’s fine if the calorie figure came from a label — just worth a look.
        </p>
      )}

      {(pendingImageUrl || meal?.image_path) && (
        <Field label="Photo">
          <MealImage
            path={meal?.image_path ?? null}
            localUrl={pendingImageUrl}
            className="h-32 w-full rounded-lg object-cover"
          />
        </Field>
      )}

      <Field
        label="Notes"
        htmlFor="meal-notes"
        aside="Optional"
        error={errors.notes?.message}
      >
        <Textarea
          id="meal-notes"
          rows={2}
          maxLength={1000}
          placeholder="Anything worth remembering"
          {...form.register('notes')}
        />
      </Field>

      <div className="flex gap-2 pt-1">
        {meal && (
          <Button
            type="button"
            variant="subtle"
            size="icon"
            onClick={handleDelete}
            aria-label="Delete meal"
          >
            <Trash2 className="text-destructive" aria-hidden />
          </Button>
        )}
        <Button type="submit" loading={form.formState.isSubmitting} block>
          {meal ? 'Save changes' : 'Log meal'}
        </Button>
      </div>

      {confirmElement}
    </form>
  );
}
