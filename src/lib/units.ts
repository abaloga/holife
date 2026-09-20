import { round } from './utils';
import type { WeightUnit } from '@/types/database';

/**
 * Weight is *always* stored in kilograms. Units are a presentation concern and
 * conversion happens at the edges: when rendering, and when reading a form.
 */

export const KG_PER_LB = 0.45359237;
export const LB_PER_STONE = 14;

export const WEIGHT_UNIT_LABELS: Record<WeightUnit, string> = {
  kg: 'Kilograms',
  lb: 'Pounds',
  st: 'Stone & pounds',
};

export const WEIGHT_UNIT_SUFFIX: Record<WeightUnit, string> = {
  kg: 'kg',
  lb: 'lb',
  st: 'st',
};

export function kgToLb(kg: number): number {
  return kg / KG_PER_LB;
}

export function lbToKg(lb: number): number {
  return lb * KG_PER_LB;
}

export function kgToStonesAndPounds(kg: number): { stones: number; pounds: number } {
  const totalPounds = kgToLb(kg);
  let stones = Math.floor(totalPounds / LB_PER_STONE);
  let pounds = round(totalPounds - stones * LB_PER_STONE, 1);
  // Rounding 13.97 lb up to 14.0 lb must roll over into the next stone.
  if (pounds >= LB_PER_STONE) {
    stones += 1;
    pounds = 0;
  }
  return { stones, pounds };
}

export function stonesAndPoundsToKg(stones: number, pounds: number): number {
  return lbToKg(stones * LB_PER_STONE + pounds);
}

/** Convert a stored kilogram value into the user's display unit. */
export function kgToDisplay(kg: number, unit: WeightUnit): number {
  return unit === 'kg' ? kg : kgToLb(kg);
}

/** Convert a value the user typed in their display unit back to kilograms. */
export function displayToKg(value: number, unit: WeightUnit): number {
  return unit === 'kg' ? value : lbToKg(value);
}

/** Sensible precision: 0.1 kg / 0.1 lb is the resolution of a bathroom scale. */
export function formatWeight(
  kg: number | null | undefined,
  unit: WeightUnit,
  options: { withUnit?: boolean; decimals?: number } = {},
): string {
  if (kg == null || !Number.isFinite(kg)) return '—';
  const { withUnit = true, decimals = 1 } = options;

  if (unit === 'st') {
    const { stones, pounds } = kgToStonesAndPounds(kg);
    return withUnit ? `${stones} st ${pounds.toFixed(1)} lb` : `${stones}:${pounds.toFixed(1)}`;
  }

  const value = kgToDisplay(kg, unit);
  const text = value.toFixed(decimals);
  return withUnit ? `${text} ${WEIGHT_UNIT_SUFFIX[unit]}` : text;
}

/** A signed delta, e.g. `'+0.4 kg'` / `'−1.2 lb'`. Uses a real minus sign. */
export function formatWeightDelta(deltaKg: number, unit: WeightUnit): string {
  const displayDelta = unit === 'kg' ? deltaKg : kgToLb(deltaKg);
  const magnitude = Math.abs(displayDelta).toFixed(1);
  const suffix = unit === 'st' ? 'lb' : WEIGHT_UNIT_SUFFIX[unit];
  if (Math.abs(displayDelta) < 0.05) return `0.0 ${suffix}`;
  return `${displayDelta > 0 ? '+' : '−'}${magnitude} ${suffix}`;
}

/**
 * Step size for a weight input, in the display unit. Smaller in kilograms
 * because a kilogram is a coarser increment than a pound.
 */
export function weightInputStep(unit: WeightUnit): number {
  return unit === 'kg' ? 0.1 : 0.2;
}
