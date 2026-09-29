import { lazy, type ComponentType, type LazyExoticComponent } from 'react';
import { History, PartyPopper, type LucideIcon } from 'lucide-react';

/**
 * The catalogue of chart widgets a user can add to Today.
 *
 * Today itself holds none of this: it only knows the ordered list of keys a
 * user has added (`dashboard_widgets`) and looks each one up here. A new
 * widget is one entry plus whatever chart component it points to — Today,
 * the picker and the empty state all pick it up automatically.
 */
export interface DashboardWidgetDefinition {
  key: string;
  /** Which app this widget visualises, for its icon/tone and "open app" link. */
  appId?: string;
  /** Overrides the icon/tone normally derived from `appId`. Required without one. */
  icon?: LucideIcon;
  tone?: string;
  name: string;
  /** One line shown in the picker. Say what it shows, not that it's a chart. */
  description: string;
  component: LazyExoticComponent<ComponentType>;
}

export const DASHBOARD_WIDGETS: DashboardWidgetDefinition[] = [
  {
    key: 'weight-trend',
    appId: 'weight',
    name: 'Weight trend',
    description: 'Your smoothed weight trend over the last month.',
    component: lazy(() =>
      import('@/features/weight/surfaces').then((m) => ({ default: m.WeightTrendWidget })),
    ),
  },
  {
    key: 'nutrition-calories',
    appId: 'nutrition',
    name: 'Calories, last 2 weeks',
    description: 'Daily calories against your target.',
    component: lazy(() =>
      import('@/features/nutrition/surfaces').then((m) => ({ default: m.NutritionCaloriesWidget })),
    ),
  },
  {
    key: 'habits-consistency',
    appId: 'habits',
    name: 'Habit consistency',
    description: 'Completion rate across your habits, day by day.',
    component: lazy(() =>
      import('@/features/habits/surfaces').then((m) => ({ default: m.HabitsConsistencyWidget })),
    ),
  },
  {
    key: 'tasks-throughput',
    appId: 'tasks',
    name: 'Tasks completed',
    description: 'How many tasks you finished each day.',
    component: lazy(() =>
      import('@/features/tasks/surfaces').then((m) => ({ default: m.TasksThroughputWidget })),
    ),
  },
  {
    key: 'goals-progress',
    appId: 'goals',
    name: 'Goals progress',
    description: 'How far along each active goal is.',
    component: lazy(() =>
      import('@/features/goals/surfaces').then((m) => ({ default: m.GoalsProgressWidget })),
    ),
  },
  {
    key: 'music-formats',
    appId: 'music',
    name: 'Collection by format',
    description: 'CDs versus cassettes in your collection.',
    component: lazy(() =>
      import('@/features/music/surfaces').then((m) => ({ default: m.MusicFormatsWidget })),
    ),
  },
  {
    key: 'holidays-today',
    icon: PartyPopper,
    tone: 'text-accent',
    name: "Today's national days",
    description: "What's on the National Day calendar today.",
    component: lazy(() =>
      import('@/features/holidays/surfaces').then((m) => ({ default: m.HolidaysTodayWidget })),
    ),
  },
  {
    key: 'on-this-day',
    icon: History,
    tone: 'text-chart-2',
    name: 'On this day',
    description: "Wikipedia's picks for the most notable events on this date.",
    component: lazy(() =>
      import('@/features/holidays/surfaces').then((m) => ({ default: m.OnThisDayWidget })),
    ),
  },
];

export function dashboardWidgetByKey(key: string): DashboardWidgetDefinition | undefined {
  return DASHBOARD_WIDGETS.find((widget) => widget.key === key);
}
