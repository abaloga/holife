import { supabase } from '@/lib/supabase';
import { AppError, toUserMessage } from '@/lib/errors';
import { zonedDateTimeToInstant, type DateKey } from '@/lib/date';
import type { Tables } from '@/types/database';

export type WeightEntry = Tables<'weight_entries'>;

export async function listWeightEntries(userId: string, limit: number): Promise<WeightEntry[]> {
  const { data, error } = await supabase
    .from('weight_entries')
    .select('*')
    .eq('user_id', userId)
    .order('local_date', { ascending: false })
    .order('measured_at', { ascending: false })
    .limit(limit);

  if (error) throw new AppError(toUserMessage(error), error);
  return data ?? [];
}

export interface WeightEntryInput {
  weightKg: number;
  date: DateKey;
  note?: string | null;
  timezone: string;
}

export async function createWeightEntry(
  userId: string,
  { weightKg, date, note, timezone }: WeightEntryInput,
): Promise<WeightEntry> {
  // Back-dated entries get the current time of day, which keeps `measured_at`
  // plausible without asking the user for a time they don't remember.
  const measuredAt = zonedDateTimeToInstant(date, null, timezone);

  const { data, error } = await supabase
    .from('weight_entries')
    .insert({
      user_id: userId,
      weight_kg: weightKg,
      local_date: date,
      measured_at: measuredAt.toISOString(),
      note: note?.trim() ? note.trim() : null,
    })
    .select('*')
    .single();

  if (error) throw new AppError(toUserMessage(error), error);
  return data;
}

export async function updateWeightEntry(
  id: string,
  { weightKg, date, note, timezone }: WeightEntryInput,
): Promise<WeightEntry> {
  const measuredAt = zonedDateTimeToInstant(date, null, timezone);

  const { data, error } = await supabase
    .from('weight_entries')
    .update({
      weight_kg: weightKg,
      local_date: date,
      measured_at: measuredAt.toISOString(),
      note: note?.trim() ? note.trim() : null,
    })
    .eq('id', id)
    .select('*')
    .single();

  if (error) throw new AppError(toUserMessage(error), error);
  return data;
}

export async function deleteWeightEntry(id: string): Promise<void> {
  const { error } = await supabase.from('weight_entries').delete().eq('id', id);
  if (error) throw new AppError(toUserMessage(error), error);
}
