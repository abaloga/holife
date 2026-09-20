import { supabase } from '@/lib/supabase';
import { AppError, toUserMessage } from '@/lib/errors';
import type { DateKey } from '@/lib/date';
import type { GoalStatus, Tables } from '@/types/database';

export type Goal = Tables<'goals'>;

export async function listGoals(userId: string): Promise<Goal[]> {
  const { data, error } = await supabase
    .from('goals')
    .select('*')
    .eq('user_id', userId)
    .order('status', { ascending: true })
    .order('target_date', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false });

  if (error) throw new AppError(toUserMessage(error), error);
  return data ?? [];
}

export interface GoalInput {
  title: string;
  description?: string | null;
  targetDate: DateKey | null;
  status: GoalStatus;
  startValue: number | null;
  targetValue: number | null;
  currentValue: number | null;
  unit: string | null;
}

function toRow(input: GoalInput) {
  const quantitative = input.targetValue != null;

  return {
    title: input.title.trim(),
    description: input.description?.trim() ? input.description.trim() : null,
    target_date: input.targetDate,
    status: input.status,
    start_value: quantitative ? input.startValue : null,
    target_value: input.targetValue,
    // The DB requires a current value whenever a target exists; default it to
    // the starting point so a new goal reads as 0% rather than as broken.
    current_value: quantitative ? (input.currentValue ?? input.startValue ?? 0) : null,
    unit: quantitative && input.unit?.trim() ? input.unit.trim() : null,
    completed_at: input.status === 'achieved' ? new Date().toISOString() : null,
  };
}

export async function createGoal(userId: string, input: GoalInput): Promise<Goal> {
  const { data, error } = await supabase
    .from('goals')
    .insert({ user_id: userId, ...toRow(input) })
    .select('*')
    .single();

  if (error) throw new AppError(toUserMessage(error), error);
  return data;
}

export async function updateGoal(id: string, input: GoalInput): Promise<Goal> {
  const { data, error } = await supabase
    .from('goals')
    .update(toRow(input))
    .eq('id', id)
    .select('*')
    .single();

  if (error) throw new AppError(toUserMessage(error), error);
  return data;
}

/** Nudging progress from the goal list, without opening the whole form. */
export async function setGoalProgress(id: string, currentValue: number): Promise<Goal> {
  const { data, error } = await supabase
    .from('goals')
    .update({ current_value: currentValue })
    .eq('id', id)
    .select('*')
    .single();

  if (error) throw new AppError(toUserMessage(error), error);
  return data;
}

export async function setGoalStatus(id: string, status: GoalStatus): Promise<Goal> {
  const { data, error } = await supabase
    .from('goals')
    .update({
      status,
      completed_at: status === 'achieved' ? new Date().toISOString() : null,
    })
    .eq('id', id)
    .select('*')
    .single();

  if (error) throw new AppError(toUserMessage(error), error);
  return data;
}

export async function deleteGoal(id: string): Promise<void> {
  const { error } = await supabase.from('goals').delete().eq('id', id);
  if (error) throw new AppError(toUserMessage(error), error);
}
