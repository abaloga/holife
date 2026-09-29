import { useState } from 'react';
import { ChevronDown, History, PartyPopper } from 'lucide-react';
import { EmptyState } from '@/components/common/empty-state';
import { cn } from '@/lib/utils';
import { useOnThisDay, useTodayHolidays } from './hooks';
import type { HistoricalEvent } from './api';

/** Today's widget: whatever's on the "National ___ Day" calendar today. */
export function HolidaysTodayWidget() {
  const { holidays, isLoading, isError } = useTodayHolidays();

  if (isLoading) return null;

  if (isError) {
    return (
      <EmptyState
        icon={PartyPopper}
        size="compact"
        title="Couldn't load today's national days"
        description="Check your connection and try again later."
      />
    );
  }

  if (holidays.length === 0) {
    return (
      <EmptyState
        icon={PartyPopper}
        size="compact"
        title="Nothing on the calendar today"
        description="No national day found for today."
      />
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {holidays.map((holiday) => (
        <span
          key={holiday.name}
          className="rounded-full border border-border bg-subtle px-3 py-1.5 text-xs font-medium"
        >
          {holiday.name}
        </span>
      ))}
    </div>
  );
}

/** BC years arrive negative; "48 BC" reads far better than "-48". */
function formatYear(year: number): string {
  return year < 0 ? `${Math.abs(year)} BC` : String(year);
}

/**
 * Today's widget: historical events on this calendar date, not birthdays.
 * Collapsed to just the subject and year; tap one to read what happened.
 */
export function OnThisDayWidget() {
  const { events, isLoading, isError } = useOnThisDay();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (isLoading) return null;

  if (isError || events.length === 0) {
    return (
      <EmptyState
        icon={History}
        size="compact"
        title="Couldn't load history"
        description="Check your connection and try again later."
      />
    );
  }

  return (
    <ul>
      {events.map((event, index) => (
        <EventRow
          key={index}
          event={event}
          open={openIndex === index}
          onToggle={() => setOpenIndex((current) => (current === index ? null : index))}
        />
      ))}
    </ul>
  );
}

function EventRow({
  event,
  open,
  onToggle,
}: {
  event: HistoricalEvent;
  open: boolean;
  onToggle: () => void;
}) {
  const name = event.title ?? event.text;

  return (
    <li className="border-b border-border/60 last:border-0">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center gap-2 py-1.5 text-left"
      >
        <span className="tnum shrink-0 text-xs font-semibold text-muted-foreground">
          {formatYear(event.year)}
        </span>
        <span className="min-w-0 flex-1 truncate text-xs font-medium">{name}</span>
        <ChevronDown
          className={cn(
            'size-3.5 shrink-0 text-muted-foreground transition-transform duration-150',
            open && 'rotate-180',
          )}
          aria-hidden
        />
      </button>
      {open && (
        <div className="pb-2 pl-1 pr-5">
          <p className="text-xs leading-snug text-muted-foreground">{event.text}</p>
          {event.url && (
            <a
              href={event.url}
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-block text-[0.6875rem] text-muted-foreground underline-offset-4 hover:underline"
            >
              Read more on Wikipedia
            </a>
          )}
        </div>
      )}
    </li>
  );
}
