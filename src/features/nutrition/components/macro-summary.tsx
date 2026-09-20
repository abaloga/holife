import { cn } from '@/lib/utils';
import { ProgressBar, ProgressRing } from '@/components/ui/progress';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { formatGrams, formatNumber } from '@/lib/format';
import { MACRO_BG, MACRO_COLOR, MACRO_LABEL, MACRO_ONLY_KEYS, MACRO_UNIT } from '@/lib/chart';
import type { MacroProgress } from '../calculations';

interface MacroSummaryProps {
  progress: MacroProgress[];
  /** `compact` is the Today variant; `default` heads the nutrition screen. */
  size?: 'compact' | 'default';
  className?: string;
}

/**
 * Calories as a ring, macros as bars.
 *
 * Every mark carries its own number: the gold used for fat sits below 3:1
 * against a white surface, so colour alone is never the only way to read a
 * value here.
 */
export function MacroSummary({ progress, size = 'default', className }: MacroSummaryProps) {
  const byKey = Object.fromEntries(progress.map((item) => [item.key, item])) as Record<
    MacroProgress['key'],
    MacroProgress
  >;
  const calories = byKey.calories;
  const compact = size === 'compact';
  const ringSize = compact ? 92 : 112;

  const remaining = calories.remaining;
  const over = remaining < 0;

  return (
    <div className={cn('flex items-center gap-5', className)}>
      <ProgressRing
        value={calories.value}
        max={calories.target}
        size={ringSize}
        strokeWidth={compact ? 8 : 10}
        color={MACRO_COLOR.calories}
        label={`Calories: ${formatNumber(calories.value)} of ${formatNumber(calories.target)}`}
      >
        <div className="text-center leading-none">
          <AnimatedNumber
            value={Math.abs(remaining)}
            format={(value) => formatNumber(Math.round(value))}
            className={cn('block font-semibold tracking-tight', compact ? 'text-xl' : 'text-2xl')}
          />
          <span className="mt-1 block text-[0.625rem] font-medium uppercase tracking-[0.07em] text-muted-foreground">
            {over ? 'over' : 'left'}
          </span>
        </div>
      </ProgressRing>

      <dl className="min-w-0 flex-1 space-y-2.5">
        <div>
          <div className="flex items-baseline justify-between gap-2">
            <dt className="text-[0.8125rem] font-medium">Calories</dt>
            <dd className="tnum text-[0.8125rem] text-muted-foreground">
              <span className="font-semibold text-foreground">
                {formatNumber(Math.round(calories.value))}
              </span>
              {' / '}
              {formatNumber(calories.target)}
            </dd>
          </div>
        </div>

        {MACRO_ONLY_KEYS.map((key) => {
          const macro = byKey[key];
          return (
            <div key={key}>
              <div className="flex items-baseline justify-between gap-2">
                <dt className="text-[0.8125rem] font-medium">{MACRO_LABEL[key]}</dt>
                <dd className="tnum text-[0.8125rem] text-muted-foreground">
                  <span className="font-semibold text-foreground">{formatGrams(macro.value)}</span>
                  {' / '}
                  {formatGrams(macro.target)} {MACRO_UNIT[key]}
                </dd>
              </div>
              <ProgressBar
                value={macro.value}
                max={macro.target}
                size="sm"
                className="mt-1.5"
                indicatorClassName={MACRO_BG[key]}
                label={`${MACRO_LABEL[key]}: ${formatGrams(macro.value)} of ${formatGrams(macro.target)} grams`}
              />
            </div>
          );
        })}
      </dl>
    </div>
  );
}
