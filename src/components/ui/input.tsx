import * as React from 'react';
import { cn } from '@/lib/utils';

export const inputClassName = cn(
  'flex h-11 w-full rounded-lg border border-input bg-card px-3 py-2',
  'text-[0.9375rem] text-foreground placeholder:text-muted-foreground',
  'transition-[border-color,box-shadow] duration-150',
  'hover:border-border-strong',
  'focus-visible:outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/20',
  'disabled:cursor-not-allowed disabled:opacity-50',
  'aria-invalid:border-destructive aria-invalid:ring-destructive/20',
);

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, type = 'text', ...props },
  ref,
) {
  return <input ref={ref} type={type} className={cn(inputClassName, className)} {...props} />;
});

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, rows = 3, ...props },
  ref,
) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      className={cn(inputClassName, 'h-auto min-h-[5rem] resize-y leading-relaxed', className)}
      {...props}
    />
  );
});
