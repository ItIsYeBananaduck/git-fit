import { writable } from 'svelte/store';
import type { OuraTokens, OuraSleepData, OuraReadinessData, OuraActivityData } from '$lib/api/oura';

export interface OuraState {
  isConnected: boolean;
  isLoading: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: number | null;
  error: string | null;
  lastSync: Date | null;
}

export interface OuraData {
  sleep: OuraSleepData[];
  readiness: OuraReadinessData[];
  activity: OuraActivityData[];
  averageHRV: number | null;
}

// Initial state
const initialOuraState: OuraState = {
  isConnected: false,
  isLoading: false,
  accessToken: null,
  refreshToken: null,
  expiresAt: null,
  error: null,
  lastSync: null
};

const initialOuraData: OuraData = {
  sleep: [],
  readiness: [],
  activity: [],
  averageHRV: null
};

// Create stores
export const ouraState = writable<OuraState>(initialOuraState);
export const ouraData = writable<OuraData>(initialOuraData);

// Store actions
export const ouraActions = {
  /**
   * Set connection state to loading
   */
  setLoading: (loading: boolean) => {
    ouraState.update(state => ({ ...state, isLoading: loading, error: null }));
  },

  /**
   * Set authentication tokens
   */
  setTokens: (tokens: OuraTokens) => {
    const expiresAt = Date.now() + (tokens.expires_in * 1000);
    
    ouraState.update(state => ({
      ...state,
      isConnected: true,
      isLoading: false,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt,
      error: null,
      lastSync: new Date()
    }));

    // Persist tokens to localStorage
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('oura_tokens', JSON.stringify({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: expiresAt
      }));
    }
  },

  /**
   * Update data from API
   */
  updateData: (data: Partial<OuraData>) => {
    ouraData.update(current => ({ ...current, ...data }));
    ouraState.update(state => ({ ...state, lastSync: new Date(), error: null }));
  },

  /**
   * Set error state
   */
  setError: (error: string) => {
    ouraState.update(state => ({ ...state, error, isLoading: false }));
  },

  /**
   * Disconnect Oura
   */
  disconnect: () => {
    ouraState.set(initialOuraState);
    ouraData.set(initialOuraData);
    
    // Clear persisted tokens
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('oura_tokens');
    }
  },

  /**
   * Check if token needs refresh
   */
  needsRefresh: (state: OuraState): boolean => {
    if (!state.expiresAt) return false;
    // Refresh if expires within 5 minutes
    return (state.expiresAt - Date.now()) < (5 * 60 * 1000);
  },

  /**
   * Initialize from localStorage on app start
   */
  initializeFromStorage: () => {
    if (typeof localStorage === 'undefined') return;
    
    try {
      const stored = localStorage.getItem('oura_tokens');
      if (stored) {
        const tokens = JSON.parse(stored);
        
        // Check if tokens are still valid
        if (tokens.expires_at && tokens.expires_at > Date.now()) {
          ouraState.update(state => ({
            ...state,
            isConnected: true,
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token,
            expiresAt: tokens.expires_at
          }));
        } else {
          // Tokens expired, clear them
          localStorage.removeItem('oura_tokens');
        }
      }
    } catch (error) {
      console.error('Error loading Oura tokens from storage:', error);
      localStorage.removeItem('oura_tokens');
    }
  }
};

// Initialize from storage when module loads
if (typeof window !== 'undefined') {
  ouraActions.initializeFromStorage();
}