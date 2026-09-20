import { describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { App } from './App';

/**
 * A boot canary rather than a UI test.
 *
 * It asserts one thing the logic tests cannot: that the whole provider stack
 * (error boundary, query client with its storage persister, theme, auth,
 * router) mounts and resolves to a real screen. A broken context, a bad hook
 * order or a missing provider fails here instead of in the browser.
 */
describe('App', () => {
  it('boots and shows the sign-in screen when nobody is signed in', async () => {
    render(<App />);

    await waitFor(
      () => {
        expect(screen.getByRole('button', { name: /sign in/i })).toBeDefined();
      },
      { timeout: 5000 },
    );

    expect(screen.getByLabelText(/email/i)).toBeDefined();
    expect(screen.getByLabelText(/password/i)).toBeDefined();
  });

  it('offers a way to create an account', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /create an account/i })).toBeDefined();
    });
  });

  it('applies a theme class to the document so the shell is never unstyled', async () => {
    render(<App />);

    await waitFor(() => {
      expect(document.documentElement.style.colorScheme).toMatch(/light|dark/);
    });
  });
});
