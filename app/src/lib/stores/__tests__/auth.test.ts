// Authentication Store Tests

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import { authStore } from '../auth';

// Mock the auth service
vi.mock('$lib/services/authService', () => ({
  authService: {
    getCurrentUser: vi.fn(() => null),
    isAuthenticated: vi.fn(() => false),
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    refreshSession: vi.fn(),
    updateProfile: vi.fn()
  }
}));

// Mock browser environment
vi.mock('$app/environment', () => ({
  browser: true
}));

describe('Auth Store', () => {
  beforeEach(async () => {
    // Reset all mocks
    vi.clearAllMocks();

    // Clear localStorage
    localStorage.clear();

    // Reset auth store to initial state
    await authStore.logout();
  });

  it('should initialize with default state', () => {
    const state = get(authStore);

    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.isLoading).toBe(false); // After logout in beforeEach, loading should be false
    expect(state.error).toBeNull();
  });

  it('should handle successful login', async () => {
    const mockUser = {
      _id: 'user123',
      email: 'test@example.com',
      name: 'Test User',
      role: 'client' as const,
      profile: {
        fitnessLevel: 'beginner',
        goals: ['weight_loss'],
        preferences: {
          units: 'metric',
          notifications: true,
          dataSharing: false
        }
      },
      isActive: true,
      createdAt: '2025-09-18T00:00:00Z',
      emailVerified: true
    };

    // Mock successful login
    const { authService } = await import('$lib/services/authService');
    vi.mocked(authService.login).mockResolvedValue({
      success: true,
      user: mockUser,
      token: 'mock-token'
    });

    const result = await authStore.login('test@example.com', 'password');

    expect(result.success).toBe(true);

    const state = get(authStore);
    expect(state.user).toEqual(mockUser);
    expect(state.isAuthenticated).toBe(true);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('should handle login failure', async () => {
    // Mock failed login
    const { authService } = await import('$lib/services/authService');
    vi.mocked(authService.login).mockResolvedValue({
      success: false,
      error: 'Invalid credentials'
    });

    const result = await authStore.login('test@example.com', 'wrongpassword');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Invalid credentials');

    const state = get(authStore);
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.isLoading).toBe(false);
    expect(state.error).toEqual({
      code: 'LOGIN_FAILED',
      message: 'Invalid credentials'
    });
  });

  it('should handle logout', async () => {
    // Mock logout
    const { authService } = await import('$lib/services/authService');
    vi.mocked(authService.logout).mockResolvedValue();

    await authStore.logout();

    const state = get(authStore);
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('should clear errors', () => {
    // Set an error state first
    authStore.login('', ''); // This should fail and set an error

    authStore.clearError();

    const state = get(authStore);
    expect(state.error).toBeNull();
  });

  it('should handle session refresh', async () => {
    const mockUser = {
      _id: 'user123',
      email: 'test@example.com',
      name: 'Test User',
      role: 'client' as const,
      emailVerified: true
    };

    // Mock successful session refresh
    const { authService } = await import('$lib/services/authService');
    vi.mocked(authService.refreshSession).mockResolvedValue(true);
    vi.mocked(authService.getCurrentUser).mockReturnValue({
      _id: 'user123',
      email: 'test@example.com',
      name: 'Test User',
      role: 'client',
      profile: {
        fitnessLevel: 'beginner',
        goals: ['weight_loss'],
        preferences: {
          units: 'metric',
          notifications: true,
          dataSharing: false
        }
      },
      isActive: true,
      createdAt: '2025-09-18T00:00:00Z',
      emailVerified: true
    });

    const result = await authStore.refreshSession();

    expect(result).toBe(true);

    const state = get(authStore);
    expect(state.user).toEqual(mockUser);
    expect(state.isAuthenticated).toBe(true);
  });

  it('should handle failed session refresh', async () => {
    // Mock failed session refresh
    const { authService } = await import('$lib/services/authService');
    vi.mocked(authService.refreshSession).mockResolvedValue(false);

    const result = await authStore.refreshSession();

    expect(result).toBe(false);

    const state = get(authStore);
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });
});