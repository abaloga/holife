import { z } from 'zod';
import { isDateKey } from '@/lib/date';
import { optionalText, requiredNumber } from '@/lib/validation';

const macroGrams = (label: string) =>
  requiredNumber(`Enter ${label}, or 0`)
    .min(0, `${label} cannot be negative`)
    .max(2000, `That is more ${label} than this app supports`);

export const mealFormSchema = z.object({
  name: z.string().trim().min(1, 'Give the meal a name').max(160, 'That name is a little long'),
  date: z.string().refine(isDateKey, 'Pick a valid date'),
  time: z.string().regex(/^\d{2}:\d{2}$/, 'Pick a valid time'),
  slot: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
  calories: requiredNumber('Enter calories, or 0')
    .min(0, 'Calories cannot be negative')
    .max(20000, 'That seems too high'),
  protein: macroGrams('protein'),
  carbs: macroGrams('carbs'),
  fat: macroGrams('fat'),
  notes: optionalText(1000, 'Keep notes under 1000 characters'),
});

export type MealFormValues = z.infer<typeof mealFormSchema>;

export const nutritionTargetsFormSchema = z.object({
  calories: requiredNumber('Set a calorie target')
    .int('Use a whole number')
    .min(500, 'That is lower than this app supports')
    .max(15000, 'That is higher than this app supports'),
  protein: requiredNumber('Set a protein target').int().min(0).max(1000),
  carbs: requiredNumber('Set a carbohydrate target').int().min(0).max(2000),
  fat: requiredNumber('Set a fat target').int().min(0).max(1000),
});

export type NutritionTargetsFormValues = z.infer<typeof nutritionTargetsFormSchema>;

export const MEAL_SLOTS = [
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'snack', label: 'Snack' },
] as const;

/** Best guess at which meal a time of day belongs to, used to pre-select. */
export function slotForHour(hour: number): 'breakfast' | 'lunch' | 'dinner' | 'snack' {
  if (hour < 11) return 'breakfast';
  if (hour < 15) return 'lunch';
  if (hour < 21) return 'dinner';
  return 'snack';
}
