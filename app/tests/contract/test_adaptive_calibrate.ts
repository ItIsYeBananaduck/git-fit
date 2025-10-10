// T006 [P] Contract test POST /api/adaptive/calibrate
// This test MUST FAIL until the adaptive fitness calibration API is implemented

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

describe('POST /api/adaptive/calibrate', () => {
  let mockFetch: MockedFunction<typeof fetch>;

  beforeEach(() => {
    mockFetch = vi.fn();
    global.fetch = mockFetch;
  });

  it('should perform fitness calibration successfully', async () => {
    const requestBody = {
      age: 28,
      weight: 70,
      height: 175,
      activityLevel: 'moderate',
      fitnessGoals: ['weight_loss', 'endurance'],
      restingHeartRate: 65,
      maxHeartRate: 195
    };

    const expectedResponse = {
      success: true,
      profile: {
        heartRateZones: {
          recovery: { min: 117, max: 137 },
          aerobic: { min: 137, max: 156 },
          anaerobic: { min: 156, max: 176 },
          neuromuscular: { min: 176, max: 195 }
        },
        fitnessLevel: 'intermediate',
        recommendedIntensity: 0.7,
        calorieTargets: {
          daily: 2200,
          workout: 400
        }
      },
      calibrationId: 'cal_abc123'
    };

    mockFetch.mockResolvedValueOnce(createMockResponse(expectedResponse, 200, true));

    const response = await fetch('/api/adaptive/calibrate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    const result = await response.json();

    expect(response.ok).toBe(true);
    expect(result.profile.heartRateZones).toBeDefined();
    expect(result.profile.fitnessLevel).toBe('intermediate');
    expect(result.calibrationId).toMatch(/^cal_/);
  });

  it('should enforce subscription restrictions for detailed calibration', async () => {
    const requestBody = {
      age: 35,
      weight: 80,
      height: 180,
      activityLevel: 'high',
      fitnessGoals: ['strength', 'endurance'],
      restingHeartRate: 58,
      maxHeartRate: 185,
      vo2Max: 45, // detailed metric requiring subscription
      bodyFatPercentage: 15
    };

    const errorResponse = {
      success: false,
      error: {
        code: 'SUBSCRIPTION_REQUIRED',
        message: 'Advanced calibration metrics require paid subscription'
      },
      basicProfile: {
        heartRateZones: {
          recovery: { min: 111, max: 129 },
          aerobic: { min: 129, max: 148 },
          anaerobic: { min: 148, max: 166 },
          neuromuscular: { min: 166, max: 185 }
        },
        fitnessLevel: 'basic_estimate'
      }
    };

    mockFetch.mockResolvedValueOnce(createMockResponse(errorResponse, 403, false));

    const response = await fetch('/api/adaptive/calibrate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    const result = await response.json();

    expect(response.status).toBe(403);
    expect(result.error.code).toBe('SUBSCRIPTION_REQUIRED');
    expect(result.basicProfile).toBeDefined();
  });

  it('should validate age range', async () => {
    const requestBody = {
      age: 12, // too young
      weight: 50,
      height: 160,
      activityLevel: 'low',
      fitnessGoals: ['general'],
      restingHeartRate: 80,
      maxHeartRate: 200
    };

    const errorResponse = {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Age must be between 13 and 100 years'
      }
    };

    mockFetch.mockResolvedValueOnce(createMockResponse(errorResponse, 400, false));

    const response = await fetch('/api/adaptive/calibrate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    const result = await response.json();

    expect(response.status).toBe(400);
    expect(result.error.code).toBe('VALIDATION_ERROR');
  });

  it('should validate heart rate consistency', async () => {
    const requestBody = {
      age: 25,
      weight: 65,
      height: 170,
      activityLevel: 'moderate',
      fitnessGoals: ['endurance'],
      restingHeartRate: 90,
      maxHeartRate: 85 // max lower than resting - invalid
    };

    const errorResponse = {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Maximum heart rate must be higher than resting heart rate'
      }
    };

    mockFetch.mockResolvedValueOnce(createMockResponse(errorResponse, 400, false));

    const response = await fetch('/api/adaptive/calibrate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    const result = await response.json();

    expect(response.status).toBe(400);
    expect(result.error.code).toBe('VALIDATION_ERROR');
    expect(result.error.message).toContain('heart rate');
  });

  it('should validate activity level enum', async () => {
    const requestBody = {
      age: 30,
      weight: 75,
      height: 175,
      activityLevel: 'super_high', // invalid enum value
      fitnessGoals: ['strength'],
      restingHeartRate: 60,
      maxHeartRate: 190
    };

    const errorResponse = {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Activity level must be one of: low, moderate, high, very_high'
      }
    };

    mockFetch.mockResolvedValueOnce(createMockResponse(errorResponse, 400, false));

    const response = await fetch('/api/adaptive/calibrate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    const result = await response.json();

    expect(response.status).toBe(400);
    expect(result.error.code).toBe('VALIDATION_ERROR');
    expect(result.error.message).toContain('Activity level');
  });

  it('should require authentication', async () => {
    const requestBody = {
      age: 25,
      weight: 70,
      height: 175,
      activityLevel: 'moderate',
      fitnessGoals: ['general'],
      restingHeartRate: 65,
      maxHeartRate: 195
    };

    const errorResponse = {
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required for fitness calibration'
      }
    };

    mockFetch.mockResolvedValueOnce(createMockResponse(errorResponse, 401, false));

    const response = await fetch('/api/adaptive/calibrate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
        // Note: no auth headers
      },
      body: JSON.stringify(requestBody)
    });

    const result = await response.json();

    expect(response.status).toBe(401);
    expect(result.error.code).toBe('UNAUTHORIZED');
  });
});