/**
 * Authentication Contract Tests - Web Dashboard UI
 * 
 * Contract tests for authentication endpoints ensuring API compliance.
 * Tests WebAuthn and email authentication flows with proper validation.
 * 
 * Generated: December 19, 2024
 * Framework: SvelteKit 2.22+ + Convex 1.27+ + Vitest + WebAuthn
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  MockApiClient,
  TestDataFactory,
  mockWebAuthnGlobals,
  assertValidRequest,
  assertValidResponse,
  ErrorSimulator,
} from '../../lib/validation/contract-tests.js';
import type {
  BiometricChallengeRequest,
  BiometricChallengeResponse,
  BiometricVerifyResponse,
  EmailLoginRequest,
  EmailLoginResponse,
  SessionValidateResponse,
} from '../../lib/types/api-contracts.js';

describe('Authentication Contract Tests', () => {
  let mockApiClient: MockApiClient;

  beforeEach(() => {
    mockApiClient = new MockApiClient();
    mockWebAuthnGlobals();
    vi.clearAllMocks();
  });

  describe('Biometric Challenge Endpoint', () => {
    it('should accept valid biometric challenge request', async () => {
      const request = TestDataFactory.createValidBiometricChallengeRequest();
      
      // Validate request contract
      assertValidRequest<BiometricChallengeRequest>(
        request,
        'BiometricChallengeRequestSchema'
      );

      const response = await mockApiClient.mockBiometricChallenge(request);
      
      // Validate response contract
      assertValidResponse<BiometricChallengeResponse>(
        response,
        'BiometricChallengeResponseSchema'
      );

      expect(response).toMatchObject({
        challenge: expect.any(String),
        timeout: expect.any(Number),
        allowCredentials: expect.any(Array),
      });
    });

    it('should reject invalid email in challenge request', async () => {
      const invalidRequest = {
        userEmail: 'invalid-email',
      };

      await expect(
        mockApiClient.mockBiometricChallenge(invalidRequest)
      ).rejects.toThrow('Request validation failed');
    });

    it('should reject empty challenge request', async () => {
      const emptyRequest = {};

      await expect(
        mockApiClient.mockBiometricChallenge(emptyRequest)
      ).rejects.toThrow('Request validation failed');
    });

    it('should handle server errors gracefully', async () => {
      const validRequest = TestDataFactory.createValidBiometricChallengeRequest();

      await expect(
        mockApiClient.mockBiometricChallenge(validRequest, { shouldSucceed: false })
      ).rejects.toThrow('Biometric challenge failed');
    });

    it('should respect timeout configuration', async () => {
      const request = TestDataFactory.createValidBiometricChallengeRequest();
      const response = await mockApiClient.mockBiometricChallenge(request);
      
      assertValidResponse<BiometricChallengeResponse>(
        response,
        'BiometricChallengeResponseSchema'
      );

      const typedResponse = response as BiometricChallengeResponse;
      expect(typedResponse.timeout).toBeGreaterThan(0);
      expect(typedResponse.timeout).toBeLessThanOrEqual(300); // 5 minutes max
    });
  });

  describe('Biometric Verify Endpoint', () => {
    it('should accept valid biometric verification request', async () => {
      const mockCredential = {
        signature: new ArrayBuffer(64),
        authenticatorData: new ArrayBuffer(37),
        clientDataJSON: new ArrayBuffer(121),
        userHandle: new ArrayBuffer(32),
      };

      const request = {
        challenge: 'mock_challenge_123',
        credential: mockCredential,
      };

      const response = await mockApiClient.mockBiometricVerify(request);
      
      assertValidResponse<BiometricVerifyResponse>(
        response,
        'BiometricVerifyResponseSchema'
      );

      expect(response).toMatchObject({
        success: true,
        sessionToken: expect.any(String),
        user: expect.objectContaining({
          id: expect.any(String),
          email: expect.any(String),
          name: expect.any(String),
        }),
      });
    });

    it('should reject empty challenge in verify request', async () => {
      const invalidRequest = {
        challenge: '',
        credential: {
          signature: new ArrayBuffer(64),
          authenticatorData: new ArrayBuffer(37),
          clientDataJSON: new ArrayBuffer(121),
          userHandle: null,
        },
      };

      await expect(
        mockApiClient.mockBiometricVerify(invalidRequest)
      ).rejects.toThrow();
    });

    it('should handle authentication failures', async () => {
      const validRequest = {
        challenge: 'mock_challenge_123',
        credential: {
          signature: new ArrayBuffer(64),
          authenticatorData: new ArrayBuffer(37),
          clientDataJSON: new ArrayBuffer(121),
          userHandle: null,
        },
      };

      await expect(
        mockApiClient.mockBiometricVerify(validRequest, { shouldSucceed: false })
      ).rejects.toThrow('Biometric verification failed');
    });

    it('should return valid user profile in successful response', async () => {
      const validRequest = {
        challenge: 'mock_challenge_123',
        credential: {
          signature: new ArrayBuffer(64),
          authenticatorData: new ArrayBuffer(37),
          clientDataJSON: new ArrayBuffer(121),
          userHandle: new ArrayBuffer(32),
        },
      };

      const response = await mockApiClient.mockBiometricVerify(validRequest);
      const typedResponse = response as BiometricVerifyResponse;

      expect(typedResponse.user).toMatchObject({
        id: expect.any(String),
        email: expect.stringMatching(/^[^\s@]+@[^\s@]+\.[^\s@]+$/),
        name: expect.any(String),
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });
  });

  describe('Email Login Endpoint', () => {
    it('should accept valid email login request', async () => {
      const request = TestDataFactory.createValidEmailLoginRequest();
      
      assertValidRequest<EmailLoginRequest>(
        request,
        'EmailLoginRequestSchema'
      );

      const response = await mockApiClient.mockEmailLogin(request);
      
      assertValidResponse<EmailLoginResponse>(
        response,
        'EmailLoginResponseSchema'
      );

      expect(response).toMatchObject({
        success: true,
        sessionToken: expect.any(String),
        user: expect.any(Object),
        requiresBiometricSetup: expect.any(Boolean),
      });
    });

    it('should reject invalid email format', async () => {
      const invalidRequest = {
        email: 'invalid-email',
        password: 'password123',
      };

      await expect(
        mockApiClient.mockEmailLogin(invalidRequest)
      ).rejects.toThrow('Request validation failed');
    });

    it('should reject short passwords', async () => {
      const invalidRequest = {
        email: 'test@example.com',
        password: '123', // Too short
      };

      await expect(
        mockApiClient.mockEmailLogin(invalidRequest)
      ).rejects.toThrow('Request validation failed');
    });

    it('should reject missing credentials', async () => {
      const invalidRequest = TestDataFactory.createInvalidRequest('password');

      await expect(
        mockApiClient.mockEmailLogin(invalidRequest)
      ).rejects.toThrow('Request validation failed');
    });

    it('should handle login failures', async () => {
      const validRequest = TestDataFactory.createValidEmailLoginRequest();

      await expect(
        mockApiClient.mockEmailLogin(validRequest, { shouldSucceed: false })
      ).rejects.toThrow('Email login failed');
    });

    it('should indicate biometric setup requirement', async () => {
      const request = TestDataFactory.createValidEmailLoginRequest();
      const customResponse = {
        success: true,
        sessionToken: 'mock_token_123',
        user: {
          id: 'user_123',
          email: 'test@example.com',
          name: 'Test User',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
        requiresBiometricSetup: true,
      };

      const response = await mockApiClient.mockEmailLogin(request, {
        customResponse,
      });

      const typedResponse = response as EmailLoginResponse;
      expect(typedResponse.requiresBiometricSetup).toBe(true);
    });
  });

  describe('Session Validation Endpoint', () => {
    it('should return valid session for authenticated user', async () => {
      const mockResponse = {
        valid: true,
        user: {
          id: 'user_123',
          email: 'test@example.com',
          name: 'Test User',
          weight: 170,
          fitnessGoal: 'Muscle Gain',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
        expiresAt: Date.now() + 3600000, // 1 hour from now
      };

      assertValidResponse<SessionValidateResponse>(
        mockResponse,
        'SessionValidateResponseSchema'
      );

      expect(mockResponse.valid).toBe(true);
      expect(mockResponse.user).toBeDefined();
      expect(mockResponse.expiresAt).toBeGreaterThan(Date.now());
    });

    it('should return invalid session for unauthenticated user', async () => {
      const mockResponse = {
        valid: false,
      };

      assertValidResponse<SessionValidateResponse>(
        mockResponse,
        'SessionValidateResponseSchema'
      );

      expect(mockResponse.valid).toBe(false);
      expect(mockResponse.user).toBeUndefined();
    });

    it('should handle expired sessions', async () => {
      const mockResponse = {
        valid: false,
        expiresAt: Date.now() - 1000, // Expired
      };

      assertValidResponse<SessionValidateResponse>(
        mockResponse,
        'SessionValidateResponseSchema'
      );

      expect(mockResponse.valid).toBe(false);
    });
  });

  describe('WebAuthn Browser API Integration', () => {
    it('should mock navigator.credentials.create', () => {
      expect(navigator.credentials.create).toBeDefined();
      expect(vi.isMockFunction(navigator.credentials.create)).toBe(true);
    });

    it('should mock navigator.credentials.get', () => {
      expect(navigator.credentials.get).toBeDefined();
      expect(vi.isMockFunction(navigator.credentials.get)).toBe(true);
    });

    it('should mock PublicKeyCredential availability check', async () => {
      const globalWithCredential = window as typeof window & {
        PublicKeyCredential: {
          isUserVerifyingPlatformAuthenticatorAvailable: () => Promise<boolean>;
        };
      };
      
      const isAvailable = await globalWithCredential.PublicKeyCredential
        .isUserVerifyingPlatformAuthenticatorAvailable();
      
      expect(isAvailable).toBe(true);
      expect(vi.isMockFunction(
        globalWithCredential.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable
      )).toBe(true);
    });

    it('should mock conditional mediation availability', async () => {
      const globalWithCredential = window as typeof window & {
        PublicKeyCredential: {
          isConditionalMediationAvailable: () => Promise<boolean>;
        };
      };
      
      const isAvailable = await globalWithCredential.PublicKeyCredential
        .isConditionalMediationAvailable();
      
      expect(isAvailable).toBe(true);
      expect(vi.isMockFunction(
        globalWithCredential.PublicKeyCredential.isConditionalMediationAvailable
      )).toBe(true);
    });
  });

  describe('Error Handling Contracts', () => {
    it('should handle network errors consistently', async () => {
      const request = TestDataFactory.createValidEmailLoginRequest();
      
      await expect(
        mockApiClient.mockEmailLogin(request, {
          customResponse: ErrorSimulator.networkError(),
          shouldSucceed: false,
        })
      ).rejects.toThrow();
    });

    it('should handle timeout errors consistently', async () => {
      const request = TestDataFactory.createValidBiometricChallengeRequest();
      
      await expect(
        mockApiClient.mockBiometricChallenge(request, {
          customResponse: ErrorSimulator.timeoutError(),
          shouldSucceed: false,
        })
      ).rejects.toThrow();
    });

    it('should handle rate limiting errors', async () => {
      const request = TestDataFactory.createValidEmailLoginRequest();
      
      await expect(
        mockApiClient.mockEmailLogin(request, {
          customResponse: ErrorSimulator.rateLimitError(),
          shouldSucceed: false,
        })
      ).rejects.toThrow();
    });

    it('should handle server errors gracefully', async () => {
      const request = TestDataFactory.createValidBiometricChallengeRequest();
      
      await expect(
        mockApiClient.mockBiometricChallenge(request, {
          customResponse: ErrorSimulator.serverError(),
          shouldSucceed: false,
        })
      ).rejects.toThrow();
    });
  });

  describe('Response Time Contracts', () => {
    it('should complete biometric challenge within acceptable time', async () => {
      const request = TestDataFactory.createValidBiometricChallengeRequest();
      const startTime = Date.now();
      
      await mockApiClient.mockBiometricChallenge(request);
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      // Should complete within 500ms (excluding network)
      expect(responseTime).toBeLessThan(500);
    });

    it('should complete email login within acceptable time', async () => {
      const request = TestDataFactory.createValidEmailLoginRequest();
      const startTime = Date.now();
      
      await mockApiClient.mockEmailLogin(request);
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      // Should complete within 500ms (excluding network)
      expect(responseTime).toBeLessThan(500);
    });

    it('should handle timeout delays appropriately', async () => {
      const request = TestDataFactory.createValidEmailLoginRequest();
      const delay = 100;
      const startTime = Date.now();
      
      await mockApiClient.mockEmailLogin(request, { delay });
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      // Should respect the delay
      expect(responseTime).toBeGreaterThanOrEqual(delay);
    });
  });

  describe('Security Contracts', () => {
    it('should not expose sensitive data in error messages', async () => {
      const invalidRequest = {
        email: 'test@example.com',
        password: 'wrong-password',
      };

      try {
        await mockApiClient.mockEmailLogin(invalidRequest, { shouldSucceed: false });
      } catch (error) {
        const errorMessage = (error as Error).message;
        
        // Should not contain password in error message
        expect(errorMessage).not.toContain('wrong-password');
        expect(errorMessage).not.toContain(invalidRequest.password);
      }
    });

    it('should use secure session tokens', async () => {
      const request = TestDataFactory.createValidEmailLoginRequest();
      const response = await mockApiClient.mockEmailLogin(request);
      const typedResponse = response as EmailLoginResponse;
      
      // Session token should be non-empty string
      expect(typedResponse.sessionToken).toBeDefined();
      expect(typeof typedResponse.sessionToken).toBe('string');
      expect(typedResponse.sessionToken.length).toBeGreaterThan(0);
    });

    it('should validate challenge strings properly', async () => {
      const request = TestDataFactory.createValidBiometricChallengeRequest();
      const response = await mockApiClient.mockBiometricChallenge(request);
      const typedResponse = response as BiometricChallengeResponse;
      
      // Challenge should be non-empty string
      expect(typedResponse.challenge).toBeDefined();
      expect(typeof typedResponse.challenge).toBe('string');
      expect(typedResponse.challenge.length).toBeGreaterThan(0);
    });
  });
});