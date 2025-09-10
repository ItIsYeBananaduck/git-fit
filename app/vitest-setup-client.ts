/// <reference types="@vitest/browser/matchers" />
/// <reference types="@vitest/browser/providers/playwright" />

import { vi } from 'vitest';

// Set up environment variables for testing
process.env.VITE_CONVEX_URL = 'https://test-convex-url.convex.cloud';
process.env.PUBLIC_CONVEX_URL = 'https://test-convex-url.convex.cloud';

// Mock localStorage for tests
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Mock fetch for HTTP requests
global.fetch = vi.fn();
