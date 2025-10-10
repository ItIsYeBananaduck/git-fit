// Svelte context provider for Convex integration
import { getContext, setContext } from 'svelte';
import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import type { ConvexReactClient } from 'convex/react';
import { 
  initializeConvex, 
  createConvexService, 
  type ConvexIntegrationService 
} from '../services/convexIntegration.js';

// Context keys
const CONVEX_CLIENT_KEY = Symbol('convex-client');
const CONVEX_SERVICE_KEY = Symbol('convex-service');
const USER_ID_KEY = Symbol('user-id');

// Store interfaces
export interface ConvexContext {
  client: ConvexReactClient | null;
  service: ConvexIntegrationService | null;
  isInitialized: boolean;
  error: string | null;
}

// Context stores
export function createConvexStores() {
  const convexContext = writable<ConvexContext>({
    client: null,
    service: null,
    isInitialized: false,
    error: null
  });

  const userId = writable<string | null>(null);

  return {
    convexContext,
    userId
  };
}

// Context provider functions
export function setConvexContext(
  client: ConvexReactClient | null,
  currentUserId: string | null = null
) {
  if (!browser) return;

  try {
    let service: ConvexIntegrationService | null = null;
    
    if (client) {
      initializeConvex(client);
      service = createConvexService(client);
    }

    const context: ConvexContext = {
      client,
      service,
      isInitialized: !!client,
      error: null
    };

    setContext(CONVEX_CLIENT_KEY, client);
    setContext(CONVEX_SERVICE_KEY, service);
    
    if (currentUserId) {
      setContext(USER_ID_KEY, currentUserId);
    }

    return context;
  } catch (error) {
    const errorContext: ConvexContext = {
      client: null,
      service: null,
      isInitialized: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };

    console.error('Failed to initialize Convex context:', error);
    return errorContext;
  }
}

export function getConvexContext(): ConvexContext {
  if (!browser) {
    return {
      client: null,
      service: null,
      isInitialized: false,
      error: null
    };
  }

  try {
    const client = getContext<ConvexReactClient | null>(CONVEX_CLIENT_KEY);
    const service = getContext<ConvexIntegrationService | null>(CONVEX_SERVICE_KEY);
    
    return {
      client: client || null,
      service: service || null,
      isInitialized: !!(client && service),
      error: null
    };
  } catch (error) {
    return {
      client: null,
      service: null,
      isInitialized: false,
      error: 'Context not found - make sure to call setConvexContext() in parent component'
    };
  }
}

export function getConvexService(): ConvexIntegrationService | null {
  if (!browser) return null;
  
  try {
    return getContext<ConvexIntegrationService | null>(CONVEX_SERVICE_KEY);
  } catch {
    return null;
  }
}

export function getUserId(): string | null {
  if (!browser) return null;
  
  try {
    return getContext<string | null>(USER_ID_KEY);
  } catch {
    return null;
  }
}

export function setUserId(userId: string) {
  if (!browser) return;
  setContext(USER_ID_KEY, userId);
}

// Reactive store for components to subscribe to Convex state
export function createConvexReactiveStore() {
  if (!browser) {
    return writable<ConvexContext>({
      client: null,
      service: null,
      isInitialized: false,
      error: null
    });
  }

  const { subscribe, set, update } = writable<ConvexContext>({
    client: null,
    service: null,
    isInitialized: false,
    error: null
  });

  return {
    subscribe,
    initialize: (client: ConvexReactClient, userId?: string) => {
      const context = setConvexContext(client, userId);
      if (context) {
        set(context);
      }
      return context;
    },
    updateUserId: (userId: string) => {
      setUserId(userId);
      update(ctx => ({ ...ctx }));
    },
    reset: () => {
      set({
        client: null,
        service: null,
        isInitialized: false,
        error: null
      });
    }
  };
}

// Component helper functions
export function withConvexContext(component: Record<string, unknown>) {
  return {
    ...component,
    getConvexService,
    getUserId,
    getConvexContext
  };
}

// Error boundary for Convex operations
export function safeConvexOperation<T>(
  operation: () => Promise<T>,
  fallback: T,
  errorMessage: string = 'Convex operation failed'
): Promise<T> {
  if (!browser) return Promise.resolve(fallback);

  return operation().catch((error) => {
    console.error(errorMessage, error);
    return fallback;
  });
}

// Utility to check if Convex is ready
export function isConvexReady(): boolean {
  if (!browser) return false;
  
  const context = getConvexContext();
  return context.isInitialized && !context.error;
}