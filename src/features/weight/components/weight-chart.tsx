import { useMemo } from 'react';
import {
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts';
import { addDaysToKey, daysBetweenKeys, formatDateKey, type DateKey } from '@/lib/date';
import { formatWeight, kgToDisplay } from '@/lib/units';
import { axisProps, ChartContainer, ChartTooltip } from '@/components/common/chart-container';
import { CHART_NEUTRAL } from '@/lib/chart';
import type { TrendPoint } from '../calculations';
import type { WeightUnit } from '@/types/database';

interface WeightChartProps {
  points: TrendPoint[];
  unit: WeightUnit;
  goalWeightKg: number | null;
  /** Days of history to show; `null` shows everything. */
  rangeDays: number | null;
  today: DateKey;
}

/**
 * The trend line is the subject; individual weigh-ins are secondary marks
 * behind it. That ordering is the whole point — a day's reading is noise, and
 * drawing it as the primary line would invite the user to read noise as change.
 */
export function WeightChart({ points, unit, goalWeightKg, rangeDays, today }: WeightChartProps) {
  const data = useMemo(() => {
    const cutoff = rangeDays == null ? null : addDaysToKey(today, -rangeDays);
    const visible = cutoff ? points.filter((point) => point.date >= cutoff) : points;
    if (visible.length === 0) return [];

    const origin = visible[0].date;
    return visible.map((point) => ({
      t: daysBetweenKeys(origin, point.date),
      date: point.date,
      // Plotted in display units; the kilogram values ride along so the tooltip
      // can format without converting back and forth.
      value: kgToDisplay(point.kg, unit),
      trend: kgToDisplay(point.trendKg, unit),
      valueKg: point.kg,
      trendKg: point.trendKg,
    }));
  }, [points, rangeDays, today, unit]);

  const { domain, ticks } = useMemo(() => {
    if (data.length === 0) return { domain: [0, 1] as [number, number], ticks: [] as number[] };

    const values = data.flatMap((row) => [row.value, row.trend]);
    const goal = goalWeightKg != null ? kgToDisplay(goalWeightKg, unit) : null;
    if (goal != null) values.push(goal);

    const min = Math.min(...values);
    const max = Math.max(...values);

    // Enforce a minimum visible span so a half-kilo wobble cannot be stretched
    // to fill the plot and look like a dramatic change.
    const minimumSpan = unit === 'kg' ? 4 : 8;
    const span = Math.max(max - min, minimumSpan);
    const centre = (max + min) / 2;
    const pad = span * 0.12;

    const lastT = data[data.length - 1].t;
    const tickCount = Math.min(4, data.length);
    const tickValues = Array.from({ length: tickCount }, (_, index) =>
      Math.round((lastT * index) / Math.max(tickCount - 1, 1)),
    );

    return {
      domain: [centre - span / 2 - pad, centre + span / 2 + pad] as [number, number],
      ticks: [...new Set(tickValues)],
    };
  }, [data, goalWeightKg, unit]);

  if (data.length === 0) return null;

  const origin = data[0].date;
  const goalDisplay = goalWeightKg != null ? kgToDisplay(goalWeightKg, unit) : null;

  return (
    <ChartContainer
      height={208}
      label={`Weight trend over the ${rangeDays ? `last ${rangeDays} days` : 'full history'}`}
    >
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
          <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="2 4" vertical={false} />
          <XAxis
            {...axisProps}
            dataKey="t"
            type="number"
            domain={['dataMin', 'dataMax']}
            ticks={ticks}
            tickFormatter={(value: number) => formatDateKey(addDaysToKey(origin, value), 'd MMM')}
            minTickGap={24}
          />
          <YAxis
            {...axisProps}
            domain={domain}
            width={44}
            tickFormatter={(value: number) => value.toFixed(0)}
          />

          {goalDisplay != null && (
            <ReferenceLine
              y={goalDisplay}
              stroke="var(--chart-1)"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              label={{
                value: 'Goal',
                position: 'insideTopRight',
                fill: 'var(--chart-1)',
                fontSize: 10,
              }}
            />
          )}

          <Tooltip
            cursor={{ stroke: 'var(--border-strong)', strokeWidth: 1 }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const row = payload[0].payload as (typeof data)[number];
              return (
                <ChartTooltip
                  title={formatDateKey(row.date, 'EEE d MMM yyyy')}
                  rows={[
                    {
                      label: 'Trend',
                      value: formatWeight(row.trendKg, unit),
                      color: 'var(--chart-2)',
                    },
                    {
                      label: 'Logged',
                      value: formatWeight(row.valueKg, unit),
                      color: CHART_NEUTRAL,
                    },
                  ]}
                />
              );
            }}
          />

          {/* ZAxis fixes the dot area; without it Recharts sizes points from
              a z value that doesn't exist here and draws them far too large. */}
          <ZAxis type="number" range={[16, 16]} />
          <Scatter dataKey="value" fill={CHART_NEUTRAL} fillOpacity={0.5} shape="circle" />
          <Line
            type="monotone"
            dataKey="trend"
            stroke="var(--chart-2)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 2, stroke: 'var(--card)' }}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
