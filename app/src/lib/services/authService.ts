// ...existing code...
// (Removed duplicate export of authService; singleton exported at end of file)
// Authentication Service

import { ConvexError } from "convex/values";
import type {
  User,
  RegisterData,
  LoginCredentials,
  AuthResult,
} from '../../types/auth';
import { api } from "$lib/convex/_generated/api";
import { convex } from "$lib/convex";
import { browser } from '$app/environment';

export class AuthService {
  private static instance: AuthService;
  private currentUser: User | null = null;
  private authToken: string | null = null;

  constructor() {
    if (browser) {
      this.initializeFromStorage();
    }
  }

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  /**
   * Initialize auth state from localStorage
   */
  private initializeFromStorage(): void {
    try {
      const token = localStorage.getItem('auth_token');
      const userData = localStorage.getItem('user_data');

      if (token && userData) {
        this.authToken = token;
        this.currentUser = JSON.parse(userData);
      }
    } catch (error) {
      console.error('Failed to initialize auth from storage:', error);
      this.clearStorage();
    }
  }

  /**
   * Register a new user
   */
  async register(userData: RegisterData): Promise<AuthResult> {
    try {
      // Validate input
      const validation = this.validateRegistrationData(userData);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.error
        };
      }

      // Call Convex mutation
      const result = await convex.mutation(api.functions.users.register, {
        email: userData.email.toLowerCase().trim(),
        password: userData.password,
        name: userData.name.trim(),
        role: userData.role,
        profile: userData.profile
      }) as {
        success: boolean;
        user?: User;
        token?: string;
        error?: string;
      };

      if (result.success && result.user && result.token) {
        this.setAuthData(result.user, result.token);
        return {
          success: true,
          user: result.user,
          token: result.token,
          requiresVerification: !result.user.emailVerified
        };
      }

