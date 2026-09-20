import { z } from 'zod';
import { optionalText } from '@/lib/validation';

/** Matches the `release_year` check constraint in the migration. */
const EARLIEST_YEAR = 1877;
const LATEST_YEAR = 2100;

export const musicFormSchema = z.object({
  title: z.string().trim().min(1, 'Give the release a title').max(200, 'That title is a little long'),
  artist: optionalText(200, 'That artist name is a little long'),
  format: z.enum(['cd', 'cassette'], { required_error: 'Pick CD or cassette' }),
  releaseYear: z
    .number()
    .int('Years are whole numbers')
    .min(EARLIEST_YEAR, `Use a year from ${EARLIEST_YEAR} onwards`)
    .max(LATEST_YEAR, `Use a year up to ${LATEST_YEAR}`)
    .nullable()
    .default(null),
  notes: optionalText(1000, 'Keep the notes under 1000 characters'),
});

export type MusicFormValues = z.infer<typeof musicFormSchema>;
