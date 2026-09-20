import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SectionHeaderProps {
  title: string;
  /** Short supporting line. Keep it factual; this is not a place for copy. */
  meta?: React.ReactNode;
  /** A "see all" destination. Renders the whole header as a link on mobile. */
  to?: string;
  action?: React.ReactNode;
  className?: string;
}

/**
 * Sections are separated by a heading and whitespace rather than by a card.
 * Cards are reserved for things that genuinely need a surface of their own.
 */
export function SectionHeader({ title, meta, to, action, className }: SectionHeaderProps) {
  const heading = (
    <div className="flex min-w-0 items-baseline gap-2">
      <h2 className="text-[0.8125rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        {title}
      </h2>
      {meta && <span className="truncate text-xs text-muted-foreground/80">{meta}</span>}
    </div>
  );

  return (
    <div className={cn('mb-3 flex items-center justify-between gap-3', className)}>
      {to ? (
        <Link
          to={to}
          className="group flex min-w-0 items-center gap-1 rounded-sm focus-visible:outline-offset-4"
        >
          {heading}
          <ChevronRight
            className="size-3.5 shrink-0 text-muted-foreground/60 transition-transform duration-150 group-hover:translate-x-0.5"
            aria-hidden
          />
        </Link>
      ) : (
        heading
      )}
      {action}
    </div>
  );
}

export function Section({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  return (
    <section className={cn('mt-7 first:mt-0', className)} {...props}>
      {children}
    </section>
  );
}
