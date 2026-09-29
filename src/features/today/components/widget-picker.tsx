import { LayoutGrid } from 'lucide-react';
import { cn } from '@/lib/utils';
import { appById } from '@/app/apps';
import type { DashboardWidgetDefinition } from '@/app/dashboard-widgets';

interface WidgetPickerProps {
  widgets: DashboardWidgetDefinition[];
  onAdd: (key: string) => void;
  pendingKey?: string | null;
  className?: string;
}

/**
 * A grid of widgets not yet on the dashboard. Used both inline, in Today's
 * empty state, and inside the "Add widget" dialog once the dashboard already
 * has something on it — same list, same behaviour, different container.
 */
export function WidgetPicker({ widgets, onAdd, pendingKey, className }: WidgetPickerProps) {
  if (widgets.length === 0) {
    return (
      <p className="text-center text-sm text-muted-foreground">
        Every widget is already on your dashboard.
      </p>
    );
  }

  return (
    <div className={cn('grid gap-2 sm:grid-cols-2', className)}>
      {widgets.map((widget) => {
        const app = widget.appId ? appById(widget.appId) : undefined;
        const Icon = widget.icon ?? app?.icon ?? LayoutGrid;
        const tone = widget.tone ?? app?.tone;

        return (
          <button
            key={widget.key}
            type="button"
            onClick={() => onAdd(widget.key)}
            disabled={pendingKey === widget.key}
            className={cn(
              'flex items-start gap-3 rounded-xl border border-border bg-card p-3.5 text-left',
              'transition-colors duration-150 hover:bg-subtle/60 active:scale-[0.98]',
              'disabled:pointer-events-none disabled:opacity-60',
            )}
          >
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-subtle">
              <Icon className={cn('size-4', tone)} aria-hidden />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-medium">{widget.name}</span>
              <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
                {widget.description}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
