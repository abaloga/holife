import { useQuery } from '@tanstack/react-query';
import { usePreferences } from '@/features/settings/hooks';
import { queryKeys } from '@/lib/query-keys';
import { parseDateKey } from '@/lib/date';
import { fetchAvailableCountries, fetchNationalDays, fetchOnThisDay } from './api';

export function useTodayHolidays() {
  const { today, timezone } = usePreferences();

  const query = useQuery({
    queryKey: queryKeys.holidays.day(today, timezone),
    queryFn: () => fetchNationalDays(today, timezone),
    // The day's list is set once it's published; no need to refetch within it.
    staleTime: 12 * 60 * 60_000,
  });

  return {
    holidays: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
  };
}

export function useOnThisDay() {
  const { today } = usePreferences();
  const { month, day } = parseDateKey(today);

  const query = useQuery({
    queryKey: queryKeys.holidays.onThisDay(month, day),
    queryFn: () => fetchOnThisDay(month, day),
    // The calendar date's history doesn't change within a day.
    staleTime: 24 * 60 * 60_000,
  });

  return {
    // No cap: these are already curated, so more of them is more good stuff,
    // not more noise. The widget scrolls internally if the list runs long.
    events: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
  };
}

export function useCountryOptions() {
  const query = useQuery({
    queryKey: queryKeys.holidays.countries,
    queryFn: fetchAvailableCountries,
    staleTime: Infinity,
  });

  return { countries: query.data ?? [], isLoading: query.isLoading };
}
