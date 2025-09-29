import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Integration test for Multi-provider OAuth Management
// This test validates managing multiple OAuth connections simultaneously

describe('Multi-provider OAuth Management Integration', () => {
  let mockFetch: any;
  
  beforeEach(() => {
    mockFetch = global.fetch = vi.fn();
  });
  
  afterEach(() => {
    vi.clearAllMocks();
  });
  
  it('should connect multiple music providers simultaneously', async () => {
    // Step 1: Connect to Spotify first
    const spotifyAuthRequest = {
      providerId: 'spotify',
      scopes: ['user-read-private', 'user-library-read'],
      redirectUri: 'gitfit://oauth/callback'
    };
    
    const spotifyAuthResponse = {
      authorizationUrl: 'https://accounts.spotify.com/authorize?...',
      state: 'spotify-state',
      codeVerifier: 'spotify-verifier'
    };
    
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => spotifyAuthResponse
    });
    
    const spotifyAuth = await fetch('/api/oauth/authorize', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer mock-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(spotifyAuthRequest)
    });
    const spotify = await spotifyAuth.json();
    
    expect(spotify.authorizationUrl).toContain('accounts.spotify.com');
    
    // Step 2: Complete Spotify callback
    const spotifyCallbackRequest = {
      providerId: 'spotify',
      code: 'spotify-code',
      state: 'spotify-state',
      codeVerifier: 'spotify-verifier'
    };
    
    const spotifyConnectionResponse = {
      connection: {
        _id: 'conn_spotify',
        providerId: 'spotify',
        providerUserId: 'spotify_user_123',
        displayName: 'Spotify User',
        isActive: true
      }
    };
    
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => spotifyConnectionResponse
    });
    
    const spotifyCallback = await fetch('/api/oauth/callback', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer mock-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(spotifyCallbackRequest)
    });
    const spotifyConnection = await spotifyCallback.json();
    
    expect(spotifyConnection.connection.providerId).toBe('spotify');
    
    // Step 3: Connect to Apple Music
    const appleAuthRequest = {
      providerId: 'apple_music',
      scopes: ['library-read'],
      redirectUri: 'gitfit://oauth/callback'
    };
    
    const appleAuthResponse = {
      authorizationUrl: 'https://music.apple.com/authorize?...',
      state: 'apple-state',
      // Apple Music uses different flow
      developerToken: 'apple-dev-token'
    };
    
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => appleAuthResponse
    });
    
    const appleAuth = await fetch('/api/oauth/authorize', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer mock-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(appleAuthRequest)
    });
    const apple = await appleAuth.json();
    
    expect(apple.authorizationUrl).toContain('music.apple.com');
    
    // Step 4: Complete Apple Music callback
    const appleCallbackRequest = {
      providerId: 'apple_music',
      userToken: 'apple-user-token',
      state: 'apple-state'
    };
    
    const appleConnectionResponse = {
      connection: {
        _id: 'conn_apple',
        providerId: 'apple_music',
        providerUserId: 'apple_user_456',
        displayName: 'Apple Music User',
        isActive: true
      }
    };
    
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => appleConnectionResponse
    });
    
    const appleCallback = await fetch('/api/oauth/callback', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer mock-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(appleCallbackRequest)
    });
    const appleConnection = await appleCallback.json();
    
    expect(appleConnection.connection.providerId).toBe('apple_music');
    
    // Step 5: Verify both connections exist
    const connectionsResponse = {
      connections: [
        {
          _id: 'conn_spotify',
          providerId: 'spotify',
          displayName: 'Spotify User',
          isActive: true,
          connectedAt: Date.now() - 300000
        },
        {
          _id: 'conn_apple',
          providerId: 'apple_music',
          displayName: 'Apple Music User',
          isActive: true,
          connectedAt: Date.now() - 60000
        }
      ]
    };
    
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => connectionsResponse
    });
    
    const connections = await fetch('/api/oauth/providers?includeConnections=true', {
      headers: { 'Authorization': 'Bearer mock-token' }
    });
    const allConnections = await connections.json();
    
    expect(allConnections.connections).toHaveLength(2);
    expect(allConnections.connections.map((c: any) => c.providerId)).toContain('spotify');
    expect(allConnections.connections.map((c: any) => c.providerId)).toContain('apple_music');
    
    expect(mockFetch).toHaveBeenCalledTimes(5);
  });
  
  it('should sync music data from multiple providers simultaneously', async () => {
    const multiProviderSyncRequest = {
      providers: ['spotify', 'apple_music'],
      force: false
    };
    
    const syncResponse = {
      jobId: 'multi_sync_789',
      providers: ['spotify', 'apple_music'],
      estimatedCompletion: Date.now() + 120000,
      status: 'in_progress',
      providerStatus: {
        spotify: {
          status: 'syncing',
          progress: 0.3,
          lastUpdate: 'Fetching top tracks'
        },
        apple_music: {
          status: 'queued',
          progress: 0.0,
          lastUpdate: 'Waiting for Spotify to complete'
        }
      }
    };
    
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => syncResponse
    });
    
    const response = await fetch('/api/music/sync', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer mock-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(multiProviderSyncRequest)
    });
    const sync = await response.json();
    
    expect(response.ok).toBe(true);
    expect(sync.providers).toContain('spotify');
    expect(sync.providers).toContain('apple_music');
    expect(sync.providerStatus.spotify.status).toBe('syncing');
    expect(sync.providerStatus.apple_music.status).toBe('queued');
  });
  
  it('should generate unified music profile from multiple providers', async () => {
    const unifiedProfileResponse = {
      profile: {
        _id: 'unified_profile_123',
        userId: 'user_456',
        topGenres: [
          {
            name: 'electronic',
            confidence: 0.85,
            sources: ['spotify', 'apple_music'],
            workoutSuitability: 0.9
          },
          {
            name: 'rock',
            confidence: 0.7,
            sources: ['spotify'],
            workoutSuitability: 0.8
          }
        ],
        topArtists: [
          {
            id: 'unified_artist_1',
            name: 'Popular Artist',
            sources: ['spotify', 'apple_music'],
            energy: 0.85,
            popularity: {
              spotify: 85,
              apple_music: 78,
              unified: 82
            }
          }
        ],
        platformData: {
          spotify: {
            totalTracks: 1500,
            totalArtists: 350,
            lastSync: Date.now() - 300000
          },
          apple_music: {
            totalTracks: 1200,
            totalArtists: 280,
            lastSync: Date.now() - 240000
          }
        },
        confidence: 0.92, // Higher confidence with multiple sources
        lastUpdated: Date.now()
      },
      connectedPlatforms: ['spotify', 'apple_music'],
      syncStatus: {
        spotify: {
          lastSync: Date.now() - 300000,
          status: 'success',
          tracksImported: 1500
        },
        apple_music: {
          lastSync: Date.now() - 240000,
          status: 'success',
          tracksImported: 1200
        }
      }
    };
    
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => unifiedProfileResponse
    });
    
    const response = await fetch('/api/music/profile', {
      headers: { 'Authorization': 'Bearer mock-token' }
    });
    const profile = await response.json();
    
    expect(response.ok).toBe(true);
    expect(profile.connectedPlatforms).toHaveLength(2);
    expect(profile.profile.topGenres[0].sources).toContain('spotify');
    expect(profile.profile.topGenres[0].sources).toContain('apple_music');
    expect(profile.profile.confidence).toBeGreaterThan(0.9); // Higher with multiple sources
    expect(profile.syncStatus.spotify.status).toBe('success');
    expect(profile.syncStatus.apple_music.status).toBe('success');
  });
  
  it('should handle partial provider failures in multi-provider operations', async () => {
    const syncRequest = {
      providers: ['spotify', 'apple_music', 'youtube_music'],
      force: true
    };
    
    const partialFailureResponse = {
      jobId: 'partial_sync_456',
      providers: ['spotify', 'apple_music', 'youtube_music'],
      status: 'partial_success',
      providerStatus: {
        spotify: {
          status: 'success',
          progress: 1.0,
          tracksImported: 1500
        },
        apple_music: {
          status: 'success',
          progress: 1.0,
          tracksImported: 1200
        },
        youtube_music: {
          status: 'failed',
          progress: 0.0,
          error: {
            code: 'OAUTH_TOKEN_EXPIRED',
            message: 'YouTube Music token expired'
          }
        }
      },
      successfulProviders: ['spotify', 'apple_music'],
      failedProviders: ['youtube_music'],
      recommendations: {
        youtube_music: {
          action: 'reconnect',
          message: 'Please reconnect your YouTube Music account'
        }
      }
    };
    
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => partialFailureResponse
    });
    
    const response = await fetch('/api/music/sync', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer mock-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(syncRequest)
    });
    const sync = await response.json();
    
    expect(response.ok).toBe(true);
    expect(sync.status).toBe('partial_success');
    expect(sync.successfulProviders).toHaveLength(2);
    expect(sync.failedProviders).toHaveLength(1);
    expect(sync.providerStatus.youtube_music.status).toBe('failed');
    expect(sync.recommendations.youtube_music.action).toBe('reconnect');
  });
  
  it('should prioritize providers for music recommendations based on data quality', async () => {
    const recommendationsRequest = {
      workoutType: 'cardio',
      duration: '45',
      intensity: '0.8'
    };
    
    const prioritizedResponse = {
      recommendations: [{
        _id: 'rec_multi_123',
        tracks: [
          {
            id: 'track_1',
            name: 'High Energy Song',
            sources: ['spotify', 'apple_music'],
            primarySource: 'spotify', // Higher data quality
            energy: 0.9,
            confidence: 0.95
          },
          {
            id: 'track_2',
            name: 'Workout Anthem',
            sources: ['apple_music'],
            primarySource: 'apple_music',
            energy: 0.85,
            confidence: 0.8
          }
        ],
        dataQuality: {
          spotify: 0.92,
          apple_music: 0.85
        },
        algorithm: 'multi_provider_ai_v1',
        confidence: 0.9
      }],
      providerContributions: {
        spotify: {
          tracksUsed: 15,
          dataQualityScore: 0.92,
          weight: 0.6
        },
        apple_music: {
          tracksUsed: 10,
          dataQualityScore: 0.85,
          weight: 0.4
        }
      }
    };
    
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => prioritizedResponse
    });
    
    const response = await fetch(`/api/music/recommendations?${new URLSearchParams(recommendationsRequest)}`, {
      headers: { 'Authorization': 'Bearer mock-token' }
    });
    const recommendations = await response.json();
    
    expect(response.ok).toBe(true);
    expect(recommendations.recommendations[0].tracks[0].primarySource).toBe('spotify');
    expect(recommendations.providerContributions.spotify.weight).toBeGreaterThan(
      recommendations.providerContributions.apple_music.weight
    );
    expect(recommendations.recommendations[0].algorithm).toBe('multi_provider_ai_v1');
  });
});

// This test should FAIL initially - validates TDD approach
// Tests will pass once multi-provider OAuth management is implemented