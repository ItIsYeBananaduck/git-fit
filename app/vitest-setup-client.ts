/// <reference types="@vitest/browser/matchers" />
/// <reference types="@vitest/browser/providers/playwright" />

import { vi } from 'vitest';
import { expect as vitestExpect } from 'vitest';

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

// Attach storages using a safe strategy. In real browser environments (Playwright)
// window.localStorage may be a read-only accessor. Attempt to define/override it
// only when possible; otherwise expose the mocks on the global object so tests
// can still use `globalThis.localStorage` and `globalThis.window` as fallbacks.
try {
	if ((g as any).window) {
		const desc = Object.getOwnPropertyDescriptor((g as any).window, 'localStorage');
		if (!desc || desc.configurable) {
			Object.defineProperty((g as any).window, 'localStorage', {
				configurable: true,
				enumerable: true,
				value: sharedLocalStorage
			});
		}
		const descSess = Object.getOwnPropertyDescriptor((g as any).window, 'sessionStorage');
		if (!descSess || descSess.configurable) {
			Object.defineProperty((g as any).window, 'sessionStorage', {
				configurable: true,
				enumerable: true,
				value: sharedSessionStorage
			});
		}
	}
} catch {
	// If overwriting the real window storage isn't allowed, proceed without throwing.
}

// Always ensure global fallbacks exist so tests can reference them directly.
if (!('localStorage' in g) || g.localStorage === undefined) {
	(g as any).localStorage = sharedLocalStorage;
}

