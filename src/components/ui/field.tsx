import * as React from 'react';
import * as LabelPrimitive from '@radix-ui/react-label';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(function Label({ className, ...props }, ref) {
  return (
    <LabelPrimitive.Root
      ref={ref}
      className={cn(
        'text-[0.8125rem] font-medium text-foreground/90 select-none',
        'peer-disabled:opacity-60',
        className,
      )}
      {...props}
    />
  );
});

interface FieldProps {
  label?: React.ReactNode;
  /** Rendered next to the label — units, optional markers, inline actions. */
  aside?: React.ReactNode;
  hint?: React.ReactNode;
  error?: string;
  htmlFor?: string;
  className?: string;
  children: React.ReactNode;
}

/**
 * The single form-row layout. Keeping label/hint/error together here is what
 * makes every form in the app line up without per-screen spacing decisions.
 */
export function Field({ label, aside, hint, error, htmlFor, className, children }: FieldProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {(label || aside) && (
        <div className="flex items-baseline justify-between gap-3">
          {label ? <Label htmlFor={htmlFor}>{label}</Label> : <span />}
          {aside && <span className="text-xs text-muted-foreground">{aside}</span>}
        </div>
      )}
      {children}
      {error ? (
        <p className="flex items-start gap-1.5 text-xs text-destructive" role="alert">
          <AlertCircle className="mt-px size-3.5 shrink-0" aria-hidden />
          {error}
        </p>
      ) : (
        hint && <p className="text-xs text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}
