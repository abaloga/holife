import * as React from 'react';
import { Minus, Plus } from 'lucide-react';
import { cn, clamp, round } from '@/lib/utils';
import { inputClassName } from './input';

export interface NumberFieldProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'> {
  value: number | null;
  onValueChange: (value: number | null) => void;
  /** Rendered inside the field, right-aligned: `kg`, `g`, `kcal`. */
  suffix?: string;
  step?: number;
  min?: number;
  max?: number;
  decimals?: number;
  /** Adds −/+ buttons. Worth it for values people nudge, like weight. */
  steppers?: boolean;
  /** Renders the value large and tabular, for the primary field in a sheet. */
  emphasis?: boolean;
}

/**
 * A numeric input that behaves on a phone: `inputMode="decimal"` raises the
 * numeric keypad, and the field is a text input so iOS never renders spinners
 * and a scroll gesture can't silently change the value.
 *
 * It keeps its own text buffer so intermediate states like `"82."` or `""` are
 * typeable, and only reports parsed numbers upward.
 */
export const NumberField = React.forwardRef<HTMLInputElement, NumberFieldProps>(
  function NumberField(
    {
      value,
      onValueChange,
      suffix,
      step = 1,
      min,
      max,
      decimals = 2,
      steppers = false,
      emphasis = false,
      className,
      onBlur,
      disabled,
      ...props
    },
    ref,
  ) {
    const [buffer, setBuffer] = React.useState(() => (value == null ? '' : String(value)));
    const [focused, setFocused] = React.useState(false);

    // Track external changes (unit switch, form reset) while not being typed in.
    React.useEffect(() => {
      if (focused) return;
      setBuffer(value == null ? '' : String(value));
    }, [value, focused]);

    const commit = (next: string) => {
      setBuffer(next);
      const normalised = next.replace(',', '.').trim();
      if (normalised === '' || normalised === '-') {
        onValueChange(null);
        return;
      }
      const parsed = Number(normalised);
      if (!Number.isFinite(parsed)) return;
      onValueChange(parsed);
    };

    const nudge = (direction: 1 | -1) => {
      const base = value ?? 0;
      let next = round(base + direction * step, decimals);
      if (min != null || max != null) {
        next = clamp(next, min ?? Number.NEGATIVE_INFINITY, max ?? Number.POSITIVE_INFINITY);
      }
      setBuffer(String(next));
      onValueChange(next);
    };

    const field = (
      <div className="relative flex-1">
        <input
          ref={ref}
          type="text"
          inputMode="decimal"
          enterKeyHint="done"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          disabled={disabled}
          value={buffer}
          onChange={(event) => commit(event.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={(event) => {
            setFocused(false);
            // Normalise on blur so "82." becomes "82" and clamping applies.
            if (value != null) {
              const clamped =
                min != null || max != null
                  ? clamp(value, min ?? Number.NEGATIVE_INFINITY, max ?? Number.POSITIVE_INFINITY)
                  : value;
              const rounded = round(clamped, decimals);
              if (rounded !== value) onValueChange(rounded);
              setBuffer(String(rounded));
            }
            onBlur?.(event);
          }}
          className={cn(
            inputClassName,
            'tnum',
            emphasis && 'h-14 text-2xl font-semibold tracking-tight',
            steppers && 'text-center',
            suffix && (emphasis ? 'pr-12' : 'pr-10'),
            className,
          )}
          {...props}
        />
        {suffix && (
          <span
            aria-hidden
            className={cn(
              'pointer-events-none absolute inset-y-0 right-3 flex items-center',
              'text-sm font-medium text-muted-foreground',
            )}
          >
            {suffix}
          </span>
        )}
      </div>
    );

    if (!steppers) return field;

    return (
      <div className="flex items-stretch gap-2">
        <StepperButton
          label={`Decrease by ${step}`}
          onClick={() => nudge(-1)}
          disabled={disabled}
          large={emphasis}
        >
          <Minus className="size-4" aria-hidden />
        </StepperButton>
        {field}
        <StepperButton
          label={`Increase by ${step}`}
          onClick={() => nudge(1)}
          disabled={disabled}
          large={emphasis}
        >
          <Plus className="size-4" aria-hidden />
        </StepperButton>
      </div>
    );
  },
);

function StepperButton({
  label,
  onClick,
  disabled,
  large,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  large?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'grid shrink-0 place-items-center rounded-lg border border-input bg-card text-foreground',
        'transition-[background-color,transform] duration-150 active:scale-95 hover:bg-subtle',
        'disabled:pointer-events-none disabled:opacity-45',
        large ? 'size-14' : 'size-11',
      )}
    >
      {children}
    </button>
  );
}
