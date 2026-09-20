import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

/**
 * What an app contributes to the shell's shared screens.
 *
 * Both are lazy and fetch their own data, so Home and Today never import a
 * feature directly and never need to know what an app measures. An app with
 * nothing to say on a given day renders nothing.
 */
interface AppSurfaces {
  /** A pill for the Home summary strip. Renders null when there's nothing due. */
  summary?: LazyExoticComponent<ComponentType>;
  /** A full-width block on the Today dashboard. */
  widget?: LazyExoticComponent<ComponentType>;
}

export const APP_SURFACES: Record<string, AppSurfaces> = {
  weight: {
    summary: lazy(() =>
      import('@/features/weight/surfaces').then((m) => ({ default: m.WeightSummary })),
    ),
    widget: lazy(() =>
      import('@/features/weight/surfaces').then((m) => ({ default: m.WeightWidget })),
    ),
  },
  nutrition: {
    summary: lazy(() =>
      import('@/features/nutrition/surfaces').then((m) => ({ default: m.NutritionSummary })),
    ),
    widget: lazy(() =>
      import('@/features/nutrition/surfaces').then((m) => ({ default: m.NutritionWidget })),
    ),
  },
  habits: {
    summary: lazy(() =>
      import('@/features/habits/surfaces').then((m) => ({ default: m.HabitsSummary })),
    ),
    widget: lazy(() =>
      import('@/features/habits/surfaces').then((m) => ({ default: m.HabitsWidget })),
    ),
  },
  tasks: {
    summary: lazy(() =>
      import('@/features/tasks/surfaces').then((m) => ({ default: m.TasksSummary })),
    ),
    widget: lazy(() =>
      import('@/features/tasks/surfaces').then((m) => ({ default: m.TasksWidget })),
    ),
  },
  goals: {
    summary: lazy(() =>
      import('@/features/goals/surfaces').then((m) => ({ default: m.GoalsSummary })),
    ),
    widget: lazy(() =>
      import('@/features/goals/surfaces').then((m) => ({ default: m.GoalsWidget })),
    ),
  },
};
