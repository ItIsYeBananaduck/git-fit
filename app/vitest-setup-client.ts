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

// Mock window object with essential properties
const mockWindow = {
  localStorage: new LocalStorageMock(),
  sessionStorage: new LocalStorageMock(),
  location: {
    href: 'http://localhost:3000',
    origin: 'http://localhost:3000',
    hostname: 'localhost',
    pathname: '/',
    search: '',
    hash: ''
  },
  navigator: {
    userAgent: 'Mozilla/5.0 (compatible; Vitest)',
    language: 'en-US',
    languages: ['en-US'],
    onLine: true
  },
  document: {
    title: 'Test Document',
    createElement: vi.fn(),
    getElementById: vi.fn(),
    querySelector: vi.fn(),
    querySelectorAll: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn()
  },
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
  open: vi.fn(),
  close: vi.fn(),
  alert: vi.fn(),
  confirm: vi.fn(),
  prompt: vi.fn(),
  // WebAuthn API mock
  PublicKeyCredential: {
    isUserVerifyingPlatformAuthenticatorAvailable: vi.fn().mockResolvedValue(true),
    isConditionalMediationAvailable: vi.fn().mockResolvedValue(true)
  }
};

type GlobalWithPolyfills = typeof globalThis & {
  localStorage?: LocalStorageMock;
  sessionStorage?: LocalStorageMock;
  window?: typeof mockWindow;
  document?: typeof mockWindow.document;
  navigator?: typeof mockWindow.navigator;
  location?: typeof mockWindow.location;
};

const g = globalThis as GlobalWithPolyfills;

// Apply window mock globally
if (!('window' in g)) {
  g.window = mockWindow as any;
}

// Apply localStorage mock globally
if (!('localStorage' in g)) {
  g.localStorage = new LocalStorageMock();
}

// Apply sessionStorage mock if needed
if (!('sessionStorage' in g)) {
  g.sessionStorage = new LocalStorageMock();
}

// Apply document mock
if (!('document' in g)) {
  g.document = mockWindow.document as any;
}

// Apply navigator mock
if (!('navigator' in g)) {
  g.navigator = mockWindow.navigator as any;
}

// Apply PublicKeyCredential mock directly to globalThis  
if (!('PublicKeyCredential' in g)) {
  (g as any).PublicKeyCredential = mockWindow.PublicKeyCredential;
}

// Apply location mock
if (!('location' in g)) {
  g.location = mockWindow.location as any;
}

// Set up environment variables for testing
process.env.VITE_CONVEX_URL = 'https://test-convex-url.convex.cloud';
process.env.PUBLIC_CONVEX_URL = 'https://test-convex-url.convex.cloud';

// Mock fetch for HTTP requests
global.fetch = vi.fn();
