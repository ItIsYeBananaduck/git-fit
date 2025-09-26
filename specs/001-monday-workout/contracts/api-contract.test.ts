import { describe, it, expect } from 'vitest';

/**
 * Contract Tests for Monday Workout Intensity Analysis API
 * 
 * These tests validate the API contract specifications.
 * They will fail until the actual implementation is created.
 */

describe('Workout Sessions API Contract', () => {
  it('should create workout session with valid data', async () => {
    const workoutData = {
      userId: 'user123',
      exerciseId: 'exercise456',
      reps: 10,
      sets: 3,
      weight: 135,
      completionTime: 1800000, // 30 minutes
      estimatedCalories: 250,
      completed: true
    };

    // This will fail until implementation exists
    const response = await fetch('/api/workouts/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(workoutData)
    });

    expect(response.status).toBe(201);
    
    const result = await response.json();
    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('rawDataHash');
    expect(result.rawDataHash).toMatch(/^[a-f0-9]{64}$/); // SHA-256 format
  });

  it('should reject workout session with invalid data', async () => {
    const invalidData = {
      userId: 'user123',
      // Missing required fields
      reps: -5, // Invalid negative reps
      sets: 0,  // Invalid zero sets
    };

    const response = await fetch('/api/workouts/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invalidData)
    });

    expect(response.status).toBe(400);
  });

  it('should require authentication for workout creation', async () => {
    const workoutData = {
      userId: 'user123',
      exerciseId: 'exercise456',
      reps: 10,
      sets: 3,
      weight: 135,
      completionTime: 1800000,
      estimatedCalories: 250,
      completed: true
    };

    const response = await fetch('/api/workouts/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // No authorization header
      body: JSON.stringify(workoutData)
    });

    expect(response.status).toBe(401);
  });
});

describe('Health Metrics API Contract', () => {
  it('should accept health metrics with valid data', async () => {
    const healthData = {
      userId: 'user123',
      date: '2025-09-26',
      heartRateAvg: 145,
      heartRateMax: 175,
      spO2Avg: 98,
      sleepScore: 75,
      strainScore: 85,
      dataSource: 'HealthKit'
    };

    const response = await fetch('/api/health/metrics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(healthData)
    });

    expect(response.status).toBe(201);
    
    const result = await response.json();
    expect(result).toHaveProperty('id');
  });

  it('should reject health metrics with out-of-range values', async () => {
    const invalidHealthData = {
      userId: 'user123',
      date: '2025-09-26',
      heartRateAvg: 300, // Invalid high heart rate
      spO2Avg: 50,       // Invalid low SpO2
      sleepScore: 150,   // Invalid high sleep score
      dataSource: 'HealthKit'
    };

    const response = await fetch('/api/health/metrics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invalidHealthData)
    });

    expect(response.status).toBe(400);
  });

  it('should accept health metrics with partial data', async () => {
    const partialHealthData = {
      userId: 'user123',
      date: '2025-09-26',
      heartRateAvg: 145, // Only heart rate provided
      dataSource: 'manual'
    };

    const response = await fetch('/api/health/metrics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(partialHealthData)
    });

    expect(response.status).toBe(201);
  });
});

describe('User Feedback API Contract', () => {
  it('should accept feedback with valid difficulty rating', async () => {
    const feedbackData = {
      workoutSessionId: 'session123',
      userId: 'user123',
      difficultyRating: 'challenge',
      notes: 'Felt good, could probably increase weight next week'
    };

    const response = await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(feedbackData)
    });

    expect(response.status).toBe(201);
    
    const result = await response.json();
    expect(result).toHaveProperty('id');
  });

  it('should reject feedback with invalid difficulty rating', async () => {
    const invalidFeedback = {
      workoutSessionId: 'session123',
      userId: 'user123',
      difficultyRating: 'impossible' // Invalid rating
    };

    const response = await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invalidFeedback)
    });

    expect(response.status).toBe(400);
  });

  it('should validate all standard difficulty ratings', async () => {
    const validRatings = ['keep going', 'neutral', 'challenge', 'easy killer', 'flag'];
    
    for (const rating of validRatings) {
      const feedbackData = {
        workoutSessionId: `session_${rating}`,
        userId: 'user123',
        difficultyRating: rating
      };

      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(feedbackData)
      });

      expect(response.status).toBe(201);
    }
  });
});

