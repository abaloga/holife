import { CalendarDays, Check, Minus, Plus } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { cn, round } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { ProgressBar } from '@/components/ui/progress';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { formatNumber, formatPercent } from '@/lib/format';
import { relativeDayDistance, type DateKey } from '@/lib/date';
import { transitions } from '@/lib/motion';
import { goalProgress, hasReachedTarget } from '../calculations';
import type { Goal } from '../api';

interface GoalCardProps {
  goal: Goal;
  today: DateKey;
  onSelect: () => void;
  onAdjust?: (value: number) => void;
  onMarkAchieved?: () => void;
}

export function GoalCard({ goal, today, onSelect, onAdjust, onMarkAchieved }: GoalCardProps) {
  const reduceMotion = useReducedMotion();
  const progress = goalProgress(goal);
  const reached = hasReachedTarget(goal);
  const quantitative = goal.target_value != null && goal.current_value != null;

  // A sensible nudge: 1 for small counts, otherwise 1% of the span.
  const step = quantitative
    ? Math.max(
        1,
        round(Math.abs((goal.target_value ?? 0) - (goal.start_value ?? 0)) / 100, 0) || 1,
      )
    : 1;

  const overdue =
    goal.status === 'active' && goal.target_date != null && goal.target_date < today;

  return (
    <div
      className={cn(
        'rounded-xl border bg-card p-4 shadow-card transition-colors duration-200',
        reached && goal.status === 'active' ? 'border-accent/40' : 'border-border',
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        className="w-full text-left transition-opacity active:opacity-70"
      >
        <div className="flex items-start justify-between gap-3">
          <h3 className="min-w-0 flex-1 text-[0.9375rem] font-medium leading-snug">
            {goal.title}
          </h3>
          {goal.status === 'achieved' && (
            <Badge variant="accent">
              <Check aria-hidden />
              Achieved
            </Badge>
          )}
          {goal.status === 'paused' && <Badge>Paused</Badge>}
        </div>

        {goal.description && (
          <p className="mt-1 line-clamp-2 text-[0.8125rem] leading-relaxed text-muted-foreground">
            {goal.description}
          </p>
        )}

        {quantitative && progress != null && (
          <div className="mt-3">
            <div className="flex items-baseline justify-between gap-2">
              <p className="tnum text-[0.9375rem] font-semibold">
                <AnimatedNumber
                  value={goal.current_value ?? 0}
                  format={(value) => formatNumber(value, Number.isInteger(goal.target_value) ? 0 : 1)}
                />
                <span className="font-normal text-muted-foreground">
                  {' / '}
                  {formatNumber(goal.target_value ?? 0, Number.isInteger(goal.target_value) ? 0 : 1)}
                  {goal.unit ? ` ${goal.unit}` : ''}
                </span>
              </p>
              <span className="tnum text-xs text-muted-foreground">{formatPercent(progress)}</span>
            </div>
            <ProgressBar
              value={progress}
              max={1}
              className="mt-2"
              showOverflow={false}
              label={`${goal.title}: ${formatPercent(progress)} complete`}
            />
          </div>
        )}

        {goal.target_date && (
          <p
            className={cn(
              'mt-2.5 flex items-center gap-1.5 text-xs',
              overdue ? 'text-destructive' : 'text-muted-foreground',
            )}
          >
            <CalendarDays className="size-3.5" aria-hidden />
            {overdue ? 'Target date passed' : `Target ${relativeDayDistance(goal.target_date, today)}`}
          </p>
        )}
      </button>

      {goal.status === 'active' && (quantitative || reached) && (
        <div className="mt-3 flex items-center gap-2 border-t border-border pt-3">
          {quantitative && onAdjust && (
            <>
              <AdjustButton
                label={`Decrease ${goal.title} by ${step}`}
                onClick={() => onAdjust((goal.current_value ?? 0) - step)}
              >
                <Minus className="size-3.5" aria-hidden />
              </AdjustButton>
              <AdjustButton
                label={`Increase ${goal.title} by ${step}`}
                onClick={() => onAdjust((goal.current_value ?? 0) + step)}
              >
                <Plus className="size-3.5" aria-hidden />
              </AdjustButton>
            </>
          )}

          {reached && onMarkAchieved && (
            <motion.button
              type="button"
              onClick={onMarkAchieved}
              initial={reduceMotion ? false : { opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              transition={transitions.soft}
              className={cn(
                'ml-auto inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5',
                'text-[0.8125rem] font-medium text-accent-foreground',
                'transition-transform active:scale-95',
              )}
            >
              <Check className="size-3.5" aria-hidden />
              Mark achieved
            </motion.button>
          )}
        </div>
      )}
    </div>
  );
}

function AdjustButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="grid size-8 place-items-center rounded-lg border border-input bg-card text-muted-foreground transition-colors hover:bg-subtle hover:text-foreground active:scale-90"
    >
      {children}
    </button>
  );
}
