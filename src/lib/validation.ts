import { z } from 'zod';

/**
 * Helpers shared by every form schema.
 *
 * The numeric controls in this app hold `number | null` rather than a string,
 * so an empty field arrives as `null`. Zod reports that as a *type* error by
 * default, which would surface as "Expected number, received null". These
 * wrappers make the message say what the user should actually do.
 */
export function requiredNumber(message: string) {
  return z.number({ required_error: message, invalid_type_error: message });
}

/** A text field that is allowed to be blank, normalised to `''` rather than undefined. */
export const optionalText = (max: number, message?: string) =>
  z
    .string()
    .trim()
    .max(max, message ?? `Keep this under ${max} characters`)
    .optional()
    .default('');
