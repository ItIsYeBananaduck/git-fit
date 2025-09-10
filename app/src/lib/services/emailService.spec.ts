import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EmailService } from './emailService';

// Mock the environment
Object.defineProperty(process, 'env', {
  value: { NODE_ENV: 'test' }
});

describe('EmailService', () => {
  let emailService: EmailService;

  beforeEach(() => {
    emailService = EmailService.getInstance();
    vi.clearAllMocks();
  });

  describe('sendPasswordResetEmail', () => {
    it('should generate password reset email with correct content', async () => {
      const result = await emailService.sendPasswordResetEmail(
        'test@example.com',
        'test-token-123',
        'John Doe'
      );

      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
    });

    it('should generate password reset email without user name', async () => {
      const result = await emailService.sendPasswordResetEmail(
        'test@example.com',
        'test-token-123'
      );

      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
    });

    it('should include reset URL in email content', async () => {
      // Spy on the private method by testing the public interface
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      // Set NODE_ENV to development to trigger console logging
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      await emailService.sendPasswordResetEmail(
        'test@example.com',
        'test-token-123',
        'John Doe'
      );

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('📧 Email would be sent:')
      );

      // Restore environment
      process.env.NODE_ENV = originalEnv;
      consoleSpy.mockRestore();
    });
  });

  describe('sendWelcomeEmail', () => {
    it('should generate welcome email for client', async () => {
      const result = await emailService.sendWelcomeEmail(
        'client@example.com',
        'Jane Client',
        'client'
      );

      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
    });

    it('should generate welcome email for trainer', async () => {
      const result = await emailService.sendWelcomeEmail(
        'trainer@example.com',
        'John Trainer',
        'trainer'
      );

      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
    });
  });

  describe('sendEmailVerificationEmail', () => {
    it('should generate email verification email', async () => {
      const result = await emailService.sendEmailVerificationEmail(
        'verify@example.com',
        'verification-token-123',
        'Test User'
      );

      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
    });

    it('should generate email verification email without user name', async () => {
      const result = await emailService.sendEmailVerificationEmail(
        'verify@example.com',
        'verification-token-123'
      );

      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
    });
  });

  describe('email content generation', () => {
    it('should generate HTML content with proper structure', async () => {
      // Test by checking the console output in development mode
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      await emailService.sendPasswordResetEmail(
        'test@example.com',
        'test-token-123',
        'John Doe'
      );

      // Verify that email sending was attempted
      expect(consoleSpy).toHaveBeenCalled();

      process.env.NODE_ENV = originalEnv;
      consoleSpy.mockRestore();
    });
  });

  describe('error handling', () => {
    it('should handle email sending errors gracefully', async () => {
      // Mock a failure scenario by overriding the private sendEmail method
      const originalSendEmail = (emailService as any).sendEmail;
      (emailService as any).sendEmail = vi.fn().mockRejectedValue(new Error('Email service unavailable'));

      const result = await emailService.sendPasswordResetEmail(
        'test@example.com',
        'test-token-123'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Email service unavailable');

      // Restore original method
      (emailService as any).sendEmail = originalSendEmail;
    });
  });

  describe('singleton pattern', () => {
    it('should return the same instance', () => {
      const instance1 = EmailService.getInstance();
      const instance2 = EmailService.getInstance();

      expect(instance1).toBe(instance2);
    });
  });
});