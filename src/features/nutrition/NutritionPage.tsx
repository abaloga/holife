import { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, SlidersHorizontal, UtensilsCrossed } from 'lucide-react';
import { PageBody, PageHeader } from '@/components/layout/page';
import { Section, SectionHeader } from '@/components/common/section';
import { EmptyState } from '@/components/common/empty-state';
import { ErrorState } from '@/components/common/error-state';
import { Button } from '@/components/ui/button';
import { Sheet } from '@/components/ui/sheet';
import { Skeleton, SkeletonRows } from '@/components/ui/skeleton';
import { usePreferences } from '@/features/settings/hooks';
import { addDaysToKey, formatDateKey, relativeDayLabel } from '@/lib/date';
import { cn } from '@/lib/utils';
import { useDayNutrition } from './hooks';
import { MacroSummary } from './components/macro-summary';
import { MealList } from './components/meal-list';
import { MealForm } from './components/meal-form';
import { TargetsForm } from './components/targets-form';
import type { MealEntry } from './api';

export function NutritionPage() {
  const { today, timezone } = usePreferences();
  const [date, setDate] = useState(today);
  const [addOpen, setAddOpen] = useState(false);
  const [targetsOpen, setTargetsOpen] = useState(false);
  const [editing, setEditing] = useState<MealEntry | null>(null);

  const { meals, progress, isLoading, isError, error, refetch } = useDayNutrition(date);
  const isFuture = date > today;

  return (
    <>
      <PageHeader
        title="Nutrition"
        back="/"
        action={
          <>
            <Button
              size="icon-sm"
              variant="ghost"
              onClick={() => setTargetsOpen(true)}
              aria-label="Edit daily targets"
            >
              <SlidersHorizontal aria-hidden />
            </Button>
            <Button size="sm" onClick={() => setAddOpen(true)}>
              <Plus aria-hidden />
              Meal
            </Button>
          </>
        }
      >
        <DayNavigator date={date} today={today} onChange={setDate} />
      </PageHeader>

      <PageBody>
        {isLoading && <NutritionSkeleton />}

        {!isLoading && isError && (
          <ErrorState error={error} subject="this day’s meals" onRetry={refetch} />
        )}

        {!isLoading && !isError && (
          <>
            <Section>
              <MacroSummary progress={progress} />
            </Section>

            <Section>
              <SectionHeader
                title="Meals"
                meta={meals.length > 0 ? `${meals.length} logged` : undefined}
              />
              {meals.length === 0 ? (
                <EmptyState
                  icon={UtensilsCrossed}
                  title={isFuture ? 'Nothing logged yet' : 'No meals logged'}
                  description={
                    isFuture
                      ? 'You can log ahead if you are planning meals.'
                      : 'Add what you ate, or describe it and let HoLife estimate the macros for you to check.'
                  }
                  action={{ label: 'Add a meal', onClick: () => setAddOpen(true) }}
                />
              ) : (
                <MealList meals={meals} timezone={timezone} onSelect={setEditing} />
              )}
            </Section>
          </>
        )}
      </PageBody>

      <Sheet
        open={addOpen}
        onOpenChange={setAddOpen}
        title="Log a meal"
        description="Enter the numbers, or estimate them from a description."
      >
        <MealForm onDone={() => setAddOpen(false)} />
      </Sheet>

      <Sheet
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
        title="Edit meal"
      >
        {editing && <MealForm meal={editing} onDone={() => setEditing(null)} />}
      </Sheet>

      <Sheet
        open={targetsOpen}
        onOpenChange={setTargetsOpen}
        title="Daily targets"
        description="What a good day looks like for you."
      >
        <TargetsForm onDone={() => setTargetsOpen(false)} />
      </Sheet>
    </>
  );
}

function DayNavigator({
  date,
  today,
  onChange,
}: {
  date: string;
  today: string;
  onChange: (date: string) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg bg-subtle p-1">
      <NavButton label="Previous day" onClick={() => onChange(addDaysToKey(date, -1))}>
        <ChevronLeft className="size-4" aria-hidden />
      </NavButton>

      <button
        type="button"
        onClick={() => onChange(today)}
        className={cn(
          'min-w-0 flex-1 truncate rounded-md px-2 py-1 text-center text-[0.8125rem] font-medium',
          'transition-colors hover:bg-card',
        )}
      >
        {relativeDayLabel(date, today)}
        <span className="ml-1.5 text-muted-foreground">{formatDateKey(date, 'd MMM')}</span>
      </button>

      <NavButton label="Next day" onClick={() => onChange(addDaysToKey(date, 1))}>
        <ChevronRight className="size-4" aria-hidden />
      </NavButton>
    </div>
  );
}

function NavButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="grid size-8 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-card hover:text-foreground active:scale-95"
    >
      {children}
    </button>
  );
}

function NutritionSkeleton() {
  return (
    <div className="mt-2 space-y-8">
      <div className="flex items-center gap-5">
        <Skeleton className="size-28 rounded-full" />
        <div className="flex-1 space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-3.5 w-full" />
          ))}
        </div>
      </div>
      <SkeletonRows rows={3} />
    </div>
  );
}
