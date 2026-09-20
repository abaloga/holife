import { useCallback, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useUserId } from '@/features/auth/auth-context';
import { usePreferences } from '@/features/settings/hooks';
import { queryKeys } from '@/lib/query-keys';
import {
  createTask,
  deleteTask,
  listTasks,
  setTaskCompleted,
  updateTask,
  type Task,
  type TaskInput,
} from './api';
import { groupTasks } from './calculations';

export function useTasks() {
  const userId = useUserId();
  return useQuery({
    queryKey: queryKeys.tasks.list(userId),
    queryFn: () => listTasks(userId),
  });
}

export function useGroupedTasks() {
  const { today } = usePreferences();
  const query = useTasks();

  const groups = useMemo(() => groupTasks(query.data ?? [], today), [query.data, today]);

  return {
    groups,
    tasks: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

function useTasksKey() {
  const userId = useUserId();
  return queryKeys.tasks.list(userId);
}

function useInvalidateTasks() {
  const userId = useUserId();
  const queryClient = useQueryClient();
  return useCallback(
    () => queryClient.invalidateQueries({ queryKey: queryKeys.tasks.root(userId) }),
    [queryClient, userId],
  );
}

/**
 * Ticking a task off is optimistic: the row should move the instant it is
 * tapped. A failure restores the previous list and surfaces the error.
 */
export function useToggleTask() {
  const queryClient = useQueryClient();
  const key = useTasksKey();

  return useMutation({
    mutationFn: ({ id, completed }: { id: string; completed: boolean }) =>
      setTaskCompleted(id, completed),

    onMutate: async ({ id, completed }) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<Task[]>(key);

      queryClient.setQueryData<Task[]>(key, (current = []) =>
        current.map((task) =>
          task.id === id
            ? {
                ...task,
                is_completed: completed,
                completed_at: completed ? new Date().toISOString() : null,
              }
            : task,
        ),
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

export function useCreateTask() {
  const userId = useUserId();
  const invalidate = useInvalidateTasks();

  return useMutation({
    mutationFn: (input: TaskInput) => createTask(userId, input),
    onSuccess: () => invalidate(),
  });
}

export function useUpdateTask() {
  const invalidate = useInvalidateTasks();

  return useMutation({
    mutationFn: ({ id, ...input }: TaskInput & { id: string }) => updateTask(id, input),
    onSuccess: () => invalidate(),
  });
}

export function useDeleteTask() {
  const invalidate = useInvalidateTasks();

  return useMutation({
    mutationFn: (id: string) => deleteTask(id),
    onSuccess: () => invalidate(),
  });
}
