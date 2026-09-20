import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Clamp a number into an inclusive range. */
export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

/** Round to a fixed number of decimal places without float drift artefacts. */
export function round(value: number, decimals = 0) {
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

/** `0` when the denominator is 0, so progress maths never yields NaN/Infinity. */
export function safeRatio(numerator: number, denominator: number) {
  if (!denominator || !Number.isFinite(denominator)) return 0;
  const ratio = numerator / denominator;
  return Number.isFinite(ratio) ? ratio : 0;
}
