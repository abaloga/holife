import { describe, expect, it } from 'vitest';
import {
  displayToKg,
  formatWeight,
  formatWeightDelta,
  kgToDisplay,
  kgToLb,
  kgToStonesAndPounds,
  lbToKg,
  stonesAndPoundsToKg,
} from './units';

describe('weight conversion', () => {
  it('converts kilograms to pounds', () => {
    expect(kgToLb(100)).toBeCloseTo(220.462, 3);
    expect(lbToKg(220.462)).toBeCloseTo(100, 3);
  });

  it('round-trips without drift', () => {
    for (const kg of [45.3, 68, 82.45, 120.9]) {
      expect(lbToKg(kgToLb(kg))).toBeCloseTo(kg, 9);
      expect(displayToKg(kgToDisplay(kg, 'lb'), 'lb')).toBeCloseTo(kg, 9);
    }
  });

  it('leaves kilograms alone', () => {
    expect(kgToDisplay(82.4, 'kg')).toBe(82.4);
    expect(displayToKg(82.4, 'kg')).toBe(82.4);
  });

  it('splits kilograms into stones and pounds', () => {
    const { stones, pounds } = kgToStonesAndPounds(82.4);
    expect(stones).toBe(12);
    expect(pounds).toBeCloseTo(13.7, 1);
    expect(stonesAndPoundsToKg(stones, pounds)).toBeCloseTo(82.4, 1);
  });

  it('rolls 14 pounds over into the next stone rather than showing "13 st 14 lb"', () => {
    // 88.885 kg is 195.96 lb, so 13 st 13.96 lb, and 13.96 rounds to 14.0.
    const { stones, pounds } = kgToStonesAndPounds(88.885);
    expect(pounds).toBeLessThan(14);
    expect(stones).toBe(14);
    expect(pounds).toBe(0);
  });
});

describe('formatWeight', () => {
  it('formats each unit with its suffix', () => {
    expect(formatWeight(82.44, 'kg')).toBe('82.4 kg');
    expect(formatWeight(82.44, 'lb')).toBe('181.7 lb');
    expect(formatWeight(82.4, 'st')).toBe('12 st 13.7 lb');
  });

  it('omits the suffix on request', () => {
    expect(formatWeight(82.44, 'kg', { withUnit: false })).toBe('82.4');
  });

  it('renders an em dash for missing data rather than NaN', () => {
    expect(formatWeight(null, 'kg')).toBe('-');
    expect(formatWeight(undefined, 'kg')).toBe('-');
    expect(formatWeight(Number.NaN, 'kg')).toBe('-');
  });
});

describe('formatWeightDelta', () => {
  it('signs the change and uses a real minus sign', () => {
    expect(formatWeightDelta(0.4, 'kg')).toBe('+0.4 kg');
    expect(formatWeightDelta(-1.2, 'kg')).toBe('−1.2 kg');
  });

  it('treats a negligible change as flat', () => {
    expect(formatWeightDelta(0.01, 'kg')).toBe('0.0 kg');
    expect(formatWeightDelta(-0.02, 'kg')).toBe('0.0 kg');
  });

  it('reports stone users their change in pounds, which is the useful unit', () => {
    expect(formatWeightDelta(-0.5, 'st')).toMatch(/lb$/);
  });

  it('converts the delta into the display unit', () => {
    expect(formatWeightDelta(-1, 'lb')).toBe('−2.2 lb');
  });
});
