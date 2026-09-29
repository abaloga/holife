import { useMemo, useState } from 'react';
import { LayoutGrid, Plus } from 'lucide-react';
import { PageBody, PageHeader } from '@/components/layout/page';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog } from '@/components/ui/dialog';
import { formatDateKey } from '@/lib/date';
import { DASHBOARD_WIDGETS, dashboardWidgetByKey } from '@/app/dashboard-widgets';
import { usePreferences } from '@/features/settings/hooks';
import { useQuickAdd } from '@/features/quick-add/quick-add-context';
import { useAddDashboardWidget, useDashboardWidgets, useRemoveDashboardWidget } from './hooks';
import { WidgetPicker } from './components/widget-picker';
import { DashboardWidgetCard } from './components/dashboard-widget-card';

/**
 * Today is a dashboard the user builds, not one the app fills in for them.
 * It holds no knowledge of what any app measures: it just renders whichever
 * chart widgets the user has added, in the order they added them, and offers
 * a way to add more. An app with no widget on it says nothing here.
 */
export function TodayPage() {
  const { today } = usePreferences();
  const { open: openQuickAdd } = useQuickAdd();
  const { widgets: saved, isLoading } = useDashboardWidgets();
  const addWidget = useAddDashboardWidget();
  const removeWidget = useRemoveDashboardWidget();
  const [pickerOpen, setPickerOpen] = useState(false);

  const added = useMemo(
    () =>
      saved.flatMap((row) => {
        const definition = dashboardWidgetByKey(row.widget_key);
        return definition ? [{ row, definition }] : [];
      }),
    [saved],
  );

  const available = useMemo(() => {
    const addedKeys = new Set(saved.map((row) => row.widget_key));
    return DASHBOARD_WIDGETS.filter((widget) => !addedKeys.has(widget.key));
  }, [saved]);

  const handleAdd = (key: string) => {
    addWidget.mutate(key);
    setPickerOpen(false);
  };

  return (
    <>
      <PageHeader
        title="Today"
        subtitle={<time dateTime={today}>{formatDateKey(today, 'EEEE d MMMM')}</time>}
        action={
          <>
            {added.length > 0 && available.length > 0 && (
              <Button
                size="icon-sm"
                variant="ghost"
                onClick={() => setPickerOpen(true)}
                aria-label="Add a widget"
              >
                <LayoutGrid aria-hidden />
              </Button>
            )}
            <Button
              size="icon-sm"
              variant="ghost"
              onClick={() => openQuickAdd()}
              aria-label="Add an entry"
              className="md:hidden"
            >
              <Plus aria-hidden />
            </Button>
          </>
        }
      />

      <PageBody>
        {isLoading && <WidgetFallback />}

        {!isLoading && added.length === 0 && (
          <div className="flex flex-col items-center gap-5 py-14 text-center">
            <p className="max-w-[26ch] text-sm text-muted-foreground">
              Your dashboard is empty. Add a widget from any of your apps to see your data as
              charts.
            </p>
            <WidgetPicker widgets={DASHBOARD_WIDGETS} onAdd={handleAdd} className="w-full" />
          </div>
        )}

        {!isLoading && added.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            {added.map(({ row, definition }) => (
              <DashboardWidgetCard
                key={row.id}
                definition={definition}
                onRemove={() => removeWidget.mutate(row.id)}
              />
            ))}
          </div>
        )}
      </PageBody>

      <Dialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        title="Add a widget"
        description="Pick something to add to Today."
      >
        <WidgetPicker widgets={available} onAdd={handleAdd} />
      </Dialog>
    </>
  );
}

function WidgetFallback() {
  return (
    <div className="grid grid-cols-2 gap-3">
      <Skeleton className="aspect-square w-full rounded-xl" />
      <Skeleton className="aspect-square w-full rounded-xl" />
    </div>
  );
}
