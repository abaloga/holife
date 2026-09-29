import { addDaysToKey, dayOfWeek, type DateKey } from '@/lib/date';
import type { HabitFrequency } from '@/types/database';

export interface ScheduledHabit {
  frequency: HabitFrequency;
  days_of_week: number[];
  /** The habit cannot have been due before it existed. */
  startDate: DateKey;
}

/** Is this habit due on this calendar day? */
export function isScheduledOn(habit: ScheduledHabit, date: DateKey): boolean {
  if (date < habit.startDate) return false;
  if (habit.frequency === 'daily') return true;
  return habit.days_of_week.includes(dayOfWeek(date));
}

/**
 * Consecutive scheduled days completed, counting back from today.
 *
 * Today is excluded while it is still incomplete: an unfinished day is not a
 * missed day, and showing a streak collapse at 9am would be both wrong and
 * unpleasant. Unscheduled days are skipped rather than breaking the run.
 */
export function currentStreak(
  habit: ScheduledHabit,
  completedDates: ReadonlySet<DateKey>,
  today: DateKey,
  maxLookbackDays = 730,
): number {
  let cursor = today;

  if (isScheduledOn(habit, today) && !completedDates.has(today)) {
    cursor = addDaysToKey(today, -1);
  }

  let streak = 0;
  for (let step = 0; step < maxLookbackDays; step += 1) {
    if (cursor < habit.startDate) break;

    if (isScheduledOn(habit, cursor)) {
      if (!completedDates.has(cursor)) break;
      streak += 1;
    }

    cursor = addDaysToKey(cursor, -1);
  }

  return streak;
}

/** The longest run of scheduled days ever completed, within the window given. */
export function longestStreak(
  habit: ScheduledHabit,
  completedDates: ReadonlySet<DateKey>,
  from: DateKey,
  to: DateKey,
): number {
  let best = 0;
  let run = 0;
  let cursor = from < habit.startDate ? habit.startDate : from;

  while (cursor <= to) {
    if (isScheduledOn(habit, cursor)) {
      if (completedDates.has(cursor)) {
        run += 1;
        if (run > best) best = run;
      } else {
        run = 0;
      }
    }
    cursor = addDaysToKey(cursor, 1);
  }

  return best;
}

export interface CompletionStats {
  /** Scheduled days in the window, excluding today if it is still open. */
  scheduled: number;
  completed: number;
  /** 0–1, or null when nothing was scheduled in the window. */
  rate: number | null;
}

/**
 * Completion over a window. Today is only counted once it has been completed,
 * so the rate never dips simply because the day has not finished yet.
 */
export function completionStats(
  habit: ScheduledHabit,
  completedDates: ReadonlySet<DateKey>,
  from: DateKey,
  to: DateKey,
  today: DateKey,
): CompletionStats {
  let scheduled = 0;
  let completed = 0;
  let cursor = from < habit.startDate ? habit.startDate : from;

  while (cursor <= to) {
    if (isScheduledOn(habit, cursor)) {
      const isOpenToday = cursor === today && !completedDates.has(cursor);
      if (!isOpenToday) {
        scheduled += 1;
        if (completedDates.has(cursor)) completed += 1;
      }
    }
    cursor = addDaysToKey(cursor, 1);
  }

  return { scheduled, completed, rate: scheduled === 0 ? null : completed / scheduled };
}

/** Groups raw completion rows by habit, for fast per-day lookups. */
export function groupCompletionsByHabit(
  completions: { habit_id: string; local_date: DateKey }[],
): Map<string, Set<DateKey>> {
  const map = new Map<string, Set<DateKey>>();
  for (const completion of completions) {
    const set = map.get(completion.habit_id) ?? new Set<DateKey>();
    set.add(completion.local_date);
    map.set(completion.habit_id, set);
  }
  return map;
}

export interface DailyCompletion {
  date: DateKey;
  /** Active habits scheduled on this day. */
  scheduled: number;
  completed: number;
  /** 0–1, or null when nothing was scheduled that day. */
  rate: number | null;
}

/**
 * One point per day in `[from, to]`: how many scheduled habits were completed
 * that day, aggregated across every active habit. Used by the Today chart
 * widget, where the question is "was I consistent", not any one habit's streak.
 */
export function dailyCompletionSeries(
  habits: (ScheduledHabit & { id: string; isActive: boolean })[],
  completedDatesByHabit: ReadonlyMap<string, ReadonlySet<DateKey>>,
  from: DateKey,
  to: DateKey,
): DailyCompletion[] {
  const points: DailyCompletion[] = [];
  let cursor = from;

  while (cursor <= to) {
    let scheduled = 0;
    let completed = 0;

    for (const habit of habits) {
      if (!habit.isActive || !isScheduledOn(habit, cursor)) continue;
      scheduled += 1;
      if (completedDatesByHabit.get(habit.id)?.has(cursor)) completed += 1;
    }

    points.push({ date: cursor, scheduled, completed, rate: scheduled === 0 ? null : completed / scheduled });
    cursor = addDaysToKey(cursor, 1);
  }

  return points;
}

/** Human description of a habit's schedule: "Every day", "Mon, Wed, Fri". */
export function describeSchedule(
  habit: Pick<ScheduledHabit, 'frequency' | 'days_of_week'>,
  dayNames: readonly string[],
): string {
  if (habit.frequency === 'daily') return 'Every day';

  const days = [...habit.days_of_week].sort((a, b) => a - b);
  if (days.length === 0) return 'No days selected';
  if (days.length === 7) return 'Every day';

  const isWeekdays = days.length === 5 && days.every((day) => day >= 1 && day <= 5);
  if (isWeekdays) return 'Weekdays';

  const isWeekends = days.length === 2 && days.includes(0) && days.includes(6);
  if (isWeekends) return 'Weekends';

  return days.map((day) => dayNames[day]).join(', ');
}
