import { TZDate } from '@date-fns/tz';
import { format as formatDate } from 'date-fns';

/**
 * Date handling in HoLife.
 *
 * Two representations, and only two:
 *
 *  1. An **instant** — a `Date` / ISO string. This is the real moment something
 *     happened and is what `timestamptz` columns store.
 *  2. A **date key** — `'yyyy-MM-dd'`. This is the calendar day the user means
 *     when they say "today", evaluated in *their* timezone. It is what `date`
 *     columns store.
 *
 * Every conversion between the two goes through this module. Nothing anywhere
 * else in the app may slice an ISO string to get a date, because
 * `'2026-01-01T00:30:00Z'.slice(0, 10)` is the wrong day for most of the world.
 */

/** A calendar day in the user's timezone, formatted `yyyy-MM-dd`. */
export type DateKey = string;

const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^(\d{2}):(\d{2})(?::\d{2})?$/;

export const DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

export const DAY_NAMES_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
export const DAY_INITIALS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'] as const;

/* -------------------------------------------------------------------------- */
/* Timezones                                                                   */
/* -------------------------------------------------------------------------- */

export function isValidTimezone(timezone: string): boolean {
  if (!timezone) return false;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}

export function systemTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

/** Falls back to the device timezone, then UTC, so this never throws. */
export function resolveTimezone(timezone: string | null | undefined): string {
  if (timezone && isValidTimezone(timezone)) return timezone;
  return systemTimezone();
}

/* -------------------------------------------------------------------------- */
/* Date keys                                                                   */
/* -------------------------------------------------------------------------- */

export function isDateKey(value: string): boolean {
  if (!DATE_KEY_PATTERN.test(value)) return false;
  const { year, month, day } = splitDateKey(value);
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;
  const probe = new Date(Date.UTC(year, month - 1, day));
  return probe.getUTCFullYear() === year && probe.getUTCMonth() === month - 1 && probe.getUTCDate() === day;
}

function splitDateKey(key: DateKey) {
  return {
    year: Number(key.slice(0, 4)),
    month: Number(key.slice(5, 7)),
    day: Number(key.slice(8, 10)),
  };
}

export function parseDateKey(key: DateKey) {
  if (!isDateKey(key)) throw new RangeError(`Invalid date key: ${key}`);
  return splitDateKey(key);
}

/**
 * A date key as a `Date` pinned to UTC midnight. Useful for weekday maths and
 * formatting, where only the calendar fields matter and both sides are UTC.
 */
export function dateKeyToUtcDate(key: DateKey): Date {
  const { year, month, day } = parseDateKey(key);
  return new Date(Date.UTC(year, month - 1, day));
}

export function utcDateToDateKey(date: Date): DateKey {
  return formatDate(new TZDate(date, 'UTC'), 'yyyy-MM-dd');
}

/** The calendar day an instant falls on, in the given timezone. */
export function toDateKey(instant: Date | string, timezone: string): DateKey {
  const date = typeof instant === 'string' ? new Date(instant) : instant;
  return formatDate(new TZDate(date, timezone), 'yyyy-MM-dd');
}

export function todayKey(timezone: string): DateKey {
  return toDateKey(new Date(), timezone);
}

export function addDaysToKey(key: DateKey, days: number): DateKey {
  const date = dateKeyToUtcDate(key);
  date.setUTCDate(date.getUTCDate() + days);
  return utcDateToDateKey(date);
}

/** Whole calendar days from `from` to `to`. Negative when `to` is earlier. */
export function daysBetweenKeys(from: DateKey, to: DateKey): number {
  const ms = dateKeyToUtcDate(to).getTime() - dateKeyToUtcDate(from).getTime();
  return Math.round(ms / 86_400_000);
}

/** 0 = Sunday .. 6 = Saturday. A calendar date's weekday is timezone-free. */
export function dayOfWeek(key: DateKey): number {
  return dateKeyToUtcDate(key).getUTCDay();
}

export function startOfWeekKey(key: DateKey, weekStartDay: number): DateKey {
  const offset = (dayOfWeek(key) - weekStartDay + 7) % 7;
  return addDaysToKey(key, -offset);
}

/** Inclusive list of date keys. Returns `[]` if `end` precedes `start`. */
export function dateKeyRange(start: DateKey, end: DateKey): DateKey[] {
  const span = daysBetweenKeys(start, end);
  if (span < 0) return [];
  const keys: DateKey[] = [];
  for (let i = 0; i <= span; i += 1) keys.push(addDaysToKey(start, i));
  return keys;
}

