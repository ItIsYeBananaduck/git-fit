import { writable, type Writable } from 'svelte/store';
import { polarAPI } from '../api/polar.js';
import type { TrackerData } from '../types/fitnessTrackers.js';

interface PolarAuthState {
  isConnected: boolean;
  accessToken: string | null;
  memberId: string | null;
  lastSync: Date | null;
}

class PolarDataService {
  private static instance: PolarDataService;
  public authState: Writable<PolarAuthState>;
  public data: Writable<TrackerData | null>;
  public loading: Writable<boolean>;
  public error: Writable<string | null>;

  private constructor() {
    this.authState = writable({
      isConnected: false,
      accessToken: null,
      memberId: null,
      lastSync: null
    });
    this.data = writable(null);
    this.loading = writable(false);
    this.error = writable(null);

    // Load saved auth state
    this.loadAuthState();
  }

  static getInstance(): PolarDataService {
    if (!PolarDataService.instance) {
      PolarDataService.instance = new PolarDataService();
    }
    return PolarDataService.instance;
  }

  private loadAuthState() {
    if (typeof window === 'undefined') return;

    const saved = localStorage.getItem('polar_auth');
    if (saved) {
      try {
        const authState = JSON.parse(saved);
        if (authState.accessToken) {
          polarAPI.setAccessToken(authState.accessToken);
          this.authState.set({
            ...authState,
            lastSync: authState.lastSync ? new Date(authState.lastSync) : null
          });
        }
      } catch (error) {
        console.error('Failed to load Polar auth state:', error);
        localStorage.removeItem('polar_auth');
      }
    }
  }

  private saveAuthState(state: PolarAuthState) {
    if (typeof window === 'undefined') return;
    localStorage.setItem('polar_auth', JSON.stringify(state));
  }

  async connect(clientId: string, clientSecret: string): Promise<string> {
    try {
      this.error.set(null);
      polarAPI.setCredentials(clientId, clientSecret);

      const redirectUri = `${window.location.origin}/auth/polar/callback`;
      const state = Math.random().toString(36).substring(7);
      
      // Store state for verification
      sessionStorage.setItem('polar_oauth_state', state);
      
      return polarAPI.getAuthUrl(redirectUri, state);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to initiate Polar connection';
      this.error.set(errorMessage);
      throw error;
    }
  }

  async handleCallback(code: string, state: string, memberId: string): Promise<void> {
    try {
      this.loading.set(true);
      this.error.set(null);

      // Verify state
      const storedState = sessionStorage.getItem('polar_oauth_state');
      if (state !== storedState) {
        throw new Error('Invalid OAuth state parameter');
      }
      sessionStorage.removeItem('polar_oauth_state');

      const redirectUri = `${window.location.origin}/auth/polar/callback`;
      const authResponse = await polarAPI.exchangeCodeForToken(code, redirectUri);

      // Register user with Polar
      await polarAPI.registerUser(memberId);

      const newAuthState = {
        isConnected: true,
        accessToken: authResponse.access_token,
        memberId,
        lastSync: null
      };

      this.authState.set(newAuthState);
      this.saveAuthState(newAuthState);

      // Fetch initial data
      await this.refreshData();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to complete Polar authentication';
      this.error.set(errorMessage);
      throw error;
    } finally {
      this.loading.set(false);
    }
  }

  async refreshData(): Promise<void> {
    try {
      this.loading.set(true);
      this.error.set(null);

      const trackerData = await polarAPI.getTrackerData();
      this.data.set(trackerData);

      // Update last sync time
      this.authState.update(state => {
        const updatedState = { ...state, lastSync: new Date() };
        this.saveAuthState(updatedState);
        return updatedState;
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to refresh Polar data';
      this.error.set(errorMessage);
      throw error;
    } finally {
      this.loading.set(false);
    }
  }

  async disconnect(): Promise<void> {
    try {
      this.loading.set(true);
      
      // Try to delete user from Polar (optional - may fail if already deleted)
      try {
        await polarAPI.deleteUser();
      } catch (error) {
        console.warn('Failed to delete user from Polar (may already be deleted):', error);
      }

      // Clear local state
      this.authState.set({
        isConnected: false,
        accessToken: null,
        memberId: null,
        lastSync: null
      });
      this.data.set(null);
      this.error.set(null);

      // Clear stored auth
      localStorage.removeItem('polar_auth');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to disconnect from Polar';
      this.error.set(errorMessage);
      throw error;
    } finally {
      this.loading.set(false);
    }
  }

  // Utility methods for getting current values
  getCurrentData(): TrackerData | null {
    let currentData: TrackerData | null = null;
    this.data.subscribe(data => currentData = data)();
    return currentData;
  }

  isConnected(): boolean {
    let connected = false;
    this.authState.subscribe(state => connected = state.isConnected)();
    return connected;
  }
}

export const polarDataService = PolarDataService.getInstance();