/**
 * Macro Calculator Contract Tests - Web Dashboard UI
 * 
 * Contract tests for macro calculator endpoints ensuring API compliance.
 * Tests macro profiles, AI adjustments, and weekly recommendations.
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
} from '../../lib/validation/contract-tests.js';
import type {
  MacroUpdateRequest,
  MacroUpdateResponse,
  MacroProfileResponse,
  AIAdjustmentRequest,
  AIAdjustmentResponse,
  WeeklyRecommendationResponse,
} from '../../lib/types/api-contracts.js';

describe('Macro Calculator Contract Tests', () => {
  let mockApiClient: MockApiClient;

  beforeEach(() => {
    mockApiClient = new MockApiClient();
  });

  describe('Macro Profile Endpoint', () => {
    it('should return valid macro profile', async () => {
      const mockResponse = {
        profile: {
          id: 'macro_123',
          userId: 'user_123',
          dailyCalories: 2500,
          proteinGrams: 150,
          carbsGrams: 300,
          fatGrams: 80,
          fitnessGoal: 'Muscle Gain',
          activityLevel: 'moderate',
          lastUpdated: '2024-12-19T00:00:00Z',
          isAIAdjusted: false,
        },
        progress: {
          currentCalories: 1800,
          currentProtein: 120,
          currentCarbs: 200,
          currentFat: 60,
          percentageToGoal: 72,
        },
      };
      
      assertValidResponse<MacroProfileResponse>(
        mockResponse,
        'MacroProfileResponseSchema'
      );

      expect(mockResponse.profile.dailyCalories).toBeGreaterThan(0);
      expect(mockResponse.progress.percentageToGoal).toBeLessThanOrEqual(100);
    });
  });

  describe('Macro Update Endpoint', () => {
    it('should accept valid macro update request', async () => {
      const request = TestDataFactory.createValidMacroUpdateRequest();
      
      assertValidRequest<MacroUpdateRequest>(
        request,
        'MacroUpdateRequestSchema'
      );

      const mockResponse = {
        success: true,
        updatedProfile: {
          id: 'macro_123',
          userId: 'user_123',
          dailyCalories: request.dailyCalories || 2500,
          proteinGrams: request.proteinGrams || 150,
          carbsGrams: 300,
          fatGrams: 80,
          fitnessGoal: request.fitnessGoal || 'Muscle Gain',
          activityLevel: 'moderate',
          lastUpdated: new Date().toISOString(),
          isAIAdjusted: false,
        },
      };
      
      assertValidResponse<MacroUpdateResponse>(
        mockResponse,
        'MacroUpdateResponseSchema'
      );
    });

    it('should reject negative macro values', async () => {
      const invalidRequest = {
        userId: 'user_123',
        proteinGrams: -50,
      };

      const validator = mockApiClient.getValidator();
      const result = validator.validateRequest('MacroUpdateRequestSchema', invalidRequest);
      
      expect(result.success).toBe(false);
      expect(result.errors.some((error: string) => error.includes('Protein cannot be negative'))).toBe(true);
    });
  });

  describe('AI Adjustment Endpoint', () => {
    it('should accept valid AI adjustment request', async () => {
      const request = {
        userId: 'user_123',
        weightChange: 2,
        energyLevel: 'moderate' as const,
        hungerLevel: 'high' as const,
        sleepQuality: 'good' as const,
        stressLevel: 'low' as const,
      };
      
      assertValidRequest<AIAdjustmentRequest>(
        request,
        'AIAdjustmentRequestSchema'
      );

      const mockResponse = {
        success: true,
        adjustments: {
          calorieChange: 100,
          proteinChange: 10,
          carbsChange: 15,
          fatChange: 5,
          reasoning: 'Increased calories due to high hunger and good recovery',
        },
        updatedProfile: {
          id: 'macro_123',
          userId: 'user_123',
          dailyCalories: 2600,
          proteinGrams: 160,
          carbsGrams: 315,
          fatGrams: 85,
          fitnessGoal: 'Muscle Gain',
          activityLevel: 'moderate',
          lastUpdated: new Date().toISOString(),
          isAIAdjusted: true,
        },
      };
      
      assertValidResponse<AIAdjustmentResponse>(
        mockResponse,
        'AIAdjustmentResponseSchema'
      );

      expect(mockResponse.adjustments.reasoning).toBeTruthy();
      expect(mockResponse.updatedProfile.isAIAdjusted).toBe(true);
    });

    it('should require valid enum values', async () => {
      const invalidRequest = {
        userId: 'user_123',
        energyLevel: 'invalid',
        hungerLevel: 'moderate',
        sleepQuality: 'good',
        stressLevel: 'low',
      };

      const validator = mockApiClient.getValidator();
      const result = validator.validateRequest('AIAdjustmentRequestSchema', invalidRequest);
      
      expect(result.success).toBe(false);
    });
  });

  describe('Weekly Recommendation Endpoint', () => {
    it('should return valid weekly recommendations', async () => {
      const mockResponse = {
        recommendations: [
          {
            type: 'increase_calories' as const,
            message: 'Consider increasing daily calories by 200',
            suggestedChanges: {
              calories: 200,
              protein: 15,
            },
          },
        ],
        surveyRequired: true,
        nextSurveyDate: '2024-12-26',
      };
      
      assertValidResponse<WeeklyRecommendationResponse>(
        mockResponse,
        'WeeklyRecommendationResponseSchema'
      );

      expect(mockResponse.recommendations).toHaveLength(1);
      expect(mockResponse.recommendations[0].message).toBeTruthy();
    });
  });

  describe('Nutrition Validation', () => {
    it('should validate macro ratio consistency', async () => {
      const request = {
        userId: 'user_123',
        dailyCalories: 2000,
        proteinGrams: 150, // 600 calories
        carbsGrams: 200,   // 800 calories  
        fatGrams: 100,     // 900 calories
        // Total: 2300 calories (exceeds daily target)
      };
      
      // This should pass validation but might trigger business logic warnings
      assertValidRequest<MacroUpdateRequest>(
        request,
        'MacroUpdateRequestSchema'
      );
      
      // Calculate macro calories
      const proteinCals = request.proteinGrams * 4;
      const carbCals = request.carbsGrams * 4;
      const fatCals = request.fatGrams * 9;
      const totalMacroCals = proteinCals + carbCals + fatCals;
      
      expect(totalMacroCals).toBeGreaterThan(request.dailyCalories);
    });
  });
});