/** The last `count` date keys ending at (and including) `end`. */
export function lastNDays(end: DateKey, count: number): DateKey[] {
  return dateKeyRange(addDaysToKey(end, -(count - 1)), end);
}

/* -------------------------------------------------------------------------- */
/* Instants                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Turn a calendar day + wall-clock time in the user's timezone into a real
 * instant. Pass `time` as `'HH:mm'`; omit it to use the current time of day,
 * which is what back-dating an entry should do.
 */
export function zonedDateTimeToInstant(
  key: DateKey,
  time: string | null | undefined,
  timezone: string,
): Date {
  const { year, month, day } = parseDateKey(key);
  let hours: number;
  let minutes: number;

  const match = time ? TIME_PATTERN.exec(time) : null;
  if (match) {
    hours = Number(match[1]);
    minutes = Number(match[2]);
  } else {
    const now = new TZDate(new Date(), timezone);
    hours = now.getHours();
    minutes = now.getMinutes();
  }

  return new Date(new TZDate(year, month - 1, day, hours, minutes, 0, 0, timezone).getTime());
}

/** UTC instant of local midnight opening `key`. */
export function startOfDayInstant(key: DateKey, timezone: string): Date {
  return zonedDateTimeToInstant(key, '00:00', timezone);
}

/** UTC instant of local midnight opening the *next* day — an exclusive bound. */
export function endOfDayInstant(key: DateKey, timezone: string): Date {
  return startOfDayInstant(addDaysToKey(key, 1), timezone);
}

/** Wall-clock `'HH:mm'` of an instant, in the given timezone. */
export function timeInTimezone(instant: Date | string, timezone: string): string {
  const date = typeof instant === 'string' ? new Date(instant) : instant;
  return formatDate(new TZDate(date, timezone), 'HH:mm');
}

/* -------------------------------------------------------------------------- */
/* Formatting                                                                  */
/* -------------------------------------------------------------------------- */

/** Format a date key. Formatting happens in UTC so no day can shift. */
export function formatDateKey(key: DateKey, pattern: string): string {
  return formatDate(new TZDate(dateKeyToUtcDate(key), 'UTC'), pattern);
}

/** Format an instant in the user's timezone. */
export function formatInstant(instant: Date | string, timezone: string, pattern: string): string {
  const date = typeof instant === 'string' ? new Date(instant) : instant;
  return formatDate(new TZDate(date, timezone), pattern);
}

/** `'Today' | 'Tomorrow' | 'Yesterday' | 'Fri 3 Oct' | 'Fri 3 Oct 2025'`. */
export function relativeDayLabel(key: DateKey, today: DateKey): string {
  const delta = daysBetweenKeys(today, key);
  if (delta === 0) return 'Today';
  if (delta === 1) return 'Tomorrow';
  if (delta === -1) return 'Yesterday';
  if (delta > 1 && delta < 7) return formatDateKey(key, 'EEEE');
  const sameYear = key.slice(0, 4) === today.slice(0, 4);
  return formatDateKey(key, sameYear ? 'EEE d MMM' : 'EEE d MMM yyyy');
}

/** `'3 days ago' | 'in 2 weeks'` — for target dates and last-logged copy. */
export function relativeDayDistance(key: DateKey, today: DateKey): string {
  const delta = daysBetweenKeys(today, key);
  const magnitude = Math.abs(delta);
  if (magnitude === 0) return 'today';

  const unit = (value: number, singular: string) =>
    `${value} ${singular}${value === 1 ? '' : 's'}`;

  let phrase: string;
  if (magnitude < 7) phrase = unit(magnitude, 'day');
  else if (magnitude < 31) phrase = unit(Math.round(magnitude / 7), 'week');
  else if (magnitude < 365) phrase = unit(Math.round(magnitude / 30.44), 'month');
  else phrase = unit(Math.round((magnitude / 365.25) * 10) / 10, 'year');

  return delta > 0 ? `in ${phrase}` : `${phrase} ago`;
}

/** Day-part greeting based on the user's own clock. */
export function greetingForTime(instant: Date, timezone: string): string {
  const hour = new TZDate(instant, timezone).getHours();
  if (hour < 5) return 'Still up';
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  if (hour < 22) return 'Good evening';
  return 'Good evening';
}
