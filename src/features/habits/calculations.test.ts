import { describe, expect, it } from 'vitest';
import {
  completionStats,
  currentStreak,
  describeSchedule,
  isScheduledOn,
  longestStreak,
  type ScheduledHabit,
} from './calculations';
import { DAY_NAMES_SHORT } from '@/lib/date';

const daily: ScheduledHabit = {
  frequency: 'daily',
  days_of_week: [],
  startDate: '2025-01-01',
};

// 2025-01-06 is a Monday.
const weekdays: ScheduledHabit = {
  frequency: 'days_of_week',
  days_of_week: [1, 2, 3, 4, 5],
  startDate: '2025-01-01',
};

describe('isScheduledOn', () => {
  it('schedules a daily habit every day', () => {
    expect(isScheduledOn(daily, '2025-01-04')).toBe(true);
    expect(isScheduledOn(daily, '2025-01-05')).toBe(true);
  });

  it('schedules a weekday habit only on weekdays', () => {
    expect(isScheduledOn(weekdays, '2025-01-06')).toBe(true); // Monday
    expect(isScheduledOn(weekdays, '2025-01-11')).toBe(false); // Saturday
    expect(isScheduledOn(weekdays, '2025-01-12')).toBe(false); // Sunday
  });

  it('is never due before the habit existed', () => {
    expect(isScheduledOn(daily, '2024-12-31')).toBe(false);
  });
});

describe('currentStreak', () => {
  it('is zero with no completions', () => {
    expect(currentStreak(daily, new Set(), '2025-01-10')).toBe(0);
  });

  it('counts consecutive completed days', () => {
    const completed = new Set(['2025-01-08', '2025-01-09', '2025-01-10']);
    expect(currentStreak(daily, completed, '2025-01-10')).toBe(3);
  });

  it('does not break the streak just because today is not done yet', () => {
    const completed = new Set(['2025-01-08', '2025-01-09']);
    // Today (the 10th) is still open — the run of two should stand.
    expect(currentStreak(daily, completed, '2025-01-10')).toBe(2);
  });

  it('breaks on a genuinely missed day', () => {
    const completed = new Set(['2025-01-07', '2025-01-09', '2025-01-10']);
    expect(currentStreak(daily, completed, '2025-01-10')).toBe(2);
  });

  it('skips unscheduled days rather than breaking on them', () => {
    // Fri 10th, Thu 9th completed; the weekend before is simply not due.
    const completed = new Set(['2025-01-09', '2025-01-10', '2025-01-06', '2025-01-07', '2025-01-08']);
    expect(currentStreak(weekdays, completed, '2025-01-10')).toBe(5);
  });

  it('counts a weekday habit across a weekend', () => {
    // Mon 13th open, Fri 10th and Thu 9th done. Sat/Sun are not due.
    const completed = new Set(['2025-01-09', '2025-01-10']);
    expect(currentStreak(weekdays, completed, '2025-01-13')).toBe(2);
  });

  it('stops at the habit start date', () => {
    const recent: ScheduledHabit = { ...daily, startDate: '2025-01-09' };
    const completed = new Set(['2025-01-09', '2025-01-10']);
    expect(currentStreak(recent, completed, '2025-01-10')).toBe(2);
  });
});

describe('longestStreak', () => {
  it('finds the best run in the window', () => {
    const completed = new Set([
      '2025-01-01',
      '2025-01-02',
      '2025-01-03',
      // gap
      '2025-01-06',
      '2025-01-07',
    ]);
    expect(longestStreak(daily, completed, '2025-01-01', '2025-01-07')).toBe(3);
  });

  it('is zero when nothing was completed', () => {
    expect(longestStreak(daily, new Set(), '2025-01-01', '2025-01-07')).toBe(0);
  });
});

describe('completionStats', () => {
  it('counts scheduled and completed days', () => {
    const completed = new Set(['2025-01-01', '2025-01-03']);
    const stats = completionStats(daily, completed, '2025-01-01', '2025-01-05', '2025-01-10');

    expect(stats.scheduled).toBe(5);
    expect(stats.completed).toBe(2);
    expect(stats.rate).toBeCloseTo(0.4, 5);
  });

  it('excludes an unfinished today so the rate does not dip at breakfast', () => {
    const completed = new Set(['2025-01-01', '2025-01-02']);
    const stats = completionStats(daily, completed, '2025-01-01', '2025-01-03', '2025-01-03');

    expect(stats.scheduled).toBe(2);
    expect(stats.completed).toBe(2);
    expect(stats.rate).toBe(1);
  });

  it('includes today once it is done', () => {
    const completed = new Set(['2025-01-01', '2025-01-02', '2025-01-03']);
    const stats = completionStats(daily, completed, '2025-01-01', '2025-01-03', '2025-01-03');

    expect(stats.scheduled).toBe(3);
    expect(stats.completed).toBe(3);
  });

  it('returns a null rate when nothing was scheduled', () => {
    const weekendOnly: ScheduledHabit = {
      frequency: 'days_of_week',
      days_of_week: [0, 6],
      startDate: '2025-01-01',
    };
    // Mon–Fri only.
    const stats = completionStats(weekendOnly, new Set(), '2025-01-06', '2025-01-10', '2025-01-20');

    expect(stats.scheduled).toBe(0);
    expect(stats.rate).toBeNull();
  });

  it('never counts days before the habit existed', () => {
    const recent: ScheduledHabit = { ...daily, startDate: '2025-01-09' };
    const stats = completionStats(recent, new Set(), '2025-01-01', '2025-01-10', '2025-01-20');
    expect(stats.scheduled).toBe(2);
  });
});

describe('describeSchedule', () => {
  it('describes a daily habit', () => {
    expect(describeSchedule(daily, DAY_NAMES_SHORT)).toBe('Every day');
  });

  it('recognises weekdays and weekends', () => {
    expect(describeSchedule(weekdays, DAY_NAMES_SHORT)).toBe('Weekdays');
    expect(
      describeSchedule({ frequency: 'days_of_week', days_of_week: [0, 6] }, DAY_NAMES_SHORT),
    ).toBe('Weekends');
  });

  it('lists arbitrary days in week order', () => {
    expect(
      describeSchedule({ frequency: 'days_of_week', days_of_week: [5, 1, 3] }, DAY_NAMES_SHORT),
    ).toBe('Mon, Wed, Fri');
  });

  it('treats all seven selected days as daily', () => {
    expect(
      describeSchedule(
        { frequency: 'days_of_week', days_of_week: [0, 1, 2, 3, 4, 5, 6] },
        DAY_NAMES_SHORT,
      ),
    ).toBe('Every day');
  });
});
