import { z } from 'zod';
import { isValidTimezone } from '@/lib/date';

export const userSettingsSchema = z.object({
  user_id: z.string().uuid(),
  unit_system: z.enum(['metric', 'imperial']),
  weight_unit: z.enum(['kg', 'lb', 'st']),
  theme: z.enum(['system', 'light', 'dark']),
  // A bad timezone would poison every "today" boundary in the app, so this is
  // one of the few DB values worth re-checking at runtime.
  timezone: z.string().refine(isValidTimezone, 'Unknown timezone'),
  week_start_day: z.number().int().min(0).max(6),
  goal_weight_kg: z.number().positive().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type UserSettings = z.infer<typeof userSettingsSchema>;

export const profileFormSchema = z.object({
  displayName: z.string().trim().max(60, 'That name is a little long'),
});

export const settingsFormSchema = z.object({
  unitSystem: z.enum(['metric', 'imperial']),
  weightUnit: z.enum(['kg', 'lb', 'st']),
  theme: z.enum(['system', 'light', 'dark']),
  timezone: z.string().refine(isValidTimezone, 'Pick a valid timezone'),
  weekStartDay: z.number().int().min(0).max(6),
});

export type ProfileFormValues = z.infer<typeof profileFormSchema>;
export type SettingsFormValues = z.infer<typeof settingsFormSchema>;
