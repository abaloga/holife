/**
 * Chart vocabulary shared by every module.
 *
 * The categorical hues are assigned in a fixed order and are never cycled or
 * reassigned when a series is filtered out — a macro keeps its colour whether
 * it is shown next to three others or on its own.
 */

export type MacroKey = 'calories' | 'protein' | 'carbs' | 'fat';

/** Display order everywhere macros appear: energy first, then the three macros. */
export const MACRO_KEYS: readonly MacroKey[] = ['calories', 'protein', 'carbs', 'fat'] as const;
export const MACRO_ONLY_KEYS: readonly MacroKey[] = ['protein', 'carbs', 'fat'] as const;

export const MACRO_COLOR: Record<MacroKey, string> = {
  calories: 'var(--chart-1)',
  protein: 'var(--chart-2)',
  carbs: 'var(--chart-3)',
  fat: 'var(--chart-4)',
};

/** Tailwind background utilities matching `MACRO_COLOR`, for bars and dots. */
export const MACRO_BG: Record<MacroKey, string> = {
  calories: 'bg-chart-1',
  protein: 'bg-chart-2',
  carbs: 'bg-chart-3',
  fat: 'bg-chart-4',
};

export const MACRO_LABEL: Record<MacroKey, string> = {
  calories: 'Calories',
  protein: 'Protein',
  carbs: 'Carbs',
  fat: 'Fat',
};

export const MACRO_UNIT: Record<MacroKey, string> = {
  calories: 'kcal',
  protein: 'g',
  carbs: 'g',
  fat: 'g',
};

/** Energy per gram, used to describe where a day's calories came from. */
export const CALORIES_PER_GRAM = { protein: 4, carbs: 4, fat: 9 } as const;

export const CHART_NEUTRAL = 'var(--chart-5)';
