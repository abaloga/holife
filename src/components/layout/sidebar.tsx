import { NavLink } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MODULES } from '@/app/modules';
import { Button } from '@/components/ui/button';
import { Wordmark } from '@/components/common/wordmark';
import { useQuickAdd } from '@/features/quick-add/quick-add-context';

/**
 * From `md` up the tab bar is replaced by a persistent sidebar listing every
 * module flat. A wide screen has room to show the whole app at once, so it
 * shouldn't hide modules two taps deep behind "Track" and "Plan".
 */
export function Sidebar() {
  const { open } = useQuickAdd();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-border bg-background px-3 py-5 md:flex">
      <div className="px-2 pb-5">
        <Wordmark />
      </div>

      <Button onClick={() => open()} className="mb-5 justify-start gap-2" block>
        <Plus aria-hidden />
        Add entry
      </Button>

      <nav aria-label="Modules" className="flex-1 space-y-0.5 overflow-y-auto">
        {MODULES.filter((module) => module.section !== 'system').map((module) => (
          <SidebarLink key={module.id} to={module.path} icon={module.icon} label={module.label} />
        ))}
      </nav>

      <div className="space-y-0.5 border-t border-border pt-3">
        {MODULES.filter((module) => module.section === 'system').map((module) => (
          <SidebarLink key={module.id} to={module.path} icon={module.icon} label={module.label} />
        ))}
      </div>
    </aside>
  );
}

function SidebarLink({
  to,
  icon: Icon,
  label,
}: {
  to: string;
  icon: (typeof MODULES)[number]['icon'];
  label: string;
}) {
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
