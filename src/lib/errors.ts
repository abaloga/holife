import type { PostgrestError } from '@supabase/supabase-js';

/** An error we are happy to show a user verbatim. */
export class AppError extends Error {
  constructor(
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

function isPostgrestError(value: unknown): value is PostgrestError {
  return (
    typeof value === 'object' &&
    value !== null &&
    'message' in value &&
    'code' in value &&
    typeof (value as { message: unknown }).message === 'string'
  );
}

/**
 * Turn whatever we caught into something worth putting on screen. Generic
 * "Something went wrong" is the last resort, not the first.
 */
export function toUserMessage(error: unknown): string {
  if (error instanceof AppError) return error.message;

  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return "You're offline. This will work again once you reconnect.";
  }

  if (isPostgrestError(error)) {
    switch (error.code) {
      case '23505':
        return 'That already exists.';
      case '23503':
        return 'That refers to something which no longer exists.';
      case '23514':
        return "Those values weren't accepted. Check the numbers and try again.";
      case '42501':
      case 'PGRST301':
        return 'Your session has expired. Sign in again to continue.';
      default:
        return error.message;
    }
  }

  if (error instanceof Error) {
    if (error.message.toLowerCase().includes('failed to fetch')) {
      return "Couldn't reach the server. Check your connection and try again.";
    }
    return error.message;
  }

  return 'That didn’t work. Please try again.';
}

/** Unwrap a Supabase `{ data, error }` result or throw with context. */
export function unwrap<T>(result: { data: T; error: PostgrestError | null }, context: string): T {
  if (result.error) throw new AppError(toUserMessage(result.error), result.error);
  if (result.data === null) throw new AppError(`No data returned while ${context}.`);
  return result.data;
}
