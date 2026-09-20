import { CALORIES_PER_GRAM, MACRO_KEYS, type MacroKey } from '@/lib/chart';
import { round, safeRatio } from '@/lib/utils';

export interface MacroTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export const EMPTY_TOTALS: MacroTotals = { calories: 0, protein: 0, carbs: 0, fat: 0 };

interface MacroBearing {
  calories: number | string;
  protein_g: number | string;
  carbs_g: number | string;
  fat_g: number | string;
}

/** Postgres `numeric` can arrive as a string; normalise before arithmetic. */
function toNumber(value: number | string | null | undefined): number {
  if (value == null) return 0;
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function sumMeals(meals: MacroBearing[]): MacroTotals {
  return meals.reduce<MacroTotals>(
    (totals, meal) => ({
      calories: totals.calories + toNumber(meal.calories),
      protein: totals.protein + toNumber(meal.protein_g),
      carbs: totals.carbs + toNumber(meal.carbs_g),
      fat: totals.fat + toNumber(meal.fat_g),
    }),
    { ...EMPTY_TOTALS },
  );
}

export interface MacroProgress {
  key: MacroKey;
  value: number;
  target: number;
  /** Can exceed 1 — the UI decides how to present going over. */
  ratio: number;
  /** Negative once the target is passed. */
  remaining: number;
}

export function macroProgress(totals: MacroTotals, targets: MacroTotals): MacroProgress[] {
  return MACRO_KEYS.map((key) => {
    const value = totals[key];
    const target = targets[key];
    return {
      key,
      value: round(value, 1),
      target,
      ratio: safeRatio(value, target),
      remaining: round(target - value, 1),
    };
  });
}

/** Calories implied by the logged macros, ignoring the entered calorie figure. */
export function energyFromMacros(totals: MacroTotals): number {
  return (
    totals.protein * CALORIES_PER_GRAM.protein +
    totals.carbs * CALORIES_PER_GRAM.carbs +
    totals.fat * CALORIES_PER_GRAM.fat
  );
}

/**
 * Share of energy contributed by each macro, as fractions summing to 1.
 * Derived from the macros rather than the calorie field so the split is
 * internally consistent even when the two disagree.
 */
export function macroEnergySplit(totals: MacroTotals): Record<'protein' | 'carbs' | 'fat', number> {
  const total = energyFromMacros(totals);
  if (total <= 0) return { protein: 0, carbs: 0, fat: 0 };

  return {
    protein: (totals.protein * CALORIES_PER_GRAM.protein) / total,
    carbs: (totals.carbs * CALORIES_PER_GRAM.carbs) / total,
    fat: (totals.fat * CALORIES_PER_GRAM.fat) / total,
  };
}

/**
 * How far the entered calories diverge from what the macros imply. Used to
 * gently flag a probable typo, never to overwrite what the user entered.
 */
export function calorieDiscrepancy(totals: MacroTotals): number | null {
  const implied = energyFromMacros(totals);
  if (implied === 0 || totals.calories === 0) return null;
  return round(totals.calories - implied, 0);
}
