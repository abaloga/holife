import { useEffect, type ReactNode } from 'react';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { supabase } from '@/lib/supabase';
import { AuthProvider } from '@/features/auth/auth-context';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from './theme-provider';
import { clearPersistedCache, persistOptions, queryClient } from './query-client';

function CacheLifecycle({ children }: { children: ReactNode }) {
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') clearPersistedCache();
    });
    return () => data.subscription.unsubscribe();
  }, []);

  return <>{children}</>;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <PersistQueryClientProvider client={queryClient} persistOptions={persistOptions}>
      <ThemeProvider>
        <AuthProvider>
          <CacheLifecycle>
            {children}
            <Toaster />
          </CacheLifecycle>
        </AuthProvider>
      </ThemeProvider>
    </PersistQueryClientProvider>
  );
}
