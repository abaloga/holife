import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useScrolled } from '@/hooks/use-scrolled';

interface PageHeaderProps {
  title: string;
  /** A short line under the title: a date, a count, a state. */
  subtitle?: React.ReactNode;
  /** Shows a back affordance. Pass a path, or `true` for history back. */
  back?: string | true;
  action?: React.ReactNode;
  /** Renders below the title row and scrolls away with it. */
  children?: React.ReactNode;
}

/**
 * The standard mobile header: a large title that stays put, a hairline that
 * only appears once content is behind it, and a top inset that clears the
 * notch. Titles are left-aligned rather than centred because the app is
 * one-handed and the left edge is the reading anchor.
 */
export function PageHeader({ title, subtitle, back, action, children }: PageHeaderProps) {
  const navigate = useNavigate();
  const scrolled = useScrolled();

  return (
    <header
      className={cn(
        'sticky top-0 z-30 bg-background pt-[max(0.5rem,env(safe-area-inset-top))]',
        'transition-shadow duration-200',
        scrolled && 'border-b border-border',
      )}
    >
      <div className="page-x flex items-start gap-3 pb-3 pt-2">
        {back && (
          <button
            type="button"
            onClick={() => (typeof back === 'string' ? navigate(back) : navigate(-1))}
            aria-label="Go back"
            className={cn(
              '-ml-2 mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg text-muted-foreground',
              'transition-colors hover:bg-subtle hover:text-foreground active:scale-95',
            )}
          >
            <ChevronLeft className="size-5" aria-hidden />
          </button>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-[1.5rem] font-semibold leading-tight tracking-[-0.02em]">
            {title}
          </h1>
          {subtitle && (
            <div className="mt-0.5 text-[0.8125rem] text-muted-foreground">{subtitle}</div>
          )}
        </div>
        {action && <div className="mt-0.5 flex shrink-0 items-center gap-1.5">{action}</div>}
      </div>
      {children && <div className="page-x pb-3">{children}</div>}
    </header>
  );
}

/**
 * Page body. The bottom padding clears the tab bar and the home indicator so
 * the last row of any list is always reachable and never sits under the nav.
 */
export function PageBody({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        'page-x mx-auto w-full max-w-2xl pt-1',
        'pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-10',
        'lg:max-w-4xl',
        className,
      )}
    >
      {children}
    </div>
  );
}
