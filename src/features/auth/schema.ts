import { z } from 'zod';

export const emailSchema = z
  .string()
  .min(1, 'Enter your email address')
  .email('That doesn’t look like an email address');

/**
 * Deliberately modest: length is the requirement that actually helps, and
 * character-class rules mostly push people toward worse passwords.
 */
export const passwordSchema = z
  .string()
  .min(8, 'Use at least 8 characters')
  .max(72, 'Passwords are limited to 72 characters');

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Enter your password'),
});

export const signUpSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(1, 'Enter a name')
    .max(60, 'That name is a little long'),
  email: emailSchema,
  password: passwordSchema,
});

export type SignInValues = z.infer<typeof signInSchema>;
export type SignUpValues = z.infer<typeof signUpSchema>;
