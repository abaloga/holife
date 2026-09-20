import { z } from 'zod';
import { isDateKey } from '@/lib/date';
import { optionalText, requiredNumber } from '@/lib/validation';
import { displayToKg, stonesAndPoundsToKg } from '@/lib/units';
import type { WeightUnit } from '@/types/database';

/**
 * Bounds match the database CHECK constraints so a mistake is caught in the
 * form rather than by a Postgres error the user can't act on.
 */
export const MIN_WEIGHT_KG = 20;
export const MAX_WEIGHT_KG = 500;

/**
 * The schema depends on the display unit, because the range check only means
 * something once the typed value has been converted to kilograms. "500" is a
 * plausible weight in pounds and an impossible one in kilograms.
 */
export function createWeightFormSchema(unit: WeightUnit) {
  return z
    .object({
      /** In the user's display unit — stones when the unit is `st`. */
      weight: requiredNumber('Enter a weight').positive('Enter a weight above zero'),
      /** Only used when the unit is `st`. */
      pounds: z.number().min(0).max(13.9, 'Pounds must be under 14').nullable().default(null),
      date: z.string().refine(isDateKey, 'Pick a valid date'),
      note: optionalText(500, 'Keep the note under 500 characters'),
    })
    .superRefine((values, context) => {
      const kg = weightValuesToKg(values, unit);
      if (kg < MIN_WEIGHT_KG || kg > MAX_WEIGHT_KG) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['weight'],
          message: 'That weight is outside the range this app supports.',
        });
      }
    });
}

export type WeightFormValues = z.infer<ReturnType<typeof createWeightFormSchema>>;

export function weightValuesToKg(
  values: { weight: number; pounds?: number | null },
  unit: WeightUnit,
): number {
  return unit === 'st'
    ? stonesAndPoundsToKg(values.weight, values.pounds ?? 0)
    : displayToKg(values.weight, unit);
}
