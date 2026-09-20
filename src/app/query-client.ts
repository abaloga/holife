import { QueryClient } from '@tanstack/react-query';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { AppError } from '@/lib/errors';

const PERSIST_KEY = 'holife.query-cache';

/** Bump when a cached shape changes incompatibly; old caches are then dropped. */
const CACHE_VERSION = 'v1';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Long enough that switching tabs doesn't refetch everything, short
      // enough that a second device's changes show up quickly.
      staleTime: 30_000,
      // The cache is the offline story: keep entries for a day so a cold launch
      // without a network still has yesterday's data to render.
      gcTime: 24 * 60 * 60 * 1000,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      // Serve cached data immediately when offline instead of erroring.
      networkMode: 'offlineFirst',
      retry: (failureCount, error) => {
        // Our own validation/permission errors will never succeed on retry.
        if (error instanceof AppError) return false;
        return failureCount < 2;
      },
    },
    mutations: {
      // Paused while offline, replayed on reconnect.
      networkMode: 'online',
      retry: 0,
    },
  },
});

export const queryPersister = createSyncStoragePersister({
  storage: typeof window === 'undefined' ? undefined : window.localStorage,
  key: PERSIST_KEY,
  throttleTime: 1_000,
});

export const persistOptions = {
  persister: queryPersister,
  maxAge: 24 * 60 * 60 * 1000,
  buster: CACHE_VERSION,
  dehydrateOptions: {
    // Never persist errors or in-flight state.
    shouldDehydrateQuery: (query: { state: { status: string } }) =>
      query.state.status === 'success',
  },
};

/** Called on sign-out so the next account never sees the previous one's rows. */
export function clearPersistedCache() {
  queryClient.clear();
  try {
    window.localStorage.removeItem(PERSIST_KEY);
  } catch {
    /* Storage unavailable — the in-memory clear above is still enough. */
  }
}