describe('Weekly Intensity API Contract', () => {
  it('should retrieve intensity score and volume adjustments', async () => {
    const response = await fetch('/api/intensity/weekly/user123?weekStart=2025-09-22');

    expect(response.status).toBe(200);
    
    const result = await response.json();
    expect(result).toHaveProperty('intensityScore');
    expect(result).toHaveProperty('volumeAdjustments');
    
    // Validate intensity score structure
    expect(result.intensityScore).toHaveProperty('totalIntensity');
    expect(result.intensityScore).toHaveProperty('baseScore');
    expect(result.intensityScore).toHaveProperty('heartRateComponent');
    expect(result.intensityScore).toHaveProperty('spO2Component');
    expect(result.intensityScore).toHaveProperty('sleepComponent');
    expect(result.intensityScore).toHaveProperty('feedbackComponent');
    expect(result.intensityScore).toHaveProperty('dataQuality');
    
    // Validate volume adjustments structure
    expect(Array.isArray(result.volumeAdjustments)).toBe(true);
    
    if (result.volumeAdjustments.length > 0) {
      const adjustment = result.volumeAdjustments[0];
      expect(adjustment).toHaveProperty('exerciseId');
      expect(adjustment).toHaveProperty('currentWeight');
      expect(adjustment).toHaveProperty('adjustmentPercentage');
      expect(adjustment).toHaveProperty('newWeight');
      expect(adjustment).toHaveProperty('reason');
      expect(adjustment).toHaveProperty('triggerRule');
    }
  });

  it('should return 404 for non-existent user/week', async () => {
    const response = await fetch('/api/intensity/weekly/nonexistent?weekStart=2025-09-22');

    expect(response.status).toBe(404);
  });

  it('should default to current week when no weekStart provided', async () => {
    const response = await fetch('/api/intensity/weekly/user123');

    // Should return data for current week or 404 if no data
    expect([200, 404]).toContain(response.status);
  });
});

describe('Monday Processing API Contract', () => {
  it('should trigger processing with valid admin credentials', async () => {
    const processingData = {
      weekStartDate: '2025-09-22'
    };

    const response = await fetch('/api/monday-processing/trigger', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': 'Bearer admin_token'
      },
      body: JSON.stringify(processingData)
    });

    expect(response.status).toBe(202);
    
    const result = await response.json();
    expect(result).toHaveProperty('processingId');
  });

  it('should reject processing trigger without admin credentials', async () => {
    const processingData = {
      weekStartDate: '2025-09-22'
    };

    const response = await fetch('/api/monday-processing/trigger', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // No admin authorization
      body: JSON.stringify(processingData)
    });

    expect([401, 403]).toContain(response.status);
  });

  it('should retrieve processing status', async () => {
    const response = await fetch('/api/monday-processing/status/processing123');

    expect([200, 404]).toContain(response.status);
    
    if (response.status === 200) {
      const result = await response.json();
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('usersProcessed');
      expect(result).toHaveProperty('intensityScoresGenerated');
      expect(result).toHaveProperty('adjustmentsGenerated');
      expect(result).toHaveProperty('processingTimeMs');
      expect(result).toHaveProperty('errors');
      
      // Validate status enum
      expect(['running', 'completed', 'failed', 'partial']).toContain(result.status);
    }
  });
});

describe('Authentication Contract', () => {
  it('should require JWT bearer token for protected endpoints', async () => {
    const protectedEndpoints = [
      { method: 'POST', url: '/api/workouts/sessions' },
      { method: 'POST', url: '/api/health/metrics' },
      { method: 'POST', url: '/api/feedback' },
      { method: 'GET', url: '/api/intensity/weekly/user123' },
    ];

    for (const endpoint of protectedEndpoints) {
      const response = await fetch(endpoint.url, {
        method: endpoint.method,
        headers: { 'Content-Type': 'application/json' }
        // No authorization header
      });

      expect(response.status).toBe(401);
    }
  });

  it('should accept valid JWT bearer tokens', async () => {
    const response = await fetch('/api/intensity/weekly/user123', {
      headers: { 
        'Authorization': 'Bearer valid_jwt_token'
      }
    });

    // Should not return 401 (may return 404 if no data, which is fine)
    expect(response.status).not.toBe(401);
  });
});