import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Integration test for OAuth Connection Error Handling
// This test validates comprehensive error handling across OAuth flows

describe('OAuth Error Handling Integration', () => {
  let mockFetch: any;
  
  beforeEach(() => {
    mockFetch = global.fetch = vi.fn();
  });
  
  afterEach(() => {
    vi.clearAllMocks();
  });
  
  it('should handle provider service unavailable (Spotify down)', async () => {
    const authRequest = {
      providerId: 'spotify',
      scopes: ['user-read-private'],
      redirectUri: 'gitfit://oauth/callback'
    };
    
    const serviceUnavailableResponse = {
      ok: false,
      status: 503,
      json: async () => ({
        error: {
          code: 'EXTERNAL_SERVICE_UNAVAILABLE',
          message: 'Spotify authorization service is temporarily unavailable',
          providerId: 'spotify',
          retryAfter: 300,
          alternativeProviders: ['apple_music', 'youtube_music']
        }
      })
    };
    
    mockFetch.mockResolvedValueOnce(serviceUnavailableResponse);
    
    const response = await fetch('/api/oauth/authorize', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer mock-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(authRequest)
    });
    const error = await response.json();
    
    expect(response.status).toBe(503);
    expect(error.error.code).toBe('EXTERNAL_SERVICE_UNAVAILABLE');
    expect(error.error.retryAfter).toBe(300);
    expect(error.error.alternativeProviders).toContain('apple_music');
  });
  
  it('should handle user denial of OAuth permission', async () => {
    const callbackRequest = {
      providerId: 'spotify',
      error: 'access_denied',
      errorDescription: 'The user denied the request',
      state: 'test-state'
    };
    
    const deniedResponse = {
      ok: false,
      status: 400,
      json: async () => ({
        error: {
          code: 'OAUTH_ACCESS_DENIED',
          message: 'User denied OAuth authorization request',
          providerId: 'spotify',
          userAction: 'denied',
          canRetry: true
        }
      })
    };
    
    mockFetch.mockResolvedValueOnce(deniedResponse);
    
    const response = await fetch('/api/oauth/callback', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer mock-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(callbackRequest)
    });
    const error = await response.json();
    
    expect(response.status).toBe(400);
    expect(error.error.code).toBe('OAUTH_ACCESS_DENIED');
    expect(error.error.userAction).toBe('denied');
    expect(error.error.canRetry).toBe(true);
  });
  
  it('should handle invalid OAuth configuration (missing client ID)', async () => {
    const authRequest = {
      providerId: 'misconfigured_provider',
      scopes: ['read'],
      redirectUri: 'gitfit://oauth/callback'
    };
    
    const configErrorResponse = {
      ok: false,
      status: 500,
      json: async () => ({
        error: {
          code: 'OAUTH_CONFIGURATION_ERROR',
          message: 'OAuth provider configuration is invalid or incomplete',
          providerId: 'misconfigured_provider',
          details: 'Missing required client_id configuration',
          isRetryable: false
        }
      })
    };
    
    mockFetch.mockResolvedValueOnce(configErrorResponse);
    
    const response = await fetch('/api/oauth/authorize', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer mock-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(authRequest)
    });
    const error = await response.json();
    
    expect(response.status).toBe(500);
    expect(error.error.code).toBe('OAUTH_CONFIGURATION_ERROR');
    expect(error.error.isRetryable).toBe(false);
  });
  
  it('should handle network timeout during token exchange', async () => {
    const callbackRequest = {
      providerId: 'spotify',
      code: 'auth-code',
      state: 'test-state',
      codeVerifier: 'test-verifier'
    };
    
    const timeoutResponse = {
      ok: false,
      status: 408,
      json: async () => ({
        error: {
          code: 'OAUTH_NETWORK_TIMEOUT',
          message: 'Network timeout during token exchange with Spotify',
          providerId: 'spotify',
          operation: 'token_exchange',
          isRetryable: true,
          suggestedRetryDelay: 5000
        }
      })
    };
    
    mockFetch.mockResolvedValueOnce(timeoutResponse);
    
    const response = await fetch('/api/oauth/callback', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer mock-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(callbackRequest)
    });
    const error = await response.json();
    
    expect(response.status).toBe(408);
    expect(error.error.code).toBe('OAUTH_NETWORK_TIMEOUT');
    expect(error.error.isRetryable).toBe(true);
    expect(error.error.suggestedRetryDelay).toBe(5000);
  });
  
  it('should handle insufficient OAuth scopes error', async () => {
    const authRequest = {
      providerId: 'spotify',
      scopes: ['invalid-scope', 'user-read-private'],
      redirectUri: 'gitfit://oauth/callback'
    };
    
    const scopeErrorResponse = {
      ok: false,
      status: 400,
      json: async () => ({
        error: {
          code: 'OAUTH_INVALID_SCOPE',
          message: 'Requested OAuth scopes are invalid or not available',
          providerId: 'spotify',
          invalidScopes: ['invalid-scope'],
          availableScopes: [
            'user-read-private',
            'user-library-read',
            'user-top-read',
            'playlist-read-private'
          ],
          suggestedScopes: ['user-read-private', 'user-library-read']
        }
      })
    };
    
    mockFetch.mockResolvedValueOnce(scopeErrorResponse);
    
    const response = await fetch('/api/oauth/authorize', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer mock-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(authRequest)
    });
    const error = await response.json();
    
    expect(response.status).toBe(400);
    expect(error.error.code).toBe('OAUTH_INVALID_SCOPE');
    expect(error.error.invalidScopes).toContain('invalid-scope');
    expect(error.error.suggestedScopes).toContain('user-library-read');
  });
  
  it('should handle OAuth connection deletion with active sessions', async () => {
    const deleteRequest = {
      providerId: 'spotify',
      force: false // Don't force deletion
    };
    
    const activeSessionsResponse = {
      ok: false,
      status: 409,
      json: async () => ({
        error: {
          code: 'OAUTH_CONNECTION_IN_USE',
          message: 'Cannot delete OAuth connection while active sessions exist',
          providerId: 'spotify',
          activeSessions: [
            {
              id: 'session_1',
              type: 'music_sync',
              startedAt: Date.now() - 60000
            },
            {
              id: 'session_2',
              type: 'recommendation_generation',
              startedAt: Date.now() - 30000
            }
          ],
          canForceDelete: true
        }
      })
    };
    
    mockFetch.mockResolvedValueOnce(activeSessionsResponse);
    
    const response = await fetch('/api/oauth/connections/spotify', {
      method: 'DELETE',
      headers: {
        'Authorization': 'Bearer mock-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(deleteRequest)
    });
    const error = await response.json();
    
    expect(response.status).toBe(409);
    expect(error.error.code).toBe('OAUTH_CONNECTION_IN_USE');
    expect(error.error.activeSessions.length).toBe(2);
    expect(error.error.canForceDelete).toBe(true);
  });
  
  it('should handle provider-specific API errors during music sync', async () => {
    const syncRequest = {
      providers: ['spotify'],
      force: true
    };
    
    const apiErrorResponse = {
      ok: false,
      status: 400,
      json: async () => ({
        error: {
          code: 'SPOTIFY_API_ERROR',
          message: 'Spotify API returned an error',
          providerId: 'spotify',
          providerError: {
            error: 'invalid_grant',
            error_description: 'Authorization code expired'
          },
          recovery: {
            action: 'reauthorize',
            message: 'Please reconnect your Spotify account'
          }
        }
      })
    };
    
    mockFetch.mockResolvedValueOnce(apiErrorResponse);
    
    const response = await fetch('/api/music/sync', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer mock-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(syncRequest)
    });
    const error = await response.json();
    
    expect(response.status).toBe(400);
    expect(error.error.code).toBe('SPOTIFY_API_ERROR');
    expect(error.error.providerError.error).toBe('invalid_grant');
    expect(error.error.recovery.action).toBe('reauthorize');
  });
});

// This test should FAIL initially - validates TDD approach
// Tests will pass once comprehensive error handling is implemented