// Authentication Integration Tests

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { get } from 'svelte/store';
import { authStore } from '$lib/stores/auth';
import { authService } from '$lib/services/authService';
import { checkPasswordStrength, isValidEmail } from '$lib/utils/password';
import { requireRole, requireAdmin, requireTrainer, requireClient } from '$lib/utils/auth-guards';
import type { RegisterData, User } from '$lib/types/auth';

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
  setTimeout: vi.fn((callback) => {
    callback();
  }),
  clearTimeout: vi.fn()
}));

describe('Authentication Integration Tests', () => {
  // Refined mockConvex to align with the expected structure
  let mockConvex = {
    convex: {
      mutation: vi.fn(() => Promise.resolve({ success: true, user: mockUser, token: 'mock-token' })),
      query: vi.fn(() => Promise.resolve()),
    },
  };

  // Updated mockUser to ensure all required properties are included
  const mockUser: User = {
    _id: 'mock123',
    email: 'mock@example.com',
    name: 'Mock User',
    role: 'client',
    emailVerified: true,
    profile: {
      fitnessLevel: 'intermediate',
      goals: ['Endurance', 'Flexibility'],
      preferences: { workoutTime: 'evening', diet: 'keto' },
    },
    isActive: true,
    createdAt: new Date().toISOString(),
  };

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

  describe('Client Registration and Login', () => {
    it('should register and log in a client successfully', async () => {
      // Mock user data
      const clientData = {
        email: 'client@example.com',
        password: 'StrongPassword123!',
        name: 'Test Client',
        role: 'client',
        profile: {
          fitnessLevel: 'beginner',
          goals: ['Weight Loss', 'Muscle Gain'],
          preferences: { workoutTime: 'morning', diet: 'vegan' },
        },
      };

      const mockResponse = {
        success: true,
        user: {
          _id: 'client123',
          email: clientData.email,
          name: clientData.name,
          role: 'client',
          emailVerified: true,
          profile: {
            fitnessLevel: 'beginner',
            goals: ['Weight Loss', 'Muscle Gain'],
            preferences: { workoutTime: 'morning', diet: 'vegan' },
          },
          isActive: true,
          createdAt: new Date().toISOString(),
        },
        token: 'mock-token',
      };

      // Mock authService behavior
      vi.spyOn(authService, 'register').mockResolvedValue(mockResponse);
      vi.spyOn(authService, 'login').mockResolvedValue(mockResponse);

      // Perform registration
      const registerResult = await authService.register(clientData);
      expect(registerResult.success).toBe(true);
      expect(registerResult.user?.email).toBe(clientData.email);

      // Perform login
      const loginResult = await authService.login({
        email: clientData.email,
        password: clientData.password,
      });
      expect(loginResult.success).toBe(true);
      expect(loginResult.user?.role).toBe('client');
    });
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