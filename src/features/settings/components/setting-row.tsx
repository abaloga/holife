import * as React from 'react';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/field';

interface SettingRowProps {
  label: string;
  description?: string;
  htmlFor?: string;
  /** Put the control under the label instead of beside it. */
  stacked?: boolean;
  children: React.ReactNode;
}

/** One consistent row shape for every setting, so the page reads as a list. */
export function SettingRow({ label, description, htmlFor, stacked, children }: SettingRowProps) {
  return (
    <div
      className={cn(
        'px-3.5 py-3',
        stacked ? 'space-y-2' : 'flex items-center justify-between gap-4',
      )}
    >
      <div className="min-w-0">
        <Label htmlFor={htmlFor}>{label}</Label>
        {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
      </div>
      <div className={cn(stacked ? 'w-full' : 'shrink-0')}>{children}</div>
    </div>
  );
}
