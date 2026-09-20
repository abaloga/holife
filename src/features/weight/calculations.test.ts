import { describe, expect, it } from 'vitest';
import { addDaysToKey } from '@/lib/date';
import {
  averagePerDay,
  buildTrend,
  summariseWeight,
  trendChange,
  type WeightSample,
} from './calculations';

const series = (entries: [string, number][]): WeightSample[] =>
  entries.map(([date, kg]) => ({ date, kg }));

describe('averagePerDay', () => {
  it('averages several weigh-ins on the same day', () => {
    const result = averagePerDay(
      series([
        ['2025-01-01', 80],
        ['2025-01-01', 82],
        ['2025-01-02', 81],
      ]),
    );

    expect(result).toEqual([
      { date: '2025-01-01', kg: 81 },
      { date: '2025-01-02', kg: 81 },
    ]);
  });

  it('sorts oldest first regardless of input order', () => {
    const result = averagePerDay(
      series([
        ['2025-01-03', 80],
        ['2025-01-01', 82],
        ['2025-01-02', 81],
      ]),
    );

    expect(result.map((point) => point.date)).toEqual([
      '2025-01-01',
      '2025-01-02',
      '2025-01-03',
    ]);
  });

  it('handles an empty series', () => {
    expect(averagePerDay([])).toEqual([]);
  });
});

describe('buildTrend', () => {
  it('starts the trend at the first reading', () => {
    const trend = buildTrend(series([['2025-01-01', 80]]));
    expect(trend).toHaveLength(1);
    expect(trend[0].trendKg).toBe(80);
  });

  it('lags behind a jump instead of following it', () => {
    const trend = buildTrend(
      series([
        ['2025-01-01', 80],
        ['2025-01-02', 84], // a heavy meal, not 4 kg of fat
      ]),
    );

    expect(trend[1].kg).toBe(84);
    expect(trend[1].trendKg).toBeGreaterThan(80);
    expect(trend[1].trendKg).toBeLessThan(81);
  });

  it('closes half the gap to a sustained new weight every half-life', () => {
    // Start at 90 kg, then hold 80 kg. With a 10-day half-life the remaining
    // gap should halve every 10 days: 5 kg at day 10, 2.5 at day 20, and so on.
    const sustained = (days: number) =>
      buildTrend(
        Array.from({ length: days + 1 }, (_, index) => ({
          date: addDaysToKey('2025-01-01', index),
          kg: index === 0 ? 90 : 80,
        })),
      );

    expect(sustained(10).at(-1)!.trendKg).toBeCloseTo(85, 1);
    expect(sustained(20).at(-1)!.trendKg).toBeCloseTo(82.5, 1);
    expect(sustained(90).at(-1)!.trendKg).toBeCloseTo(80, 1);
  });

  it('weights a long gap more heavily than a next-day weigh-in', () => {
    const nextDay = buildTrend(
      series([
        ['2025-01-01', 80],
        ['2025-01-02', 84],
      ]),
    );
    const afterAGap = buildTrend(
      series([
        ['2025-01-01', 80],
        ['2025-01-21', 84],
      ]),
    );

    expect(afterAGap[1].trendKg).toBeGreaterThan(nextDay[1].trendKg);
  });

  it('ignores the order entries arrive in', () => {
    const forwards = buildTrend(
      series([
        ['2025-01-01', 80],
        ['2025-01-02', 81],
      ]),
    );
    const backwards = buildTrend(
      series([
        ['2025-01-02', 81],
        ['2025-01-01', 80],
      ]),
    );

    expect(backwards).toEqual(forwards);
  });
});

describe('trendChange', () => {
  it('refuses to report a change from too few readings', () => {
    const trend = buildTrend(
      series([
        ['2025-01-01', 80],
        ['2025-01-08', 79],
      ]),
    );
    expect(trendChange(trend, 7)).toBeNull();
  });

  it('refuses when the readings do not span enough time', () => {
    const trend = buildTrend(
      series([
        ['2025-01-01', 80],
        ['2025-01-02', 80],
        ['2025-01-03', 80],
      ]),
    );
    expect(trendChange(trend, 30, { minimumSpanDays: 14, minimumPoints: 3 })).toBeNull();
  });

  it('reports a downward trend as a negative number', () => {
    const samples: WeightSample[] = [];
    for (let day = 1; day <= 28; day += 1) {
      samples.push({
        date: `2025-01-${String(day).padStart(2, '0')}`,
        kg: 85 - day * 0.1,
      });
    }

    const change = trendChange(buildTrend(samples), 7);
    expect(change).not.toBeNull();
    expect(change!.deltaKg).toBeLessThan(0);
    expect(change!.spanDays).toBe(7);
  });

  it('reports how many days it actually measured', () => {
    const samples = series([
      ['2025-01-01', 80],
      ['2025-01-04', 80.2],
      ['2025-01-07', 79.8],
      ['2025-01-10', 79.5],
    ]);

    const change = trendChange(buildTrend(samples), 7);
    expect(change?.spanDays).toBe(9);
  });
});

describe('summariseWeight', () => {
  it('returns an empty summary for no data rather than throwing', () => {
    const summary = summariseWeight([], '2025-01-10', null);
    expect(summary.latest).toBeNull();
    expect(summary.latestTrendKg).toBeNull();
    expect(summary.sinceLastKg).toBeNull();
    expect(summary.week).toBeNull();
    expect(summary.toGoalKg).toBeNull();
  });

  it('reports the raw change since the previous entry', () => {
    const summary = summariseWeight(
      series([
        ['2025-01-01', 80],
        ['2025-01-02', 80.6],
      ]),
      '2025-01-02',
      null,
    );

    expect(summary.sinceLastKg).toBeCloseTo(0.6, 3);
    expect(summary.daysSinceLast).toBe(0);
  });

  it('counts the days since the last weigh-in', () => {
    const summary = summariseWeight(series([['2025-01-01', 80]]), '2025-01-06', null);
    expect(summary.daysSinceLast).toBe(5);
  });

  it('measures the distance to a goal from the trend, not the last reading', () => {
    const samples = series([
      ['2025-01-01', 85],
      ['2025-01-02', 84.8],
      ['2025-01-03', 89], // an outlier day
    ]);

    const summary = summariseWeight(samples, '2025-01-03', 80);
    expect(summary.toGoalKg).not.toBeNull();
    // Distance to goal should stay near −5, not blow out to −9.
    expect(Math.abs(summary.toGoalKg!)).toBeLessThan(6);
  });
});
