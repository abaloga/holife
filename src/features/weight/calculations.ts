import { daysBetweenKeys, type DateKey } from '@/lib/date';
import { round } from '@/lib/utils';

export interface WeightSample {
  date: DateKey;
  kg: number;
}

export interface TrendPoint extends WeightSample {
  /** Exponentially smoothed weight: the line the user should actually read. */
  trendKg: number;
}

/**
 * Day weight is noisy: water, food timing and sodium move the scale by more
 * than a week of real change. Everything here works from a smoothed series so
 * the app never reports a one-day fluctuation as progress.
 */

/** Collapses multiple weigh-ins on one day into that day's mean. */
export function averagePerDay(samples: WeightSample[]): WeightSample[] {
  const totals = new Map<DateKey, { sum: number; count: number }>();

  for (const sample of samples) {
    const existing = totals.get(sample.date);
    if (existing) {
      existing.sum += sample.kg;
      existing.count += 1;
    } else {
      totals.set(sample.date, { sum: sample.kg, count: 1 });
    }
  }

  return [...totals.entries()]
    .map(([date, { sum, count }]) => ({ date, kg: sum / count }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Exponentially weighted moving average, time-aware: a gap of several days
 * pulls the trend further toward the new reading than a next-day weigh-in does,
 * which keeps the line honest after a break in logging.
 *
 * `halfLifeDays` is how long it takes the trend to close half the distance to a
 * sustained new weight. 10 days is a common choice for bodyweight.
 */
export function buildTrend(samples: WeightSample[], halfLifeDays = 10): TrendPoint[] {
  const daily = averagePerDay(samples);
  if (daily.length === 0) return [];

  const points: TrendPoint[] = [];
  let trend = daily[0].kg;
  points.push({ ...daily[0], trendKg: trend });

  for (let i = 1; i < daily.length; i += 1) {
    const sample = daily[i];
    const gap = Math.max(1, daysBetweenKeys(daily[i - 1].date, sample.date));
    const alpha = 1 - 0.5 ** (gap / halfLifeDays);
    trend += alpha * (sample.kg - trend);
    points.push({ ...sample, trendKg: trend });
  }

  return points;
}

export interface PeriodChange {
  /** Kilograms, signed. Negative means the trend went down. */
  deltaKg: number;
  /** Days actually covered, which may be shorter than requested. */
  spanDays: number;
}

/**
 * Change in the *trend* over the last `days`. Returns null when the history is
 * too short or too sparse for the number to mean anything, which is better than
 * showing a confident figure derived from two readings.
 */
export function trendChange(
  points: TrendPoint[],
  days: number,
  options: { minimumSpanDays?: number; minimumPoints?: number } = {},
): PeriodChange | null {
  const { minimumSpanDays = Math.min(days, 5), minimumPoints = 3 } = options;
  if (points.length < minimumPoints) return null;

  const latest = points[points.length - 1];
  const windowStart = points.filter(
    (point) => daysBetweenKeys(point.date, latest.date) >= days,
  );

  // Nothing old enough: fall back to the earliest point we do have, provided it
  // covers a useful span.
  const reference = windowStart.length > 0 ? windowStart[windowStart.length - 1] : points[0];
  const spanDays = daysBetweenKeys(reference.date, latest.date);
  if (spanDays < minimumSpanDays) return null;

  return { deltaKg: round(latest.trendKg - reference.trendKg, 3), spanDays };
}

export interface WeightSummary {
  latest: WeightSample | null;
  /** Raw difference between the two most recent entries. */
  sinceLastKg: number | null;
  daysSinceLast: number | null;
  trend: TrendPoint[];
  latestTrendKg: number | null;
  week: PeriodChange | null;
  month: PeriodChange | null;
  /** Kilograms still to go, signed toward the goal. */
  toGoalKg: number | null;
}

export function summariseWeight(
  samples: WeightSample[],
  today: DateKey,
  goalWeightKg: number | null,
): WeightSummary {
  const daily = averagePerDay(samples);
  const trend = buildTrend(samples);

  const latest = daily.length > 0 ? daily[daily.length - 1] : null;
  const previous = daily.length > 1 ? daily[daily.length - 2] : null;
  const latestTrendKg = trend.length > 0 ? trend[trend.length - 1].trendKg : null;

  return {
    latest,
    sinceLastKg: latest && previous ? round(latest.kg - previous.kg, 3) : null,
    daysSinceLast: latest ? daysBetweenKeys(latest.date, today) : null,
    trend,
    latestTrendKg,
    week: trendChange(trend, 7),
    month: trendChange(trend, 30, { minimumSpanDays: 14, minimumPoints: 5 }),
    toGoalKg:
      goalWeightKg != null && latestTrendKg != null
        ? round(goalWeightKg - latestTrendKg, 3)
        : null,
  };
}
