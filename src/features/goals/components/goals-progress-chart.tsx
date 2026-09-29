import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatPercent } from '@/lib/format';
import { axisProps, ChartContainer, ChartTooltip } from '@/components/common/chart-container';

interface GoalsProgressChartProps {
  goals: { id: string; title: string; progress: number }[];
  /** Defaults to scaling with the number of goals; pass `'fill'` to take the parent's height instead. */
  height?: number | 'fill';
}

const TITLE_WIDTH = 14;

export function GoalsProgressChart({ goals, height }: GoalsProgressChartProps) {
  const data = goals.map((goal) => ({
    ...goal,
    percent: Math.round(goal.progress * 100),
    label: goal.title.length > TITLE_WIDTH ? `${goal.title.slice(0, TITLE_WIDTH - 1)}…` : goal.title,
  }));
  const resolvedHeight = height ?? Math.max(120, data.length * 40);

  return (
    <ChartContainer height={resolvedHeight} label="Progress toward each active goal">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 32, bottom: 0, left: 4 }}>
          <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="2 4" horizontal={false} />
          <XAxis {...axisProps} type="number" domain={[0, 100]} tickFormatter={(value: number) => `${value}%`} />
          <YAxis {...axisProps} type="category" dataKey="label" width={96} />
          <Tooltip
            cursor={{ fill: 'var(--subtle)' }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const row = payload[0].payload as (typeof data)[number];
              return (
                <ChartTooltip
                  title={row.title}
                  rows={[{ label: 'Progress', value: formatPercent(row.progress), color: 'var(--chart-5)' }]}
                />
              );
            }}
          />
          <Bar dataKey="percent" fill="var(--chart-5)" radius={[0, 4, 4, 0]} isAnimationActive={false} barSize={16}>
            <LabelList
              dataKey="percent"
              position="right"
              formatter={(value: number) => `${value}%`}
              className="fill-muted-foreground text-[0.6875rem]"
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
