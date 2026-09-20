import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Press feedback is a CSS transform rather than a motion component: it runs on
 * the compositor, costs nothing, and is disabled automatically by the global
 * reduced-motion rule.
 */
const buttonVariants = cva(
  [
    'relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg',
    'text-sm font-medium select-none',
    'transition-[background-color,color,border-color,box-shadow,transform,opacity] duration-150',
    'active:scale-[0.975] touch-manipulation',
    'disabled:pointer-events-none disabled:opacity-45',
    '[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*="size-"])]:size-[1.125rem]',
  ],
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-card',
        accent: 'bg-accent text-accent-foreground hover:bg-accent/90 shadow-card',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/70',
        outline: 'border border-border-strong bg-card hover:bg-subtle text-foreground',
        ghost: 'hover:bg-subtle text-foreground',
        subtle: 'bg-subtle text-foreground hover:bg-muted',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        link: 'text-foreground underline-offset-4 hover:underline active:scale-100',
      },
      size: {
        sm: 'h-9 px-3 text-[0.8125rem] rounded-md',
        default: 'h-11 px-4',
        lg: 'h-12 px-6 text-[0.9375rem]',
        icon: 'size-11',
        'icon-sm': 'size-9 rounded-md',
        'icon-lg': 'size-12',
      },
      block: {
        true: 'w-full',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  /** Shows a spinner and blocks interaction without changing the button width. */
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant, size, block, asChild = false, loading = false, children, disabled, ...props },
  ref,
) {
  const Comp = asChild ? Slot : 'button';

  if (asChild) {
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size, block, className }))}
        {...props}
      >
        {children}
      </Comp>
    );
  }

  return (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size, block, className }))}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && (
        <span className="absolute inset-0 grid place-items-center">
          <Loader2 className="size-[1.125rem] animate-spin" aria-hidden />
        </span>
      )}
      <span className={cn('contents', loading && 'invisible')}>{children}</span>
    </button>
  );
});

export { buttonVariants };
