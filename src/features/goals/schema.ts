import { z } from 'zod';
import { isDateKey } from '@/lib/date';
import { optionalText } from '@/lib/validation';

export const goalFormSchema = z
  .object({
    title: z.string().trim().min(1, 'Give the goal a title').max(160, 'That title is a little long'),
    description: optionalText(2000, 'Keep the description under 2000 characters'),
    targetDate: z
      .string()
      .refine((value) => value === '' || isDateKey(value), 'Pick a valid date')
      .default(''),
    status: z.enum(['active', 'paused', 'achieved', 'archived']),
    measurable: z.boolean(),
    startValue: z.number().nullable().default(null),
    currentValue: z.number().nullable().default(null),
    targetValue: z.number().nullable().default(null),
    unit: optionalText(24, 'Keep the unit short'),
  })
  .superRefine((values, context) => {
    if (values.measurable && values.targetValue == null) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['targetValue'],
        message: 'Enter the number you are aiming for.',
      });
    }
  });

export type GoalFormValues = z.infer<typeof goalFormSchema>;
