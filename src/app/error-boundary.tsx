import { Component, type ErrorInfo, type ReactNode } from 'react';
import { RotateCw, TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Last line of defence. A render crash should offer a way out rather than
 * leaving a white screen — especially in an installed PWA, where there is no
 * address bar to reload from.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled error in HoLife UI', error, info.componentStack);
  }

  private reset = () => {
    this.setState({ error: null });
  };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="grid min-h-dvh place-items-center bg-background px-6">
        <div className="w-full max-w-sm text-center">
          <span className="mx-auto grid size-12 place-items-center rounded-full bg-destructive/10 text-destructive">
            <TriangleAlert className="size-5" aria-hidden />
          </span>
          <h1 className="mt-4 text-lg font-semibold tracking-tight">Something broke</h1>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            The screen failed to render. Your data is safe — reloading usually fixes it.
          </p>
          <p className="mt-3 break-words rounded-lg bg-subtle px-3 py-2 text-left font-mono text-[0.6875rem] text-muted-foreground">
            {error.message}
          </p>
          <div className="mt-5 flex gap-2">
            <Button variant="subtle" onClick={this.reset} className="flex-1">
              Try again
            </Button>
            <Button onClick={() => window.location.reload()} className="flex-1">
              <RotateCw aria-hidden />
              Reload
            </Button>
          </div>
        </div>
      </div>
    );
  }
}
