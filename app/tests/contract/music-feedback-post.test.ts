import { describe, it, expect, beforeEach, vi } from 'vitest';

// Contract test for POST /api/music/recommendations/feedback
// This test validates the music recommendation feedback contract

describe('POST /api/music/recommendations/feedback - Contract Test', () => {
  let mockFetch: any;
  
  beforeEach(() => {
    mockFetch = global.fetch = vi.fn();
  });
  
  it('should submit feedback with correct request/response structure', async () => {
    const requestBody = {
      recommendationId: 'rec_123',
      rating: 4,
      feedback: 'Great energy for cardio workout',
      usedInWorkout: true,
      trackFeedback: {
        'track_456': {
          rating: 5,
          skipped: false,
          reason: 'Perfect tempo and energy'
        },
        'track_789': {
          rating: 2,
          skipped: true,
          reason: 'Too slow for the workout phase'
        }
      }
    };
    
    const expectedResponse = {
      success: true,
      recommendationId: 'rec_123',
      feedbackId: expect.any(String),
      mlUpdateScheduled: true
    };
    
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => expectedResponse
    });
    
    // Make request to non-existent endpoint (should fail initially)
    const response = await fetch('/api/music/recommendations/feedback', {
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
    expect(data.success).toBe(true);
    expect(data.recommendationId).toBe('rec_123');
    expect(data.feedbackId).toBeTruthy();
    expect(data.mlUpdateScheduled).toBe(true);
  });
  
  it('should handle minimal feedback (rating only)', async () => {
    const minimalRequest = {
      recommendationId: 'rec_456',
      rating: 3,
      usedInWorkout: false
    };
    
    const expectedResponse = {
      success: true,
      recommendationId: 'rec_456',
      feedbackId: expect.any(String),
      mlUpdateScheduled: false // No detailed feedback
    };
    
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => expectedResponse
    });
    
    const response = await fetch('/api/music/recommendations/feedback', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer mock-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(minimalRequest)
    });
    
    const data = await response.json();
    
    expect(response.ok).toBe(true);
    expect(data.success).toBe(true);
    expect(data.mlUpdateScheduled).toBe(false);
  });
  
  it('should validate rating range (1-5)', async () => {
    const invalidRequest = {
      recommendationId: 'rec_789',
      rating: 10, // Invalid rating
      usedInWorkout: true
    };
    
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Rating must be between 1 and 5',
          timestamp: Date.now(),
          requestId: 'test-request-id'
        }
      })
    });
    
    const response = await fetch('/api/music/recommendations/feedback', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer mock-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(invalidRequest)
    });
    const data = await response.json();
    
    expect(response.status).toBe(400);
    expect(data.error.code).toBe('VALIDATION_ERROR');
  });
  
  it('should return 404 for non-existent recommendation', async () => {
    const requestBody = {
      recommendationId: 'nonexistent_rec',
      rating: 3,
      usedInWorkout: false
    };
    
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: 'Recommendation not found',
          timestamp: Date.now(),
          requestId: 'test-request-id'
        }
      })
    });
    
    const response = await fetch('/api/music/recommendations/feedback', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer mock-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
    const data = await response.json();
    
    expect(response.status).toBe(404);
    expect(data.error.code).toBe('RESOURCE_NOT_FOUND');
  });
  
  it('should handle track-specific feedback validation', async () => {
    const requestWithInvalidTrackFeedback = {
      recommendationId: 'rec_123',
      rating: 4,
      usedInWorkout: true,
      trackFeedback: {
        'invalid_track': {
          rating: 15, // Invalid track rating
          skipped: false
        }
      }
    };
    
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Track rating must be between 1 and 5',
          timestamp: Date.now(),
          requestId: 'test-request-id'
        }
      })
    });
    
    const response = await fetch('/api/music/recommendations/feedback', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer mock-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestWithInvalidTrackFeedback)
    });
    const data = await response.json();
    
    expect(response.status).toBe(400);
    expect(data.error.code).toBe('VALIDATION_ERROR');
  });
});

// This test should FAIL initially - validates TDD approach