      return {
        success: false,
        error: result.error || 'Registration failed'
      };

    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        error: this.handleError(error)
      };
    }
  }

  /**
   * Login user
   */
  async login(credentials: LoginCredentials): Promise<AuthResult> {
    try {
      // Validate input
      if (!credentials.email || !credentials.password) {
        return {
          success: false,
          error: 'Email and password are required'
        };
      }

      // Call Convex mutation
      const result = await convex.mutation(api.functions.users.login, {
        email: credentials.email.toLowerCase().trim(),
        password: credentials.password,
        rememberMe: credentials.rememberMe || false
      }) as {
        success: boolean;
        user?: User;
        token?: string;
        error?: string;
      };

      if (result.success && result.user && result.token) {
        this.setAuthData(result.user, result.token);
        return {
          success: true,
          user: result.user,
          token: result.token
        };
      }

      return {
        success: false,
        error: result.error || 'Login failed'
      };

    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: this.handleError(error)
      };
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      if (this.authToken) {
        // Invalidate session on server
        await convex.mutation(api.functions.users.logout, {
          token: this.authToken
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.clearAuthData();
    }
  }

  /**
   * Get current user
   */
  getCurrentUser(): User | null {
    return this.currentUser;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.currentUser !== null && this.authToken !== null;
  }

  /**
   * Get auth token
   */
  getToken(): string | null {
    return this.authToken;
  }

  /**
   * Refresh session
   */
  async refreshSession(): Promise<boolean> {
    try {
      if (!this.authToken) return false;

      const result = await convex.query(api.functions.users.validateSession, {
        token: this.authToken
      }) as {
        valid: boolean;
        user?: User;
        reason?: string;
      };

      if (result.valid && result.user) {
        this.currentUser = result.user;
        this.updateStorage();
        return true;
      } else {
        this.clearAuthData();
        return false;
      }
    } catch (error) {
      console.error('Session refresh error:', error);
      this.clearAuthData();
      return false;
    }
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (!email || !this.isValidEmail(email)) {
        return {
          success: false,
          error: 'Please enter a valid email address'
        };
      }

      await convex.mutation(api.functions.users.requestPasswordReset, {
        email: email.toLowerCase().trim()
      });

      return { success: true };

    } catch (error) {
      console.error('Password reset request error:', error);
      return {
        success: false,
        error: this.handleError(error)
      };
    }
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    try {
      const validation = this.validatePassword(newPassword);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.error
        };
      }

      const result = await convex.mutation(api.functions.users.resetPassword, {
        token,
        newPassword
      }) as {
        success: boolean;
        error?: string;
      };

      if (result.success) {
        return { success: true };
      }

      return {
        success: false,
        error: result.error || 'Password reset failed'
      };

    } catch (error) {
      console.error('Password reset error:', error);
      return {
        success: false,
        error: this.handleError(error)
      };
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(updates: Partial<User>): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      if (!this.isAuthenticated()) {
        return {
          success: false,
          error: 'Not authenticated'
        };
      }

      const result = await convex.mutation(api.functions.users.updateUserProfile, {
        userId: this.currentUser!._id,
        updates
      }) as {
        success: boolean;
        user?: User;
        error?: string;
      };

      if (result.success && result.user) {
        this.currentUser = result.user;
        this.updateStorage();
        return {
          success: true,
          user: result.user
        };
      }

      return {
        success: false,
        error: result.error || 'Profile update failed'
      };

    } catch (error) {
      console.error('Profile update error:', error);
      return {
        success: false,
        error: this.handleError(error)
      };
    }
  }

  /**
   * Change password
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.isAuthenticated()) {
        return {
          success: false,
          error: 'Not authenticated'
        };
      }

      const validation = this.validatePassword(newPassword);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.error
        };
      }

      const result = await convex.mutation(api.functions.users.changePassword, {
        userId: this.currentUser!._id,
        currentPassword,
        newPassword
      }) as {
        success: boolean;
        error?: string;
      };

      return {
        success: result.success,
        error: result.error
      };

    } catch (error) {
      console.error('Password change error:', error);
      return {
        success: false,
        error: this.handleError(error)
      };
    }
  }

  // Private helper methods

  private setAuthData(user: User, token: string): void {
    this.currentUser = user;
    this.authToken = token;
    this.updateStorage();
  }

  private clearAuthData(): void {
    this.currentUser = null;
    this.authToken = null;
    this.clearStorage();
  }

  private updateStorage(): void {
    if (!browser) return;

    try {
      if (this.authToken && this.currentUser) {
        localStorage.setItem('auth_token', this.authToken);
        localStorage.setItem('user_data', JSON.stringify(this.currentUser));
      }
    } catch (error) {
      console.error('Failed to update storage:', error);
    }
  }

  private clearStorage(): void {
    if (!browser) return;

    try {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
    } catch (error) {
      console.error('Failed to clear storage:', error);
    }
  }

  private validateRegistrationData(data: RegisterData): { isValid: boolean; error?: string } {
    if (!data.email || !this.isValidEmail(data.email)) {
      return { isValid: false, error: 'Please enter a valid email address' };
    }

    if (!data.name || data.name.trim().length < 2) {
      return { isValid: false, error: 'Name must be at least 2 characters long' };
    }

    const passwordValidation = this.validatePassword(data.password);
    if (!passwordValidation.isValid) {
      return passwordValidation;
    }

    if (!['client', 'trainer'].includes(data.role)) {
      return { isValid: false, error: 'Please select a valid role' };
    }

    return { isValid: true };
  }

  private validatePassword(password: string): { isValid: boolean; error?: string } {
    if (!password || password.length < 8) {
      return { isValid: false, error: 'Password must be at least 8 characters long' };
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      return {
        isValid: false,
        error: 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      };
    }

    return { isValid: true };
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private handleError(error: unknown): string {
    if (error instanceof ConvexError) {
      return error.message;
    }

    if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
      return error.message;
    }

    return 'An unexpected error occurred. Please try again.';
  }
}

// Export singleton instance
export const authService = AuthService.getInstance();