import { supabase } from '@/lib/supabase';
import { AppError, toUserMessage } from '@/lib/errors';
import { systemTimezone } from '@/lib/date';
import type { Tables, TablesUpdate } from '@/types/database';
import { userSettingsSchema, type UserSettings } from './schema';

/**
 * Settings and profile rows are created by the `handle_new_user` trigger. These
 * readers still self-heal a missing row, so an account created before the
 * trigger existed (or by an admin) does not land in a broken app.
 */
export async function fetchSettings(userId: string): Promise<UserSettings> {
  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw new AppError(toUserMessage(error), error);

  const row = data ?? (await createDefaultSettings(userId));
  const parsed = userSettingsSchema.safeParse(row);
  if (parsed.success) return parsed.data;

  // A stored timezone the browser no longer recognises should not brick the
  // app, so fall back to the device's and let the user correct it in settings.
  return userSettingsSchema.parse({ ...row, timezone: systemTimezone() });
}

async function createDefaultSettings(userId: string) {
  const { data, error } = await supabase
    .from('user_settings')
    .insert({ user_id: userId, timezone: systemTimezone() })
    .select('*')
    .single();

  if (error) throw new AppError(toUserMessage(error), error);
  return data;
}

export async function updateSettings(userId: string, patch: TablesUpdate<'user_settings'>) {
  const { data, error } = await supabase
    .from('user_settings')
    .update(patch)
    .eq('user_id', userId)
    .select('*')
    .single();

  if (error) throw new AppError(toUserMessage(error), error);
  return userSettingsSchema.parse(data);
}

export async function fetchProfile(userId: string): Promise<Tables<'profiles'>> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw new AppError(toUserMessage(error), error);
  if (data) return data;

  const created = await supabase
    .from('profiles')
    .insert({ id: userId })
    .select('*')
    .single();

  if (created.error) throw new AppError(toUserMessage(created.error), created.error);
  return created.data;
}

export async function updateProfile(userId: string, patch: TablesUpdate<'profiles'>) {
  const { data, error } = await supabase
    .from('profiles')
    .update(patch)
    .eq('id', userId)
    .select('*')
    .single();

  if (error) throw new AppError(toUserMessage(error), error);
  return data;
}
