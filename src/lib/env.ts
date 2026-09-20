import { z } from 'zod';

/**
 * Client environment. Anything readable here ships to the browser, so it may
 * only ever contain publishable values. Server secrets (service role key,
 * OpenAI key) belong in Supabase Edge Function secrets — never in `VITE_*`.
 */
const clientEnvSchema = z.object({
  VITE_SUPABASE_URL: z.string().url('VITE_SUPABASE_URL must be a full URL, e.g. https://xyz.supabase.co'),
  VITE_SUPABASE_ANON_KEY: z.string().min(20, 'VITE_SUPABASE_ANON_KEY looks too short to be valid'),
  VITE_APP_NAME: z.string().min(1).default('HoLife'),
});

export type ClientEnv = z.infer<typeof clientEnvSchema>;

function readEnv(): ClientEnv {
  const parsed = clientEnvSchema.safeParse(import.meta.env);

  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `  • ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(
      `Missing or invalid environment variables.\n${details}\n\n` +
        'Copy .env.example to .env and fill in the values from your Supabase project settings.',
    );
  }

  return parsed.data;
}

export const env = readEnv();

export const APP_NAME = env.VITE_APP_NAME;
