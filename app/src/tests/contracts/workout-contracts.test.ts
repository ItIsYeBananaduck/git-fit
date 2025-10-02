/**
 * Workout Data Contract Tests - Web Dashboard UI
 * 
 * Contract tests for workout data endpoints ensuring API compliance.
 * Tests workout summaries, details, weight updates, and sync functionality.
 * 
 * Generated: December 19, 2024
 * Framework: SvelteKit 2.22+ + Convex 1.27+ + Vitest
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  MockApiClient,
  TestDataFactory,
  assertValidRequest,
  assertValidResponse,
  ErrorSimulator,
} from '../../lib/validation/contract-tests.js';
import type {
  WorkoutSummaryRequest,
  WorkoutSummaryResponse,
  WorkoutDetailRequest,
  WorkoutDetailResponse,
  WeightUpdateRequest,
  WeightUpdateResponse,
} from '../../lib/types/api-contracts.js';

describe('Workout Data Contract Tests', () => {
  let mockApiClient: MockApiClient;

  beforeEach(() => {
    mockApiClient = new MockApiClient();
  });

  describe('Workout Summaries Endpoint', () => {
    it('should accept valid workout summary request', async () => {
      const request = TestDataFactory.createValidWorkoutSummaryRequest();
      
      assertValidRequest<WorkoutSummaryRequest>(
        request,
        'WorkoutSummaryRequestSchema'
      );

      const response = await mockApiClient.mockWorkoutSummaries(request);
      
      assertValidResponse<WorkoutSummaryResponse>(
        response,
        'WorkoutSummaryResponseSchema'
      );

      expect(response).toMatchObject({
        workouts: expect.any(Array),
        pagination: expect.objectContaining({
          currentPage: expect.any(Number),
          totalPages: expect.any(Number),
          totalCount: expect.any(Number),
          hasMore: expect.any(Boolean),
        }),
      });
    });

    it('should handle pagination parameters', async () => {
      const request = {
        userId: 'user_123',
        page: 2,
        limit: 5,
        dateFrom: '2024-01-01',
        dateTo: '2024-12-31',
      };
      
      assertValidRequest<WorkoutSummaryRequest>(
        request,
        'WorkoutSummaryRequestSchema'
      );

      const response = await mockApiClient.mockWorkoutSummaries(request);
      const typedResponse = response as WorkoutSummaryResponse;
      
      expect(typedResponse.pagination.currentPage).toBe(2);
    });

    it('should reject invalid date formats', async () => {
      const invalidRequest = {
        userId: 'user_123',
        dateFrom: 'invalid-date',
      };

      await expect(
        mockApiClient.mockWorkoutSummaries(invalidRequest)
      ).rejects.toThrow('Request validation failed');
    });

    it('should reject missing user ID', async () => {
      const invalidRequest = {
        page: 1,
        limit: 10,
      };

      await expect(
        mockApiClient.mockWorkoutSummaries(invalidRequest)
      ).rejects.toThrow('Request validation failed');
    });
  });

  describe('Workout Detail Endpoint', () => {
    it('should accept valid workout detail request', async () => {
      const request = {
        workoutId: 'workout_123',
        userId: 'user_123',
      };
      
      assertValidRequest<WorkoutDetailRequest>(
        request,
        'WorkoutDetailRequestSchema'
      );

      const response = await mockApiClient.mockWorkoutDetail(request);
      
      assertValidResponse<WorkoutDetailResponse>(
        response,
        'WorkoutDetailResponseSchema'
      );

      expect(response).toMatchObject({
        id: expect.any(String),
        name: expect.any(String),
        exercises: expect.any(Array),
        performanceMetrics: expect.objectContaining({
          totalWeight: expect.any(Number),
          totalReps: expect.any(Number),
          averageIntensity: expect.any(Number),
        }),
      });
    });

    it('should validate exercise details structure', async () => {
      const request = {
        workoutId: 'workout_123',
        userId: 'user_123',
      };

      const response = await mockApiClient.mockWorkoutDetail(request);
      const typedResponse = response as WorkoutDetailResponse;
      
      if (typedResponse.exercises.length > 0) {
        const exercise = typedResponse.exercises[0];
        expect(exercise).toMatchObject({
          id: expect.any(String),
          name: expect.any(String),
          sets: expect.objectContaining({
            planned: expect.any(Number),
            completed: expect.any(Number),
            weights: expect.any(Array),
            reps: expect.any(Array),
            skipped: expect.any(Boolean),
          }),
        });
      }
    });
  });

  describe('Weight Update Endpoint', () => {
    it('should accept valid weight update request', async () => {
      const request = {
        workoutId: 'workout_123',
        exerciseId: 'exercise_1',
        setIndex: 0,
        newWeight: 135,
        userId: 'user_123',
      };
      
      assertValidRequest<WeightUpdateRequest>(
        request,
        'WeightUpdateRequestSchema'
      );

      const response = await mockApiClient.mockWeightUpdate(request);
      
      assertValidResponse<WeightUpdateResponse>(
        response,
        'WeightUpdateResponseSchema'
      );
    });

    it('should reject negative weights', async () => {
      const invalidRequest = {
        workoutId: 'workout_123',
        exerciseId: 'exercise_1',
        setIndex: 0,
        newWeight: -10,
        userId: 'user_123',
      };

      const validator = mockApiClient.getValidator();
      const result = validator.validateRequest('WeightUpdateRequestSchema', invalidRequest);
      
      expect(result.success).toBe(false);
      expect(result.errors).toContain('newWeight: Weight cannot be negative');
    });
  });

  describe('Performance Requirements', () => {
    it('should complete workout summaries within time limit', async () => {
      const request = TestDataFactory.createValidWorkoutSummaryRequest();
      const startTime = Date.now();
      
      await mockApiClient.mockWorkoutSummaries(request);
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      expect(responseTime).toBeLessThan(500); // <500ms target
    });

    it('should handle large workout lists efficiently', async () => {
      const request = {
        userId: 'user_123',
        limit: 100, // Maximum allowed
      };
      
      const startTime = Date.now();
      await mockApiClient.mockWorkoutSummaries(request);
      const responseTime = Date.now() - startTime;
      
      expect(responseTime).toBeLessThan(1000); // Should handle large lists
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      const request = TestDataFactory.createValidWorkoutSummaryRequest();
      
      await expect(
        mockApiClient.mockWorkoutSummaries(request, {
          customResponse: ErrorSimulator.networkError(),
          shouldSucceed: false,
        })
      ).rejects.toThrow();
    });

    it('should handle server errors consistently', async () => {
      const request = {
        workoutId: 'workout_123',
        userId: 'user_123',
      };
      
      await expect(
        mockApiClient.mockWorkoutDetail(request, {
          customResponse: ErrorSimulator.serverError(),
          shouldSucceed: false,
        })
      ).rejects.toThrow();
    });
  });
});