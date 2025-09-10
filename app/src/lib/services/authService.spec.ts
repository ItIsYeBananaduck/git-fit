import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService } from './authService';

// Mock the convex client
const mockMutation = vi.fn();
const mockQuery = vi.fn();

vi.mock('$lib/convex', () => ({
  convex: {
    mutation: mockMutation,
    query: mockQuery
  }
}));

// Mock the API
vi.mock('../../../convex/_generated/api', () => ({
  api: {
    functions: {
      users: {
        requestPasswordReset: 'requestPasswordReset',
        resetPassword: 'resetPassword'
      }
    }
  }
}));

// Mock the browser environment
vi.mock('$app/environment', () => ({
  browser: false
}));

describe('AuthService - Password Reset', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = AuthService.getInstance();
    mockMutation.mockClear();
    mockQuery.mockClear();
  });

  describe('requestPasswordReset', () => {
    it('should validate email format', async () => {
      const result = await authService.requestPasswordReset('invalid-email');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Please enter a valid email address');
    });

    it('should accept valid email format', async () => {
      mockMutation.mockResolvedValue({ success: true });

      const result = await authService.requestPasswordReset('test@example.com');
      
      expect(result.success).toBe(true);
      expect(mockMutation).toHaveBeenCalled();
    });

    it('should handle empty email', async () => {
      const result = await authService.requestPasswordReset('');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Please enter a valid email address');
    });

    it('should trim and lowercase email', async () => {
      mockMutation.mockResolvedValue({ success: true });

      const result = await authService.requestPasswordReset('  TEST@EXAMPLE.COM  ');
      
      expect(result.success).toBe(true);
      expect(mockMutation).toHaveBeenCalledWith(
        'requestPasswordReset',
        expect.objectContaining({
          email: 'test@example.com'
        })
      );
    });
  });

  describe('resetPassword', () => {
    it('should validate password strength', async () => {
      const result = await authService.resetPassword('valid-token', 'weak');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Password must be at least 8 characters long');
    });

    it('should require uppercase, lowercase, and number', async () => {
      const result = await authService.resetPassword('valid-token', 'weakpassword');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Password must contain at least one uppercase letter, one lowercase letter, and one number');
    });

    it('should accept strong password', async () => {
      mockMutation.mockResolvedValue({ success: true });

      const result = await authService.resetPassword('valid-token', 'StrongPass123');
      
      expect(result.success).toBe(true);
      expect(mockMutation).toHaveBeenCalled();
    });

    it('should handle server errors', async () => {
      mockMutation.mockResolvedValue({ 
        success: false, 
        error: 'Invalid token' 
      });

      const result = await authService.resetPassword('invalid-token', 'StrongPass123');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid token');
    });
  });

  describe('password validation', () => {
    const testCases = [
      { password: '', valid: false, reason: 'empty password' },
      { password: 'short', valid: false, reason: 'too short' },
      { password: 'nouppercase123', valid: false, reason: 'no uppercase' },
      { password: 'NOLOWERCASE123', valid: false, reason: 'no lowercase' },
      { password: 'NoNumbers', valid: false, reason: 'no numbers' },
      { password: 'ValidPass123', valid: true, reason: 'valid password' },
      { password: 'AnotherValid1', valid: true, reason: 'another valid password' }
    ];

    testCases.forEach(({ password, valid, reason }) => {
      it(`should ${valid ? 'accept' : 'reject'} password: ${reason}`, async () => {
        if (valid) {
          mockMutation.mockResolvedValue({ success: true });
        }

        const result = await authService.resetPassword('valid-token', password);
        
        expect(result.success).toBe(valid);
        
        if (!valid) {
          expect(result.error).toBeDefined();
        }
      });
    });
  });
});