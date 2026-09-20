import * as React from 'react';
import { cn } from '@/lib/utils';
import { inputClassName } from './input';

type NativeProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'>;

export interface DateFieldProps extends NativeProps {
  /** A date key, `yyyy-MM-dd`. */
  value: string;
  onValueChange: (value: string) => void;
}

/**
 * The native date input is deliberate: on iOS and Android it opens the system
 * picker, which is faster, fully accessible and more familiar than any custom
 * calendar we could ship, and it costs no bundle weight.
 */
export const DateField = React.forwardRef<HTMLInputElement, DateFieldProps>(function DateField(
  { value, onValueChange, className, ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      type="date"
      value={value}
      onChange={(event) => onValueChange(event.target.value)}
      className={cn(
        inputClassName,
        'tnum appearance-none',
        '[&::-webkit-date-and-time-value]:text-left',
        '[&::-webkit-calendar-picker-indicator]:cursor-pointer',
        '[&::-webkit-calendar-picker-indicator]:opacity-55',
        'hover:[&::-webkit-calendar-picker-indicator]:opacity-100',
        'dark:[&::-webkit-calendar-picker-indicator]:invert',
        className,
      )}
      {...props}
    />
  );
});

export interface TimeFieldProps extends NativeProps {
  /** `HH:mm`. */
  value: string;
  onValueChange: (value: string) => void;
}

export const TimeField = React.forwardRef<HTMLInputElement, TimeFieldProps>(function TimeField(
  { value, onValueChange, className, ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      type="time"
      value={value}
      onChange={(event) => onValueChange(event.target.value)}
      className={cn(
        inputClassName,
        'tnum appearance-none',
        '[&::-webkit-calendar-picker-indicator]:cursor-pointer',
        '[&::-webkit-calendar-picker-indicator]:opacity-55',
        'dark:[&::-webkit-calendar-picker-indicator]:invert',
        className,
      )}
      {...props}
    />
  );
});
