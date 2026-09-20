import { createClient } from '@supabase/supabase-js';
import { env } from './env';
import type { Database } from '@/types/database';

/**
 * The single Supabase client for the app.
 *
 * `persistSession` + `autoRefreshToken` keep the user signed in across app
 * launches, which is what a PWA (and later a Capacitor shell) needs.
 */
export const supabase = createClient<Database>(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'holife.auth',
    flowType: 'pkce',
  },
  global: {
    headers: { 'x-client-info': 'holife-web' },
  },
});

export const MEAL_IMAGE_BUCKET = 'meal-images';
