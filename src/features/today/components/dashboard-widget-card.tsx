import { Suspense } from 'react';
import { Link } from 'react-router-dom';
import { X, type LucideIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { appById, type AppDefinition } from '@/app/apps';
import type { DashboardWidgetDefinition } from '@/app/dashboard-widgets';

interface DashboardWidgetCardProps {
  definition: DashboardWidgetDefinition;
  onRemove: () => void;
}

/** One tile in Today's 2-column grid: a square card, sized by the grid, not its content. */
export function DashboardWidgetCard({ definition, onRemove }: DashboardWidgetCardProps) {
  const app = definition.appId ? appById(definition.appId) : undefined;
  const Icon = definition.icon ?? app?.icon;
  const Widget = definition.component;

  return (
    <div className="flex aspect-square flex-col rounded-xl border border-border bg-card p-3 shadow-card">
      <div className="mb-2 flex shrink-0 items-start justify-between gap-2">
        <TitleLink app={app} icon={Icon} tone={definition.tone ?? app?.tone} name={definition.name} />
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${definition.name} widget`}
          className="grid size-6 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-subtle hover:text-foreground"
        >
          <X className="size-3.5" aria-hidden />
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <Suspense fallback={<Skeleton className="h-full w-full rounded-lg" />}>
          <Widget />
        </Suspense>
      </div>
    </div>
  );
}

function TitleLink({
  app,
  icon: Icon,
  tone,
  name,
}: {
  app: AppDefinition | undefined;
  icon: LucideIcon | undefined;
  tone: string | undefined;
  name: string;
}) {
  const content = (
    <>
      {Icon && <Icon className={cn('size-3.5 shrink-0', tone)} aria-hidden />}
      <span className="truncate text-[0.8125rem] font-semibold leading-tight">{name}</span>
    </>
  );

  if (!app) {
    return <div className="flex min-w-0 items-center gap-1.5">{content}</div>;
  }

  return (
    <Link
      to={app.path}
      className="flex min-w-0 items-center gap-1.5 underline-offset-4 hover:underline"
    >
      {content}
    </Link>
  );
}
