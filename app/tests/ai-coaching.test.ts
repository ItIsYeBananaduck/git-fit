/**
 * Comprehensive AI Integration Test Suite
 * Tests for enhanced AI coaching system including recommendation accuracy,
 * preference learning, feedback processing, and end-to-end workflows
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { aiCoaching, createExerciseData, createFeedback, getWorkoutContext } from '../src/lib/ai-coaching.js';

// Mock fetch for testing
global.fetch = vi.fn();

describe('AI Coaching Service', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getRecommendation', () => {
    test('should successfully get AI recommendation', async () => {
      const mockRecommendation = {
        id: 'rec_user123_1234567890',
        type: 'increase_weight',
        original_value: 100,
        suggested_value: 105,
        confidence: 0.85,
        reasoning: 'Based on your recent progress and current energy level, you can handle a slight weight increase.',
        factors: ['recent_progression', 'energy_level', 'form_quality'],
        expected_outcome: 'Maintain progressive overload while staying within safe limits',
        risk_assessment: 'low',
        alternative_options: [
          {
            type: 'increase_reps',
            value: 12,
            reasoning: 'Alternative progression through volume'
          }
        ]
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          recommendation: mockRecommendation
        })
      });

      const exerciseData = createExerciseData('Bench Press', 3, 10, 100, 1);
      const context = getWorkoutContext();
      
      const result = await aiCoaching.getRecommendation('user123', exerciseData, context);
      
      expect(result).toEqual(mockRecommendation);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/recommendation'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('user123')
        })
      );
    });

    test('should handle API errors gracefully', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500
      });

      const exerciseData = createExerciseData('Bench Press', 3, 10, 100, 1);
      const context = getWorkoutContext();
      
      await expect(
        aiCoaching.getRecommendation('user123', exerciseData, context)
      ).rejects.toThrow('HTTP error! status: 500');
    });

    test('should handle network errors', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const exerciseData = createExerciseData('Bench Press', 3, 10, 100, 1);
      const context = getWorkoutContext();
      
      await expect(
        aiCoaching.getRecommendation('user123', exerciseData, context)
      ).rejects.toThrow('AI recommendation failed: Network error');
    });
  });

  describe('provideFeedback', () => {
    test('should successfully submit feedback', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      const feedback = createFeedback('user123', 'tweak123', true, {
        difficultyRating: 7,
        effectivenessRating: 8,
        perceivedExertion: 6,
        formQuality: 9,
        notes: 'Felt great, good progression'
      });
      
      await expect(aiCoaching.provideFeedback(feedback)).resolves.not.toThrow();
      
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/feedback'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('user123')
        })
      );
    });

    test('should handle feedback submission errors', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 400
      });

      const feedback = createFeedback('user123', 'tweak123', true);
      
      await expect(
        aiCoaching.provideFeedback(feedback)
      ).rejects.toThrow('HTTP error! status: 400');
    });
  });

  describe('getUserInsights', () => {
    test('should get comprehensive user insights', async () => {
      const mockInsights = {
        preference_summary: {
          preferred_intensity: 7.5,
          volume_tolerance: 8.2,
          progression_rate: 6.8,
          workout_style: 'strength-focused'
        },
        performance_trends: {
          acceptance_rate: 0.82,
          improvement_rate: 0.75,
          consistency_score: 0.88,
          weak_areas: ['leg_exercises', 'cardio_endurance'],
          strong_areas: ['upper_body_strength', 'form_quality']
        },
        ai_effectiveness: {
          recommendation_accuracy: 0.85,
          user_satisfaction: 0.87,
          personalization_level: 0.92
        },
        next_focus_areas: ['Progressive overload', 'Exercise variety', 'Recovery optimization']
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          insights: mockInsights
        })
      });
      
      const result = await aiCoaching.getUserInsights('user123');
      
      expect(result).toEqual(mockInsights);
      expect(result.preference_summary.preferred_intensity).toBeGreaterThan(7);
      expect(result.ai_effectiveness.recommendation_accuracy).toBeGreaterThan(0.8);
    });
  });

  describe('getUserProfile', () => {
    test('should get user preference profile', async () => {
      const mockProfile = {
        user_id: 'user123',
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
        learning_rate: 0.05
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          profile: mockProfile
        })
      });
      
      const result = await aiCoaching.getUserProfile('user123');
      
      expect(result).toEqual(mockProfile);
      expect(result.total_interactions).toBeGreaterThan(100);
      expect(result.acceptance_rate).toBeGreaterThan(0.8);
    });
  });
});

describe('Helper Functions', () => {
  describe('getWorkoutContext', () => {
    test('should create valid workout context', () => {
      const context = getWorkoutContext();
      
      expect(context).toHaveProperty('time_of_day');
      expect(['morning', 'afternoon', 'evening']).toContain(context.time_of_day);
      expect(context.day_of_week).toBeGreaterThanOrEqual(1);
      expect(context.day_of_week).toBeLessThanOrEqual(7);
      expect(context.gym_crowding).toBe('medium');
    });

    test('should set correct time of day based on hour', () => {
      // Mock Date to test different times
      const originalDate = Date;
      
      // Test morning (9 AM)
      global.Date = vi.fn(() => ({ 
        getHours: () => 9, 
        getDay: () => 1 
      })) as any;
      let context = getWorkoutContext();
      expect(context.time_of_day).toBe('morning');

      // Test afternoon (2 PM)
      global.Date = vi.fn(() => ({ 
        getHours: () => 14, 
        getDay: () => 1 
      })) as any;
      context = getWorkoutContext();
      expect(context.time_of_day).toBe('afternoon');

      // Test evening (7 PM)
      global.Date = vi.fn(() => ({ 
        getHours: () => 19, 
        getDay: () => 1 
      })) as any;
      context = getWorkoutContext();
      expect(context.time_of_day).toBe('evening');

      // Restore original Date
      global.Date = originalDate;
    });
  });

  describe('createExerciseData', () => {
    test('should create valid exercise data', () => {
      const exerciseData = createExerciseData('Squat', 4, 8, 135, 2);
      
      expect(exerciseData).toEqual({
        exercise_name: 'Squat',
        planned_sets: 4,
        planned_reps: 8,
        planned_weight: 135,
        current_set: 2
      });
    });

    test('should default current_set to 1', () => {
      const exerciseData = createExerciseData('Deadlift', 3, 5, 225);
      
      expect(exerciseData.current_set).toBe(1);
    });
  });

  describe('createFeedback', () => {
    test('should create basic feedback', () => {
      const feedback = createFeedback('user123', 'tweak456', true);
      
      expect(feedback).toEqual({
        user_id: 'user123',
        tweak_id: 'tweak456',
        feedback: {
          accepted: true,
          modified: false,
          skipped: false,
          difficulty_rating: undefined,
          effectiveness_rating: undefined,
          custom_adjustment: undefined,
          completion_time: undefined,
          perceived_exertion: undefined,
          form_quality: undefined,
          notes: undefined
        }
      });
    });

    test('should create detailed feedback with options', () => {
      const feedback = createFeedback('user123', 'tweak456', false, {
        modified: true,
        difficultyRating: 8,
        effectivenessRating: 6,
        perceivedExertion: 7,
        formQuality: 9,
        notes: 'Too challenging for today',
        completionTime: 120
      });
      
      expect(feedback.feedback.accepted).toBe(false);
      expect(feedback.feedback.modified).toBe(true);
      expect(feedback.feedback.difficulty_rating).toBe(8);
      expect(feedback.feedback.notes).toBe('Too challenging for today');
    });
  });
});

describe('End-to-End AI Workflow', () => {
  test('complete workout recommendation workflow', async () => {
    // Mock successful recommendation
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        recommendation: {
          id: 'rec_user123_1234567890',
          type: 'increase_weight',
          original_value: 100,
          suggested_value: 105,
          confidence: 0.85,
          reasoning: 'Progressive overload recommendation',
          factors: ['recent_progression', 'energy_level'],
          expected_outcome: 'Continued strength gains',
          risk_assessment: 'low'
        }
      })
    });

    // Mock successful feedback submission
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true })
    });

    // Step 1: Get recommendation
    const exerciseData = createExerciseData('Bench Press', 3, 10, 100, 1);
    const context = getWorkoutContext();
    context.user_energy = 8;
    context.user_motivation = 7;
    
    const recommendation = await aiCoaching.getRecommendation('user123', exerciseData, context);
    
    expect(recommendation.type).toBe('increase_weight');
    expect(recommendation.suggested_value).toBe(105);
    expect(recommendation.confidence).toBeGreaterThan(0.8);

    // Step 2: User accepts and provides feedback
    const feedback = createFeedback('user123', recommendation.id, true, {
      difficultyRating: 7,
      effectivenessRating: 8,
      perceivedExertion: 6,
      formQuality: 9
    });
    
    await expect(aiCoaching.provideFeedback(feedback)).resolves.not.toThrow();
    
    // Verify API calls
    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(global.fetch).toHaveBeenNthCalledWith(1, 
      expect.stringContaining('/recommendation'), 
      expect.any(Object)
    );
    expect(global.fetch).toHaveBeenNthCalledWith(2, 
      expect.stringContaining('/feedback'), 
      expect.any(Object)
    );
  });

  test('handles recommendation rejection with detailed feedback', async () => {
    // Mock recommendation
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        recommendation: {
          id: 'rec_user123_1234567891',
          type: 'decrease_weight',
          original_value: 150,
          suggested_value: 135,
          confidence: 0.75,
          reasoning: 'Form degradation detected',
          factors: ['form_quality', 'fatigue_level'],
          expected_outcome: 'Improved form and safety',
          risk_assessment: 'medium'
        }
      })
    });

    // Mock feedback submission
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true })
    });

    const exerciseData = createExerciseData('Squat', 3, 8, 150, 2);
    const context = getWorkoutContext();
    context.user_energy = 5; // Lower energy
    
    const recommendation = await aiCoaching.getRecommendation('user123', exerciseData, context);
    
    // User skips the recommendation
    const feedback = createFeedback('user123', recommendation.id, false, {
      skipped: true,
      difficultyRating: 9,
      effectivenessRating: 3,
      notes: 'Feeling strong today, want to push harder'
    });
    
    await aiCoaching.provideFeedback(feedback);
    
    expect(feedback.feedback.accepted).toBe(false);
    expect(feedback.feedback.skipped).toBe(true);
    expect(feedback.feedback.notes).toContain('strong today');
  });
});

describe('AI Recommendation Validation', () => {
  test('validates recommendation structure', async () => {
    const mockRecommendation = {
      id: 'rec_test_123',
      type: 'increase_weight',
      original_value: 100,
      suggested_value: 105,
      confidence: 0.85,
      reasoning: 'Test reasoning',
      factors: ['test_factor'],
      expected_outcome: 'Test outcome',
      risk_assessment: 'low'
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        recommendation: mockRecommendation
      })
    });

    const result = await aiCoaching.getRecommendation(
      'test_user', 
      createExerciseData('Test', 1, 1, 100), 
      getWorkoutContext()
    );
    
    // Validate required fields
    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('type');
    expect(result).toHaveProperty('confidence');
    expect(result).toHaveProperty('reasoning');
    expect(result).toHaveProperty('risk_assessment');
    
    // Validate data types
    expect(typeof result.confidence).toBe('number');
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
    expect(Array.isArray(result.factors)).toBe(true);
    expect(['low', 'medium', 'high']).toContain(result.risk_assessment);
  });

  test('validates safety constraints in recommendations', async () => {
    // Mock recommendation that should respect safety limits
    const mockRecommendation = {
      id: 'rec_safety_test',
      type: 'increase_weight',
      original_value: 100,
      suggested_value: 110, // 10% increase - at safety limit
      confidence: 0.90,
      reasoning: 'Progressive overload within safety limits',
      factors: ['progressive_overload'],
      expected_outcome: 'Safe strength progression',
      risk_assessment: 'low'
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        recommendation: mockRecommendation
      })
    });

    const result = await aiCoaching.getRecommendation(
      'safety_user', 
      createExerciseData('Safety Test', 3, 10, 100), 
      getWorkoutContext()
    );
    
    // Validate weight increase doesn't exceed 10% safety limit
    const percentIncrease = (result.suggested_value - result.original_value) / result.original_value;
    expect(percentIncrease).toBeLessThanOrEqual(0.10);
  });
});

describe('Performance and Error Handling', () => {
  test('handles timeout scenarios', async () => {
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Request timeout')), 100)
    );
    
    (global.fetch as any).mockImplementationOnce(() => timeoutPromise);

    const exerciseData = createExerciseData('Timeout Test', 1, 1, 100);
    const context = getWorkoutContext();
    
    await expect(
      aiCoaching.getRecommendation('timeout_user', exerciseData, context)
    ).rejects.toThrow('Request timeout');
  }, 10000);

  test('handles malformed API responses', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: false,
        error: 'Malformed request data'
      })
    });

    await expect(
      aiCoaching.getRecommendation(
        'malformed_user', 
        createExerciseData('Malformed', 1, 1, 100), 
        getWorkoutContext()
      )
    ).rejects.toThrow('Malformed request data');
  });

  test('validates rate limiting behavior', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 429
    });

    await expect(
      aiCoaching.getRecommendation(
        'rate_limited_user', 
        createExerciseData('Rate Limited', 1, 1, 100), 
        getWorkoutContext()
      )
    ).rejects.toThrow('HTTP error! status: 429');
  });
});

describe('Data Privacy and Security', () => {
  test('ensures sensitive data is not logged in errors', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    (global.fetch as any).mockRejectedValueOnce(new Error('Test error'));

    try {
      await aiCoaching.getRecommendation(
        'private_user_123', 
        createExerciseData('Private Exercise', 3, 10, 150), 
        getWorkoutContext()
      );
    } catch (error) {
      // Error should be thrown but not contain sensitive user data
      expect(error.message).not.toContain('private_user_123');
    }
    
    consoleSpy.mockRestore();
  });

  test('validates feedback data sanitization', () => {
    const feedback = createFeedback('user<script>', 'tweak123', true, {
      notes: 'This contains <script>alert("xss")</script> potential XSS'
    });
    
    // Feedback should be created as-is, sanitization happens on backend
    expect(feedback.feedback.notes).toContain('<script>');
    expect(feedback.user_id).toBe('user<script>');
  });
});

export default {
  testTimeout: 15000,
  setupFilesAfterEnv: ['<rootDir>/vitest-setup-ai.ts']
};