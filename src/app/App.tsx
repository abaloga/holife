import { Providers } from './providers';
import { AppRouter } from './router';
import { ErrorBoundary } from './error-boundary';
import { UpdatePrompt } from './update-prompt';

export function App() {
  return (
    <ErrorBoundary>
      <Providers>
        <AppRouter />
        <UpdatePrompt />
      </Providers>
    </ErrorBoundary>
  );
}
