import { describe, expect, it } from 'vitest';
import {
  estimateResponseSchema,
  isAcceptedImageType,
  macroEstimateSchema,
} from './estimate-schema';

const valid = {
  mealName: 'Scrambled eggs on sourdough',
  calories: 620,
  proteinGrams: 28,
  carbohydrateGrams: 52,
  fatGrams: 34,
  confidence: 'medium' as const,
  assumptions: ['Assumed two large eggs', 'Assumed one teaspoon of butter'],
};

describe('macroEstimateSchema', () => {
  it('accepts a well-formed estimate', () => {
    const result = macroEstimateSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('defaults assumptions to an empty array when omitted', () => {
    const { assumptions: _assumptions, ...withoutAssumptions } = valid;
    const result = macroEstimateSchema.parse(withoutAssumptions);
    expect(result.assumptions).toEqual([]);
  });

  it('rejects negative macros', () => {
    expect(macroEstimateSchema.safeParse({ ...valid, proteinGrams: -1 }).success).toBe(false);
  });

  it('rejects absurd values that would corrupt a day’s totals', () => {
    expect(macroEstimateSchema.safeParse({ ...valid, calories: 999_999 }).success).toBe(false);
    expect(macroEstimateSchema.safeParse({ ...valid, fatGrams: 5000 }).success).toBe(false);
  });

  it('rejects a confidence value outside the allowed set', () => {
    expect(macroEstimateSchema.safeParse({ ...valid, confidence: 'certain' }).success).toBe(false);
  });

  it('rejects strings where numbers are required, rather than coercing them', () => {
    expect(macroEstimateSchema.safeParse({ ...valid, calories: '620' }).success).toBe(false);
  });

  it('rejects NaN and Infinity', () => {
    expect(macroEstimateSchema.safeParse({ ...valid, calories: Number.NaN }).success).toBe(false);
    expect(macroEstimateSchema.safeParse({ ...valid, calories: Infinity }).success).toBe(false);
  });

  it('rejects an empty meal name', () => {
    expect(macroEstimateSchema.safeParse({ ...valid, mealName: '   ' }).success).toBe(false);
  });

  it('caps the number of assumptions', () => {
    const tooMany = { ...valid, assumptions: Array.from({ length: 20 }, (_, i) => `a${i}`) };
    expect(macroEstimateSchema.safeParse(tooMany).success).toBe(false);
  });

  it('accepts an optional component breakdown', () => {
    const result = macroEstimateSchema.safeParse({
      ...valid,
      components: [{ name: 'Sourdough', portion: '2 slices', calories: 220 }],
    });
    expect(result.success).toBe(true);
  });
});

describe('estimateResponseSchema', () => {
  it('requires the model that produced the estimate', () => {
    expect(estimateResponseSchema.safeParse({ estimate: valid }).success).toBe(false);
    expect(
      estimateResponseSchema.safeParse({ estimate: valid, model: 'gpt-5.6-luna' }).success,
    ).toBe(true);
  });

  it('rejects a response whose estimate is malformed', () => {
    const result = estimateResponseSchema.safeParse({
      estimate: { ...valid, proteinGrams: 'lots' },
      model: 'gpt-5.6-luna',
    });
    expect(result.success).toBe(false);
  });
});

describe('isAcceptedImageType', () => {
  it('accepts the formats a phone camera produces', () => {
    expect(isAcceptedImageType('image/jpeg')).toBe(true);
    expect(isAcceptedImageType('image/heic')).toBe(true);
  });

  it('rejects anything else', () => {
    expect(isAcceptedImageType('image/gif')).toBe(false);
    expect(isAcceptedImageType('application/pdf')).toBe(false);
    expect(isAcceptedImageType('')).toBe(false);
  });
});
