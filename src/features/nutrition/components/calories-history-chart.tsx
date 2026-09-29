import { Bar, BarChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatDateKey, type DateKey } from '@/lib/date';
import { formatNumber } from '@/lib/format';
import { axisProps, ChartContainer, ChartTooltip } from '@/components/common/chart-container';
import { MACRO_COLOR } from '@/lib/chart';

interface CaloriesHistoryChartProps {
  days: { date: DateKey; calories: number }[];
  target: number;
  height?: number | 'fill';
}

export function CaloriesHistoryChart({ days, target, height = 180 }: CaloriesHistoryChartProps) {
  return (
    <ChartContainer height={height} label={`Calories over the last ${days.length} days`}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={days} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
          <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="2 4" vertical={false} />
          <XAxis
            {...axisProps}
            dataKey="date"
            tickFormatter={(value: DateKey) => formatDateKey(value, 'd MMM')}
            minTickGap={24}
          />
          <YAxis {...axisProps} width={40} tickFormatter={(value: number) => formatNumber(value)} />
          {target > 0 && (
            <ReferenceLine
              y={target}
              stroke="var(--chart-1)"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              label={{
                value: 'Target',
                position: 'insideTopRight',
                fill: 'var(--chart-1)',
                fontSize: 10,
              }}
            />
          )}
          <Tooltip
            cursor={{ fill: 'var(--subtle)' }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const row = payload[0].payload as (typeof days)[number];
              return (
                <ChartTooltip
                  title={formatDateKey(row.date, 'EEE d MMM yyyy')}
                  rows={[
                    {
                      label: 'Calories',
                      value: `${formatNumber(row.calories)} kcal`,
                      color: MACRO_COLOR.calories,
                    },
                  ]}
                />
              );
            }}
          />
          <Bar dataKey="calories" fill={MACRO_COLOR.calories} radius={[4, 4, 0, 0]} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
