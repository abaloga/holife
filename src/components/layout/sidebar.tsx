import { NavLink } from 'react-router-dom';
import { LayoutGrid, Plus, Sun, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CATEGORY_LABELS, appsInCategory, populatedCategories } from '@/app/apps';
import { Button } from '@/components/ui/button';
import { Wordmark } from '@/components/common/wordmark';
import { useQuickAdd } from '@/features/quick-add/quick-add-context';

/**
 * From `md` up the tab bar is replaced by a persistent sidebar listing every
 * app under its category. A wide screen has room to show the whole library at
 * once, so it shouldn't make you go back to the launcher to switch apps.
 */
export function Sidebar() {
  const { open } = useQuickAdd();
  const categories = populatedCategories();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-border bg-background px-3 py-5 md:flex">
      <div className="px-2 pb-5">
        <Wordmark />
      </div>

      <Button onClick={() => open()} className="mb-5 justify-start gap-2" block>
        <Plus aria-hidden />
        Add entry
      </Button>

      <nav aria-label="Apps" className="flex-1 space-y-4 overflow-y-auto">
        <div className="space-y-0.5">
          <SidebarLink to="/" icon={LayoutGrid} label="Home" />
          <SidebarLink to="/today" icon={Sun} label="Today" />
        </div>

        {categories.map((category) => (
          <div key={category} className="space-y-0.5">
            <p className="px-2.5 pb-1 text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground/70">
              {CATEGORY_LABELS[category]}
            </p>
            {appsInCategory(category).map((app) => (
              <SidebarLink key={app.id} to={app.path} icon={app.icon} label={app.name} />
            ))}
          </div>
        ))}
      </nav>
    </aside>
  );
}

function SidebarLink({ to, icon: Icon, label }: { to: string; icon: LucideIcon; label: string }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors duration-150',
          isActive
            ? 'bg-subtle text-foreground'
            : 'text-muted-foreground hover:bg-subtle/60 hover:text-foreground',
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon className={cn('size-[1.125rem]', isActive && 'text-accent')} aria-hidden />
          {label}
        </>
      )}
    </NavLink>
  );
}
