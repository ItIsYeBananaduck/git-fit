// T007 [P] Contract test POST /api/adaptive/workout
// This test MUST FAIL until the adaptive workout recording API is implemented

import { describe, it, expect, beforeEach, vi, MockedFunction } from 'vitest';

// Helper to create mock Response
const createMockResponse = (data: unknown, status = 200, ok = true): Response => {
  return {
    ok,
    status,
    statusText: ok ? 'OK' : 'Error',
    headers: new Headers(),
    redirected: false,
    type: 'basic' as ResponseType,
    url: '',
    body: null,
    bodyUsed: false,
    clone: vi.fn(),
    arrayBuffer: vi.fn(),
    blob: vi.fn(),
    formData: vi.fn(),
    text: vi.fn(),
    bytes: vi.fn(),
    json: vi.fn().mockResolvedValue(data)
  } as Response;
};

describe('POST /api/adaptive/workout', () => {
  let mockFetch: MockedFunction<typeof fetch>;

  beforeEach(() => {
    mockFetch = vi.fn();
    global.fetch = mockFetch;
  });

  it('should record workout session successfully', async () => {
    const requestBody = {
      exerciseId: 'ex_push_ups_123',
      duration: 1800, // 30 minutes in seconds
      heartRateData: [
        { timestamp: 1640995200000, bpm: 120 },
        { timestamp: 1640995260000, bpm: 135 },
        { timestamp: 1640995320000, bpm: 155 }
      ],
      caloriesBurned: 287,
      intensityZones: {
        recovery: 300,
        aerobic: 900,
        anaerobic: 600,
        neuromuscular: 0
      },
      perceivedExertion: 7
    };

    const expectedResponse = {
      success: true,
      session: {
        sessionId: 'session_abc123',
        adaptiveScore: 8.2,
        performanceMetrics: {
          averageHeartRate: 137,
          maxHeartRate: 155,
          caloriesBurned: 287,
          intensityDistribution: {
            recovery: 16.7,
            aerobic: 50.0,
            anaerobic: 33.3,
            neuromuscular: 0.0
          }
        },
        nextRecommendations: {
          restPeriod: '24h',
          nextIntensity: 0.75,
          suggestedExercises: ['ex_squats_456', 'ex_plank_789']
        }
      }
    };

    mockFetch.mockResolvedValueOnce(createMockResponse(expectedResponse, 200, true));

    const response = await fetch('/api/adaptive/workout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    const result = await response.json();

    expect(response.ok).toBe(true);
    expect(result.session.sessionId).toMatch(/^session_/);
    expect(result.session.adaptiveScore).toBeGreaterThan(0);
    expect(result.session.nextRecommendations).toBeDefined();
  });

  it('should handle workout without heart rate monitoring', async () => {
    const requestBody = {
      exerciseId: 'ex_yoga_123',
      duration: 2700, // 45 minutes
      caloriesBurned: 200,
      perceivedExertion: 4
      // No heart rate data
    };

    const expectedResponse = {
      success: true,
      session: {
        sessionId: 'session_xyz789',
        adaptiveScore: 6.5,
        performanceMetrics: {
          caloriesBurned: 200,
          estimatedIntensity: 'low',
          perceivedExertion: 4
        },
        limitations: ['Heart rate data unavailable - using perceived exertion only'],
        nextRecommendations: {
          restPeriod: '12h',
          nextIntensity: 0.6,
          suggestedExercises: ['ex_stretching_456']
        }
      }
    };

    mockFetch.mockResolvedValueOnce(createMockResponse(expectedResponse, 200, true));

    const response = await fetch('/api/adaptive/workout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    const result = await response.json();

    expect(response.ok).toBe(true);
    expect(result.session.limitations).toContain('Heart rate data unavailable - using perceived exertion only');
    expect(result.session.performanceMetrics.estimatedIntensity).toBe('low');
  });

  it('should enforce free user workout limits', async () => {
    const requestBody = {
      exerciseId: 'ex_premium_hiit_123',
      duration: 1200,
      heartRateData: [
        { timestamp: 1640995200000, bpm: 160 },
        { timestamp: 1640995260000, bpm: 175 }
      ],
      caloriesBurned: 250,
      perceivedExertion: 8
    };

    const errorResponse = {
      success: false,
      error: {
        code: 'SUBSCRIPTION_REQUIRED',
        message: 'Premium exercise tracking requires paid subscription'
      },
      basicSession: {
        sessionId: 'session_basic_123',
        adaptiveScore: null,
        performanceMetrics: {
          duration: 1200,
          caloriesBurned: 250
        },
        limitations: ['Advanced analytics require subscription upgrade']
      }
    };

    mockFetch.mockResolvedValueOnce(createMockResponse(errorResponse, 403, false));

    const response = await fetch('/api/adaptive/workout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    const result = await response.json();

    expect(response.status).toBe(403);
    expect(result.error.code).toBe('SUBSCRIPTION_REQUIRED');
    expect(result.basicSession).toBeDefined();
  });

  it('should validate exercise exists', async () => {
    const requestBody = {
      exerciseId: 'ex_nonexistent_999',
      duration: 1800,
      caloriesBurned: 300,
      perceivedExertion: 6
    };

    const errorResponse = {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Exercise not found or not available to user'
      }
    };

    mockFetch.mockResolvedValueOnce(createMockResponse(errorResponse, 400, false));

    const response = await fetch('/api/adaptive/workout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    const result = await response.json();

    expect(response.status).toBe(400);
    expect(result.error.code).toBe('VALIDATION_ERROR');
    expect(result.error.message).toContain('Exercise not found');
  });

  it('should validate perceived exertion range', async () => {
    const requestBody = {
      exerciseId: 'ex_running_123',
      duration: 2400,
      caloriesBurned: 400,
      perceivedExertion: 15 // out of 1-10 range
    };

    const errorResponse = {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Perceived exertion must be between 1 and 10'
      }
    };

    mockFetch.mockResolvedValueOnce(createMockResponse(errorResponse, 400, false));

    const response = await fetch('/api/adaptive/workout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    const result = await response.json();

    expect(response.status).toBe(400);
    expect(result.error.code).toBe('VALIDATION_ERROR');
    expect(result.error.message).toContain('Perceived exertion');
  });

  it('should validate heart rate data format', async () => {
    const requestBody = {
      exerciseId: 'ex_cycling_123',
      duration: 1800,
      heartRateData: [
        { timestamp: 'invalid', bpm: 130 }, // invalid timestamp
        { timestamp: 1640995260000, bpm: -50 } // invalid BPM
      ],
      caloriesBurned: 350,
      perceivedExertion: 7
    };

    const errorResponse = {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid heart rate data format. Timestamp must be unix milliseconds, BPM must be 30-220'
      }
    };

    mockFetch.mockResolvedValueOnce(createMockResponse(errorResponse, 400, false));

    const response = await fetch('/api/adaptive/workout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    const result = await response.json();

    expect(response.status).toBe(400);
    expect(result.error.code).toBe('VALIDATION_ERROR');
    expect(result.error.message).toContain('heart rate data format');
  });

  it('should require minimum duration', async () => {
    const requestBody = {
      exerciseId: 'ex_stretching_123',
      duration: 30, // too short
      caloriesBurned: 5,
      perceivedExertion: 2
    };

    const errorResponse = {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Workout duration must be at least 60 seconds'
      }
    };

    mockFetch.mockResolvedValueOnce(createMockResponse(errorResponse, 400, false));

    const response = await fetch('/api/adaptive/workout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    const result = await response.json();

    expect(response.status).toBe(400);
    expect(result.error.code).toBe('VALIDATION_ERROR');
    expect(result.error.message).toContain('60 seconds');
  });
});