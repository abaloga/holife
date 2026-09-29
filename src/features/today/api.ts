import { supabase } from '@/lib/supabase';
import { AppError, toUserMessage } from '@/lib/errors';
import type { Tables } from '@/types/database';

export type DashboardWidgetRow = Tables<'dashboard_widgets'>;

export async function listDashboardWidgets(userId: string): Promise<DashboardWidgetRow[]> {
  const { data, error } = await supabase
    .from('dashboard_widgets')
    .select('*')
    .eq('user_id', userId)
    .order('sort_order', { ascending: true });

  if (error) throw new AppError(toUserMessage(error), error);
  return data ?? [];
}

export async function addDashboardWidget(
  userId: string,
  widgetKey: string,
  sortOrder: number,
): Promise<DashboardWidgetRow> {
  const { data, error } = await supabase
    .from('dashboard_widgets')
    .insert({ user_id: userId, widget_key: widgetKey, sort_order: sortOrder })
    .select('*')
    .single();

  if (error) throw new AppError(toUserMessage(error), error);
  return data;
}

export async function removeDashboardWidget(id: string): Promise<void> {
  const { error } = await supabase.from('dashboard_widgets').delete().eq('id', id);
  if (error) throw new AppError(toUserMessage(error), error);
}