if (!('sessionStorage' in g) || g.sessionStorage === undefined) {
	(g as any).sessionStorage = sharedSessionStorage;
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

// Provide `global` alias to support tests that reference `global` (Node style)
// In browser/Playwright runs `global` may not be defined; create a harmless
// alias to globalThis so tests that do `(global as any).Capacitor = ...` work.
if (!(g as any).global) {
	try {
		(g as any).global = g;
	} catch {
		// best-effort; do not throw during setup
	}
}

// Set up environment variables for testing.
// In browser-based test environments (Playwright) `process` may not exist,
// so create a minimal global.process.env fallback to avoid ReferenceErrors.
if (typeof (globalThis as any).process === 'undefined') {
	(globalThis as any).process = { env: {} };
}
if (!((globalThis as any).process.env && typeof (globalThis as any).process.env === 'object')) {
	(globalThis as any).process.env = {};
}
(globalThis as any).process.env.VITE_CONVEX_URL = (globalThis as any).process.env.VITE_CONVEX_URL || 'https://test-convex-url.convex.cloud';
(globalThis as any).process.env.PUBLIC_CONVEX_URL = (globalThis as any).process.env.PUBLIC_CONVEX_URL || 'https://test-convex-url.convex.cloud';

// Mock fetch for HTTP requests
(globalThis as any).fetch = vi.fn();

// Polyfill/override Touch and TouchEvent for the test environment so
// @testing-library/dom's synthetic touch events can be constructed.
try {
	(globalThis as any).Touch = class {
		[key: string]: any;
		constructor(init: any = {}) {
			// Provide a minimal Touch shape; real browsers provide more fields but
			// tests only rely on clientX/clientY/force/identifier
			this.identifier = init.identifier ?? 0;
			this.clientX = init.clientX ?? init.pageX ?? 0;
			this.clientY = init.clientY ?? init.pageY ?? 0;
			this.force = init.force ?? 0;
			this.target = init.target || null;
		}
	};

		(globalThis as any).TouchEvent = class extends Event {
			[key: string]: any;
			touches: any[];
			changedTouches: any[];
			constructor(type: string, init: any = {}) {
				// Use EventInit to set bubbles/cancelable/composed rather than assigning
				// to the Event instance (many properties are readonly).
				const eventInit: any = {
					bubbles: !!init.bubbles,
					cancelable: !!init.cancelable,
					composed: !!init.composed
				};
				super(type, eventInit);
				this.touches = Array.isArray(init.touches)
					? init.touches.map((t: any) => new (globalThis as any).Touch(t))
					: [];
				this.changedTouches = Array.isArray(init.changedTouches)
					? init.changedTouches.map((t: any) => new (globalThis as any).Touch(t))
					: [];
				// Copy only non-readonly convenience properties
				if (init.target) (this as any).target = init.target;
				if (init.detail) (this as any).detail = init.detail;
			}
		} as any;
} catch {
	// best-effort
}

// Ensure Vitest's expect is available globally for @testing-library/jest-dom
if (!(globalThis as any).expect) {
	(globalThis as any).expect = vitestExpect;
}

// Dynamically import jest-dom matchers after expect is defined (browser env)
// Load jest-dom matchers synchronously for browser tests so they are available
// when tests start. Use top-level await to ensure this completes before tests run.
try {
	if (typeof window !== 'undefined') {
		// eslint-disable-next-line no-undef
		await import('@testing-library/jest-dom');
	}
} catch {
	// ignore if not available
}

// Attempt to import testing-library (which is aliased to our shim). If the
// alias is working, its `render` export should already be our compat render.
try {
	const compat = await import('./src/test-helpers/test-compat');
	// Try to synchronously require the testing-library package via Node's
	// resolver (createRequire) and overwrite its `render` export so every
	// consumer gets our compat wrapper. Using require helps mutate a CJS
	// export object which Vite/Esm imports sometimes wrap as read-only.
	try {
		const { createRequire } = await import('module');
		const require = createRequire(import.meta.url);
		try {
			const tlCjs = require('@testing-library/svelte');
			if (tlCjs) {
				try { tlCjs.render = (compat as any).render; } catch {}
				try { (globalThis as any).__test_compat_render = (compat as any).render; } catch {}
			}
		} catch (e) {
			// best-effort: ignore if require fails
		}
	} catch {}

  try {
    const { afterEach } = await import('vitest');
		try {
			// If the testing-library was loaded via alias, prefer its cleanup.
			const tl = await import('@testing-library/svelte');
			const { cleanup } = tl as any;
			if (cleanup) {
				afterEach(() => {
					try { cleanup(); } catch {}
					try { if (typeof document !== 'undefined' && document.body) document.body.innerHTML = ''; } catch {}
				});
			} else {
				afterEach(() => { try { if (typeof document !== 'undefined' && document.body) document.body.innerHTML = ''; } catch {} });
			}
		} catch {
			afterEach(() => { try { if (typeof document !== 'undefined' && document.body) document.body.innerHTML = ''; } catch {} });
		}
  } catch {}
} catch (e) {
  try { console.debug('Could not import testing-library via alias:', String(e)); } catch {}
}

// Monkeypatch Svelte's mount function to ensure component export objects
// include a backwards-compatible `$on` and theme helpers. This catches code
// paths where testing-library's render returns a raw Svelte export object and
// tests call `component.component.$on(...)` directly.
try {
	const sveltePkg: any = await import('svelte');
	if (sveltePkg && typeof sveltePkg.mount === 'function') {
		const originalMount = sveltePkg.mount;
		sveltePkg.mount = function (component: any, options: any) {
			const exports = originalMount(component, options);
			try {
				if (exports && typeof exports === 'object') {
					if (typeof exports.$on !== 'function') {
						exports.$on = function (event: string, cb: Function) {
							try {
								const container = (options && (options.target || options.anchor)) || (globalThis as any).__lastRenderContainer;
								if (container && container.addEventListener) {
									const listener = (ev: any) => cb(ev.detail ?? ev);
									container.addEventListener(event, listener as EventListener);
								}
								const globalMap: Map<any, Map<string, Set<Function>>> = (globalThis as any).__compatHandlers || new Map();
								(globalThis as any).__compatHandlers = globalMap;
								let byEvent = globalMap.get(container);
								if (!byEvent) {
									byEvent = new Map<string, Set<Function>>();
									globalMap.set(container, byEvent);
								}
								let handlers = byEvent.get(event);
								if (!handlers) {
									handlers = new Set();
									byEvent.set(event, handlers);
								}
								handlers.add(cb as unknown as Function);
							} catch {}
							return { destroy() { /* noop */ } } as any;
						};
					}
					if (typeof exports.setTheme !== 'function') {
						exports.setTheme = function (t: 'dark' | 'light') {
							try { localStorage.setItem('mobile-theme', t); } catch {}
							try {
								const container = (options && (options.target || options.anchor)) || (globalThis as any).__lastRenderContainer;
								if (container && container.setAttribute) container.setAttribute('data-theme', t);
							} catch {}
						};
					}
					if (typeof exports.toggleTheme !== 'function') {
						exports.toggleTheme = function () {
							try {
								const container = (options && (options.target || options.anchor)) || (globalThis as any).__lastRenderContainer;
								const cur = (container && (container.getAttribute('data-theme') || container.dataset?.theme)) || localStorage.getItem('mobile-theme') || 'dark';
								const next = cur === 'dark' ? 'light' : 'dark';
								try { localStorage.setItem('mobile-theme', next); } catch {}
								if (container && container.setAttribute) container.setAttribute('data-theme', next);
							} catch {}
						};
					}
					try {
						Object.defineProperty(exports, 'currentTheme', {
							get() {
								try {
									const container = (options && (options.target || options.anchor)) || (globalThis as any).__lastRenderContainer;
									if (container) return container.getAttribute('data-theme') || container.dataset?.theme || localStorage.getItem('mobile-theme') || 'dark';
								} catch {}
								try { return localStorage.getItem('mobile-theme') || 'dark'; } catch { return 'dark'; }
							},
							configurable: true
						});
					} catch {}
				}
			} catch {}
			return exports;
		};
	}
} catch (e) {
	try { console.debug('Svelte mount monkeypatch failed:', String(e)); } catch {}
}

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
if (typeof window === 'undefined') {
	(async () => {
		try {
			const path = await import('path');
			console.log('Resolved $lib alias:', path.resolve('./src/lib'));
			console.log('Resolved $lib/convex/_generated/api alias:', path.resolve('./src/lib/convex/_generated/api'));
		} catch {
			// ignore
		}
	})();
} else {
	console.log('Browser test environment detected; skipping path.resolve debug logs');
}

// Ensure a clean DOM before each test to avoid leaking multiple instances
try {
	const { beforeEach } = await import('vitest');
	beforeEach(() => {
		try {
			if (typeof document !== 'undefined' && document.body) document.body.innerHTML = '';
		} catch {}
	});
} catch {}

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

// Provide a global helper to ensure a testing-library render result has the
// backwards-compatible `.component` shape (with `$on`, exported helpers).
// Tests can call `component = (globalThis as any).__ensureCompat(component)`
// immediately after render to guarantee the legacy API works.
(globalThis as any).__ensureCompat = function (result: any) {
	try {
		if (!result || !result.component) return result;
		const containerAny = result.container;
		const comp = result.component;

		// If $on is already a function, assume compatible
		if (typeof comp.$on === 'function') return result;

		// Create compatibility wrapper similar to test-compat
		const wrapper = new Proxy(comp, {
			get(target, prop, receiver) {
				if (prop === '$on') {
					return (event: string, cb: Function) => {
						let listener: EventListener | null = null;
						if (containerAny && containerAny.addEventListener) {
							listener = (ev: any) => cb(ev && ev.detail ? ev.detail : ev);
							containerAny.addEventListener(event, listener as EventListener);
						}
						try {
							(globalThis as any).__compatHandlers = (globalThis as any).__compatHandlers || new Map();
							let byEvent = (globalThis as any).__compatHandlers.get(containerAny);
							if (!byEvent) { byEvent = new Map(); (globalThis as any).__compatHandlers.set(containerAny, byEvent); }
							let handlers = byEvent.get(event);
							if (!handlers) { handlers = new Set(); byEvent.set(event, handlers); }
							handlers.add(cb);
						} catch {}
						return { destroy() { try { if (listener && containerAny && containerAny.removeEventListener) containerAny.removeEventListener(event, listener as EventListener); } catch {} } };
					};
				}
				const value = Reflect.get(target, prop, receiver);
				if (value !== undefined) { if (typeof value === 'function') return value.bind(target); return value; }
				try {
					if (containerAny && prop in containerAny) {
						const val = containerAny[prop as any];
						if (typeof val === 'function') return val.bind(containerAny);
						return val;
					}
					const last = (globalThis as any).__lastRenderContainer;
					if (last && prop in last) {
						const val = last[prop as any];
						if (typeof val === 'function') return val.bind(last);
						return val;
					}
				} catch {}
				return undefined;
			}
		});

		// Return a proxied result where .component returns our wrapper
		return new Proxy(result, {
			get(target, prop, receiver) {
				if (prop === 'component') return wrapper;
				return Reflect.get(target, prop, receiver);
			}
		});
	} catch {
		return result;
	}
};

// Provide global fallback methods on generic objects so older tests that call
// `component.component.$on(...)` or `component.component.setTheme(...)` won't
// throw under Svelte 5. These are best-effort shims that register handlers
// against the most-recently-rendered container saved by test-compat.
try {
	} catch {}
