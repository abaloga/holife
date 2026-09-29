import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { Disc3 } from 'lucide-react';
import { EmptyState } from '@/components/common/empty-state';
import { ChartContainer, ChartTooltip } from '@/components/common/chart-container';
import { useMusicCollection } from './hooks';

const FORMAT_COLOR = { cd: 'var(--chart-1)', cassette: 'var(--chart-4)' } as const;
const FORMAT_LABEL = { cd: 'CDs', cassette: 'Cassettes' } as const;

/** Today's chart widget: the collection's shape, not a list of items. */
export function MusicFormatsWidget() {
  const { items, cds, cassettes, isLoading } = useMusicCollection();

  if (isLoading) return null;

  if (items.length === 0) {
    return (
      <EmptyState
        icon={Disc3}
        size="compact"
        title="No music logged yet"
        description="Add a CD or cassette and its share of your collection shows up here."
      />
    );
  }

  const data = (
    [
      { key: 'cd' as const, value: cds.length },
      { key: 'cassette' as const, value: cassettes.length },
    ] satisfies { key: keyof typeof FORMAT_COLOR; value: number }[]
  ).filter((row) => row.value > 0);

  return (
    <div className="flex h-full flex-col">
      <div className="min-h-0 flex-1">
        <ChartContainer height="fill" label="CDs versus cassettes in your collection">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="key"
                innerRadius="55%"
                outerRadius="85%"
                paddingAngle={2}
                isAnimationActive={false}
              >
                {data.map((row) => (
                  <Cell key={row.key} fill={FORMAT_COLOR[row.key]} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const row = payload[0].payload as (typeof data)[number];
                  return (
                    <ChartTooltip
                      title={FORMAT_LABEL[row.key]}
                      rows={[{ label: 'Count', value: String(row.value), color: FORMAT_COLOR[row.key] }]}
                    />
                  );
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>
      <p className="mt-1.5 flex shrink-0 justify-center gap-3 truncate text-[0.6875rem] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="size-2 rounded-full" style={{ background: FORMAT_COLOR.cd }} />
          {cds.length} CDs
        </span>
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="size-2 rounded-full" style={{ background: FORMAT_COLOR.cassette }} />
          {cassettes.length} Cassettes
        </span>
      </p>
    </div>
  );
}
