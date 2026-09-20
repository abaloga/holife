import { describe, expect, it } from 'vitest';
import { goalProgress, hasReachedTarget } from './calculations';

describe('goalProgress', () => {
  it('is null without a numeric target', () => {
    expect(goalProgress({ start_value: null, target_value: null, current_value: null })).toBeNull();
    expect(goalProgress({ start_value: 0, target_value: null, current_value: 5 })).toBeNull();
  });

  it('measures an increasing goal from its starting point', () => {
    expect(goalProgress({ start_value: 0, target_value: 24, current_value: 6 })).toBeCloseTo(
      0.25,
      5,
    );
  });

  it('measures a decreasing goal just as well', () => {
    // Losing weight from 90 kg to 80 kg, currently 85 kg, so halfway.
    expect(goalProgress({ start_value: 90, target_value: 80, current_value: 85 })).toBeCloseTo(
      0.5,
      5,
    );
  });

  it('does not treat a non-zero start as progress already made', () => {
    // Starting at 10 books and aiming for 20, having read none of them yet.
    expect(goalProgress({ start_value: 10, target_value: 20, current_value: 10 })).toBe(0);
  });

  it('clamps outside the range instead of reporting 140%', () => {
    expect(goalProgress({ start_value: 0, target_value: 10, current_value: 14 })).toBe(1);
    expect(goalProgress({ start_value: 0, target_value: 10, current_value: -3 })).toBe(0);
  });

  it('handles a zero-width goal without dividing by zero', () => {
    expect(goalProgress({ start_value: 5, target_value: 5, current_value: 5 })).toBe(1);
    expect(goalProgress({ start_value: 5, target_value: 5, current_value: 4 })).toBeNull();
  });

  it('treats a missing start as zero', () => {
    expect(goalProgress({ start_value: null, target_value: 50, current_value: 25 })).toBeCloseTo(
      0.5,
      5,
    );
  });
});

describe('hasReachedTarget', () => {
  it('is true once an increasing goal meets its target', () => {
    expect(hasReachedTarget({ start_value: 0, target_value: 10, current_value: 10 })).toBe(true);
    expect(hasReachedTarget({ start_value: 0, target_value: 10, current_value: 11 })).toBe(true);
    expect(hasReachedTarget({ start_value: 0, target_value: 10, current_value: 9 })).toBe(false);
  });

  it('is true once a decreasing goal meets its target', () => {
    expect(hasReachedTarget({ start_value: 90, target_value: 80, current_value: 80 })).toBe(true);
    expect(hasReachedTarget({ start_value: 90, target_value: 80, current_value: 79 })).toBe(true);
    expect(hasReachedTarget({ start_value: 90, target_value: 80, current_value: 81 })).toBe(false);
  });

  it('is false for a goal with no numbers', () => {
    expect(hasReachedTarget({ start_value: null, target_value: null, current_value: null })).toBe(
      false,
    );
  });
});
