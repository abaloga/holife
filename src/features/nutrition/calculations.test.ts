import { describe, expect, it } from 'vitest';
import {
  calorieDiscrepancy,
  energyFromMacros,
  macroEnergySplit,
  macroProgress,
  sumMeals,
} from './calculations';

const meal = (calories: number, protein: number, carbs: number, fat: number) => ({
  calories,
  protein_g: protein,
  carbs_g: carbs,
  fat_g: fat,
});

describe('sumMeals', () => {
  it('returns zeros for an empty day', () => {
    expect(sumMeals([])).toEqual({ calories: 0, protein: 0, carbs: 0, fat: 0 });
  });

  it('adds up every macro', () => {
    const totals = sumMeals([meal(500, 30, 50, 20), meal(700, 40, 60, 25)]);
    expect(totals).toEqual({ calories: 1200, protein: 70, carbs: 110, fat: 45 });
  });

  it('handles numerics arriving as strings from Postgres', () => {
    const totals = sumMeals([
      { calories: '500.5', protein_g: '30.2', carbs_g: '50', fat_g: '20' },
    ]);
    expect(totals.calories).toBeCloseTo(500.5, 5);
    expect(totals.protein).toBeCloseTo(30.2, 5);
  });
});

describe('macroProgress', () => {
  const targets = { calories: 2000, protein: 150, carbs: 200, fat: 65 };

  it('reports ratio and remaining for each macro', () => {
    const progress = macroProgress({ calories: 1000, protein: 75, carbs: 100, fat: 30 }, targets);
    const calories = progress.find((item) => item.key === 'calories')!;

    expect(calories.ratio).toBeCloseTo(0.5, 5);
    expect(calories.remaining).toBe(1000);
  });

  it('goes past 1 rather than clamping, so the UI can show an overshoot', () => {
    const progress = macroProgress({ calories: 2500, protein: 0, carbs: 0, fat: 0 }, targets);
    const calories = progress.find((item) => item.key === 'calories')!;

    expect(calories.ratio).toBeCloseTo(1.25, 5);
    expect(calories.remaining).toBe(-500);
  });

  it('yields 0 rather than NaN or Infinity when a target is zero', () => {
    const progress = macroProgress(
      { calories: 500, protein: 10, carbs: 10, fat: 10 },
      { calories: 0, protein: 0, carbs: 0, fat: 0 },
    );

    for (const item of progress) {
      expect(Number.isFinite(item.ratio)).toBe(true);
      expect(item.ratio).toBe(0);
    }
  });

  it('keeps the macro order stable', () => {
    const progress = macroProgress({ calories: 0, protein: 0, carbs: 0, fat: 0 }, targets);
    expect(progress.map((item) => item.key)).toEqual(['calories', 'protein', 'carbs', 'fat']);
  });
});

describe('energyFromMacros', () => {
  it('uses 4/4/9 kcal per gram', () => {
    expect(energyFromMacros({ calories: 0, protein: 10, carbs: 10, fat: 10 })).toBe(
      10 * 4 + 10 * 4 + 10 * 9,
    );
  });

  it('is zero for an empty day', () => {
    expect(energyFromMacros({ calories: 0, protein: 0, carbs: 0, fat: 0 })).toBe(0);
  });
});

describe('macroEnergySplit', () => {
  it('splits energy proportionally and sums to one', () => {
    const split = macroEnergySplit({ calories: 0, protein: 50, carbs: 50, fat: 0 });
    expect(split.protein).toBeCloseTo(0.5, 5);
    expect(split.carbs).toBeCloseTo(0.5, 5);
    expect(split.fat).toBe(0);
    expect(split.protein + split.carbs + split.fat).toBeCloseTo(1, 5);
  });

  it('returns zeros when nothing is logged, instead of dividing by zero', () => {
    expect(macroEnergySplit({ calories: 0, protein: 0, carbs: 0, fat: 0 })).toEqual({
      protein: 0,
      carbs: 0,
      fat: 0,
    });
  });
});

describe('calorieDiscrepancy', () => {
  it('is null when there is nothing to compare', () => {
    expect(calorieDiscrepancy({ calories: 0, protein: 10, carbs: 10, fat: 10 })).toBeNull();
    expect(calorieDiscrepancy({ calories: 500, protein: 0, carbs: 0, fat: 0 })).toBeNull();
  });

  it('is near zero when the entered calories match the macros', () => {
    // 30p + 40c + 15f = 120 + 160 + 135 = 415 kcal
    expect(calorieDiscrepancy({ calories: 415, protein: 30, carbs: 40, fat: 15 })).toBe(0);
  });

  it('is positive when the entered calories exceed what the macros imply', () => {
    expect(calorieDiscrepancy({ calories: 600, protein: 30, carbs: 40, fat: 15 })).toBe(185);
  });
});
