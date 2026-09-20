import { NavLink, useLocation } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import { LayoutGrid, Plus, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';
import { transitions } from '@/lib/motion';
import { useQuickAdd } from '@/features/quick-add/quick-add-context';

interface NavItem {
  to: string;
  label: string;
  icon: typeof Sun;
}

/**
 * Only the two shell surfaces live here. Everything else is an app you open
 * from Home, so the tab bar stays the same size no matter how many apps exist.
 */
const ITEMS: NavItem[] = [
  { to: '/', label: 'Home', icon: LayoutGrid },
  { to: '/today', label: 'Today', icon: Sun },
];

export function BottomNav() {
  const { pathname } = useLocation();
  const { open } = useQuickAdd();
  const reduceMotion = useReducedMotion();

  const renderItem = (item: NavItem) => {
    const active = item.to === '/' ? pathname === '/' : pathname.startsWith(item.to);
    const Icon = item.icon;

    return (
      <NavLink
        key={item.to}
        to={item.to}
        aria-current={active ? 'page' : undefined}
        className={cn(
          'relative flex flex-1 flex-col items-center justify-center gap-1 rounded-lg py-1.5',
          'transition-colors duration-150',
          active ? 'text-foreground' : 'text-muted-foreground',
        )}
      >
        {active && (
          <motion.span
            layoutId={reduceMotion ? undefined : 'bottom-nav-indicator'}
            className="absolute -top-px h-0.5 w-8 rounded-full bg-accent"
            transition={transitions.spring}
          />
        )}
        <Icon className={cn('size-[1.3rem]', active && 'text-accent')} aria-hidden />
        <span className="text-[0.6875rem] font-medium leading-none">{item.label}</span>
      </NavLink>
    );
  };

  return (
    <nav
      aria-label="Primary"
      className={cn(
        'fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background md:hidden',
        'pb-[env(safe-area-inset-bottom)]',
      )}
    >
      <div className="mx-auto flex h-16 max-w-md items-stretch px-2">
        {renderItem(ITEMS[0])}

        <div className="flex w-16 shrink-0 items-center justify-center">
          <button
            type="button"
            onClick={() => open()}
            aria-label="Add an entry"
            className={cn(
              'grid size-12 -translate-y-3 place-items-center rounded-full',
              'bg-primary text-primary-foreground shadow-raised',
              'transition-transform duration-150 active:scale-90',
            )}
          >
            <Plus className="size-6" aria-hidden />
          </button>
        </div>

        {renderItem(ITEMS[1])}
      </div>
    </nav>
  );
}
