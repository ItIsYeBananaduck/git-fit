import { writable } from 'svelte/store';
import type { WHOOPTokens, WHOOPUser, WHOOPRecovery, WHOOPStrain, WHOOPSleep } from '$lib/api/whoop';

// WHOOP connection state
export interface WHOOPState {
  isConnected: boolean;
  isLoading: boolean;
  user: WHOOPUser | null;
  tokens: WHOOPTokens | null;
  lastSync: string | null;
  error: string | null;
}

// WHOOP data stores
export interface WHOOPData {
  recovery: WHOOPRecovery[];
  strain: WHOOPStrain[];
  sleep: WHOOPSleep[];
  lastUpdated: string | null;
}

// Create stores
export const whoopState = writable<WHOOPState>({
  isConnected: false,
  isLoading: false,
  user: null,
  tokens: null,
  lastSync: null,
  error: null
});

export const whoopData = writable<WHOOPData>({
  recovery: [],
  strain: [],
  sleep: [],
  lastUpdated: null
});

// Store actions
export const whoopActions = {
  setLoading: (loading: boolean) => {
    whoopState.update(state => ({ ...state, isLoading: loading, error: null }));
  },

  setError: (error: string) => {
    whoopState.update(state => ({ ...state, error, isLoading: false }));
  },

  setConnected: (user: WHOOPUser, tokens: WHOOPTokens) => {
    whoopState.update(state => ({
      ...state,
      isConnected: true,
      user,
      tokens,
      lastSync: new Date().toISOString(),
      error: null,
      isLoading: false
    }));
  },

  setDisconnected: () => {
    whoopState.set({
      isConnected: false,
      isLoading: false,
      user: null,
      tokens: null,
      lastSync: null,
      error: null
    });
    whoopData.set({
      recovery: [],
      strain: [],
      sleep: [],
      lastUpdated: null
    });
  },

  updateData: (newData: Partial<WHOOPData>) => {
    whoopData.update(data => ({
      ...data,
      ...newData,
      lastUpdated: new Date().toISOString()
    }));
    whoopState.update(state => ({
      ...state,
      lastSync: new Date().toISOString()
    }));
  },

  updateTokens: (tokens: WHOOPTokens) => {
    whoopState.update(state => ({ ...state, tokens }));
  }
};