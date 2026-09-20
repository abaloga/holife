import { Suspense } from 'react';
import { Plus } from 'lucide-react';
import { PageBody, PageHeader } from '@/components/layout/page';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDateKey } from '@/lib/date';
import { APPS } from '@/app/apps';
import { APP_SURFACES } from '@/app/app-surfaces';
import { usePreferences } from '@/features/settings/hooks';
import { useQuickAdd } from '@/features/quick-add/quick-add-context';

/**
 * The cross-app view of one day.
 *
 * It holds no knowledge of what any app measures. It just renders whatever
 * widgets the registry offers, in app order. An app that says nothing today
 * renders nothing, and a new app appears here by adding one entry to
 * `APP_SURFACES`.
 */
export function TodayPage() {
  const { today } = usePreferences();
  const { open: openQuickAdd } = useQuickAdd();

  const widgets = APPS.flatMap((app) => {
    const Widget = APP_SURFACES[app.id]?.widget;
    return Widget ? [{ id: app.id, Widget }] : [];
  });

  return (
    <>
      <PageHeader
        title="Today"
        subtitle={<time dateTime={today}>{formatDateKey(today, 'EEEE d MMMM')}</time>}
        action={
          <Button
            size="icon-sm"
            variant="ghost"
            onClick={() => openQuickAdd()}
            aria-label="Add an entry"
            className="md:hidden"
          >
            <Plus aria-hidden />
          </Button>
        }
      />

      <PageBody>
        {widgets.map(({ id, Widget }) => (
          <Suspense key={id} fallback={<WidgetFallback />}>
            <Widget />
          </Suspense>
        ))}
      </PageBody>
    </>
  );
}

function WidgetFallback() {
  return (
    <div className="mt-7 space-y-3 first:mt-0">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-20 w-full rounded-xl" />
    </div>
  );
}
