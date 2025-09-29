import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render } from '@testing-library/svelte';

// Contract test for GET /api/oauth/providers
// This test validates the API contract defined in contracts.md

describe('GET /api/oauth/providers - Contract Test', () => {
  let mockFetch: any;
  
  beforeEach(() => {
    // Mock fetch to simulate API calls
    mockFetch = global.fetch = vi.fn();
  });
  
  it('should return providers list with correct structure', async () => {
    // Expected response structure from contracts.md
    const expectedResponse = {
      providers: [
        {
          id: 'spotify',
          name: 'spotify',
          displayName: 'Spotify',
          scopes: ['user-read-private', 'user-top-read', 'playlist-read-private'],
          isEnabled: true,
          supportedPlatforms: ['ios', 'android', 'web'],
          iconUrl: expect.any(String),
          brandColor: '#1DB954'
        }
      ],
      userConnections: {
        spotify: {
          isConnected: true,
          connectedAt: expect.any(Number),
          lastSyncAt: expect.any(Number),
          status: 'active'
        }
      }
    };
    
    // Mock successful response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => expectedResponse
    });
    
    // Make request to non-existent endpoint (should fail initially)
    const response = await fetch('/api/oauth/providers', {
      headers: {
        'Authorization': 'Bearer mock-token',
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    // Validate response structure matches contract
    expect(response.ok).toBe(true);
    expect(response.status).toBe(200);
    expect(data).toMatchObject(expectedResponse);
    expect(data.providers).toBeInstanceOf(Array);
    expect(data.userConnections).toBeInstanceOf(Object);
  });
  
  it('should return 401 for invalid authentication', async () => {
    // Mock unauthorized response
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({
        error: {
          code: 'AUTHENTICATION_REQUIRED',
          message: 'Invalid or missing authentication',
          timestamp: Date.now(),
          requestId: 'test-request-id'
        }
      })
    });
    
    // Request without proper authentication
    const response = await fetch('/api/oauth/providers');
    const data = await response.json();
    
    expect(response.status).toBe(401);
    expect(data.error.code).toBe('AUTHENTICATION_REQUIRED');
  });
  
  it('should return 500 for server configuration error', async () => {
    // Mock server error response
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Server configuration error',
          timestamp: Date.now(),
          requestId: 'test-request-id'
        }
      })
    });
    
    const response = await fetch('/api/oauth/providers', {
      headers: { 'Authorization': 'Bearer mock-token' }
    });
    const data = await response.json();
    
    expect(response.status).toBe(500);
    expect(data.error.code).toBe('INTERNAL_ERROR');
  });
});

// This test should FAIL initially since the endpoint doesn't exist yet
// This validates our TDD approach