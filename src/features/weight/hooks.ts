import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useUserId } from '@/features/auth/auth-context';
import { usePreferences } from '@/features/settings/hooks';
import { queryKeys, WEIGHT_PAGE_SIZE } from '@/lib/query-keys';
import {
  createWeightEntry,
  deleteWeightEntry,
  listWeightEntries,
  updateWeightEntry,
  type WeightEntry,
  type WeightEntryInput,
} from './api';
import { summariseWeight, type WeightSummary } from './calculations';

export function useWeightEntries(limit = WEIGHT_PAGE_SIZE) {
  const userId = useUserId();
  return useQuery({
    queryKey: queryKeys.weight.list(userId, limit),
    queryFn: () => listWeightEntries(userId, limit),
  });
}

export function useWeightSummary(): {
  summary: WeightSummary;
  entries: WeightEntry[];
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  refetch: () => void;
} {
  const { today, goalWeightKg } = usePreferences();
  const query = useWeightEntries();

  const summary = useMemo(() => {
    const samples = (query.data ?? []).map((entry) => ({
      date: entry.local_date,
      kg: Number(entry.weight_kg),
    }));
    return summariseWeight(samples, today, goalWeightKg);
  }, [query.data, today, goalWeightKg]);

  return {
    summary,
    entries: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

function useInvalidateWeight() {
  const userId = useUserId();
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: queryKeys.weight.root(userId) });
}

export function useCreateWeightEntry() {
  const userId = useUserId();
  const invalidate = useInvalidateWeight();

  return useMutation({
    mutationFn: (input: WeightEntryInput) => createWeightEntry(userId, input),
    onSuccess: invalidate,
  });
}

export function useUpdateWeightEntry() {
  const invalidate = useInvalidateWeight();

  return useMutation({
    mutationFn: ({ id, ...input }: WeightEntryInput & { id: string }) =>
      updateWeightEntry(id, input),
    onSuccess: invalidate,
  });
}

export function useDeleteWeightEntry() {
  const invalidate = useInvalidateWeight();

  return useMutation({
    mutationFn: (id: string) => deleteWeightEntry(id),
    onSuccess: invalidate,
  });
}
