// Authentication Integration Tests

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { get } from 'svelte/store';
import { authStore } from '$lib/stores/auth';
import { authService } from '$lib/services/authService';
import { checkPasswordStrength, isValidEmail } from '$lib/utils/password';
import { requireAuth, requireRole, requireAdmin, requireTrainer, requireClient, redirectIfAuthenticated } from '$lib/utils/auth-guards';
import type { RegisterData, User, LoginCredentials } from '$lib/types/auth';

// Mock Convex
vi.mock('$lib/convex', () => ({
  convex: {
    mutation: vi.fn(),
    query: vi.fn(),
  }
}));

// Mock browser environment
vi.mock('$app/environment', () => ({
  browser: true
}));

// Mock SvelteKit redirect
vi.mock('@sveltejs/kit', () => ({
  redirect: vi.fn((status: number, location: string) => {
    throw new Error(`Redirect: ${status} -> ${location}`);
  })
}));

// Mock setTimeout for session expiration tests
vi.mock('global', () => ({
  setTimeout: vi.fn((callback, delay) => {
    // Immediately execute for testing
    callback();
    return 1;
  }),
  clearTimeout: vi.fn()
}));

describe('Authentication Integration Tests', () => {
  let mockConvex: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    localStorage.clear();
    await authStore.logout();
    
    // Get fresh mock reference
    mockConvex = await import('$lib/convex');
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('Complete Registration and Login Journey', () => {
    it('should handle complete client registration and login flow', async () => {
      const mockUser: User = {
        _id: 'client123',
        email: 'client@example.com',
        name: 'Test Client',
        role: 'client',
        profile: {
          fitnessLevel: 'beginner',
          goals: ['Weight Loss', 'Muscle Gain'],
          height: 175,
          weight: 70,
          dateOfBirth: '1990-01-01',
          preferences: {
            units: 'metric',
            notifications: true,
            dataSharing: false
          }
        },
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
        emailVerified: false
      };

      vi.mocked(mockConvex.convex.mutation).mockResolvedValue({
        success: true,
        user: mockUser,
        token: 'client-token'
      });

      // Test registration data validation
      const registrationData: RegisterData = {
        email: 'client@example.com',
        password: 'SecurePass123!',
        name: 'Test Client',
        role: 'client',
        profile: {
          fitnessLevel: 'beginner',
          goals: ['Weight Loss', 'Muscle Gain'],
          height: 175,
          weight: 70,
          dateOfBirth: '1990-01-01',
          preferences: {
            units: 'metric',
            notifications: true,
            dataSharing: false
          }
        }
      };

      // Validate email format
      expect(isValidEmail(registrationData.email)).toBe(true);

      // Validate password strength
      const passwordStrength = checkPasswordStrength(registrationData.password);
      expect(passwordStrength.isValid).toBe(true);
      expect(passwordStrength.score).toBeGreaterThanOrEqual(3);

      // Register user
      const registerResult = await authStore.register(registrationData);
      expect(registerResult.success).toBe(true);

      // Check auth state after registration
      const stateAfterRegister = get(authStore);
      expect(stateAfterRegister.user).toEqual(mockUser);
      expect(stateAfterRegister.isAuthenticated).toBe(true);
      expect(stateAfterRegister.isLoading).toBe(false);

      // Test route protection with authenticated user
      const protectedUser = requireAuth(stateAfterRegister.user, '/dashboard');
      expect(protectedUser).toEqual(mockUser);

      // Test role-based access
      const clientUser = requireClient(stateAfterRegister.user, '/client-dashboard');
      expect(clientUser).toEqual(mockUser);

      // Test logout
      await authStore.logout();
      const stateAfterLogout = get(authStore);
      expect(stateAfterLogout.user).toBeNull();
      expect(stateAfterLogout.isAuthenticated).toBe(false);

      // Test route protection after logout
      expect(() => {
        requireAuth(stateAfterLogout.user, '/dashboard');
      }).toThrow('Redirect: 302 -> /auth/login?redirect=%2Fdashboard');
    });

    it('should handle complete trainer registration and login flow', async () => {
      const mockUser: User = {
        _id: 'trainer123',
        email: 'trainer@example.com',
        name: 'Test Trainer',
        role: 'trainer',
        profile: {
          bio: 'Experienced fitness trainer with 5 years of experience',
          specialties: ['Weight Training', 'HIIT', 'Nutrition'],
          certifications: ['NASM-CPT', 'Precision Nutrition'],
          hourlyRate: 75,
          experience: 5,
          availability: {
            timezone: 'UTC',
            schedule: {
              monday: { start: '09:00', end: '17:00' },
              tuesday: { start: '09:00', end: '17:00' }
            }
          },
          preferences: {
            notifications: true,
            clientCommunication: true
          }
        },
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
        emailVerified: true
      };

      vi.mocked(mockConvex.convex.mutation).mockResolvedValue({
        success: true,
        user: mockUser,
        token: 'trainer-token'
      });

      const registrationData: RegisterData = {
        email: 'trainer@example.com',
        password: 'TrainerPass123!',
        name: 'Test Trainer',
        role: 'trainer',
        profile: {
          bio: 'Experienced fitness trainer with 5 years of experience',
          specialties: ['Weight Training', 'HIIT', 'Nutrition'],
          certifications: ['NASM-CPT', 'Precision Nutrition'],
          hourlyRate: 75,
          experience: 5,
          preferences: {
            notifications: true,
            clientCommunication: true
          }
        }
      };

      // Register trainer
      const registerResult = await authStore.register(registrationData);
      expect(registerResult.success).toBe(true);

      // Check auth state
      const state = get(authStore);
      expect(state.user).toEqual(mockUser);
      expect(state.isAuthenticated).toBe(true);

      // Test trainer-specific access
      const trainerUser = requireTrainer(state.user, '/trainer-dashboard');
      expect(trainerUser).toEqual(mockUser);

      // Test that client-only access is denied for trainer
      expect(() => {
        requireRole(state.user, 'client', '/client-only');
      }).toThrow('Redirect: 302 -> /unauthorized');
    });

    it('should handle admin user registration and access', async () => {
      const mockAdmin: User = {
        _id: 'admin123',
        email: 'admin@example.com',
        name: 'Test Admin',
        role: 'admin',
        profile: {
          department: 'Platform Management',
          permissions: ['user_management', 'content_moderation', 'analytics']
        },
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
        emailVerified: true
      };

      vi.mocked(mockConvex.convex.mutation).mockResolvedValue({
        success: true,
        user: mockAdmin,
        token: 'admin-token'
      });

      // Login as admin
      const loginResult = await authStore.login('admin@example.com', 'AdminPass123!');
      expect(loginResult.success).toBe(true);

      const state = get(authStore);
      expect(state.user).toEqual(mockAdmin);

      // Test admin access
      const adminUser = requireAdmin(state.user, '/admin');
      expect(adminUser).toEqual(mockAdmin);

      // Test that admin can access all role-specific areas
      const adminAsTrainer = requireTrainer(state.user, '/trainer-area');
      expect(adminAsTrainer).toEqual(mockAdmin);

      const adminAsClient = requireClient(state.user, '/client-area');
      expect(adminAsClient).toEqual(mockAdmin);
    });
  });

  it('should handle login flow with existing user', async () => {
    const mockUser = {
      _id: 'user123',
      email: 'existing@example.com',
      name: 'Existing User',
      role: 'trainer' as const,
      emailVerified: true
    };

    // Mock successful login
    const mockConvex = await import('$lib/convex');
    vi.mocked(mockConvex.convex.mutation).mockResolvedValue({
      success: true,
      user: mockUser,
      token: 'login-token'
    });

    // Login
    const loginResult = await authStore.login('existing@example.com', 'password123');
    expect(loginResult.success).toBe(true);

    // Check auth state
    const state = get(authStore);
    expect(state.user).toEqual(mockUser);
    expect(state.isAuthenticated).toBe(true);

    // Test trainer-specific access
    const trainerUser = requireRole(state.user, 'trainer', '/trainer-dashboard');
    expect(trainerUser).toEqual(mockUser);

    // Test that client-only access is denied
    expect(() => {
      requireRole(state.user, 'client', '/client-only');
    }).toThrow('Redirect: 302 -> /unauthorized');
  });

  it('should handle authentication errors gracefully', async () => {
    // Mock failed login
    const mockConvex = await import('$lib/convex');
    vi.mocked(mockConvex.convex.mutation).mockResolvedValue({
      success: false,
      error: 'Invalid credentials'
    });

    // Attempt login
    const loginResult = await authStore.login('wrong@example.com', 'wrongpassword');
    expect(loginResult.success).toBe(false);
    expect(loginResult.error).toBe('Invalid credentials');

    // Check auth state remains unauthenticated
    const state = get(authStore);
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.error).toEqual({
      code: 'LOGIN_FAILED',
      message: 'Invalid credentials'
    });

    // Clear error
    authStore.clearError();
    const clearedState = get(authStore);
    expect(clearedState.error).toBeNull();
  });

  it('should validate user input properly', () => {
    // Test various email formats
    expect(isValidEmail('valid@example.com')).toBe(true);
    expect(isValidEmail('user+tag@domain.co.uk')).toBe(true);
    expect(isValidEmail('invalid-email')).toBe(false);
    expect(isValidEmail('@example.com')).toBe(false);
    expect(isValidEmail('')).toBe(false);

    // Test password strength
    const weakPassword = checkPasswordStrength('weak');
    expect(weakPassword.isValid).toBe(false);
    expect(weakPassword.feedback.length).toBeGreaterThan(0);

    const strongPassword = checkPasswordStrength('StrongPass123!');
    expect(strongPassword.isValid).toBe(true);
    expect(strongPassword.score).toBeGreaterThanOrEqual(3);
  });

  it('should handle session management', async () => {
    const mockUser = {
      _id: 'user123',
      email: 'session@example.com',
      name: 'Session User',
      role: 'client' as const,
      emailVerified: true
    };

    // Mock successful session refresh
    const mockConvex = await import('$lib/convex');
    vi.mocked(mockConvex.convex.query).mockResolvedValue({
      valid: true,
      user: mockUser
    });

    // Mock authService methods
    vi.spyOn(authService, 'refreshSession').mockResolvedValue(true);
    vi.spyOn(authService, 'getCurrentUser').mockReturnValue(mockUser);

    // Test session refresh
    const refreshResult = await authStore.refreshSession();
    expect(refreshResult).toBe(true);

    const state = get(authStore);
    expect(state.user).toEqual(mockUser);
    expect(state.isAuthenticated).toBe(true);
  });
});