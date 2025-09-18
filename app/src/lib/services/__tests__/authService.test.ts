// Authentication Service Tests

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService } from '../authService';
import type { RegisterData, LoginCredentials } from "../../../../src/types/auth";

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

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    // Clear localStorage
    localStorage.clear();

    // Debugging: Log localStorage state
    console.log('localStorage before clear:', localStorage);

    // Create new instance
    authService = new AuthService();
  });

  describe('Registration', () => {
    it('should validate registration data', async () => {
      const invalidData: RegisterData = {
        email: 'invalid-email',
        password: '123',
        name: '',
        role: 'client',
        profile: {}
      };

      const result = await authService.register(invalidData);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should accept valid registration data', async () => {
      const validData: RegisterData = {
        email: 'test@example.com',
        password: 'SecurePass123',
        name: 'Test User',
        role: 'client',
        profile: {
          fitnessLevel: 'beginner',
          goals: ['weight_loss']
        }
      };

      // Mock successful Convex response
      const mockConvex = await import('$lib/convex');
      vi.mocked(mockConvex.convex.mutation).mockResolvedValue({
        success: true,
        user: {
          _id: 'user123',
          email: validData.email,
          name: validData.name,
          role: validData.role,
          emailVerified: false
        },
        token: 'mock-token'
      });

      const result = await authService.register(validData);

      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.token).toBeDefined();
    });
  });

  describe('Login', () => {
    it('should validate login credentials', async () => {
      const invalidCredentials: LoginCredentials = {
        email: '',
        password: ''
      };

      const result = await authService.login(invalidCredentials);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Email and password are required');
    });

    it('should handle successful login', async () => {
      const credentials: LoginCredentials = {
        email: 'test@example.com',
        password: 'SecurePass123'
      };

      // Mock successful Convex response
      const mockConvex = await import('$lib/convex');
      vi.mocked(mockConvex.convex.mutation).mockResolvedValue({
        success: true,
        user: {
          _id: 'user123',
          email: credentials.email,
          name: 'Test User',
          role: 'client',
          emailVerified: true
        },
        token: 'mock-token'
      });

      const result = await authService.login(credentials);

      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.token).toBeDefined();
    });
  });

  describe('Session Management', () => {
    it('should store auth data in localStorage', async () => {
      const user = {
        _id: 'user123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'client' as const,
        emailVerified: true
      };
      const token = 'mock-token';

      // Mock successful login
      const mockConvex = await import('$lib/convex');
      vi.mocked(mockConvex.convex.mutation).mockResolvedValue({
        success: true,
        user,
        token
      });

      await authService.login({
        email: 'test@example.com',
        password: 'SecurePass123'
      });

      expect(localStorage.getItem('auth_token')).toBe(token);
      expect(localStorage.getItem('user_data')).toBe(JSON.stringify(user));
    });

    it('should clear auth data on logout', async () => {
      // Set initial data
      localStorage.setItem('auth_token', 'mock-token');
      localStorage.setItem('user_data', JSON.stringify({ id: 'user123' }));

      // Mock logout
      const mockConvex = await import('$lib/convex');
      vi.mocked(mockConvex.convex.mutation).mockResolvedValue({ success: true });

      await authService.logout();

      expect(localStorage.getItem('auth_token')).toBeNull();
      expect(localStorage.getItem('user_data')).toBeNull();
    });
  });

  describe('Password Validation', () => {
    it('should reject weak passwords', async () => {
      const weakPasswords = [
        '123',
        'password',
        'PASSWORD',
        '12345678',
        'abcdefgh',
        'ABCDEFGH'
      ];

      for (const password of weakPasswords) {
        const result = await authService.register({
          email: 'test@example.com',
          password,
          name: 'Test User',
          role: 'client',
          profile: {}
        });

        expect(result.success).toBe(false);
        expect(result.error).toMatch(/Password must/i);
      }
    });

    it('should accept strong passwords', async () => {
      const strongPasswords = [
        'SecurePass123',
        'MyStr0ngP@ssw0rd',
        'C0mpl3xP@ssw0rd!'
      ];

      // Mock successful response
      const mockConvex = await import('$lib/convex');
      vi.mocked(mockConvex.convex.mutation).mockResolvedValue({
        success: true,
        user: { _id: 'user123', email: 'test@example.com', name: 'Test', role: 'client', emailVerified: false },
        token: 'mock-token'
      });

      for (const password of strongPasswords) {
        const result = await authService.register({
          email: 'test@example.com',
          password,
          name: 'Test User',
          role: 'client',
          profile: {}
        });

        // Should not fail due to password validation
        if (!result.success && result.error?.includes('Password must contain')) {
          throw new Error(`Strong password rejected: ${password}`);
        }
      }
    });
  });
});