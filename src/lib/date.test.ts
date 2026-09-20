import { describe, expect, it } from 'vitest';
import {
  addDaysToKey,
  dateKeyRange,
  dayOfWeek,
  daysBetweenKeys,
  endOfDayInstant,
  formatDateKey,
  greetingForTime,
  isDateKey,
  lastNDays,
  relativeDayDistance,
  relativeDayLabel,
  resolveTimezone,
  startOfDayInstant,
  startOfWeekKey,
  timeInTimezone,
  toDateKey,
  zonedDateTimeToInstant,
} from './date';

describe('isDateKey', () => {
  it('accepts real calendar dates', () => {
    expect(isDateKey('2025-06-10')).toBe(true);
    expect(isDateKey('2024-02-29')).toBe(true); // 2024 is a leap year
  });

  it('rejects dates that do not exist', () => {
    expect(isDateKey('2026-02-29')).toBe(false); // 2026 is not
    expect(isDateKey('2025-02-30')).toBe(false);
    expect(isDateKey('2025-13-01')).toBe(false);
    expect(isDateKey('2025-00-10')).toBe(false);
  });

  it('rejects anything that is not yyyy-MM-dd', () => {
    expect(isDateKey('2025-1-1')).toBe(false);
    expect(isDateKey('01/01/2025')).toBe(false);
    expect(isDateKey('')).toBe(false);
  });
});

describe('toDateKey', () => {
  it('uses the user timezone, not UTC, to decide the day', () => {
    // 23:30 in New York on 2 March is already 04:30 UTC on 3 March.
    const instant = new Date('2025-03-03T04:30:00Z');
    expect(toDateKey(instant, 'America/New_York')).toBe('2025-03-02');
    expect(toDateKey(instant, 'UTC')).toBe('2025-03-03');
  });

  it('puts an early-morning Sydney moment on the right local day', () => {
    // 09:00 Sydney on 5 June is 23:00 UTC on 4 June.
    const instant = new Date('2025-06-04T23:00:00Z');
    expect(toDateKey(instant, 'Australia/Sydney')).toBe('2025-06-05');
    expect(toDateKey(instant, 'UTC')).toBe('2025-06-04');
  });

  it('is not the same as slicing the ISO string', () => {
    const iso = '2025-01-01T00:30:00Z';
    expect(iso.slice(0, 10)).toBe('2025-01-01');
    expect(toDateKey(iso, 'America/Los_Angeles')).toBe('2024-12-31');
  });
});

describe('zonedDateTimeToInstant', () => {
  it('interprets wall-clock time in the given timezone', () => {
    const instant = zonedDateTimeToInstant('2025-07-04', '12:00', 'America/New_York');
    // Midday in New York in July (UTC-4) is 16:00 UTC.
    expect(instant.toISOString()).toBe('2025-07-04T16:00:00.000Z');
  });

  it('handles a zone ahead of UTC', () => {
    const instant = zonedDateTimeToInstant('2025-07-04', '09:00', 'Asia/Tokyo');
    expect(instant.toISOString()).toBe('2025-07-04T00:00:00.000Z');
  });

  it('round-trips through toDateKey', () => {
    const timezone = 'Pacific/Auckland';
    for (const key of ['2025-01-15', '2025-06-15', '2025-09-28']) {
      const instant = zonedDateTimeToInstant(key, '13:00', timezone);
      expect(toDateKey(instant, timezone)).toBe(key);
    }
  });

  it('survives a spring-forward day, where local midnight may not exist', () => {
    // Clocks in Auckland jump from 02:00 to 03:00 on 28 September 2025.
    const instant = startOfDayInstant('2025-09-28', 'Pacific/Auckland');
    expect(toDateKey(instant, 'Pacific/Auckland')).toBe('2025-09-28');
  });
});

describe('day boundaries', () => {
  it('spans exactly 24 hours on an ordinary day', () => {
    const start = startOfDayInstant('2025-05-10', 'Europe/London');
    const end = endOfDayInstant('2025-05-10', 'Europe/London');
    expect(end.getTime() - start.getTime()).toBe(24 * 60 * 60 * 1000);
  });

  it('spans 23 hours on the day clocks go forward', () => {
    // UK clocks go forward on 30 March 2025.
    const start = startOfDayInstant('2025-03-30', 'Europe/London');
    const end = endOfDayInstant('2025-03-30', 'Europe/London');
    expect(end.getTime() - start.getTime()).toBe(23 * 60 * 60 * 1000);
  });

  it('spans 25 hours on the day clocks go back', () => {
    const start = startOfDayInstant('2025-10-26', 'Europe/London');
    const end = endOfDayInstant('2025-10-26', 'Europe/London');
    expect(end.getTime() - start.getTime()).toBe(25 * 60 * 60 * 1000);
  });
});

