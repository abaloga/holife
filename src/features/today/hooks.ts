import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useUserId } from '@/features/auth/auth-context';
import { queryKeys } from '@/lib/query-keys';
import {
  addDashboardWidget,
  listDashboardWidgets,
  removeDashboardWidget,
  type DashboardWidgetRow,
} from './api';

export function useDashboardWidgets() {
  const userId = useUserId();
  const query = useQuery({
    queryKey: queryKeys.dashboardWidgets.list(userId),
    queryFn: () => listDashboardWidgets(userId),
  });

  return {
    widgets: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
  };
}

function useInvalidateDashboardWidgets() {
  const userId = useUserId();
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: queryKeys.dashboardWidgets.root(userId) });
}

export function useAddDashboardWidget() {
  const userId = useUserId();
  const queryClient = useQueryClient();
  const invalidate = useInvalidateDashboardWidgets();
  const key = queryKeys.dashboardWidgets.list(userId);

  return useMutation({
    mutationFn: (widgetKey: string) => {
      const current = queryClient.getQueryData<DashboardWidgetRow[]>(key) ?? [];
      const nextOrder = current.reduce((max, row) => Math.max(max, row.sort_order), -1) + 1;
      return addDashboardWidget(userId, widgetKey, nextOrder);
    },
    onSuccess: invalidate,
  });
}

export function useRemoveDashboardWidget() {
  const invalidate = useInvalidateDashboardWidgets();

  return useMutation({
    mutationFn: (id: string) => removeDashboardWidget(id),
    onSuccess: invalidate,
  });
}
