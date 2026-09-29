import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

/**
 * What an app contributes to Home's summary strip.
 *
 * Lazy and self-fetching, so Home never imports a feature directly and never
 * needs to know what an app measures. An app with nothing to say right now
 * renders nothing.
 *
 * Today's own widgets are a separate catalogue: see `dashboard-widgets.ts`.
 */
interface AppSurfaces {
  /** A pill for the Home summary strip. Renders null when there's nothing due. */
  summary?: LazyExoticComponent<ComponentType>;
}

export const APP_SURFACES: Record<string, AppSurfaces> = {
  weight: {
    summary: lazy(() =>
      import('@/features/weight/surfaces').then((m) => ({ default: m.WeightSummary })),
    ),
  },
  nutrition: {
    summary: lazy(() =>
      import('@/features/nutrition/surfaces').then((m) => ({ default: m.NutritionSummary })),
    ),
  },
  habits: {
    summary: lazy(() =>
      import('@/features/habits/surfaces').then((m) => ({ default: m.HabitsSummary })),
    ),
  },
  tasks: {
    summary: lazy(() =>
      import('@/features/tasks/surfaces').then((m) => ({ default: m.TasksSummary })),
    ),
  },
  goals: {
    summary: lazy(() =>
      import('@/features/goals/surfaces').then((m) => ({ default: m.GoalsSummary })),
    ),
  },
};
