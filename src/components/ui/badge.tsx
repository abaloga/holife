import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[0.6875rem] font-medium leading-4 whitespace-nowrap [&_svg]:size-3',
  {
    variants: {
      variant: {
        default: 'bg-subtle text-subtle-foreground',
        outline: 'border border-border text-muted-foreground',
        accent: 'bg-accent-subtle text-accent',
        solid: 'bg-primary text-primary-foreground',
        destructive: 'bg-destructive/12 text-destructive',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
