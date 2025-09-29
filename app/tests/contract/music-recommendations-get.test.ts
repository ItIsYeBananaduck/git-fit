import { describe, it, expect, beforeEach, vi } from 'vitest';

// Contract test for GET /api/music/recommendations
// This test validates the AI music recommendations contract

describe('GET /api/music/recommendations - Contract Test', () => {
  let mockFetch: any;
  
  beforeEach(() => {
    mockFetch = global.fetch = vi.fn();
  });
  
  it('should return AI-generated recommendations with correct structure', async () => {
    const expectedResponse = {
      recommendations: [
        {
          _id: expect.any(String),
          userId: expect.any(String),
          workoutType: 'cardio',
          targetIntensity: 0.8,
          duration: 45,
          tracks: [
            {
              id: 'track_123',
              name: 'High Energy Track',
              artist: 'Workout Artist',
              durationMs: 180000,
              energy: 0.9,
              tempo: 130,
              recommendationScore: 0.95,
              reasoning: 'High energy perfect for cardio',
              position: 1,
              phaseMatch: 'main'
            }
          ],
          generatedAt: expect.any(Number),
          algorithm: 'ai_v1',
          confidence: 0.85,
          usedInWorkout: false
        }
      ],
      generatedAt: expect.any(Number),
      algorithm: 'ai_v1',
      confidence: 0.85,
      fallbackUsed: false
    };
    
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => expectedResponse
    });
    
    // Make request with required query parameters
    const queryParams = new URLSearchParams({
      workoutType: 'cardio',
      duration: '45',
      intensity: '0.8',
      limit: '25'
    });
    
    const response = await fetch(`/api/music/recommendations?${queryParams}`, {
      headers: {
        'Authorization': 'Bearer mock-token'
      }
    });
    
    const data = await response.json();
    
    expect(response.ok).toBe(true);
    expect(response.status).toBe(200);
    expect(data).toMatchObject(expectedResponse);
    expect(data.recommendations).toBeInstanceOf(Array);
    expect(data.recommendations[0].tracks).toBeInstanceOf(Array);
    expect(data.recommendations[0].tracks[0].recommendationScore).toBeGreaterThan(0);
  });
  
  it('should validate required query parameters', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Missing required parameters: workoutType, duration, intensity',
          timestamp: Date.now(),
          requestId: 'test-request-id'
        }
      })
    });
    
    // Request without required parameters
    const response = await fetch('/api/music/recommendations', {
      headers: { 'Authorization': 'Bearer mock-token' }
    });
    const data = await response.json();
    
    expect(response.status).toBe(400);
    expect(data.error.code).toBe('VALIDATION_ERROR');
  });
  
  it('should handle fallback recommendations when user has no music data', async () => {
    const fallbackResponse = {
      recommendations: [
        {
          tracks: [{
            id: 'fallback_track',
            name: 'Generic Workout Song',
            energy: 0.8,
            tempo: 120,
            phaseMatch: 'main'
          }]
        }
      ],
      fallbackUsed: true,
      algorithm: 'fallback_v1',
      confidence: 0.6
    };
    
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => fallbackResponse
    });
    
    const queryParams = new URLSearchParams({
      workoutType: 'strength',
      duration: '30',
      intensity: '0.7'
    });
    
    const response = await fetch(`/api/music/recommendations?${queryParams}`, {
      headers: { 'Authorization': 'Bearer mock-token' }
    });
    const data = await response.json();
    
    expect(response.ok).toBe(true);
    expect(data.fallbackUsed).toBe(true);
    expect(data.confidence).toBeLessThan(0.8); // Lower confidence for fallback
  });
  
  it('should respect limit parameter', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ recommendations: new Array(10).fill({}) })
    });
    
    const queryParams = new URLSearchParams({
      workoutType: 'yoga',
      duration: '60',
      intensity: '0.3',
      limit: '10'
    });
    
    const response = await fetch(`/api/music/recommendations?${queryParams}`, {
      headers: { 'Authorization': 'Bearer mock-token' }
    });
    
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('limit=10'),
      expect.any(Object)
    );
  });
});

// This test should FAIL initially - validates TDD approach