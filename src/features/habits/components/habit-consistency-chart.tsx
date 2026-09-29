import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatDateKey, type DateKey } from '@/lib/date';
import { formatPercent } from '@/lib/format';
import { axisProps, ChartContainer, ChartTooltip } from '@/components/common/chart-container';
import type { DailyCompletion } from '../calculations';

interface HabitConsistencyChartProps {
  series: DailyCompletion[];
  height?: number | 'fill';
}

export function HabitConsistencyChart({ series, height = 180 }: HabitConsistencyChartProps) {
  const data = series.map((point) => ({
    ...point,
    percent: point.rate == null ? 0 : Math.round(point.rate * 100),
  }));

  return (
    <ChartContainer height={height} label={`Habit completion rate over the last ${series.length} days`}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
          <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="2 4" vertical={false} />
          <XAxis
            {...axisProps}
            dataKey="date"
            tickFormatter={(value: DateKey) => formatDateKey(value, 'd MMM')}
            minTickGap={24}
          />
          <YAxis
            {...axisProps}
            width={36}
            domain={[0, 100]}
            ticks={[0, 50, 100]}
            tickFormatter={(value: number) => `${value}%`}
          />
          <Tooltip
            cursor={{ fill: 'var(--subtle)' }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const row = payload[0].payload as (typeof data)[number];
              return (
                <ChartTooltip
                  title={formatDateKey(row.date, 'EEE d MMM yyyy')}
                  rows={[
                    {
                      label: 'Completed',
                      value:
                        row.scheduled === 0
                          ? 'Nothing scheduled'
                          : `${row.completed}/${row.scheduled} (${formatPercent(row.rate ?? 0)})`,
                      color: 'var(--chart-3)',
                    },
                  ]}
                />
              );
            }}
          />
          <Bar dataKey="percent" fill="var(--chart-3)" radius={[4, 4, 0, 0]} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
