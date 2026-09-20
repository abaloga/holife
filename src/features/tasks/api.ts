import { supabase } from '@/lib/supabase';
import { AppError, toUserMessage } from '@/lib/errors';
import type { DateKey } from '@/lib/date';
import type { Tables } from '@/types/database';

export type Task = Tables<'tasks'>;

/**
 * Completed tasks older than this are not loaded. They still exist in the
 * database; the app just doesn't need an unbounded archive on screen.
 */
export const COMPLETED_TASK_LIMIT = 50;

export async function listTasks(userId: string): Promise<Task[]> {
  const [open, completed] = await Promise.all([
    supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .eq('is_completed', false)
      .order('due_date', { ascending: true, nullsFirst: false })
      .order('sort_order', { ascending: true }),
    supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .eq('is_completed', true)
      .order('completed_at', { ascending: false })
      .limit(COMPLETED_TASK_LIMIT),
  ]);

  if (open.error) throw new AppError(toUserMessage(open.error), open.error);
  if (completed.error) throw new AppError(toUserMessage(completed.error), completed.error);

  return [...(open.data ?? []), ...(completed.data ?? [])];
}

export interface TaskInput {
  title: string;
  notes?: string | null;
  dueDate: DateKey | null;
  dueTime: string | null;
  priority: number;
}

function toRow(input: TaskInput) {
  return {
    title: input.title.trim(),
    notes: input.notes?.trim() ? input.notes.trim() : null,
    due_date: input.dueDate,
    // The database rejects a time without a date; keep the pair consistent.
    due_time: input.dueDate ? input.dueTime : null,
    priority: input.priority,
  };
}

export async function createTask(userId: string, input: TaskInput): Promise<Task> {
  const { data, error } = await supabase
    .from('tasks')
    .insert({ user_id: userId, ...toRow(input) })
    .select('*')
    .single();

  if (error) throw new AppError(toUserMessage(error), error);
  return data;
}

export async function updateTask(id: string, input: TaskInput): Promise<Task> {
  const { data, error } = await supabase
    .from('tasks')
    .update(toRow(input))
    .eq('id', id)
    .select('*')
    .single();

  if (error) throw new AppError(toUserMessage(error), error);
  return data;
}

export async function setTaskCompleted(id: string, completed: boolean): Promise<Task> {
  const { data, error } = await supabase
    .from('tasks')
    .update({
      is_completed: completed,
      // The CHECK constraint keeps these two in step; so does this.
      completed_at: completed ? new Date().toISOString() : null,
    })
    .eq('id', id)
    .select('*')
    .single();

  if (error) throw new AppError(toUserMessage(error), error);
  return data;
}

export async function deleteTask(id: string): Promise<void> {
  const { error } = await supabase.from('tasks').delete().eq('id', id);
  if (error) throw new AppError(toUserMessage(error), error);
}
