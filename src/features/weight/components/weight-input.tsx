import { NumberField } from '@/components/ui/number-field';
import { WEIGHT_UNIT_SUFFIX, weightInputStep } from '@/lib/units';
import type { WeightUnit } from '@/types/database';

interface WeightInputProps {
  unit: WeightUnit;
  /** Value in the display unit (stones, when the unit is `st`). */
  value: number | null;
  onValueChange: (value: number | null) => void;
  /** Only used when the unit is `st`. */
  pounds: number | null;
  onPoundsChange: (value: number | null) => void;
  autoFocus?: boolean;
}

/**
 * Weight entry in whichever unit the user thinks in. The form holds display
 * units and converts once on submit, so repeatedly editing a value can't drift
 * through round-tripping to kilograms.
 */
export function WeightInput({
  unit,
  value,
  onValueChange,
  pounds,
  onPoundsChange,
  autoFocus,
}: WeightInputProps) {
  if (unit === 'st') {
    return (
      <div className="flex items-start gap-2">
        <NumberField
          value={value}
          onValueChange={onValueChange}
          suffix="st"
          step={1}
          decimals={0}
          min={0}
          max={78}
          emphasis
          autoFocus={autoFocus}
          aria-label="Stones"
        />
        <NumberField
          value={pounds}
          onValueChange={onPoundsChange}
          suffix="lb"
          step={1}
          decimals={1}
          min={0}
          max={13.9}
          emphasis
          aria-label="Pounds"
        />
      </div>
    );
  }

  return (
    <NumberField
      value={value}
      onValueChange={onValueChange}
      suffix={WEIGHT_UNIT_SUFFIX[unit]}
      step={weightInputStep(unit)}
      decimals={1}
      min={unit === 'kg' ? 20 : 44}
      max={unit === 'kg' ? 500 : 1102}
      steppers
      emphasis
      autoFocus={autoFocus}
      aria-label="Weight"
    />
  );
}
