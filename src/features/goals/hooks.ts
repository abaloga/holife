import { useCallback, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useUserId } from '@/features/auth/auth-context';
import { queryKeys } from '@/lib/query-keys';
import type { GoalStatus } from '@/types/database';
import {
  createGoal,
  deleteGoal,
  listGoals,
  setGoalProgress,
  setGoalStatus,
  updateGoal,
  type Goal,
  type GoalInput,
} from './api';

export function useGoals() {
  const userId = useUserId();
  const query = useQuery({
    queryKey: queryKeys.goals.list(userId),
    queryFn: () => listGoals(userId),
  });

  const goals = useMemo(() => query.data ?? [], [query.data]);

  return {
    goals,
    active: goals.filter((goal) => goal.status === 'active'),
    achieved: goals.filter((goal) => goal.status === 'achieved'),
    other: goals.filter((goal) => goal.status === 'paused' || goal.status === 'archived'),
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

function useInvalidateGoals() {
  const userId = useUserId();
  const queryClient = useQueryClient();
  return useCallback(
    () => queryClient.invalidateQueries({ queryKey: queryKeys.goals.root(userId) }),
    [queryClient, userId],
  );
}

export function useCreateGoal() {
  const userId = useUserId();
  const invalidate = useInvalidateGoals();

  return useMutation({
    mutationFn: (input: GoalInput) => createGoal(userId, input),
    onSuccess: () => invalidate(),
  });
}

export function useUpdateGoal() {
  const invalidate = useInvalidateGoals();

  return useMutation({
    mutationFn: ({ id, ...input }: GoalInput & { id: string }) => updateGoal(id, input),
    onSuccess: () => invalidate(),
  });
}

export function useSetGoalProgress() {
  const userId = useUserId();
  const queryClient = useQueryClient();
  const key = queryKeys.goals.list(userId);

  return useMutation({
    mutationFn: ({ id, value }: { id: string; value: number }) => setGoalProgress(id, value),

    onMutate: async ({ id, value }) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<Goal[]>(key);
      queryClient.setQueryData<Goal[]>(key, (current = []) =>
        current.map((goal) => (goal.id === id ? { ...goal, current_value: value } : goal)),
      );
      return { previous };
    },

    onError: (_error, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous);
    },

    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: key });
    },
  });
}

export function useSetGoalStatus() {
  const invalidate = useInvalidateGoals();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: GoalStatus }) => setGoalStatus(id, status),
    onSuccess: () => invalidate(),
  });
}

export function useDeleteGoal() {
  const invalidate = useInvalidateGoals();

  return useMutation({
    mutationFn: (id: string) => deleteGoal(id),
    onSuccess: () => invalidate(),
  });
}
