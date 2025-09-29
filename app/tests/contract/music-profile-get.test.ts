import { describe, it, expect, beforeEach, vi } from 'vitest';

// Contract test for GET /api/music/profile
// This test validates the music profile aggregation contract

describe('GET /api/music/profile - Contract Test', () => {
  let mockFetch: any;
  
  beforeEach(() => {
    mockFetch = global.fetch = vi.fn();
  });
  
  it('should return aggregated music profile with correct structure', async () => {
    const expectedResponse = {
      profile: {
        _id: expect.any(String),
        userId: expect.any(String),
        topGenres: [
          {
            name: 'electronic',
            confidence: 0.8,
            workoutSuitability: 0.9
          }
        ],
        topArtists: [
          {
            id: 'artist_123',
            name: 'Test Artist',
            imageUrl: expect.any(String),
            genres: ['electronic', 'house'],
            popularity: 75,
            energy: 0.85
          }
        ],
        topTracks: [
          {
            id: 'track_456',
            name: 'Test Track',
            artist: 'Test Artist',
            album: 'Test Album',
            durationMs: 240000,
            energy: 0.85,
            tempo: 128,
            danceability: 0.9,
            valence: 0.7,
            imageUrl: expect.any(String),
            previewUrl: expect.any(String),
            externalUrls: expect.any(Object)
          }
        ],
        workoutGenres: ['electronic', 'house'],
        energyRange: {
          min: 0.6,
          max: 1.0
        },
        tempoRange: {
          min: 120,
          max: 140
        },
        platformData: expect.any(Object),
        lastUpdated: expect.any(Number)
      },
      lastUpdated: expect.any(Number),
      connectedPlatforms: ['spotify'],
      syncStatus: {
        spotify: {
          lastSync: expect.any(Number),
          status: 'success'
        }
      }
    };
    
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => expectedResponse
    });
    
    // Make request to non-existent endpoint (should fail initially)
    const response = await fetch('/api/music/profile', {
      headers: {
        'Authorization': 'Bearer mock-token'
      }
    });
    
    const data = await response.json();
    
    expect(response.ok).toBe(true);
    expect(response.status).toBe(200);
    expect(data).toMatchObject(expectedResponse);
    expect(data.profile.topGenres).toBeInstanceOf(Array);
    expect(data.profile.topArtists).toBeInstanceOf(Array);
    expect(data.profile.topTracks).toBeInstanceOf(Array);
    expect(data.connectedPlatforms).toContain('spotify');
  });
  
  it('should return 401 for unauthenticated request', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({
        error: {
          code: 'AUTHENTICATION_REQUIRED',
          message: 'Authentication required',
          timestamp: Date.now(),
          requestId: 'test-request-id'
        }
      })
    });
    
    const response = await fetch('/api/music/profile');
    const data = await response.json();
    
    expect(response.status).toBe(401);
    expect(data.error.code).toBe('AUTHENTICATION_REQUIRED');
  });
  
  it('should return 404 when no music profile exists', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: 'No music profile found (no connected platforms)',
          timestamp: Date.now(),
          requestId: 'test-request-id'
        }
      })
    });
    
    const response = await fetch('/api/music/profile', {
      headers: { 'Authorization': 'Bearer mock-token' }
    });
    const data = await response.json();
    
    expect(response.status).toBe(404);
    expect(data.error.code).toBe('RESOURCE_NOT_FOUND');
  });
  
  it('should support includeRaw and refresh query parameters', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ profile: {}, rawData: {} })
    });
    
    const response = await fetch('/api/music/profile?includeRaw=true&refresh=true', {
      headers: { 'Authorization': 'Bearer mock-token' }
    });
    
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('includeRaw=true&refresh=true'),
      expect.any(Object)
    );
  });
});

// This test should FAIL initially - validates TDD approach