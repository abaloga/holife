import { Link } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * One app's line in the Home summary strip. Apps render this only when they
 * have something worth saying, so an empty strip collapses to nothing.
 */
export function SummaryPill({
  to,
  icon: Icon,
  label,
  tone,
}: {
  to: string;
  icon: LucideIcon;
  label: string;
  tone?: string;
}) {
  return (
    <Link
      to={to}
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-card',
        'px-3 py-1.5 text-[0.8125rem] font-medium shadow-card',
        'transition-[background-color,transform] duration-150 hover:bg-subtle/60 active:scale-[0.97]',
      )}
    >
      <Icon className={cn('size-3.5 shrink-0', tone ?? 'text-muted-foreground')} aria-hidden />
      <span className="truncate">{label}</span>
    </Link>
  );
}
