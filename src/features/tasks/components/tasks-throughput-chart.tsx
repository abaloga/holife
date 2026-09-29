import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatDateKey, type DateKey } from '@/lib/date';
import { axisProps, ChartContainer, ChartTooltip } from '@/components/common/chart-container';

interface TasksThroughputChartProps {
  series: { date: DateKey; completed: number }[];
  height?: number | 'fill';
}

export function TasksThroughputChart({ series, height = 180 }: TasksThroughputChartProps) {
  return (
    <ChartContainer height={height} label={`Tasks completed over the last ${series.length} days`}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={series} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
          <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="2 4" vertical={false} />
          <XAxis
            {...axisProps}
            dataKey="date"
            tickFormatter={(value: DateKey) => formatDateKey(value, 'd MMM')}
            minTickGap={24}
          />
          <YAxis {...axisProps} width={28} allowDecimals={false} />
          <Tooltip
            cursor={{ fill: 'var(--subtle)' }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const row = payload[0].payload as (typeof series)[number];
              return (
                <ChartTooltip
                  title={formatDateKey(row.date, 'EEE d MMM yyyy')}
                  rows={[
                    {
                      label: 'Completed',
                      value: `${row.completed} task${row.completed === 1 ? '' : 's'}`,
                      color: 'var(--chart-4)',
                    },
                  ]}
                />
              );
            }}
          />
          <Bar dataKey="completed" fill="var(--chart-4)" radius={[4, 4, 0, 0]} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
