import { MEAL_IMAGE_BUCKET, supabase } from '@/lib/supabase';
import { AppError, toUserMessage } from '@/lib/errors';
import { zonedDateTimeToInstant, type DateKey } from '@/lib/date';
import type { MacroSource, MealSlot, Tables } from '@/types/database';
import { isAcceptedImageType, MAX_IMAGE_BYTES } from './estimate-schema';
import type { EstimateConfidence } from '@/types/database';

export type MealEntry = Tables<'meal_entries'>;
export type NutritionTargets = Tables<'nutrition_targets'>;

/* -------------------------------------------------------------------------- */
/* Targets                                                                     */
/* -------------------------------------------------------------------------- */

export async function fetchTargets(userId: string): Promise<NutritionTargets> {
  const { data, error } = await supabase
    .from('nutrition_targets')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw new AppError(toUserMessage(error), error);
  if (data) return data;

  // Self-heals if the signup trigger didn't run for this account.
  const created = await supabase
    .from('nutrition_targets')
    .insert({ user_id: userId })
    .select('*')
    .single();

  if (created.error) throw new AppError(toUserMessage(created.error), created.error);
  return created.data;
}

export async function updateTargets(
  userId: string,
  values: { calories: number; protein_g: number; carbs_g: number; fat_g: number },
): Promise<NutritionTargets> {
  const { data, error } = await supabase
    .from('nutrition_targets')
    .update(values)
    .eq('user_id', userId)
    .select('*')
    .single();

  if (error) throw new AppError(toUserMessage(error), error);
  return data;
}

/* -------------------------------------------------------------------------- */
/* Meals                                                                       */
/* -------------------------------------------------------------------------- */

export async function listMealsForDate(userId: string, date: DateKey): Promise<MealEntry[]> {
  const { data, error } = await supabase
    .from('meal_entries')
    .select('*')
    .eq('user_id', userId)
    .eq('local_date', date)
    .order('eaten_at', { ascending: true });

  if (error) throw new AppError(toUserMessage(error), error);
  return data ?? [];
}

export interface MealInput {
  name: string;
  date: DateKey;
  time: string;
  slot: MealSlot | null;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  notes?: string | null;
  imagePath?: string | null;
  source: MacroSource;
  estimateConfidence?: EstimateConfidence | null;
  estimateAssumptions?: string[] | null;
  estimateModel?: string | null;
  timezone: string;
}

function toRow(userId: string, input: MealInput) {
  return {
    user_id: userId,
    name: input.name.trim(),
    local_date: input.date,
    eaten_at: zonedDateTimeToInstant(input.date, input.time, input.timezone).toISOString(),
    slot: input.slot,
    calories: input.calories,
    protein_g: input.protein,
    carbs_g: input.carbs,
    fat_g: input.fat,
    notes: input.notes?.trim() ? input.notes.trim() : null,
    image_path: input.imagePath ?? null,
    source: input.source,
    estimate_confidence: input.source === 'ai_estimate' ? (input.estimateConfidence ?? null) : null,
    estimate_assumptions: input.source === 'ai_estimate' ? (input.estimateAssumptions ?? null) : null,
    estimate_model: input.source === 'ai_estimate' ? (input.estimateModel ?? null) : null,
  };
}

export async function createMeal(userId: string, input: MealInput): Promise<MealEntry> {
  const { data, error } = await supabase
    .from('meal_entries')
    .insert(toRow(userId, input))
    .select('*')
    .single();

  if (error) throw new AppError(toUserMessage(error), error);
  return data;
}

export async function updateMeal(
  userId: string,
  id: string,
  input: MealInput,
): Promise<MealEntry> {
  const { user_id: _userId, ...patch } = toRow(userId, input);

  const { data, error } = await supabase
    .from('meal_entries')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single();

  if (error) throw new AppError(toUserMessage(error), error);
  return data;
}

export async function deleteMeal(meal: MealEntry): Promise<void> {
  const { error } = await supabase.from('meal_entries').delete().eq('id', meal.id);
  if (error) throw new AppError(toUserMessage(error), error);

  // Best effort: an orphaned image is untidy but not worth failing the delete.
  if (meal.image_path) await deleteMealImage(meal.image_path).catch(() => undefined);
}

/* -------------------------------------------------------------------------- */
/* Images                                                                      */
/* -------------------------------------------------------------------------- */

export function validateImage(file: File): string | null {
  if (!isAcceptedImageType(file.type)) {
    return 'Use a JPEG, PNG, WebP or HEIC image.';
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return `That image is ${(file.size / 1024 / 1024).toFixed(1)} MB. The limit is 8 MB.`;
  }
  return null;
}

/**
 * Object paths are always `<user_id>/<uuid>.<ext>`, which is exactly what the
 * storage policies key on: a user can only read or write under their own id.
 */
export async function uploadMealImage(userId: string, file: File): Promise<string> {
  const problem = validateImage(file);
  if (problem) throw new AppError(problem);

  const extension = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
  const path = `${userId}/${crypto.randomUUID()}.${extension}`;

  const { error } = await supabase.storage
    .from(MEAL_IMAGE_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });

  if (error) throw new AppError(toUserMessage(error), error);
  return path;
}

export async function createMealImageUrl(path: string, expiresInSeconds = 60 * 60) {
  const { data, error } = await supabase.storage
    .from(MEAL_IMAGE_BUCKET)
    .createSignedUrl(path, expiresInSeconds);

  if (error) throw new AppError(toUserMessage(error), error);
  return data.signedUrl;
}

export async function deleteMealImage(path: string): Promise<void> {
  const { error } = await supabase.storage.from(MEAL_IMAGE_BUCKET).remove([path]);
  if (error) throw new AppError(toUserMessage(error), error);
}
