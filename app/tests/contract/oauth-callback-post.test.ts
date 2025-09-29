import { describe, it, expect, beforeEach, vi } from 'vitest';

// Contract test for POST /api/oauth/callback
// This test validates the OAuth callback handler contract

describe('POST /api/oauth/callback - Contract Test', () => {
  let mockFetch: any;
  
  beforeEach(() => {
    mockFetch = global.fetch = vi.fn();
  });
  
  it('should handle successful OAuth callback with correct response structure', async () => {
    const requestBody = {
      code: 'auth_code_from_provider',
      state: 'abc123',
      sessionId: 'sess_456'
    };
    
    const expectedResponse = {
      success: true,
      connectionId: expect.any(String),
      provider: {
        id: 'spotify',
        displayName: 'Spotify'
      },
      userInfo: {
        externalUserId: expect.any(String),
        displayName: expect.any(String),
        email: expect.any(String),
        profileImageUrl: expect.any(String)
      },
      syncStatus: {
        initiated: true,
        estimatedCompletion: expect.any(Number)
      }
    };
    
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => expectedResponse
    });
    
    // Make request to non-existent endpoint (should fail initially)
    const response = await fetch('/api/oauth/callback', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer mock-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
    
    const data = await response.json();
    
    expect(response.ok).toBe(true);
    expect(response.status).toBe(200);
    expect(data).toMatchObject(expectedResponse);
    expect(data.success).toBe(true);
    expect(data.connectionId).toBeTruthy();
    expect(data.provider.id).toBeTruthy();
    expect(data.userInfo.externalUserId).toBeTruthy();
  });
  
  it('should return 400 for invalid authorization code', async () => {
    const invalidRequest = {
      code: 'invalid_code',
      state: 'invalid_state',
      sessionId: 'invalid_session'
    };
    
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({
        error: {
          code: 'INVALID_REQUEST',
          message: 'Invalid authorization code or state',
          timestamp: Date.now(),
          requestId: 'test-request-id'
        }
      })
    });
    
    const response = await fetch('/api/oauth/callback', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer mock-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(invalidRequest)
    });
    const data = await response.json();
    
    expect(response.status).toBe(400);
    expect(data.error.code).toBe('INVALID_REQUEST');
  });
  
  it('should return 408 for expired OAuth session', async () => {
    const expiredRequest = {
      code: 'valid_code',
      state: 'expired_state',
      sessionId: 'expired_session'
    };
    
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 408,
      json: async () => ({
        error: {
          code: 'REQUEST_TIMEOUT',
          message: 'OAuth session expired',
          timestamp: Date.now(),
          requestId: 'test-request-id'
        }
      })
    });
    
    const response = await fetch('/api/oauth/callback', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer mock-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(expiredRequest)
    });
    const data = await response.json();
    
    expect(response.status).toBe(408);
    expect(data.error.code).toBe('REQUEST_TIMEOUT');
  });
  
  it('should handle user denied authorization', async () => {
    const deniedRequest = {
      error: 'access_denied',
      errorDescription: 'User denied authorization',
      state: 'abc123',
      sessionId: 'sess_456'
    };
    
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 422,
      json: async () => ({
        error: {
          code: 'AUTHORIZATION_FAILED',
          message: 'OAuth provider rejected the request',
          timestamp: Date.now(),
          requestId: 'test-request-id'
        }
      })
    });
    
    const response = await fetch('/api/oauth/callback', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer mock-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(deniedRequest)
    });
    const data = await response.json();
    
    expect(response.status).toBe(422);
    expect(data.error.code).toBe('AUTHORIZATION_FAILED');
  });
});

// This test should FAIL initially - validates TDD approach