describe('date key arithmetic', () => {
  it('adds days across a month boundary', () => {
    expect(addDaysToKey('2025-01-31', 1)).toBe('2025-02-01');
    expect(addDaysToKey('2025-03-01', -1)).toBe('2025-02-28');
  });

  it('adds days across a leap day', () => {
    expect(addDaysToKey('2024-02-28', 1)).toBe('2024-02-29');
    expect(addDaysToKey('2024-02-28', 2)).toBe('2024-03-01');
  });

  it('counts whole days between keys, signed', () => {
    expect(daysBetweenKeys('2025-01-01', '2025-01-08')).toBe(7);
    expect(daysBetweenKeys('2025-01-08', '2025-01-01')).toBe(-7);
    expect(daysBetweenKeys('2025-01-01', '2025-01-01')).toBe(0);
  });

  it('counts days across a DST change without drifting', () => {
    // The naive (ms difference / 86400000) approach gives 30.958 here.
    expect(daysBetweenKeys('2025-03-09', '2025-04-09')).toBe(31);
  });

  it('knows the weekday of a calendar date', () => {
    expect(dayOfWeek('2025-01-05')).toBe(0); // Sunday
    expect(dayOfWeek('2025-01-06')).toBe(1); // Monday
    expect(dayOfWeek('2025-01-11')).toBe(6); // Saturday
  });
});

describe('week and ranges', () => {
  it('finds the start of the week for a Monday-first user', () => {
    expect(startOfWeekKey('2025-01-09', 1)).toBe('2025-01-06');
    expect(startOfWeekKey('2025-01-06', 1)).toBe('2025-01-06');
  });

  it('finds the start of the week for a Sunday-first user', () => {
    expect(startOfWeekKey('2025-01-09', 0)).toBe('2025-01-05');
  });

  it('builds an inclusive range', () => {
    expect(dateKeyRange('2025-01-01', '2025-01-04')).toEqual([
      '2025-01-01',
      '2025-01-02',
      '2025-01-03',
      '2025-01-04',
    ]);
  });

  it('returns an empty range when the end precedes the start', () => {
    expect(dateKeyRange('2025-01-04', '2025-01-01')).toEqual([]);
  });

  it('returns the last N days ending today, oldest first', () => {
    const days = lastNDays('2025-01-07', 7);
    expect(days).toHaveLength(7);
    expect(days[0]).toBe('2025-01-01');
    expect(days[6]).toBe('2025-01-07');
  });
});

describe('formatting', () => {
  it('formats a date key without shifting the day', () => {
    expect(formatDateKey('2025-12-25', 'EEE d MMM yyyy')).toBe('Thu 25 Dec 2025');
  });

  it('labels nearby days in words', () => {
    expect(relativeDayLabel('2025-06-10', '2025-06-10')).toBe('Today');
    expect(relativeDayLabel('2025-06-11', '2025-06-10')).toBe('Tomorrow');
    expect(relativeDayLabel('2025-06-09', '2025-06-10')).toBe('Yesterday');
  });

  it('names the weekday within the coming week', () => {
    expect(relativeDayLabel('2025-06-13', '2025-06-10')).toBe('Friday');
  });

  it('falls back to a date once a week out', () => {
    expect(relativeDayLabel('2025-06-20', '2025-06-10')).toBe('Fri 20 Jun');
    expect(relativeDayLabel('2026-06-20', '2025-06-10')).toBe('Sat 20 Jun 2026');
  });

  it('describes distance in sensible units', () => {
    expect(relativeDayDistance('2025-06-10', '2025-06-10')).toBe('today');
    expect(relativeDayDistance('2025-06-13', '2025-06-10')).toBe('in 3 days');
    expect(relativeDayDistance('2025-06-07', '2025-06-10')).toBe('3 days ago');
    expect(relativeDayDistance('2025-06-24', '2025-06-10')).toBe('in 2 weeks');
  });

  it('reads the wall clock in the right zone', () => {
    const instant = new Date('2025-06-04T23:00:00Z');
    expect(timeInTimezone(instant, 'UTC')).toBe('23:00');
    expect(timeInTimezone(instant, 'Australia/Sydney')).toBe('09:00');
  });
});

describe('resolveTimezone', () => {
  it('keeps a valid zone', () => {
    expect(resolveTimezone('Europe/Berlin')).toBe('Europe/Berlin');
  });

  it('falls back when the zone is unknown, missing, or nonsense', () => {
    expect(resolveTimezone('Mars/Olympus_Mons')).not.toBe('Mars/Olympus_Mons');
    expect(resolveTimezone(null)).toBeTruthy();
    expect(resolveTimezone('')).toBeTruthy();
  });
});

describe('greetingForTime', () => {
  it('greets according to the user’s own clock', () => {
    const instant = new Date('2025-06-04T23:00:00Z');
    expect(greetingForTime(instant, 'Australia/Sydney')).toBe('Good morning'); // 09:00
    expect(greetingForTime(instant, 'Europe/London')).toBe('Still up'); // 00:00 BST
  });

  it('handles the small hours', () => {
    const instant = new Date('2025-06-05T02:00:00Z');
    expect(greetingForTime(instant, 'UTC')).toBe('Still up');
  });
});
