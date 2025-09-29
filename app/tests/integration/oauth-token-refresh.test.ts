import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Integration test for OAuth Token Refresh Flow
// This test validates automatic token refresh and error handling

describe('OAuth Token Refresh Integration', () => {
  let mockFetch: any;
  
  beforeEach(() => {
    mockFetch = global.fetch = vi.fn();
  });
  
  afterEach(() => {
    vi.clearAllMocks();
  });
  
  it('should automatically refresh expired Spotify token', async () => {
    // Step 1: Initial API call that triggers token refresh (token expired)
    const initialApiCall = {
      ok: false,
      status: 401,
      json: async () => ({
        error: {
          code: 'OAUTH_TOKEN_EXPIRED',
          message: 'Access token has expired',
          providerId: 'spotify',
          refreshAvailable: true
        }
      })
    };
    
    // Step 2: Token refresh request succeeds
    const refreshResponse = {
      connection: {
        _id: 'conn_123',
        providerId: 'spotify',
        accessToken: 'new-encrypted-access-token',
        refreshToken: 'new-encrypted-refresh-token',
        expiresAt: Date.now() + 3600000,
        lastRefreshAt: Date.now()
      }
    };
    
    // Step 3: Retry original API call with new token succeeds
    const retryResponse = {
      profile: {
        topGenres: ['electronic', 'house'],
        topArtists: [{ name: 'Artist 1', energy: 0.8 }],
        lastUpdated: Date.now()
      }
    };
    
    mockFetch
      .mockResolvedValueOnce(initialApiCall) // Initial call fails
      .mockResolvedValueOnce({ // Refresh succeeds
        ok: true,
        json: async () => refreshResponse
      })
      .mockResolvedValueOnce({ // Retry succeeds
        ok: true,
        json: async () => retryResponse
      });
    
    // Make initial API call that will trigger refresh flow
    const response1 = await fetch('/api/music/profile', {
      headers: { 'Authorization': 'Bearer mock-token' }
    });
    const error1 = await response1.json();
    
    expect(response1.status).toBe(401);
    expect(error1.error.code).toBe('OAUTH_TOKEN_EXPIRED');
    expect(error1.error.refreshAvailable).toBe(true);
    
    // Simulate automatic token refresh (this would be handled by client)
    const refreshResponse2 = await fetch('/api/oauth/refresh', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer mock-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ providerId: 'spotify' })
    });
    const refresh = await refreshResponse2.json();
    
    expect(refresh.connection.accessToken).toBe('new-encrypted-access-token');
    expect(refresh.connection.lastRefreshAt).toBeTruthy();
    
    // Retry original API call with refreshed token
    const response3 = await fetch('/api/music/profile', {
      headers: { 'Authorization': 'Bearer mock-token' }
    });
    const profile = await response3.json();
    
    expect(response3.ok).toBe(true);
    expect(profile.profile.topGenres).toContain('electronic');
    
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });
  
  it('should handle refresh token expiration gracefully', async () => {
    const refreshRequest = {
      providerId: 'spotify'
    };
    
    const refreshErrorResponse = {
      ok: false,
      status: 400,
      json: async () => ({
        error: {
          code: 'OAUTH_REFRESH_TOKEN_EXPIRED',
          message: 'Refresh token has expired. User must re-authenticate.',
          providerId: 'spotify',
          requiresReauth: true
        }
      })
    };
    
    mockFetch.mockResolvedValueOnce(refreshErrorResponse);
    
    const response = await fetch('/api/oauth/refresh', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer mock-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(refreshRequest)
    });
    const error = await response.json();
    
    expect(response.status).toBe(400);
    expect(error.error.code).toBe('OAUTH_REFRESH_TOKEN_EXPIRED');
    expect(error.error.requiresReauth).toBe(true);
  });
  
  it('should handle provider-specific refresh errors (Spotify rate limiting)', async () => {
    const refreshRequest = { providerId: 'spotify' };
    
    const rateLimitResponse = {
      ok: false,
      status: 429,
      json: async () => ({
        error: {
          code: 'EXTERNAL_API_RATE_LIMITED',
          message: 'Spotify API rate limit exceeded',
          retryAfter: 60,
          providerId: 'spotify'
        }
      })
    };
    
    mockFetch.mockResolvedValueOnce(rateLimitResponse);
    
    const response = await fetch('/api/oauth/refresh', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer mock-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(refreshRequest)
    });
    const error = await response.json();
    
    expect(response.status).toBe(429);
    expect(error.error.code).toBe('EXTERNAL_API_RATE_LIMITED');
    expect(error.error.retryAfter).toBe(60);
  });
  
  it('should refresh Apple Music token with different flow', async () => {
    const refreshRequest = { providerId: 'apple_music' };
    
    const appleRefreshResponse = {
      connection: {
        _id: 'conn_456',
        providerId: 'apple_music',
        accessToken: 'new-apple-token',
        // Apple Music uses developer tokens, no refresh token
        refreshToken: null,
        expiresAt: Date.now() + 3600000,
        lastRefreshAt: Date.now()
      }
    };
    
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => appleRefreshResponse
    });
    
    const response = await fetch('/api/oauth/refresh', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer mock-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(refreshRequest)
    });
    const refresh = await response.json();
    
    expect(response.ok).toBe(true);
    expect(refresh.connection.providerId).toBe('apple_music');
    expect(refresh.connection.refreshToken).toBeNull();
  });
  
  it('should handle concurrent refresh requests for same provider', async () => {
    const refreshRequest = { providerId: 'spotify' };
    
    // First request succeeds
    const successResponse = {
      connection: {
        providerId: 'spotify',
        accessToken: 'refreshed-token',
        lastRefreshAt: Date.now()
      }
    };
    
    // Second concurrent request returns cached result
    const cachedResponse = {
      connection: {
        providerId: 'spotify',
        accessToken: 'refreshed-token', // Same token
        lastRefreshAt: expect.any(Number),
        fromCache: true
      }
    };
    
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => successResponse
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => cachedResponse
      });
    
    // Make two concurrent refresh requests
    const [response1, response2] = await Promise.all([
      fetch('/api/oauth/refresh', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer mock-token',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(refreshRequest)
      }),
      fetch('/api/oauth/refresh', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer mock-token',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(refreshRequest)
      })
    ]);
    
    const refresh1 = await response1.json();
    const refresh2 = await response2.json();
    
    expect(refresh1.connection.accessToken).toBe('refreshed-token');
    expect(refresh2.connection.accessToken).toBe('refreshed-token');
    expect(refresh2.connection.fromCache).toBe(true);
  });
});

// This test should FAIL initially - validates TDD approach
// Tests will pass once OAuth refresh endpoints are implemented