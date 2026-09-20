import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vitest/config';

const resolvePath = (path: string) => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      // The PWA virtual module only exists when vite-plugin-pwa is loaded.
      'virtual:pwa-register/react': resolvePath('./src/test/pwa-register-stub.ts'),
      '@': resolvePath('./src'),
    },
  },
  test: {
    // Logic tests run in Node; only component tests pay for a DOM.
    environment: 'node',
    environmentMatchGlobs: [['**/*.test.tsx', 'jsdom']],
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['./src/test/setup.ts'],
    globals: false,
    env: {
      // Placeholders so `lib/env` validates; no request is ever made to them.
      VITE_SUPABASE_URL: 'https://test-project.supabase.co',
      VITE_SUPABASE_ANON_KEY: 'test-anon-key-that-is-long-enough-to-pass',
      VITE_APP_NAME: 'HoLife',
    },
  },
});
