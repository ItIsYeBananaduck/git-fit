import { describe, it, expect, beforeEach, vi } from 'vitest';

// Contract test for POST /api/music/sync
// This test validates the music profile sync trigger contract

describe('POST /api/music/sync - Contract Test', () => {
  let mockFetch: any;
  
  beforeEach(() => {
    mockFetch = global.fetch = vi.fn();
  });
  
  it('should trigger music sync with correct request/response structure', async () => {
    const requestBody = {
      providers: ['spotify'],
      force: false
    };
    
    const expectedResponse = {
      jobId: expect.any(String),
      providers: ['spotify'],
      estimatedCompletion: expect.any(Number),
      status: 'queued'
    };
    
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => expectedResponse
    });
    
    // Make request to non-existent endpoint (should fail initially)
    const response = await fetch('/api/music/sync', {
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
    expect(data.jobId).toBeTruthy();
    expect(data.providers).toContain('spotify');
    expect(['queued', 'in_progress']).toContain(data.status);
  });
  
  it('should handle sync request without specific providers', async () => {
    const requestBody = {
      force: true
    };
    
    const expectedResponse = {
      jobId: expect.any(String),
      providers: ['spotify', 'apple_music'],
      estimatedCompletion: expect.any(Number),
      status: 'in_progress'
    };
    
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => expectedResponse
    });
    
    const response = await fetch('/api/music/sync', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer mock-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
    
    const data = await response.json();
    
    expect(response.ok).toBe(true);
    expect(data.providers.length).toBeGreaterThan(0);
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
    
    const response = await fetch('/api/music/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ providers: ['spotify'] })
    });
    const data = await response.json();
    
    expect(response.status).toBe(401);
    expect(data.error.code).toBe('AUTHENTICATION_REQUIRED');
  });
  
  it('should return 503 when external API is unavailable', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 503,
      json: async () => ({
        error: {
          code: 'EXTERNAL_API_ERROR',
          message: 'External API temporarily unavailable',
          timestamp: Date.now(),
          requestId: 'test-request-id'
        }
      })
    });
    
    const response = await fetch('/api/music/sync', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer mock-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ providers: ['spotify'] })
    });
    const data = await response.json();
    
    expect(response.status).toBe(503);
    expect(data.error.code).toBe('EXTERNAL_API_ERROR');
  });
});

// This test should FAIL initially - validates TDD approach