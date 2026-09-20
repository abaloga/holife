import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

/**
 * Browser APIs jsdom does not implement, stubbed just enough for the component
 * smoke tests. Anything beyond this belongs in a real browser, not here.
 */

// Logic tests run in the Node environment, where there is no DOM to patch.
const hasDom = typeof window !== 'undefined';

if (hasDom && !window.matchMedia) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

if (hasDom && !window.ResizeObserver) {
  window.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

if (hasDom && !window.scrollTo) {
  window.scrollTo = vi.fn();
}

afterEach(() => {
  if (!hasDom) return;
  cleanup();
  localStorage.clear();
});
