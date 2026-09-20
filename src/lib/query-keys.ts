import type { DateKey } from './date';

/**
 * Every cache key is scoped by user id. Signing in as a different account can
 * then never surface the previous account's cached rows, which matters because
 * the query cache is persisted to storage for offline reads.
 */
export const queryKeys = {
  auth: ['auth'] as const,

  profile: (userId: string) => ['profile', userId] as const,
  settings: (userId: string) => ['settings', userId] as const,

  weight: {
    root: (userId: string) => ['weight', userId] as const,
    list: (userId: string, limit: number) => ['weight', userId, 'list', limit] as const,
  },

  nutrition: {
    root: (userId: string) => ['nutrition', userId] as const,
    targets: (userId: string) => ['nutrition', userId, 'targets'] as const,
    day: (userId: string, date: DateKey) => ['nutrition', userId, 'day', date] as const,
  },

  habits: {
    root: (userId: string) => ['habits', userId] as const,
    list: (userId: string) => ['habits', userId, 'list'] as const,
    completions: (userId: string, from: DateKey, to: DateKey) =>
      ['habits', userId, 'completions', from, to] as const,
  },

  tasks: {
    root: (userId: string) => ['tasks', userId] as const,
    list: (userId: string) => ['tasks', userId, 'list'] as const,
  },

  goals: {
    root: (userId: string) => ['goals', userId] as const,
    list: (userId: string) => ['goals', userId, 'list'] as const,
  },

  music: {
    root: (userId: string) => ['music', userId] as const,
    list: (userId: string) => ['music', userId, 'list'] as const,
  },
} as const;

/** Window of habit history the app keeps warm: enough for streaks and a heatmap. */
export const HABIT_HISTORY_DAYS = 90;

/** How many weight entries the weight screen loads at once. */
export const WEIGHT_PAGE_SIZE = 400;
