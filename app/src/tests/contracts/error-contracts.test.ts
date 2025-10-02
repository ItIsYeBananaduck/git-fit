/**
 * Error Handling Contract Tests - Web Dashboard UI
 * 
 * Contract tests for error scenarios across all API endpoints.
 * Tests authentication failures, validation errors, network issues, and server errors.
 * 
 * Generated: December 19, 2024
 * Framework: SvelteKit 2.22+ + Convex 1.27+ + Vitest
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  MockApiClient,
  ErrorSimulator,
  assertValidResponse,
} from '../../lib/validation/contract-tests.js';
import type {
  ErrorResponse,
} from '../../lib/types/api-contracts.js';

describe('Error Handling Contract Tests', () => {
  let mockApiClient: MockApiClient;

  beforeEach(() => {
    mockApiClient = new MockApiClient();
  });

  describe('Authentication Error Responses', () => {
    it('should return structured error for invalid credentials', async () => {
      const errorResponse = {
        success: false as const,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password',
          timestamp: new Date().toISOString(),
        },
      };
      
      assertValidResponse<ErrorResponse>(
        errorResponse,
        'ErrorResponseSchema'
      );

      expect(errorResponse.success).toBe(false);
      expect(errorResponse.error.code).toBe('INVALID_CREDENTIALS');
      expect(errorResponse.error.message).toBeTruthy();
    });

    it('should return structured error for expired sessions', async () => {
      const errorResponse = {
        success: false as const,
        error: {
          code: 'SESSION_EXPIRED',
          message: 'Your session has expired. Please log in again.',
          details: {
            expiredAt: '2024-12-19T10:00:00Z',
            sessionId: 'session_123',
          },
          timestamp: new Date().toISOString(),
        },
      };
      
      assertValidResponse<ErrorResponse>(
        errorResponse,
        'ErrorResponseSchema'
      );

      expect(errorResponse.error.details).toBeDefined();
      expect(errorResponse.error.code).toBe('SESSION_EXPIRED');
    });

    it('should return structured error for biometric failures', async () => {
      const errorResponse = {
        success: false as const,
        error: {
          code: 'BIOMETRIC_VERIFICATION_FAILED',
          message: 'Biometric verification failed. Please try again or use email login.',
          details: {
            attemptCount: 3,
            maxAttempts: 5,
          },
          timestamp: new Date().toISOString(),
        },
      };
      
      assertValidResponse<ErrorResponse>(
        errorResponse,
        'ErrorResponseSchema'
      );

      expect(errorResponse.error.code).toBe('BIOMETRIC_VERIFICATION_FAILED');
    });
  });

  describe('Validation Error Responses', () => {
    it('should return structured error for invalid input data', async () => {
      const errorResponse = {
        success: false as const,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Input validation failed',
          details: {
            field: 'email',
            value: 'invalid-email',
            expectedFormat: 'Valid email address',
          },
          timestamp: new Date().toISOString(),
        },
      };
      
      assertValidResponse<ErrorResponse>(
        errorResponse,
        'ErrorResponseSchema'
      );

      expect(errorResponse.error.code).toBe('VALIDATION_ERROR');
      expect(errorResponse.error.details).toBeDefined();
    });

    it('should return structured error for missing required fields', async () => {
      const errorResponse = {
        success: false as const,
        error: {
          code: 'MISSING_REQUIRED_FIELDS',
          message: 'Required fields are missing',
          details: {
            missingFields: ['userId', 'workoutId'],
            providedFields: ['exerciseId'],
          },
          timestamp: new Date().toISOString(),
        },
      };
      
      assertValidResponse<ErrorResponse>(
        errorResponse,
        'ErrorResponseSchema'
      );

      expect(errorResponse.error.details?.missingFields).toHaveLength(2);
    });

    it('should return structured error for invalid enum values', async () => {
      const errorResponse = {
        success: false as const,
        error: {
          code: 'INVALID_ENUM_VALUE',
          message: 'Invalid value for enum field',
          details: {
            field: 'fitnessGoal',
            value: 'InvalidGoal',
            allowedValues: ['Fat Loss', 'Muscle Gain', 'Hypertrophy', 'Powerlifting', 'Bodybuilding'],
          },
          timestamp: new Date().toISOString(),
        },
      };
      
      assertValidResponse<ErrorResponse>(
        errorResponse,
        'ErrorResponseSchema'
      );

      expect(errorResponse.error.details?.allowedValues).toHaveLength(5);
    });
  });

  describe('Network Error Responses', () => {
    it('should handle network timeout errors', async () => {
      const request = { userEmail: 'test@example.com' };
      
      await expect(
        mockApiClient.mockBiometricChallenge(request, {
          customResponse: ErrorSimulator.timeoutError(),
          shouldSucceed: false,
        })
      ).rejects.toThrow('Request timeout');
    });

    it('should handle network connection errors', async () => {
      const request = { email: 'test@example.com', password: 'password123' };
      
      await expect(
        mockApiClient.mockEmailLogin(request, {
          customResponse: ErrorSimulator.networkError(),
          shouldSucceed: false,
        })
      ).rejects.toThrow('Network error');
    });

    it('should return structured error for rate limiting', async () => {
      const errorResponse = {
        success: false as const,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests. Please try again later.',
          details: {
            retryAfter: 60, // seconds
            requestCount: 100,
            timeWindow: '1 minute',
          },
          timestamp: new Date().toISOString(),
        },
      };
      
      assertValidResponse<ErrorResponse>(
        errorResponse,
        'ErrorResponseSchema'
      );

      expect(errorResponse.error.details?.retryAfter).toBe(60);
    });
  });

  describe('Server Error Responses', () => {
    it('should return structured error for internal server errors', async () => {
      const errorResponse = {
        success: false as const,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An internal server error occurred. Please try again later.',
          details: {
            errorId: 'error_' + Date.now(),
            supportContact: 'support@example.com',
          },
          timestamp: new Date().toISOString(),
        },
      };
      
      assertValidResponse<ErrorResponse>(
        errorResponse,
        'ErrorResponseSchema'
      );

      expect(errorResponse.error.code).toBe('INTERNAL_SERVER_ERROR');
      expect(errorResponse.error.details?.errorId).toBeTruthy();
    });

    it('should return structured error for database connection issues', async () => {
      const errorResponse = {
        success: false as const,
        error: {
          code: 'DATABASE_CONNECTION_ERROR',
          message: 'Unable to connect to database. Service temporarily unavailable.',
          timestamp: new Date().toISOString(),
        },
      };
      
      assertValidResponse<ErrorResponse>(
        errorResponse,
        'ErrorResponseSchema'
      );

      expect(errorResponse.error.code).toBe('DATABASE_CONNECTION_ERROR');
    });

    it('should return structured error for service unavailable', async () => {
      const errorResponse = {
        success: false as const,
        error: {
          code: 'SERVICE_UNAVAILABLE',
          message: 'Service is temporarily unavailable due to maintenance.',
          details: {
            estimatedRestoreTime: '2024-12-19T12:00:00Z',
            maintenanceWindow: '10:00 - 12:00 UTC',
          },
          timestamp: new Date().toISOString(),
        },
      };
      
      assertValidResponse<ErrorResponse>(
        errorResponse,
        'ErrorResponseSchema'
      );

      expect(errorResponse.error.details?.estimatedRestoreTime).toBeTruthy();
    });
  });

  describe('Business Logic Error Responses', () => {
    it('should return structured error for insufficient permissions', async () => {
      const errorResponse = {
        success: false as const,
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'You do not have permission to access this resource.',
          details: {
            requiredPermission: 'view_client_data',
            userPermissions: ['view_own_data'],
            resourceType: 'client_workout_data',
          },
          timestamp: new Date().toISOString(),
        },
      };
      
      assertValidResponse<ErrorResponse>(
        errorResponse,
        'ErrorResponseSchema'
      );

      expect(errorResponse.error.details?.requiredPermission).toBe('view_client_data');
    });

    it('should return structured error for resource not found', async () => {
      const errorResponse = {
        success: false as const,
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: 'The requested resource was not found.',
          details: {
            resourceType: 'workout',
            resourceId: 'workout_nonexistent',
            userId: 'user_123',
          },
          timestamp: new Date().toISOString(),
        },
      };
      
      assertValidResponse<ErrorResponse>(
        errorResponse,
        'ErrorResponseSchema'
      );

      expect(errorResponse.error.details?.resourceType).toBe('workout');
    });

    it('should return structured error for expired tokens', async () => {
      const errorResponse = {
        success: false as const,
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'QR code token has expired. Please generate a new one.',
          details: {
            tokenType: 'qr_connection_token',
            expiredAt: '2024-12-18T10:00:00Z',
            maxAge: '24 hours',
          },
          timestamp: new Date().toISOString(),
        },
      };
      
      assertValidResponse<ErrorResponse>(
        errorResponse,
        'ErrorResponseSchema'
      );

      expect(errorResponse.error.details?.tokenType).toBe('qr_connection_token');
    });
  });

  describe('Error Response Consistency', () => {
    it('should always include required error fields', async () => {
      const minimalError = {
        success: false as const,
        error: {
          code: 'GENERIC_ERROR',
          message: 'An error occurred',
          timestamp: new Date().toISOString(),
        },
      };
      
      assertValidResponse<ErrorResponse>(
        minimalError,
        'ErrorResponseSchema'
      );

      expect(minimalError.success).toBe(false);
      expect(minimalError.error.code).toBeTruthy();
      expect(minimalError.error.message).toBeTruthy();
      expect(minimalError.error.timestamp).toBeTruthy();
    });

    it('should use consistent timestamp format', async () => {
      const errorResponse = {
        success: false as const,
        error: {
          code: 'TEST_ERROR',
          message: 'Test error message',
          timestamp: new Date().toISOString(),
        },
      };
      
      assertValidResponse<ErrorResponse>(
        errorResponse,
        'ErrorResponseSchema'
      );

      // Validate ISO 8601 timestamp format
      const timestamp = new Date(errorResponse.error.timestamp);
      expect(timestamp.toISOString()).toBe(errorResponse.error.timestamp);
    });

    it('should provide helpful error codes', async () => {
      const errorCodes = [
        'INVALID_CREDENTIALS',
        'SESSION_EXPIRED',
        'VALIDATION_ERROR',
        'RATE_LIMIT_EXCEEDED',
        'INTERNAL_SERVER_ERROR',
        'RESOURCE_NOT_FOUND',
        'INSUFFICIENT_PERMISSIONS',
      ];

      errorCodes.forEach(code => {
        const errorResponse = {
          success: false as const,
          error: {
            code,
            message: 'Test message',
            timestamp: new Date().toISOString(),
          },
        };
        
        assertValidResponse<ErrorResponse>(
          errorResponse,
          'ErrorResponseSchema'
        );

        expect(errorResponse.error.code).toBe(code);
      });
    });
  });
});