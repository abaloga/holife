import { useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useUserId } from '@/features/auth/auth-context';
import { queryKeys } from '@/lib/query-keys';
import { resolveTimezone, todayKey, type DateKey } from '@/lib/date';
import { useIntervalValue } from '@/hooks/use-interval-value';
import type { TablesUpdate } from '@/types/database';
import { fetchProfile, fetchSettings, updateProfile, updateSettings } from './api';
import type { UserSettings } from './schema';

export function useSettings() {
  const userId = useUserId();
  return useQuery({
    queryKey: queryKeys.settings(userId),
    queryFn: () => fetchSettings(userId),
    // Settings change rarely and everything depends on them, so keep them warm.
    staleTime: 5 * 60_000,
  });
}

export function useUpdateSettings() {
  const userId = useUserId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (patch: TablesUpdate<'user_settings'>) => updateSettings(userId, patch),
    onSuccess: (settings) => {
      queryClient.setQueryData(queryKeys.settings(userId), settings);
      // A timezone or week-start change re-buckets every dated screen.
      queryClient.invalidateQueries({ queryKey: ['nutrition', userId] });
      queryClient.invalidateQueries({ queryKey: ['habits', userId] });
    },
  });
}

export function useProfile() {
  const userId = useUserId();
  return useQuery({
    queryKey: queryKeys.profile(userId),
    queryFn: () => fetchProfile(userId),
    staleTime: 5 * 60_000,
  });
}

export function useUpdateProfile() {
  const userId = useUserId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (patch: TablesUpdate<'profiles'>) => updateProfile(userId, patch),
    onSuccess: (profile) => queryClient.setQueryData(queryKeys.profile(userId), profile),
  });
}

export interface Preferences {
  settings: UserSettings | undefined;
  timezone: string;
  weightUnit: UserSettings['weight_unit'];
  weekStartDay: number;
  goalWeightKg: number | null;
  /** The user's current calendar day. Rolls over without a reload. */
  today: DateKey;
  isLoading: boolean;
}

/**
 * The one hook screens use for "what does this user consider today, and in what
 * units?". Keeping it in a single place is what stops timezone logic leaking
 * into components.
 */
export function usePreferences(): Preferences {
  const { data: settings, isLoading } = useSettings();
  const timezone = resolveTimezone(settings?.timezone);

  const computeToday = useCallback(() => todayKey(timezone), [timezone]);
  const today = useIntervalValue(computeToday, 60_000);

  return {
    settings,
    timezone,
    weightUnit: settings?.weight_unit ?? 'kg',
    weekStartDay: settings?.week_start_day ?? 1,
    goalWeightKg: settings?.goal_weight_kg ?? null,
    today,
    isLoading,
  };
}
