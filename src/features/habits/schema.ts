import { z } from 'zod';
import { optionalText } from '@/lib/validation';

export const habitFormSchema = z
  .object({
    name: z.string().trim().min(1, 'Give the habit a name').max(80, 'That name is a little long'),
    description: optionalText(500, 'Keep the description under 500 characters'),
    icon: z.string().min(1),
    frequency: z.enum(['daily', 'days_of_week']),
    daysOfWeek: z.array(z.number().int().min(0).max(6)),
    isActive: z.boolean(),
  })
  .superRefine((values, context) => {
    if (values.frequency === 'days_of_week' && values.daysOfWeek.length === 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['daysOfWeek'],
        message: 'Pick at least one day.',
      });
    }
  });

export type HabitFormValues = z.infer<typeof habitFormSchema>;
