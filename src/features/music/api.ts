import { supabase } from '@/lib/supabase';
import { AppError, toUserMessage } from '@/lib/errors';
import type { MusicFormat, Tables } from '@/types/database';

export type MusicItem = Tables<'music_items'>;

export async function listMusicItems(userId: string): Promise<MusicItem[]> {
  const { data, error } = await supabase
    .from('music_items')
    .select('*')
    .eq('user_id', userId)
    .order('artist', { ascending: true, nullsFirst: false })
    .order('title', { ascending: true });

  if (error) throw new AppError(toUserMessage(error), error);
  return data ?? [];
}

export interface MusicItemInput {
  title: string;
  artist: string | null;
  format: MusicFormat;
  releaseYear: number | null;
  notes: string | null;
}

function toRow(input: MusicItemInput) {
  return {
    title: input.title.trim(),
    artist: input.artist?.trim() ? input.artist.trim() : null,
    format: input.format,
    release_year: input.releaseYear,
    notes: input.notes?.trim() ? input.notes.trim() : null,
  };
}

export async function createMusicItem(
  userId: string,
  input: MusicItemInput,
): Promise<MusicItem> {
  const { data, error } = await supabase
    .from('music_items')
    .insert({ user_id: userId, ...toRow(input) })
    .select('*')
    .single();

  if (error) throw new AppError(toUserMessage(error), error);
  return data;
}

export async function updateMusicItem(id: string, input: MusicItemInput): Promise<MusicItem> {
  const { data, error } = await supabase
    .from('music_items')
    .update(toRow(input))
    .eq('id', id)
    .select('*')
    .single();

  if (error) throw new AppError(toUserMessage(error), error);
  return data;
}

export async function deleteMusicItem(id: string): Promise<void> {
  const { error } = await supabase.from('music_items').delete().eq('id', id);
  if (error) throw new AppError(toUserMessage(error), error);
}
