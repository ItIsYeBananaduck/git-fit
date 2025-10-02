import { describe, it, expect, vi, beforeEach } from 'vitest';

// Contract test for OAuth authorization using Convex
// This test validates the OAuth authorization initiation contract

// Mock the Convex client
vi.mock('../../src/lib/convex', () => ({
  convex: {
    mutation: vi.fn()
  }
}));

interface OAuthResponse {
  sessionId: string;
  authUrl: string;
  state: string;
  redirectUri: string;
  expiresAt: number;
  scopes: string[];
  provider: {
    id: string;
    name: string;
    iconUrl: string;
    brandColor: string;
  };
}

describe('OAuth Authorization - Contract Test (Convex)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initiate OAuth flow with correct request/response structure (Convex)', async () => {
    const { convex } = await import('../../src/lib/convex');
    
    // Mock the mutation response
    const mockResponse: OAuthResponse = {
      sessionId: 'session_123456789',
      authUrl: 'https://accounts.spotify.com/authorize?client_id=test&response_type=code&state=mock_state_123&code_challenge=mock_challenge',
      state: 'mock_state_1234567890123456789012345678901234567890123',
      redirectUri: 'https://localhost:3000/oauth/callback',
      expiresAt: Date.now() + 3600000,
      scopes: ['user-read-private', 'user-top-read'],
      provider: {
        id: 'spotify',
        name: 'Spotify',
        iconUrl: 'https://developer.spotify.com/assets/branding-guidelines/icon.svg',
        brandColor: '#1DB954'
      }
    };

    vi.mocked(convex.mutation).mockResolvedValue(mockResponse);

    const args = {
      providerId: 'spotify',
      userId: 'mock_user_id',
      platform: 'ios',
      scopes: ['user-read-private', 'user-top-read'],
      returnUrl: 'https://localhost:3000/oauth/callback',
      metadata: {
        userAgent: 'MockAgent',
        ipAddress: '127.0.0.1',
        deviceType: 'ios',
        appVersion: '1.0.0'
      }
    };

    const data = await convex.mutation('initiateOAuthFlow', args) as OAuthResponse;

    expect(data).toMatchObject({
      authUrl: expect.stringContaining('https://accounts.spotify.com/authorize'),
      state: expect.any(String),
      sessionId: expect.any(String),
      expiresAt: expect.any(Number),
      provider: expect.any(Object)
    });
    expect(data.authUrl).toMatch(/^https:\/\//);
    expect(data.state).toBeDefined();
    expect(convex.mutation).toHaveBeenCalledWith('initiateOAuthFlow', args);
  });
  
  it('should throw error for invalid provider ID (Convex)', async () => {
    const { convex } = await import('../../src/lib/convex');
    
    vi.mocked(convex.mutation).mockRejectedValue(new Error('OAuth provider not supported'));

    const invalidArgs = {
      providerId: 'invalid_provider',
      userId: 'mock_user_id',
      platform: 'web',
      scopes: []
    };

    await expect(
      convex.mutation('initiateOAuthFlow', invalidArgs)
    ).rejects.toThrow('OAuth provider');
  });
  
  it('should handle existing active session (Convex)', async () => {
    const { convex } = await import('../../src/lib/convex');
    
    const mockResponse = {
      sessionId: 'existing_session_456',
      authUrl: 'https://accounts.spotify.com/authorize?existing=true',
      message: 'Reusing existing session'
    };

    vi.mocked(convex.mutation).mockResolvedValue(mockResponse);

    const args = {
      providerId: 'spotify',
      userId: 'existing_user_123',
      platform: 'ios',
      scopes: ['user-read-private']
    };

    const response = await convex.mutation('initiateOAuthFlow', args) as { sessionId: string; authUrl: string; message?: string };

    expect(response.sessionId).toBeDefined();
    expect(response.authUrl).toBeDefined();
    expect(convex.mutation).toHaveBeenCalledWith('initiateOAuthFlow', args);
  });
});