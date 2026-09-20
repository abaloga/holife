import * as React from 'react';
import * as SwitchPrimitive from '@radix-ui/react-switch';
import { cn } from '@/lib/utils';

export const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>
>(function Switch({ className, ...props }, ref) {
  return (
    <SwitchPrimitive.Root
      ref={ref}
      className={cn(
        'peer inline-flex h-[1.625rem] w-[2.75rem] shrink-0 cursor-pointer items-center rounded-full',
        'border-2 border-transparent transition-colors duration-200',
        'data-[state=checked]:bg-accent data-[state=unchecked]:bg-input',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        className={cn(
          'pointer-events-none block size-[1.25rem] rounded-full bg-white shadow-sm ring-0',
          'transition-transform duration-200 ease-out',
          'data-[state=checked]:translate-x-[1.125rem] data-[state=unchecked]:translate-x-0',
        )}
      />
    </SwitchPrimitive.Root>
  );
});
