import * as React from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  /** True until the persisted session has been read from storage. */
  initialising: boolean;
}

const AuthContext = React.createContext<AuthContextValue | null>(null);

/**
 * Holds the Supabase session. Everything downstream can assume that once
 * `initialising` is false, `user` is either a real signed-in user or null —
 * which is what lets protected routes redirect without flashing.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = React.useState<Session | null>(null);
  const [initialising, setInitialising] = React.useState(true);

  React.useEffect(() => {
    let active = true;

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!active) return;
        setSession(data.session);
      })
      .finally(() => {
        if (active) setInitialising(false);
      });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const value = React.useMemo(
    () => ({ session, user: session?.user ?? null, initialising }),
    [session, initialising],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
}

/**
 * For code that only runs inside protected routes, where a user is guaranteed.
 * Saves every feature hook from handling a null user it can never receive.
 */
export function useUserId(): string {
  const { user } = useAuth();
  if (!user) throw new Error('useUserId called outside an authenticated route');
  return user.id;
}
