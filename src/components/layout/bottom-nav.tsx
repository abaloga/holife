import { NavLink, useLocation } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import { CircleGauge, Ellipsis, Plus, Sun, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import { transitions } from '@/lib/motion';
import { useQuickAdd } from '@/features/quick-add/quick-add-context';

interface NavItem {
  to: string;
  label: string;
  icon: typeof Sun;
  /** Paths that should also light this tab up. */
  match: (pathname: string) => boolean;
}

const ITEMS: NavItem[] = [
  { to: '/', label: 'Today', icon: Sun, match: (path) => path === '/' },
  {
    to: '/track/weight',
    label: 'Track',
    icon: CircleGauge,
    match: (path) => path.startsWith('/track'),
  },
  {
    to: '/plan/habits',
    label: 'Plan',
    icon: Target,
    match: (path) => path.startsWith('/plan'),
  },
  {
    to: '/more',
    label: 'More',
    icon: Ellipsis,
    match: (path) => path.startsWith('/more') || path.startsWith('/settings'),
  },
];

/**
 * Phone navigation. Four destinations plus a central Add action, sized so every
 * target clears 44px and the row sits above the home indicator.
 */
export function BottomNav() {
  const { pathname } = useLocation();
  const { open } = useQuickAdd();
  const reduceMotion = useReducedMotion();

  const [left, right] = [ITEMS.slice(0, 2), ITEMS.slice(2)];

  const renderItem = (item: NavItem) => {
    const active = item.match(pathname);
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
        {left.map(renderItem)}

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

        {right.map(renderItem)}
      </div>
    </nav>
  );
}
