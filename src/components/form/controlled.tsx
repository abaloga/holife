import { Controller, type Control, type FieldPath, type FieldValues } from 'react-hook-form';
import { NumberField, type NumberFieldProps } from '@/components/ui/number-field';
import { DateField, TimeField, type DateFieldProps } from '@/components/ui/date-field';
import { SegmentedControl, type SegmentedOption } from '@/components/ui/segmented-control';

/**
 * Thin bindings between React Hook Form and the controlled inputs in this app.
 *
 * Without these every form repeats the same `<Controller render={...}>` block
 * four or five times, which buries what each form is actually doing.
 */

interface ControlProps<T extends FieldValues> {
  control: Control<T>;
  name: FieldPath<T>;
}

export function ControlledNumber<T extends FieldValues>({
  control,
  name,
  ...props
}: ControlProps<T> & Omit<NumberFieldProps, 'value' | 'onValueChange'>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <NumberField
          {...props}
          value={(field.value as number | null) ?? null}
          onValueChange={field.onChange}
          onBlur={field.onBlur}
        />
      )}
    />
  );
}

export function ControlledDate<T extends FieldValues>({
  control,
  name,
  ...props
}: ControlProps<T> & Omit<DateFieldProps, 'value' | 'onValueChange'>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <DateField
          {...props}
          value={(field.value as string | null) ?? ''}
          onValueChange={(value) => field.onChange(value)}
          onBlur={field.onBlur}
        />
      )}
    />
  );
}

export function ControlledTime<T extends FieldValues>({
  control,
  name,
  ...props
}: ControlProps<T> & Omit<DateFieldProps, 'value' | 'onValueChange'>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <TimeField
          {...props}
          value={(field.value as string | null) ?? ''}
          onValueChange={(value) => field.onChange(value)}
          onBlur={field.onBlur}
        />
      )}
    />
  );
}

export function ControlledSegmented<T extends FieldValues, V extends string>({
  control,
  name,
  options,
  ...props
}: ControlProps<T> & {
  options: SegmentedOption<V>[];
  'aria-label': string;
  className?: string;
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <SegmentedControl
          {...props}
          options={options}
          value={field.value as V}
          onValueChange={(value) => field.onChange(value)}
        />
      )}
    />
  );
}
