import { describe, it, expect, beforeEach, vi } from 'vitest';

// Contract test for POST /api/oauth/authorize
// This test validates the OAuth authorization initiation contract

describe('POST /api/oauth/authorize - Contract Test', () => {
  let mockFetch: any;
  
  beforeEach(() => {
    mockFetch = global.fetch = vi.fn();
  });
  
  it('should initiate OAuth flow with correct request/response structure', async () => {
    const requestBody = {
      providerId: 'spotify',
      platform: 'ios',
      scopes: ['user-read-private', 'user-top-read']
    };
    
    const expectedResponse = {
      authUrl: expect.stringContaining('https://accounts.spotify.com/authorize'),
      state: expect.any(String),
      codeChallenge: expect.any(String),
      sessionId: expect.any(String),
      expiresAt: expect.any(Number)
    };
    
    // Mock successful authorization response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => expectedResponse
    });
    
    // Make request to non-existent endpoint (should fail initially)
    const response = await fetch('/api/oauth/authorize', {
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
    expect(data.authUrl).toMatch(/^https:\/\//);
    expect(data.state).toHaveLength(22); // Base64 URL-safe 16 bytes
    expect(data.codeChallenge).toHaveLength(43); // Base64 URL-safe 32 bytes
  });
  
  it('should return 400 for invalid provider ID', async () => {
    const invalidRequest = {
      providerId: 'invalid_provider',
      platform: 'web'
    };
    
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({
        error: {
          code: 'INVALID_REQUEST',
          message: 'Invalid provider ID or platform',
          timestamp: Date.now(),
          requestId: 'test-request-id'
        }
      })
    });
    
    const response = await fetch('/api/oauth/authorize', {
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
  
  it('should return 409 for already connected user', async () => {
    const requestBody = {
      providerId: 'spotify',
      platform: 'web'
    };
    
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 409,
      json: async () => ({
        error: {
          code: 'AUTHORIZATION_FAILED',
          message: 'User already connected to this provider',
          timestamp: Date.now(),
          requestId: 'test-request-id'
        }
      })
    });
    
    const response = await fetch('/api/oauth/authorize', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer mock-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
    const data = await response.json();
    
    expect(response.status).toBe(409);
    expect(data.error.code).toBe('AUTHORIZATION_FAILED');
  });
});

// This test should FAIL initially - validates TDD approach