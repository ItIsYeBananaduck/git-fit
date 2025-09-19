// Authentication Store

import { writable, derived } from 'svelte/store';
import type { User, AuthState } from '../../types/auth.js';
import { authService } from '../services/authService.js';
import { browser } from '$app/environment';

// Create the auth store
function createAuthStore() {
  const initialState: AuthState = {
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null
  };

  const { subscribe, set, update } = writable<AuthState>(initialState);

  return {
    subscribe,

    // Initialize auth state (call on app startup)
    async initialize() {
      if (!browser) return;

      update(state => ({ ...state, isLoading: true }));

      try {
        const currentUser = authService.getCurrentUser();

        if (currentUser && authService.isAuthenticated()) {
          // Validate session with server
          const isValid = await authService.refreshSession();

          if (isValid) {
            const refreshedUser = authService.getCurrentUser();
            set({
              user: refreshedUser,
              isAuthenticated: true,
              isLoading: false,
              error: null
            });
          } else {
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
              error: null
            });
          }
        } else {
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null
          });
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: {
            code: 'INITIALIZATION_ERROR',
            message: 'Failed to initialize authentication'
          }
        });
      }
    },

    // Login
    async login(email: string, password: string, rememberMe: boolean = false) {
      update(state => ({ ...state, isLoading: true, error: null }));

      try {
        const result = await authService.login({ email, password, rememberMe });

        if (result.success && result.user) {
          set({
            user: result.user,
            isAuthenticated: true,
            isLoading: false,
            error: null
          });
          return { success: true };
        } else {
          update(state => ({
            ...state,
            isLoading: false,
            error: {
              code: 'LOGIN_FAILED',
              message: result.error || 'Login failed'
            }
          }));
          return { success: false, error: result.error };
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Login failed';
        update(state => ({
          ...state,
          isLoading: false,
          error: {
            code: 'LOGIN_ERROR',
            message: errorMessage
          }
        }));
        return { success: false, error: errorMessage };
      }
    },

    // Register
    async register(userData: { email: string; password: string; [key: string]: string | number | boolean }) {
      update(state => ({ ...state, isLoading: true, error: null }));

      try {
        const result = await authService.register(userData);

        if (result.success && result.user) {
          set({
            user: result.user,
            isAuthenticated: true,
            isLoading: false,
            error: null
          });
          return {
            success: true,
            requiresVerification: result.requiresVerification
          };
        } else {
          update(state => ({
            ...state,
            isLoading: false,
            error: {
              code: 'REGISTRATION_FAILED',
              message: result.error || 'Registration failed'
            }
          }));
          return { success: false, error: result.error };
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Registration failed';
        update(state => ({
          ...state,
          isLoading: false,
          error: {
            code: 'REGISTRATION_ERROR',
            message: errorMessage
          }
        }));
        return { success: false, error: errorMessage };
      }
    },

    // Logout
    async logout() {
      update(state => ({ ...state, isLoading: true }));

      try {
        await authService.logout();
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null
        });
      } catch (error) {
        console.error('Logout error:', error);
        // Still clear the state even if server logout fails
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null
        });
      }
    },

    // Update profile
    async updateProfile(updates: Partial<User>) {
      update(state => ({ ...state, isLoading: true, error: null }));

      try {
        const result = await authService.updateProfile(updates);

        if (result.success && result.user) {
          update(state => ({
            ...state,
            user: result.user,
            isLoading: false,
            error: null
          }));
          return { success: true };
        } else {
          update(state => ({
            ...state,
            isLoading: false,
            error: {
              code: 'UPDATE_FAILED',
              message: result.error || 'Profile update failed'
            }
          }));
          return { success: false, error: result.error };
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Profile update failed';
        update(state => ({
          ...state,
          isLoading: false,
          error: {
            code: 'UPDATE_ERROR',
            message: errorMessage
          }
        }));
        return { success: false, error: errorMessage };
      }
    },

    // Clear error
    clearError() {
      update(state => ({ ...state, error: null }));
    },

    // Refresh session
    async refreshSession() {
      try {
        const isValid = await authService.refreshSession();

        if (isValid) {
          const user = authService.getCurrentUser();
          update(state => ({
            ...state,
            user,
            isAuthenticated: true
          }));
        } else {
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null
          });
        }

        return isValid;
      } catch (error) {
        console.error('Session refresh error:', error);
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null
        });
        return false;
      }
    },

    /**
     * Get the current authenticated user (async, for onboarding flows)
     */
    async getAuthUser(): Promise<User | null> {
      // Try to get from store first
      const current = authService.getCurrentUser();
      if (current) return current;
      // Try to refresh session if not present
      await authService.refreshSession();
      return authService.getCurrentUser();
    }
  };
}

export const authStore = createAuthStore();

// Derived stores for convenience
export const user = derived(authStore, $auth => $auth.user);
export const isAuthenticated = derived(authStore, $auth => $auth.isAuthenticated);
export const isLoading = derived(authStore, $auth => $auth.isLoading);
export const authError = derived(authStore, $auth => $auth.error);

// Export getAuthUser function
export const getAuthUser = () => authStore.getAuthUser();