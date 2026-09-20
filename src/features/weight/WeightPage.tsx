import { useState } from 'react';
import { Plus, Scale } from 'lucide-react';
import { PageBody, PageHeader } from '@/components/layout/page';
import { Section, SectionHeader } from '@/components/common/section';
import { EmptyState } from '@/components/common/empty-state';
import { ErrorState } from '@/components/common/error-state';
import { ListGroup, ListRow } from '@/components/common/list-row';
import { Button } from '@/components/ui/button';
import { Sheet } from '@/components/ui/sheet';
import { Skeleton, SkeletonRows } from '@/components/ui/skeleton';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { Badge } from '@/components/ui/badge';
import { usePreferences } from '@/features/settings/hooks';
import { formatDateKey, relativeDayLabel, type DateKey } from '@/lib/date';
import { formatWeight, formatWeightDelta } from '@/lib/units';
import { useWeightSummary } from './hooks';
import { WeightChart } from './components/weight-chart';
import { WeightForm } from './components/weight-form';
import { WeightChangeGrid, WeightHeadline } from './components/weight-stats';
import type { WeightEntry } from './api';
import type { WeightUnit } from '@/types/database';

type RangeValue = '30' | '90' | '365' | 'all';

const RANGE_OPTIONS = [
  { value: '30' as const, label: '30d' },
  { value: '90' as const, label: '90d' },
  { value: '365' as const, label: '1y' },
  { value: 'all' as const, label: 'All' },
];

export function WeightPage() {
  const { weightUnit, today, goalWeightKg } = usePreferences();
  const { summary, entries, isLoading, isError, error, refetch } = useWeightSummary();

  const [range, setRange] = useState<RangeValue>('90');
  const [logOpen, setLogOpen] = useState(false);
  const [editing, setEditing] = useState<WeightEntry | null>(null);

  const rangeDays = range === 'all' ? null : Number(range);
  const hasEntries = entries.length > 0;

  return (
    <>
      <PageHeader
        title="Weight"
        back="/"
        subtitle={hasEntries ? `${entries.length} entries logged` : undefined}
        action={
          <Button size="sm" onClick={() => setLogOpen(true)}>
            <Plus aria-hidden />
            Log
          </Button>
        }
      />

      <PageBody>
        {isLoading && <WeightPageSkeleton />}

        {!isLoading && isError && (
          <ErrorState error={error} subject="your weight history" onRetry={refetch} />
        )}

        {!isLoading && !isError && !hasEntries && (
          <EmptyState
            icon={Scale}
            title="No weigh-ins yet"
            description="Log your weight a few times and HoLife will show the trend underneath the day-to-day noise."
            action={{ label: 'Log your first weight', onClick: () => setLogOpen(true) }}
            className="mt-6"
          />
        )}

        {!isLoading && !isError && hasEntries && (
          <>
            <Section>
              <WeightHeadline summary={summary} unit={weightUnit} today={today} />
              <WeightChangeGrid summary={summary} unit={weightUnit} className="mt-5" />
            </Section>

            {summary.trend.length >= 2 && (
              <Section>
                <SectionHeader
                  title="Trend"
                  meta={summary.trend.length < 3 ? 'settling in' : undefined}
                />
                <SegmentedControl
                  value={range}
                  onValueChange={setRange}
                  options={RANGE_OPTIONS}
                  aria-label="Chart range"
                  className="mb-4"
                />
                <WeightChart
                  points={summary.trend}
                  unit={weightUnit}
                  goalWeightKg={goalWeightKg}
                  rangeDays={rangeDays}
                  today={today}
                />
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  The line is a smoothed trend; the dots are individual weigh-ins. Day-to-day
                  changes are mostly water and food, not fat.
                </p>
              </Section>
            )}

            <Section>
              <SectionHeader title="History" meta={`${entries.length}`} />
              <HistoryList
                entries={entries}
                unit={weightUnit}
                today={today}
                onSelect={setEditing}
              />
            </Section>
          </>
        )}
      </PageBody>

      <Sheet
        open={logOpen}
        onOpenChange={setLogOpen}
        title="Log weight"
        description="Takes a couple of seconds."
      >
        <WeightForm seedKg={summary.latest?.kg ?? null} onDone={() => setLogOpen(false)} />
      </Sheet>

      <Sheet
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
        title="Edit entry"
      >
        {editing && <WeightForm entry={editing} onDone={() => setEditing(null)} />}
      </Sheet>
    </>
  );
}

function HistoryList({
  entries,
  unit,
  today,
  onSelect,
}: {
  entries: WeightEntry[];
  unit: WeightUnit;
  today: DateKey;
  onSelect: (entry: WeightEntry) => void;
}) {
  return (
    <ListGroup>
      {entries.map((entry, index) => {
        // Entries arrive newest-first, so the "previous" reading is the next one.
        const older = entries[index + 1];
        const delta = older ? Number(entry.weight_kg) - Number(older.weight_kg) : null;

        return (
          <ListRow
            key={entry.id}
            onActivate={() => onSelect(entry)}
            activateLabel={`Edit entry from ${formatDateKey(entry.local_date, 'd MMMM yyyy')}`}
            trailing={
              <span className="tnum shrink-0 text-[0.9375rem] font-semibold">
                {formatWeight(Number(entry.weight_kg), unit)}
              </span>
            }
          >
            <div className="flex items-center gap-2">
              <span className="truncate text-[0.9375rem]">
                {relativeDayLabel(entry.local_date, today)}
              </span>
              {delta != null && Math.abs(delta) >= 0.05 && (
                <Badge variant="outline" className="tnum shrink-0">
                  {formatWeightDelta(delta, unit)}
                </Badge>
              )}
            </div>
            {entry.note ? (
              <p className="mt-0.5 truncate text-xs text-muted-foreground">{entry.note}</p>
            ) : (
              <p className="mt-0.5 text-xs text-muted-foreground">
                {formatDateKey(entry.local_date, 'd MMM yyyy')}
              </p>
            )}
          </ListRow>
        );
      })}
    </ListGroup>
  );
}

function WeightPageSkeleton() {
  return (
    <div className="mt-2 space-y-8">
      <div className="space-y-3">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-3 w-52" />
      </div>
      <Skeleton className="h-52 w-full rounded-xl" />
      <SkeletonRows rows={4} />
    </div>
  );
}
