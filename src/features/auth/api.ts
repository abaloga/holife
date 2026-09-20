import { supabase } from '@/lib/supabase';
import { AppError } from '@/lib/errors';
import { systemTimezone } from '@/lib/date';
import type { SignInValues, SignUpValues } from './schema';

/** Supabase auth errors are terse; these are the ones worth rewording. */
function authMessage(message: string): string {
  const normalised = message.toLowerCase();
  if (normalised.includes('invalid login credentials')) {
    return 'That email and password don’t match an account.';
  }
  if (normalised.includes('email not confirmed')) {
    return 'Confirm your email address first — check your inbox for the link.';
  }
  if (normalised.includes('user already registered')) {
    return 'An account with that email already exists. Try signing in instead.';
  }
  if (normalised.includes('rate limit') || normalised.includes('too many')) {
    return 'Too many attempts. Wait a moment and try again.';
  }
  return message;
}

export async function signIn({ email, password }: SignInValues) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new AppError(authMessage(error.message), error);
  return data;
}

export async function signUp({ email, password, displayName }: SignUpValues) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // Read by the `handle_new_user` trigger to seed profile + settings, so a
      // new account arrives with its name and timezone already correct.
      data: { display_name: displayName, timezone: systemTimezone() },
      emailRedirectTo: `${window.location.origin}/`,
    },
  });
  if (error) throw new AppError(authMessage(error.message), error);

  return {
    ...data,
    /** No session means the project requires email confirmation. */
    needsEmailConfirmation: data.session === null,
  };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw new AppError(authMessage(error.message), error);
}

export async function sendPasswordReset(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/`,
  });
  if (error) throw new AppError(authMessage(error.message), error);
}
