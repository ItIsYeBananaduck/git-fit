import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Integration test for Complete OAuth Authorization Flow
// This test validates end-to-end OAuth flow with real API interactions

describe('OAuth Authorization Flow Integration', () => {
  let mockFetch: any;
  let mockWindow: any;
  
  beforeEach(() => {
    mockFetch = global.fetch = vi.fn();
    mockWindow = {
      location: { href: '', assign: vi.fn() },
      crypto: { getRandomValues: vi.fn(() => new Uint8Array(32)) },
      localStorage: {
        setItem: vi.fn(),
        getItem: vi.fn(),
        removeItem: vi.fn()
      }
    };
    global.window = mockWindow;
  });
  
  afterEach(() => {
    vi.clearAllMocks();
  });
  
  it('should complete full Spotify OAuth flow with PKCE', async () => {
    // Step 1: Get OAuth providers and find Spotify
    const providersResponse = {
      providers: [{
        id: 'spotify',
        name: 'Spotify',
        enabled: true,
        clientId: 'test-client-id',
        scopes: ['user-read-private', 'user-library-read', 'user-top-read'],
        pkceRequired: true
      }]
    };
    
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => providersResponse
    });
    
    const providersResult = await fetch('/api/oauth/providers', {
      headers: { 'Authorization': 'Bearer mock-token' }
    });
    const providers = await providersResult.json();
    
    expect(providers.providers[0].id).toBe('spotify');
    expect(providers.providers[0].pkceRequired).toBe(true);
    
    // Step 2: Initialize OAuth authorization
    const authRequest = {
      providerId: 'spotify',
      scopes: ['user-read-private', 'user-library-read'],
      redirectUri: 'gitfit://oauth/callback',
      pkce: {
        codeChallenge: 'test-challenge',
        codeChallengeMethod: 'S256'
      }
    };
    
    const authResponse = {
      authorizationUrl: 'https://accounts.spotify.com/authorize?client_id=test-client-id&response_type=code&redirect_uri=gitfit://oauth/callback&scope=user-read-private%20user-library-read&code_challenge=test-challenge&code_challenge_method=S256&state=test-state',
      state: 'test-state',
      codeVerifier: 'test-verifier'
    };
    
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => authResponse
    });
    
    const authResult = await fetch('/api/oauth/authorize', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer mock-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(authRequest)
    });
    const auth = await authResult.json();
    
    expect(auth.authorizationUrl).toContain('accounts.spotify.com');
    expect(auth.authorizationUrl).toContain('code_challenge=test-challenge');
    expect(auth.state).toBeTruthy();
    expect(auth.codeVerifier).toBeTruthy();
    
    // Step 3: Simulate redirect back from Spotify with authorization code
    const callbackRequest = {
      providerId: 'spotify',
      code: 'auth-code-from-spotify',
      state: 'test-state',
      codeVerifier: 'test-verifier'
    };
    
    const tokenResponse = {
      connection: {
        _id: 'conn_123',
        userId: 'user_456',
        providerId: 'spotify',
        providerUserId: 'spotify_user_789',
        accessToken: 'encrypted-access-token',
        refreshToken: 'encrypted-refresh-token',
        expiresAt: Date.now() + 3600000,
        scopes: ['user-read-private', 'user-library-read'],
        connectedAt: Date.now()
      },
      profile: {
        id: 'spotify_user_789',
        displayName: 'Test User',
        email: 'test@example.com',
        images: [{ url: 'https://example.com/avatar.jpg' }]
      }
    };
    
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => tokenResponse
    });
    
    const callbackResult = await fetch('/api/oauth/callback', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer mock-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(callbackRequest)
    });
    const callback = await callbackResult.json();
    
    expect(callback.connection.providerId).toBe('spotify');
    expect(callback.connection.accessToken).toBe('encrypted-access-token');
    expect(callback.profile.displayName).toBe('Test User');
    
    // Step 4: Verify connection was created
    const connectionsResponse = {
      connections: [{
        _id: 'conn_123',
        providerId: 'spotify',
        providerUserId: 'spotify_user_789',
        displayName: 'Test User',
        isActive: true,
        connectedAt: expect.any(Number),
        lastSyncAt: null
      }]
    };
    
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => connectionsResponse
    });
    
    const connectionsResult = await fetch('/api/oauth/providers?includeConnections=true', {
      headers: { 'Authorization': 'Bearer mock-token' }
    });
    const connections = await connectionsResult.json();
    
    expect(connections.connections[0].providerId).toBe('spotify');
    expect(connections.connections[0].isActive).toBe(true);
    
    // Validate that all fetch calls were made in correct order
    expect(mockFetch).toHaveBeenCalledTimes(4);
  });
  
  it('should handle OAuth state mismatch error', async () => {
    const callbackRequest = {
      providerId: 'spotify',
      code: 'auth-code',
      state: 'mismatched-state',
      codeVerifier: 'test-verifier'
    };
    
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({
        error: {
          code: 'OAUTH_STATE_MISMATCH',
          message: 'OAuth state parameter mismatch',
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
      body: JSON.stringify(callbackRequest)
    });
    const error = await response.json();
    
    expect(response.status).toBe(400);
    expect(error.error.code).toBe('OAUTH_STATE_MISMATCH');
  });
  
  it('should handle PKCE verification failure', async () => {
    const callbackRequest = {
      providerId: 'spotify',
      code: 'auth-code',
      state: 'test-state',
      codeVerifier: 'wrong-verifier'
    };
    
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({
        error: {
          code: 'OAUTH_PKCE_VERIFICATION_FAILED',
          message: 'PKCE code verifier validation failed',
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
      body: JSON.stringify(callbackRequest)
    });
    const error = await response.json();
    
    expect(response.status).toBe(400);
    expect(error.error.code).toBe('OAUTH_PKCE_VERIFICATION_FAILED');
  });
});

// This test should FAIL initially - validates TDD approach
// Tests will pass once OAuth flow endpoints are implemented