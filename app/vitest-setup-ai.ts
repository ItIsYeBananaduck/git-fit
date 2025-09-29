/**
 * Vitest Setup for AI Coaching Tests
 * Configures test environment, mocks, and utilities for AI integration testing
 */

import { vi, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { cleanup } from '@testing-library/svelte';

// Setup test environment
beforeAll(() => {
  // Mock environment variables
  Object.defineProperty(import.meta, 'env', {
    value: {
      VITE_API_URL: 'http://localhost:8000',
      VITE_CONVEX_URL: 'https://test-convex.convex.cloud',
      MODE: 'test'
    },
    writable: true
  });

  // Mock console methods to reduce noise in tests
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  // Keep error logging for debugging
  vi.spyOn(console, 'error').mockImplementation((message) => {
    if (process.env.NODE_ENV !== 'test') {
      console.error(message);
    }
  });

  // Mock Date for consistent testing
  const mockDate = new Date('2024-01-15T10:30:00Z');
  vi.setSystemTime(mockDate);
});

afterAll(() => {
  // Restore all mocks
  vi.restoreAllMocks();
  vi.useRealTimers();
});

beforeEach(() => {
  // Reset all mocks before each test
  vi.clearAllMocks();
  
  // Reset fetch mock
  if (global.fetch && vi.isMockFunction(global.fetch)) {
    (global.fetch as any).mockReset();
  }
});

afterEach(() => {
  // Cleanup after each test
  cleanup();
  vi.clearAllTimers();
});

// Global test utilities
global.testUtils = {
  // Create mock AI recommendation
  createMockRecommendation: (overrides = {}) => ({
    id: 'rec_test_123456789',
    type: 'increase_weight',
    original_value: 100,
    suggested_value: 105,
    confidence: 0.85,
    reasoning: 'Progressive overload based on recent performance',
    factors: ['recent_progression', 'energy_level', 'form_quality'],
    expected_outcome: 'Continued strength gains with maintained form',
    risk_assessment: 'low',
    alternative_options: [
      {
        type: 'increase_reps',
        value: 12,
        reasoning: 'Volume-based progression alternative'
      }
    ],
    ...overrides
  }),

  // Create mock user insights
  createMockInsights: (overrides = {}) => ({
    preference_summary: {
      preferred_intensity: 7.5,
      volume_tolerance: 8.2,
      progression_rate: 6.8,
      workout_style: 'strength-focused',
      ...overrides.preference_summary
    },
    performance_trends: {
      acceptance_rate: 0.82,
      improvement_rate: 0.75,
      consistency_score: 0.88,
      weak_areas: ['leg_exercises', 'cardio_endurance'],
      strong_areas: ['upper_body_strength', 'form_quality'],
      ...overrides.performance_trends
    },
    ai_effectiveness: {
      recommendation_accuracy: 0.85,
      user_satisfaction: 0.87,
      personalization_level: 0.92,
      ...overrides.ai_effectiveness
    },
    next_focus_areas: [
      'Progressive overload optimization',
      'Exercise variety expansion',
      'Recovery period adjustment',
      ...(overrides.next_focus_areas || [])
    ],
    ...overrides
  }),

  // Create mock user profile
  createMockUserProfile: (overrides = {}) => ({
    user_id: 'test_user_123',
    preferred_intensity: 7.5,
    volume_tolerance: 8.2,
    rest_time_preference: 90,
    exercise_variety: 6.5,
    progression_rate: 7.0,
    form_focus: 8.5,
    time_constraints: {
      typical_session_length: 60,
      preferred_times: ['morning', 'evening'],
      rush_tolerance: 5.0
    },
    acceptance_rate: 0.82,
    modification_frequency: 0.15,
    skip_rate: 0.03,
    workout_confidence: 0.88,
    exercise_confidence: 0.85,
    intensity_confidence: 0.79,
    total_interactions: 156,
    last_updated: '2024-01-15T10:30:00Z',
    learning_rate: 0.05,
    ...overrides
  }),

  // Mock successful fetch response
  mockFetchSuccess: (data, status = 200) => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: status >= 200 && status < 300,
      status,
      json: async () => ({ success: true, ...data })
    });
  },

  // Mock fetch error
  mockFetchError: (status = 500, message = 'Internal Server Error') => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status,
      statusText: message
    });
  },

  // Mock network error
  mockNetworkError: (message = 'Network error') => {
    (global.fetch as any).mockRejectedValueOnce(new Error(message));
  },

  // Wait for async operations
  waitFor: (fn, timeout = 5000) => {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const check = () => {
        try {
          const result = fn();
          if (result) {
            resolve(result);
          } else if (Date.now() - startTime >= timeout) {
            reject(new Error(`Timeout: Condition not met within ${timeout}ms`));
          } else {
            setTimeout(check, 50);
          }
        } catch (error) {
          if (Date.now() - startTime >= timeout) {
            reject(error);
          } else {
            setTimeout(check, 50);
          }
        }
      };
      check();
    });
  },

  // Generate test user ID
  generateTestUserId: () => `test_user_${Math.random().toString(36).substr(2, 9)}`,

  // Generate test tweak ID
  generateTestTweakId: () => `tweak_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,

  // Validate recommendation structure
  validateRecommendation: (recommendation) => {
    const requiredFields = [
      'id', 'type', 'original_value', 'suggested_value', 
      'confidence', 'reasoning', 'factors', 'expected_outcome', 'risk_assessment'
    ];
    
    for (const field of requiredFields) {
      if (!(field in recommendation)) {
        throw new Error(`Missing required field: ${field}`);
      }
    }
    
    // Validate data types
    if (typeof recommendation.confidence !== 'number' || 
        recommendation.confidence < 0 || 
        recommendation.confidence > 1) {
      throw new Error('Confidence must be a number between 0 and 1');
    }
    
    if (!Array.isArray(recommendation.factors)) {
      throw new Error('Factors must be an array');
    }
    
    if (!['low', 'medium', 'high'].includes(recommendation.risk_assessment)) {
      throw new Error('Risk assessment must be low, medium, or high');
    }
    
    const validTypes = [
      'increase_weight', 'decrease_weight', 'adjust_reps', 'modify_rest', 
      'change_exercise', 'add_warmup', 'suggest_form_focus'
    ];
    
    if (!validTypes.includes(recommendation.type)) {
      throw new Error(`Invalid recommendation type: ${recommendation.type}`);
    }
    
    return true;
  },

  // Validate feedback structure
  validateFeedback: (feedback) => {
    if (!feedback.user_id || !feedback.tweak_id || !feedback.feedback) {
      throw new Error('Feedback must have user_id, tweak_id, and feedback fields');
    }
    
    const { feedback: feedbackData } = feedback;
    
    if (typeof feedbackData.accepted !== 'boolean') {
      throw new Error('Feedback.accepted must be a boolean');
    }
    
    // Validate rating ranges if provided
    const ratings = [
      'difficulty_rating', 'effectiveness_rating', 
      'perceived_exertion', 'form_quality'
    ];
    
    for (const rating of ratings) {
      if (feedbackData[rating] !== undefined) {
        if (typeof feedbackData[rating] !== 'number' || 
            feedbackData[rating] < 1 || 
            feedbackData[rating] > 10) {
          throw new Error(`${rating} must be a number between 1 and 10`);
        }
      }
    }
    
    return true;
  },

  // Simulate user interaction delay
  simulateUserDelay: (min = 100, max = 500) => {
    const delay = Math.random() * (max - min) + min;
    return new Promise(resolve => setTimeout(resolve, delay));
  },

  // Generate realistic exercise data
  generateExerciseData: (exerciseName = 'Bench Press') => {
    const exercises = {
      'Bench Press': { sets: 3, reps: 10, weight: 135 },
      'Squat': { sets: 3, reps: 8, weight: 185 },
      'Deadlift': { sets: 3, reps: 5, weight: 225 },
      'Overhead Press': { sets: 3, reps: 8, weight: 95 },
      'Pull-ups': { sets: 3, reps: 10, weight: 0 }
    };
    
    const defaults = exercises[exerciseName] || exercises['Bench Press'];
    
    return {
      exercise_name: exerciseName,
      planned_sets: defaults.sets,
      planned_reps: defaults.reps,
      planned_weight: defaults.weight,
      current_set: 1
    };
  },

  // Generate realistic workout context
  generateWorkoutContext: (overrides = {}) => {
    const times = ['morning', 'afternoon', 'evening'];
    const crowding = ['low', 'medium', 'high'];
    
    return {
      time_of_day: times[Math.floor(Math.random() * times.length)],
      day_of_week: Math.floor(Math.random() * 7) + 1,
      user_energy: Math.floor(Math.random() * 10) + 1,
      user_motivation: Math.floor(Math.random() * 10) + 1,
      available_time: Math.floor(Math.random() * 60) + 30, // 30-90 minutes
      equipment_availability: ['barbell', 'dumbbells', 'bench'],
      gym_crowding: crowding[Math.floor(Math.random() * crowding.length)],
      ...overrides
    };
  }
};

// Type definitions for test utils
declare global {
  interface Window {
    testUtils: typeof global.testUtils;
  }
  
  namespace globalThis {
    var testUtils: typeof global.testUtils;
  }
}

// Export for use in test files
export const testUtils = global.testUtils;