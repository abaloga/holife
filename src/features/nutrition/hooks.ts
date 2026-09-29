import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useUserId } from '@/features/auth/auth-context';
import { usePreferences } from '@/features/settings/hooks';
import { queryKeys } from '@/lib/query-keys';
import { addDaysToKey, lastNDays, type DateKey } from '@/lib/date';
import { round } from '@/lib/utils';
import {
  createMeal,
  deleteMeal,
  fetchTargets,
  listMealsForDate,
  listMealsForRange,
  updateMeal,
  updateTargets,
  type MealEntry,
  type MealInput,
} from './api';
import { macroProgress, sumMeals, type MacroTotals } from './calculations';

/** How many days of calorie history the Today chart widget shows. */
export const CALORIE_HISTORY_DAYS = 14;

export function useNutritionTargets() {
  const userId = useUserId();
  return useQuery({
    queryKey: queryKeys.nutrition.targets(userId),
    queryFn: () => fetchTargets(userId),
    staleTime: 5 * 60_000,
  });
}

export function useUpdateNutritionTargets() {
  const userId = useUserId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: { calories: number; protein: number; carbs: number; fat: number }) =>
      updateTargets(userId, {
        calories: values.calories,
        protein_g: values.protein,
        carbs_g: values.carbs,
        fat_g: values.fat,
      }),
    onSuccess: (targets) =>
      queryClient.setQueryData(queryKeys.nutrition.targets(userId), targets),
  });
}

export function useMealsForDate(date: DateKey) {
  const userId = useUserId();
  return useQuery({
    queryKey: queryKeys.nutrition.day(userId, date),
    queryFn: () => listMealsForDate(userId, date),
  });
}

/** Everything the nutrition screens need for one day, in one call. */
export function useDayNutrition(date: DateKey) {
  const mealsQuery = useMealsForDate(date);
  const targetsQuery = useNutritionTargets();

  const meals = useMemo(() => mealsQuery.data ?? [], [mealsQuery.data]);

  const targets = useMemo<MacroTotals>(
    () => ({
      calories: targetsQuery.data?.calories ?? 0,
      protein: targetsQuery.data?.protein_g ?? 0,
      carbs: targetsQuery.data?.carbs_g ?? 0,
      fat: targetsQuery.data?.fat_g ?? 0,
    }),
    [targetsQuery.data],
  );

  const totals = useMemo(() => sumMeals(meals), [meals]);
  const progress = useMemo(() => macroProgress(totals, targets), [totals, targets]);

  return {
    meals,
    totals,
    targets,
    progress,
    hasTargets: targetsQuery.data != null,
    isLoading: mealsQuery.isLoading || targetsQuery.isLoading,
    isError: mealsQuery.isError || targetsQuery.isError,
    error: mealsQuery.error ?? targetsQuery.error,
    refetch: () => {
      void mealsQuery.refetch();
      void targetsQuery.refetch();
    },
  };
}

function useInvalidateNutrition() {
  const userId = useUserId();
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: queryKeys.nutrition.root(userId) });
}

export function useCreateMeal() {
  const userId = useUserId();
  const invalidate = useInvalidateNutrition();

  return useMutation({
    mutationFn: (input: MealInput) => createMeal(userId, input),
    onSuccess: invalidate,
  });
}

export function useUpdateMeal() {
  const userId = useUserId();
  const invalidate = useInvalidateNutrition();

  return useMutation({
    mutationFn: ({ id, ...input }: MealInput & { id: string }) => updateMeal(userId, id, input),
    onSuccess: invalidate,
  });
}

export function useDeleteMeal() {
  const invalidate = useInvalidateNutrition();

  return useMutation({
    mutationFn: (meal: MealEntry) => deleteMeal(meal),
    onSuccess: invalidate,
  });
}

/** The current day's totals, used by Home without duplicating the maths. */
export function useTodayNutrition() {
  const { today } = usePreferences();
  return useDayNutrition(today);
}

/** Daily calorie totals for the Today chart widget: one point per day. */
export function useCalorieHistory(days = CALORIE_HISTORY_DAYS) {
  const userId = useUserId();
  const { today } = usePreferences();
  const from = addDaysToKey(today, -(days - 1));

  const mealsQuery = useQuery({
    queryKey: queryKeys.nutrition.range(userId, from, today),
    queryFn: () => listMealsForRange(userId, from, today),
  });
  const targetsQuery = useNutritionTargets();

  const series = useMemo(() => {
    const totals = new Map<DateKey, number>();
    for (const meal of mealsQuery.data ?? []) {
      totals.set(meal.local_date, (totals.get(meal.local_date) ?? 0) + Number(meal.calories));
    }
    return lastNDays(today, days).map((date) => ({
      date,
      calories: round(totals.get(date) ?? 0, 0),
    }));
  }, [mealsQuery.data, today, days]);

  return {
    series,
    target: targetsQuery.data?.calories ?? 0,
    hasData: (mealsQuery.data ?? []).length > 0,
    isLoading: mealsQuery.isLoading || targetsQuery.isLoading,
  };
}
