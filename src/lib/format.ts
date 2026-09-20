import { round } from './utils';

/** Whole numbers with thousands separators: calories, steps, counts. */
export function formatNumber(value: number | null | undefined, decimals = 0): string {
  if (value == null || !Number.isFinite(value)) return '-';
  return new Intl.NumberFormat(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/** Macro grams: no decimals above 10 g, one below, so small values stay useful. */
export function formatGrams(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '-';
  return value >= 10 || value === 0 ? formatNumber(round(value)) : formatNumber(value, 1);
}

export function formatPercent(ratio: number, decimals = 0): string {
  if (!Number.isFinite(ratio)) return '-';
  return `${round(ratio * 100, decimals)}%`;
}

/** First grapheme-ish character of each of the first two words, for avatars. */
export function initials(name: string | null | undefined): string {
  if (!name) return '';
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((part) => [...part][0] ?? '').join('').toUpperCase();
}
