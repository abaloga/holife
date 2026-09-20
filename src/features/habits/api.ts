import { supabase } from '@/lib/supabase';
import { AppError, toUserMessage } from '@/lib/errors';
import { zonedDateTimeToInstant, type DateKey } from '@/lib/date';
import type { HabitFrequency, Tables } from '@/types/database';

export type Habit = Tables<'habits'>;
export type HabitCompletion = Tables<'habit_completions'>;

export async function listHabits(userId: string): Promise<Habit[]> {
  const { data, error } = await supabase
    .from('habits')
    .select('*')
    .eq('user_id', userId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) throw new AppError(toUserMessage(error), error);
  return data ?? [];
}

export async function listCompletions(
  userId: string,
  from: DateKey,
  to: DateKey,
): Promise<HabitCompletion[]> {
  const { data, error } = await supabase
    .from('habit_completions')
    .select('*')
    .eq('user_id', userId)
    .gte('local_date', from)
    .lte('local_date', to);

  if (error) throw new AppError(toUserMessage(error), error);
  return data ?? [];
}

export interface HabitInput {
  name: string;
  description?: string | null;
  icon: string;
  frequency: HabitFrequency;
  daysOfWeek: number[];
  isActive?: boolean;
}

function toRow(input: HabitInput) {
  return {
    name: input.name.trim(),
    description: input.description?.trim() ? input.description.trim() : null,
    icon: input.icon,
    frequency: input.frequency,
    // The DB constraint requires an empty array for daily habits.
    days_of_week: input.frequency === 'days_of_week' ? [...new Set(input.daysOfWeek)].sort() : [],
    is_active: input.isActive ?? true,
  };
}

export async function createHabit(userId: string, input: HabitInput): Promise<Habit> {
  const { data, error } = await supabase
    .from('habits')
    .insert({ user_id: userId, ...toRow(input) })
    .select('*')
    .single();

  if (error) throw new AppError(toUserMessage(error), error);
  return data;
}

export async function updateHabit(id: string, input: HabitInput): Promise<Habit> {
  const { data, error } = await supabase
    .from('habits')
    .update(toRow(input))
    .eq('id', id)
    .select('*')
    .single();

  if (error) throw new AppError(toUserMessage(error), error);
  return data;
}

export async function deleteHabit(id: string): Promise<void> {
  const { error } = await supabase.from('habits').delete().eq('id', id);
  if (error) throw new AppError(toUserMessage(error), error);
}

export async function completeHabit(
  userId: string,
  habitId: string,
  date: DateKey,
  timezone: string,
): Promise<HabitCompletion> {
  const { data, error } = await supabase
    .from('habit_completions')
    .insert({
      user_id: userId,
      habit_id: habitId,
      local_date: date,
      completed_at: zonedDateTimeToInstant(date, null, timezone).toISOString(),
    })
    .select('*')
    .single();

  if (error) throw new AppError(toUserMessage(error), error);
  return data;
}

export async function uncompleteHabit(habitId: string, date: DateKey): Promise<void> {
  const { error } = await supabase
    .from('habit_completions')
    .delete()
    .eq('habit_id', habitId)
    .eq('local_date', date);

  if (error) throw new AppError(toUserMessage(error), error);
}
