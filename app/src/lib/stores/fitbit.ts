import { writable } from 'svelte/store';
import type { FitbitTokens, FitbitSleepData, FitbitHeartRateData, FitbitActivityData } from '$lib/api/fitbit';

export interface FitbitState {
  isConnected: boolean;
  isLoading: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  userId: string | null;
  expiresAt: number | null;
  error: string | null;
  lastSync: Date | null;
  scopes: string[];
}

export interface FitbitData {
  sleep: FitbitSleepData['sleep'];
  heartRate: FitbitHeartRateData['activities-heart'];
  activity: FitbitActivityData | null;
  restingHeartRate: number | null;
  hrv: number | null;
}

// Initial state
const initialFitbitState: FitbitState = {
  isConnected: false,
  isLoading: false,
  accessToken: null,
  refreshToken: null,
  userId: null,
  expiresAt: null,
  error: null,
  lastSync: null,
  scopes: []
};

const initialFitbitData: FitbitData = {
  sleep: [],
  heartRate: [],
  activity: null,
  restingHeartRate: null,
  hrv: null
};

// Create stores
export const fitbitState = writable<FitbitState>(initialFitbitState);
export const fitbitData = writable<FitbitData>(initialFitbitData);

// Store actions
export const fitbitActions = {
  /**
   * Set connection state to loading
   */
  setLoading: (loading: boolean) => {
    fitbitState.update(state => ({ ...state, isLoading: loading, error: null }));
  },

  /**
   * Set authentication tokens
   */
  setTokens: (tokens: FitbitTokens) => {
    const expiresAt = Date.now() + (tokens.expires_in * 1000);
    const scopes = tokens.scope ? tokens.scope.split(' ') : [];
    
    fitbitState.update(state => ({
      ...state,
      isConnected: true,
      isLoading: false,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      userId: tokens.user_id,
      expiresAt,
      scopes,
      error: null,
      lastSync: new Date()
    }));

    // Persist tokens to localStorage
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('fitbit_tokens', JSON.stringify({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        user_id: tokens.user_id,
        expires_at: expiresAt,
        scopes
      }));
    }
  },

  /**
   * Update data from API
   */
  updateData: (data: Partial<FitbitData>) => {
    fitbitData.update(current => ({ ...current, ...data }));
    fitbitState.update(state => ({ ...state, lastSync: new Date(), error: null }));
  },

  /**
   * Set error state
   */
  setError: (error: string) => {
    fitbitState.update(state => ({ ...state, error, isLoading: false }));
  },

  /**
   * Disconnect Fitbit
   */
  disconnect: () => {
    fitbitState.set(initialFitbitState);
    fitbitData.set(initialFitbitData);
    
    // Clear persisted tokens
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('fitbit_tokens');
    }
  },

  /**
   * Check if token needs refresh
   */
  needsRefresh: (state: FitbitState): boolean => {
    if (!state.expiresAt) return false;
    // Refresh if expires within 30 minutes
    return (state.expiresAt - Date.now()) < (30 * 60 * 1000);
  },

  /**
   * Check if specific scope is granted
   */
  hasScope: (state: FitbitState, scope: string): boolean => {
    return state.scopes.includes(scope);
  },

  /**
   * Get missing scopes for desired functionality
   */
  getMissingScopes: (state: FitbitState, requiredScopes: string[]): string[] => {
    return requiredScopes.filter(scope => !state.scopes.includes(scope));
  },

  /**
   * Update token from refresh
   */
  updateTokens: (tokens: Partial<FitbitTokens>) => {
    fitbitState.update(state => {
      const newState = { ...state };
      
      if (tokens.access_token) {
        newState.accessToken = tokens.access_token;
      }
      
      if (tokens.refresh_token) {
        newState.refreshToken = tokens.refresh_token;
      }
      
      if (tokens.expires_in) {
        newState.expiresAt = Date.now() + (tokens.expires_in * 1000);
      }
      
      if (tokens.scope) {
        newState.scopes = tokens.scope.split(' ');
      }

      // Update localStorage
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem('fitbit_tokens');
        if (stored) {
          const current = JSON.parse(stored);
          localStorage.setItem('fitbit_tokens', JSON.stringify({
            ...current,
            access_token: newState.accessToken,
            refresh_token: newState.refreshToken,
            expires_at: newState.expiresAt,
            scopes: newState.scopes
          }));
        }
      }

      return newState;
    });
  },

  /**
   * Initialize from localStorage on app start
   */
  initializeFromStorage: () => {
    if (typeof localStorage === 'undefined') return;
    
    try {
      const stored = localStorage.getItem('fitbit_tokens');
      if (stored) {
        const tokens = JSON.parse(stored);
        
        // Check if tokens are still valid
        if (tokens.expires_at && tokens.expires_at > Date.now()) {
          fitbitState.update(state => ({
            ...state,
            isConnected: true,
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token,
            userId: tokens.user_id,
            expiresAt: tokens.expires_at,
            scopes: tokens.scopes || []
          }));
        } else {
          // Tokens expired, clear them
          localStorage.removeItem('fitbit_tokens');
        }
      }
    } catch (error) {
      console.error('Error loading Fitbit tokens from storage:', error);
      localStorage.removeItem('fitbit_tokens');
    }
  }
};

// Initialize from storage when module loads
if (typeof window !== 'undefined') {
  fitbitActions.initializeFromStorage();
}