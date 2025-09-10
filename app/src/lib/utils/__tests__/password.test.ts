// Password Utilities Tests

import { describe, it, expect } from 'vitest';
import { 
  checkPasswordStrength, 
  isValidEmail, 
  sanitizeInput,
  generateToken,
  generateResetToken,
  generateSessionToken
} from '../password';

describe('Password Utilities', () => {
  describe('checkPasswordStrength', () => {
    it('should reject weak passwords', () => {
      const weakPasswords = [
        '123',
        'password',
        'PASSWORD',
        '12345678',
        'abcdefgh',
        'ABCDEFGH'
      ];

      weakPasswords.forEach(password => {
        const result = checkPasswordStrength(password);
        expect(result.isValid).toBe(false);
        expect(result.score).toBeLessThan(3);
        expect(result.feedback.length).toBeGreaterThan(0);
      });
    });

    it('should accept strong passwords', () => {
      const strongPasswords = [
        'SecurePass123',
        'MyStr0ngP@ssw0rd',
        'C0mpl3xP@ssw0rd!',
        'Th1sIsAV3ryStr0ngP@ssw0rd!'
      ];

      strongPasswords.forEach(password => {
        const result = checkPasswordStrength(password);
        expect(result.isValid).toBe(true);
        expect(result.score).toBeGreaterThanOrEqual(3);
      });
    });

    it('should provide helpful feedback', () => {
      const result = checkPasswordStrength('weak');
      
      expect(result.feedback).toContain('Use at least 8 characters');
      expect(result.feedback).toContain('Add uppercase letters');
      expect(result.feedback).toContain('Add numbers');
      expect(result.feedback).toContain('Add special characters (!@#$%^&*)');
    });

    it('should give bonus for longer passwords', () => {
      const shortStrong = checkPasswordStrength('SecureP1!');
      const longStrong = checkPasswordStrength('ThisIsAVeryLongSecureP@ssw0rd123!');
      
      expect(longStrong.score).toBeGreaterThanOrEqual(shortStrong.score);
    });
  });

  describe('isValidEmail', () => {
    it('should validate correct email formats', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org',
        'user123@test-domain.com'
      ];

      validEmails.forEach(email => {
        expect(isValidEmail(email)).toBe(true);
      });
    });

    it('should reject invalid email formats', () => {
      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'user@',
        'user@.com',
        'user@example', // This might be passing incorrectly
        ''
      ];

      invalidEmails.forEach(email => {
        expect(isValidEmail(email), `Email "${email}" should be invalid`).toBe(false);
      });
    });

    it('should handle email with whitespace', () => {
      expect(isValidEmail('  test@example.com  ')).toBe(true);
      expect(isValidEmail('test @example.com')).toBe(false);
    });
  });

  describe('sanitizeInput', () => {
    it('should remove dangerous characters', () => {
      const input = '<script>alert("xss")</script>Hello World';
      const sanitized = sanitizeInput(input);
      
      expect(sanitized).not.toContain('<');
      expect(sanitized).not.toContain('>');
      expect(sanitized).toContain('Hello World');
    });

    it('should trim whitespace', () => {
      const input = '  Hello World  ';
      const sanitized = sanitizeInput(input);
      
      expect(sanitized).toBe('Hello World');
    });

    it('should handle empty strings', () => {
      expect(sanitizeInput('')).toBe('');
      expect(sanitizeInput('   ')).toBe('');
    });
  });

  describe('Token Generation', () => {
    it('should generate tokens of correct length', () => {
      const token = generateToken(32);
      expect(token).toHaveLength(32);
    });

    it('should generate unique tokens', () => {
      const token1 = generateToken();
      const token2 = generateToken();
      
      expect(token1).not.toBe(token2);
    });

    it('should generate reset tokens', () => {
      const resetToken = generateResetToken();
      expect(resetToken).toHaveLength(48);
      expect(typeof resetToken).toBe('string');
    });

    it('should generate session tokens', () => {
      const sessionToken = generateSessionToken();
      expect(sessionToken).toHaveLength(64);
      expect(typeof sessionToken).toBe('string');
    });

    it('should only contain valid characters', () => {
      const token = generateToken(100);
      const validChars = /^[A-Za-z0-9]+$/;
      
      expect(validChars.test(token)).toBe(true);
    });
  });
});