import { clamp } from '@/lib/utils';

export interface QuantitativeGoal {
  start_value: number | null;
  target_value: number | null;
  current_value: number | null;
}

/**
 * Progress toward a numeric target, 0–1.
 *
 * Works in both directions: a goal to *lose* 6 kg and a goal to *read* 24 books
 * both start at 0 and reach 1 at the target, because progress is measured
 * relative to where the user started rather than relative to zero.
 *
 * Returns null when the goal has no numeric target, or when start and target
 * are the same value and the ratio would be meaningless.
 */
export function goalProgress(goal: QuantitativeGoal): number | null {
  const { start_value: start, target_value: target, current_value: current } = goal;
  if (target == null || current == null) return null;

  const from = start ?? 0;
  const span = target - from;
  if (span === 0) return current === target ? 1 : null;

  return clamp((current - from) / span, 0, 1);
}

/** Whether the numbers say this goal has been reached, regardless of status. */
export function hasReachedTarget(goal: QuantitativeGoal): boolean {
  const { start_value: start, target_value: target, current_value: current } = goal;
  if (target == null || current == null) return false;

  const from = start ?? 0;
  return target >= from ? current >= target : current <= target;
}
