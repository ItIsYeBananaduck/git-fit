/// <reference types="@vitest/browser/matchers" />
/// <reference types="@vitest/browser/providers/playwright" />


import { vi } from 'vitest';

// Consolidated localStorage mock setup
class LocalStorageMock {
  private store: Map<string, string> = new Map();
  private keys: string[] = []; // Explicitly track insertion order

  clear() {
    this.store.clear();
    this.keys = [];
  }

  getItem(key: string) {
    return this.store.get(key) || null;
  }

  setItem(key: string, value: string) {
    if (!this.store.has(key)) {
      this.keys.push(key);
    } else {
      // Remove and re-add the key to maintain insertion order
      this.keys = this.keys.filter(k => k !== key);
      this.keys.push(key);
    }
    this.store.set(key, value.toString());
  }

  removeItem(key: string) {
    this.store.delete(key);
    this.keys = this.keys.filter(k => k !== key);
  }

  key(index: number) {
    return index >= 0 && index < this.keys.length ? this.keys[index] : null;
  }

  get length() {
    return this.store.size;
  }
}

type GlobalWithPolyfills = typeof globalThis & {
  localStorage?: LocalStorageMock;
  sessionStorage?: LocalStorageMock;
};

const g = globalThis as GlobalWithPolyfills;

// Apply localStorage mock globally
if (!('localStorage' in g)) {
  g.localStorage = new LocalStorageMock();
  console.log('localStorage mock applied:', g.localStorage);
}

// Apply sessionStorage mock if needed
if (!('sessionStorage' in g)) {
  g.sessionStorage = new LocalStorageMock();
  console.log('sessionStorage mock applied:', g.sessionStorage);
}

// Debugging: Confirm mocks are applied
console.debug('Mocks initialized:', {
  localStorage: !!g.localStorage,
  sessionStorage: !!g.sessionStorage,
});

// Set up environment variables for testing
process.env.VITE_CONVEX_URL = 'https://test-convex-url.convex.cloud';
process.env.PUBLIC_CONVEX_URL = 'https://test-convex-url.convex.cloud';

// Mock fetch for HTTP requests
global.fetch = vi.fn();
