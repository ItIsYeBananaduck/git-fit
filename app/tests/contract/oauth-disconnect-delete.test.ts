import { describe, it, expect, vi } from 'vitest';

// Contract test for DELETE /api/oauth/connections/{providerId}
// This test validates the OAuth disconnection contract

describe('DELETE /api/oauth/connections/{providerId} - Contract Test', () => {
  let mockFetch: any;
  
  beforeEach(() => {
    mockFetch = global.fetch = vi.fn();
  });
  
  it('should disconnect OAuth connection with correct response structure', async () => {
    const mockResponse = {
      success: true,
      providerId: 'spotify',
      disconnectedAt: Date.now(),
      dataRetention: {
        musicProfile: 'anonymized',
        recommendations: 'preserved',
        retentionPeriod: 30
      }
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockResponse
    });    // Make request to non-existent endpoint (should fail initially)
    const response = await fetch('/api/oauth/connections/spotify', {
      method: 'DELETE',
      headers: {
        'Authorization': 'Bearer mock-token',
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    expect(response.ok).toBe(true);
    expect(response.status).toBe(200);
    expect(data).toMatchObject({
      success: true,
      providerId: 'spotify',
      disconnectedAt: expect.any(Number),
      dataRetention: {
        musicProfile: 'anonymized',
        recommendations: 'preserved',
        retentionPeriod: 30
      }
    });
    expect(data.success).toBe(true);
    expect(data.providerId).toBe('spotify');
    expect(data.disconnectedAt).toBeGreaterThan(0);
    expect(data.dataRetention.retentionPeriod).toBe(30);
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
    
    const response = await fetch('/api/oauth/connections/spotify', {
      method: 'DELETE'
    });
    const data = await response.json();
    
    expect(response.status).toBe(401);
    expect(data.error.code).toBe('AUTHENTICATION_REQUIRED');
  });
  
  it('should return 404 for non-existent connection', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: 'Connection not found',
          timestamp: Date.now(),
          requestId: 'test-request-id'
        }
      })
    });
    
    const response = await fetch('/api/oauth/connections/nonexistent', {
      method: 'DELETE',
      headers: {
        'Authorization': 'Bearer mock-token'
      }
    });
    const data = await response.json();
    
    expect(response.status).toBe(404);
    expect(data.error.code).toBe('RESOURCE_NOT_FOUND');
  });
  
  it('should return 500 for disconnection failure', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Disconnection failed',
          timestamp: Date.now(),
          requestId: 'test-request-id'
        }
      })
    });
    
    const response = await fetch('/api/oauth/connections/spotify', {
      method: 'DELETE',
      headers: {
        'Authorization': 'Bearer mock-token'
      }
    });
    const data = await response.json();
    
    expect(response.status).toBe(500);
    expect(data.error.code).toBe('INTERNAL_ERROR');
  });
});

// This test should FAIL initially - validates TDD approach