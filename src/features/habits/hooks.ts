import { useCallback, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useUserId } from '@/features/auth/auth-context';
import { usePreferences } from '@/features/settings/hooks';
import { HABIT_HISTORY_DAYS, queryKeys } from '@/lib/query-keys';
import { addDaysToKey, lastNDays, startOfWeekKey, toDateKey, type DateKey } from '@/lib/date';
import {
  completeHabit,
  createHabit,
  deleteHabit,
  listCompletions,
  listHabits,
  uncompleteHabit,
  updateHabit,
  type Habit,
  type HabitCompletion,
  type HabitInput,
} from './api';
import {
  completionStats,
  currentStreak,
  isScheduledOn,
  longestStreak,
  type CompletionStats,
  type ScheduledHabit,
} from './calculations';

/** The rolling window every habit screen reads from. */
function historyWindow(today: DateKey) {
  return { from: addDaysToKey(today, -(HABIT_HISTORY_DAYS - 1)), to: today };
}

export function useHabits() {
  const userId = useUserId();
  return useQuery({
    queryKey: queryKeys.habits.list(userId),
    queryFn: () => listHabits(userId),
  });
}

export function useHabitCompletions() {
  const userId = useUserId();
  const { today } = usePreferences();
  const { from, to } = historyWindow(today);

  return useQuery({
    queryKey: queryKeys.habits.completions(userId, from, to),
    queryFn: () => listCompletions(userId, from, to),
  });
}

export interface HabitView {
  habit: Habit;
  scheduledToday: boolean;
  completedToday: boolean;
  streak: number;
  /** Best run within the loaded history window. */
  bestStreak: number;
  stats: CompletionStats;
  /** Completion since the start of the user's own week. */
  weekStats: CompletionStats;
  /** Last seven days, oldest first: the dot strip on the habits screen. */
  recent: { date: DateKey; scheduled: boolean; completed: boolean }[];
}

function toScheduled(habit: Habit, timezone: string): ScheduledHabit {
  return {
    frequency: habit.frequency,
    days_of_week: habit.days_of_week,
    startDate: toDateKey(habit.created_at, timezone),
  };
}

export function useHabitsOverview() {
  const { today, timezone, weekStartDay } = usePreferences();
  const habitsQuery = useHabits();
  const completionsQuery = useHabitCompletions();

  const completionsByHabit = useMemo(() => {
    const map = new Map<string, Set<DateKey>>();
    for (const completion of completionsQuery.data ?? []) {
      const set = map.get(completion.habit_id) ?? new Set<DateKey>();
      set.add(completion.local_date);
      map.set(completion.habit_id, set);
    }
    return map;
  }, [completionsQuery.data]);

  const views = useMemo<HabitView[]>(() => {
    const habits = habitsQuery.data ?? [];
    const { from } = historyWindow(today);
    const week = lastNDays(today, 7);
    const weekStart = startOfWeekKey(today, weekStartDay);

    return habits.map((habit) => {
      const scheduled = toScheduled(habit, timezone);
      const dates = completionsByHabit.get(habit.id) ?? new Set<DateKey>();

      return {
        habit,
        scheduledToday: habit.is_active && isScheduledOn(scheduled, today),
        completedToday: dates.has(today),
        streak: currentStreak(scheduled, dates, today),
        bestStreak: longestStreak(scheduled, dates, from, today),
        stats: completionStats(scheduled, dates, from, today, today),
        weekStats: completionStats(scheduled, dates, weekStart, today, today),
        recent: week.map((date) => ({
          date,
          scheduled: isScheduledOn(scheduled, date),
          completed: dates.has(date),
        })),
      };
    });
  }, [habitsQuery.data, completionsByHabit, today, timezone, weekStartDay]);

  return {
    views,
    activeViews: views.filter((view) => view.habit.is_active),
    todayViews: views.filter((view) => view.scheduledToday),
    isLoading: habitsQuery.isLoading || completionsQuery.isLoading,
    isError: habitsQuery.isError || completionsQuery.isError,
    error: habitsQuery.error ?? completionsQuery.error,
    refetch: () => {
      void habitsQuery.refetch();
      void completionsQuery.refetch();
    },
  };
}

/**
 * Toggling is optimistic: the tick fills instantly and rolls back if the write
 * fails. Completion is idempotent per day at the database level, so a double
 * tap cannot create two rows.
 */
export function useToggleHabit() {
  const userId = useUserId();
  const { today, timezone } = usePreferences();
  const queryClient = useQueryClient();
  const { from, to } = historyWindow(today);
  const key = queryKeys.habits.completions(userId, from, to);

  return useMutation({
    mutationFn: async ({
      habitId,
      date,
      completed,
    }: {
      habitId: string;
      date: DateKey;
      completed: boolean;
    }) => {
      if (completed) await completeHabit(userId, habitId, date, timezone);
      else await uncompleteHabit(habitId, date);
    },

    onMutate: async ({ habitId, date, completed }) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<HabitCompletion[]>(key);

      queryClient.setQueryData<HabitCompletion[]>(key, (current = []) => {
        if (!completed) {
          return current.filter(
            (row) => !(row.habit_id === habitId && row.local_date === date),
          );
        }
        if (current.some((row) => row.habit_id === habitId && row.local_date === date)) {
          return current;
        }
        return [
          ...current,
          {
            id: `optimistic-${habitId}-${date}`,
            user_id: userId,
            habit_id: habitId,
            local_date: date,
            completed_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
          },
        ];
      });

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

function useInvalidateHabits() {
  const userId = useUserId();
  const queryClient = useQueryClient();
  return useCallback(
    () => queryClient.invalidateQueries({ queryKey: queryKeys.habits.root(userId) }),
    [queryClient, userId],
  );
}

export function useCreateHabit() {
  const userId = useUserId();
  const invalidate = useInvalidateHabits();

  return useMutation({
    mutationFn: (input: HabitInput) => createHabit(userId, input),
    onSuccess: () => invalidate(),
  });
}

export function useUpdateHabit() {
  const invalidate = useInvalidateHabits();

  return useMutation({
    mutationFn: ({ id, ...input }: HabitInput & { id: string }) => updateHabit(id, input),
    onSuccess: () => invalidate(),
  });
}

export function useDeleteHabit() {
  const invalidate = useInvalidateHabits();

  return useMutation({
    mutationFn: (id: string) => deleteHabit(id),
    onSuccess: () => invalidate(),
  });
}
