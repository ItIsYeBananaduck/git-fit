/// <reference types="@vitest/browser/matchers" />
/// <reference types="@vitest/browser/providers/playwright" />

import { vi } from 'vitest';
import path from 'path';

/* eslint-disable @typescript-eslint/no-explicit-any */

console.log('vitest-setup-client.ts is being executed');

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
			this.keys = this.keys.filter((k) => k !== key);
			this.keys.push(key);
		}
		this.store.set(key, value.toString());
	}

	removeItem(key: string) {
		this.store.delete(key);
		this.keys = this.keys.filter((k) => k !== key);
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

// Apply window mock globally and make localStorage/sessionStorage singletons
if (!('window' in g)) {
	// Narrow assignment by using structural typing; mockWindow matches the minimal
	// properties we rely on for tests so cast to Window & Partial<typeof mockWindow>
	// Use a safe any-style attach for the test environment; this file runs only
	// in the test harness and these assignments are intentionally permissive.
	(g as any).window = mockWindow;
}

// Ensure a single LocalStorageMock instance is shared between window and global
const sharedLocalStorage = mockWindow.localStorage || new LocalStorageMock();
const sharedSessionStorage = mockWindow.sessionStorage || new LocalStorageMock();

// Attach storages using Partial window typing
(g as any).window.localStorage = sharedLocalStorage;
(g as any).window.sessionStorage = sharedSessionStorage;

if (!('localStorage' in g) || g.localStorage === undefined) {
	g.localStorage = sharedLocalStorage;
}

if (!('sessionStorage' in g) || g.sessionStorage === undefined) {
	g.sessionStorage = sharedSessionStorage;
}

// Apply document mock
if (!('document' in g)) {
	(g as any).document = mockWindow.document;
}

// Apply navigator mock
if (!('navigator' in g)) {
	(g as any).navigator = mockWindow.navigator;
}

// Apply PublicKeyCredential mock directly to globalThis
if (!('PublicKeyCredential' in g)) {
	(g as any).PublicKeyCredential = mockWindow.PublicKeyCredential;
}

// Apply location mock
if (!('location' in g)) {
	(g as any).location = mockWindow.location;
}

// Set up environment variables for testing
process.env.VITE_CONVEX_URL = 'https://test-convex-url.convex.cloud';
process.env.PUBLIC_CONVEX_URL = 'https://test-convex-url.convex.cloud';

// Mock fetch for HTTP requests
global.fetch = vi.fn();

// Provide a minimal Capacitor mock for mobile-related tests
if (!(g as any).Capacitor) {
	// Minimal Capacitor mock to satisfy mobile-related tests
	(g as any).Capacitor = {
		Plugins: {
			Haptics: {
				impact: vi.fn().mockResolvedValue(undefined),
				notification: vi.fn().mockResolvedValue(undefined),
				selection: vi.fn().mockResolvedValue(undefined)
			}
		}
	};
}

console.log('Testing environment initialized');
console.log('Resolved $lib alias:', path.resolve('./src/lib'));
console.log(
	'Resolved $lib/convex/_generated/api alias:',
	path.resolve('./src/lib/convex/_generated/api')
);

// Try to instantiate the in-repo ConvexTestingHelper and expose it globally for tests
// Use dynamic import so TypeScript/Vite handle module resolution in the test env
(async () => {
	try {
		const mod = await import('./tests/ConvexTestingHelper.js');
		const ConvexTestingHelper = (mod && (mod as any).ConvexTestingHelper) || null;
		if (ConvexTestingHelper && !(globalThis as any).__convexTestHarness) {
			const harness = new ConvexTestingHelper();
			(globalThis as any).__convexTestHarness = harness;
			// some tests expect a variable named `t`
			(globalThis as any).t = harness;
			console.log(
				'ConvexTestingHelper instantiated and attached to global.__convexTestHarness and global.t'
			);
		}
	} catch (err) {
		// debug-only: avoid noisy logs in normal runs
		try {
			console.debug(
				'vitest setup: ConvexTestingHelper not available (dynamic import):',
				String(err)
			);
		} catch {
			// swallow
		}
	}
})();
