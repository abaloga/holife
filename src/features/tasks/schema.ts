import { z } from 'zod';
import { isDateKey } from '@/lib/date';
import { optionalText } from '@/lib/validation';

export const taskFormSchema = z.object({
  title: z.string().trim().min(1, 'Give the task a title').max(200, 'That title is a little long'),
  notes: optionalText(2000, 'Keep notes under 2000 characters'),
  dueDate: z
    .string()
    .refine((value) => value === '' || isDateKey(value), 'Pick a valid date')
    .nullable(),
  dueTime: z
    .string()
    .refine((value) => value === '' || /^\d{2}:\d{2}$/.test(value), 'Pick a valid time')
    .default(''),
  // Held as a string because the segmented control speaks strings; converted
  // once, at the edge, when the task is written.
  priority: z.enum(['0', '1', '2', '3']),
});

export type TaskFormValues = z.infer<typeof taskFormSchema>;
