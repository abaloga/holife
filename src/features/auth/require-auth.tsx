import { Navigate, useLocation } from 'react-router-dom';
import { Wordmark } from '@/components/common/wordmark';
import { useAuth } from './auth-context';

/**
 * Gate for every application route. While the persisted session is being read
 * the splash holds — redirecting first would sign out anyone reopening the
 * installed app.
 */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, initialising } = useAuth();
  const location = useLocation();

  if (initialising) return <Splash />;

  if (!user) {
    return <Navigate to="/auth" replace state={{ from: location.pathname + location.search }} />;
  }

  return <>{children}</>;
}

export function Splash() {
  return (
    <div className="grid min-h-dvh place-items-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <Wordmark size="lg" />
        <span className="sr-only">Loading</span>
        <span
          aria-hidden
          className="h-0.5 w-16 animate-shimmer rounded-full bg-border-strong"
        />
      </div>
    </div>
  );
}
