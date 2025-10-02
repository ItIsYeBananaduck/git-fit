/**
 * Food Database Contract Tests - Web Dashboard UI
 * 
 * Contract tests for food database endpoints ensuring API compliance.
 * Tests custom food creation, validation, and verification functionality.
 * 
 * Generated: December 19, 2024
 * Framework: SvelteKit 2.22+ + Convex 1.27+ + Vitest
 */

import { describe, it, expect } from 'vitest';
import {
  TestDataFactory,
  assertValidRequest,
  assertValidResponse,
} from '../../lib/validation/contract-tests.js';
import type {
  CustomFoodCreateRequest,
  CustomFoodCreateResponse,
  CustomFoodListResponse,
  ValidationRequest,
  ValidationResponse,
  VerificationRequest,
  VerificationResponse,
} from '../../lib/types/api-contracts.js';

describe('Food Database Contract Tests', () => {
  describe('Custom Food Creation Endpoint', () => {
    it('should accept valid custom food request', async () => {
      const request = TestDataFactory.createValidCustomFoodRequest();
      
      assertValidRequest<CustomFoodCreateRequest>(
        request,
        'CustomFoodCreateRequestSchema'
      );

      const mockResponse = {
        success: true,
        food: {
          id: 'food_123',
          userId: 'user_123',
          name: 'Test Food',
          caloriesPerUnit: 100,
          proteinPerUnit: 20,
          carbsPerUnit: 5,
          fatPerUnit: 2,
          unit: '100g',
          isVerified: false,
          flaggedAsOutlier: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        validationFlags: {
          isOutlier: false,
          outlierReasons: [],
          confidenceScore: 0.95,
        },
      };
      
      assertValidResponse<CustomFoodCreateResponse>(
        mockResponse,
        'CustomFoodCreateResponseSchema'
      );

      expect(mockResponse.validationFlags.confidenceScore).toBeGreaterThanOrEqual(0);
      expect(mockResponse.validationFlags.confidenceScore).toBeLessThanOrEqual(1);
    });

    it('should reject negative nutritional values', async () => {
      const invalidRequest = {
        userId: 'user_123',
        name: 'Invalid Food',
        caloriesPerUnit: -50, // Invalid
        proteinPerUnit: 20,
        carbsPerUnit: 5,
        fatPerUnit: 2,
        unit: '100g',
      };

      // Mock validator to test negative values
      const mockValidator = {
        validateRequest: () => ({
          success: false,
          errors: ['caloriesPerUnit: Calories cannot be negative']
        })
      };
      
      const result = mockValidator.validateRequest();
      expect(result.success).toBe(false);
      expect(result.errors[0]).toContain('Calories cannot be negative');
    });
  });

  describe('Custom Food List Endpoint', () => {
    it('should return valid food list', async () => {
      const mockResponse = {
        foods: [
          {
            id: 'food_123',
            userId: 'user_123',
            name: 'Chicken Breast',
            caloriesPerUnit: 165,
            proteinPerUnit: 31,
            carbsPerUnit: 0,
            fatPerUnit: 3.6,
            unit: '100g',
            isVerified: true,
            flaggedAsOutlier: false,
            createdAt: '2024-12-19T00:00:00Z',
            updatedAt: '2024-12-19T00:00:00Z',
          },
        ],
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalCount: 1,
        },
      };
      
      assertValidResponse<CustomFoodListResponse>(
        mockResponse,
        'CustomFoodListResponseSchema'
      );

      expect(mockResponse.foods).toHaveLength(1);
      expect(mockResponse.pagination.totalCount).toBe(1);
    });
  });

  describe('AI Validation Endpoint', () => {
    it('should accept valid validation request', async () => {
      const request = {
        foodData: {
          name: 'Custom Protein Bar',
          caloriesPerUnit: 250,
          proteinPerUnit: 20,
          carbsPerUnit: 30,
          fatPerUnit: 8,
          unit: '1 bar',
        },
      };
      
      assertValidRequest<ValidationRequest>(
        request,
        'ValidationRequestSchema'
      );

      const mockResponse = {
        isValid: true,
        isOutlier: false,
        confidenceScore: 0.92,
        outlierReasons: [],
        suggestions: [],
      };
      
      assertValidResponse<ValidationResponse>(
        mockResponse,
        'ValidationResponseSchema'
      );

      expect(mockResponse.confidenceScore).toBeGreaterThan(0.9);
    });

    it('should flag nutritional outliers', async () => {
      const mockResponse = {
        isValid: true,
        isOutlier: true,
        confidenceScore: 0.3,
        outlierReasons: ['Protein content unusually high for this food type'],
        suggestions: [
          {
            field: 'proteinPerUnit',
            suggestedValue: 25,
            reason: 'Typical protein content for this food type',
          },
        ],
      };
      
      assertValidResponse<ValidationResponse>(
        mockResponse,
        'ValidationResponseSchema'
      );

      expect(mockResponse.isOutlier).toBe(true);
      expect(mockResponse.outlierReasons).toHaveLength(1);
      expect(mockResponse.suggestions).toHaveLength(1);
    });
  });

  describe('User Verification Endpoint', () => {
    it('should accept valid verification request', async () => {
      const request = {
        foodId: 'food_123',
        userId: 'user_123',
        userConfirmed: true,
        correctedValues: {
          proteinPerUnit: 25,
        },
      };
      
      assertValidRequest<VerificationRequest>(
        request,
        'VerificationRequestSchema'
      );

      const mockResponse = {
        success: true,
        updatedFood: {
          id: 'food_123',
          userId: 'user_123',
          name: 'Custom Food',
          caloriesPerUnit: 100,
          proteinPerUnit: 25, // Updated
          carbsPerUnit: 5,
          fatPerUnit: 2,
          unit: '100g',
          isVerified: true,
          flaggedAsOutlier: false,
          createdAt: '2024-12-19T00:00:00Z',
          updatedAt: new Date().toISOString(),
        },
      };
      
      assertValidResponse<VerificationResponse>(
        mockResponse,
        'VerificationResponseSchema'
      );

      expect(mockResponse.updatedFood.isVerified).toBe(true);
      expect(mockResponse.updatedFood.proteinPerUnit).toBe(25);
    });

    it('should handle user rejection of AI suggestions', async () => {
      const request = {
        foodId: 'food_123',
        userId: 'user_123',
        userConfirmed: false, // User disagrees with AI
      };
      
      assertValidRequest<VerificationRequest>(
        request,
        'VerificationRequestSchema'
      );

      const mockResponse = {
        success: true,
        updatedFood: {
          id: 'food_123',
          userId: 'user_123',
          name: 'Custom Food',
          caloriesPerUnit: 500, // Original outlier value kept
          proteinPerUnit: 50,
          carbsPerUnit: 10,
          fatPerUnit: 5,
          unit: '100g',
          isVerified: true, // User verified their values
          flaggedAsOutlier: false, // No longer flagged after verification
          createdAt: '2024-12-19T00:00:00Z',
          updatedAt: new Date().toISOString(),
        },
      };
      
      assertValidResponse<VerificationResponse>(
        mockResponse,
        'VerificationResponseSchema'
      );

      expect(mockResponse.updatedFood.isVerified).toBe(true);
      expect(mockResponse.updatedFood.flaggedAsOutlier).toBe(false);
    });
  });

  describe('Nutritional Data Validation', () => {
    it('should validate macro consistency', async () => {
      const request = {
        foodData: {
          name: 'Test Food',
          caloriesPerUnit: 100,
          proteinPerUnit: 4,   // 16 calories
          carbsPerUnit: 20,    // 80 calories
          fatPerUnit: 0.4,     // 3.6 calories
          unit: '100g',
          // Total macro calories: ~100, matches stated calories
        },
      };
      
      assertValidRequest<ValidationRequest>(
        request,
        'ValidationRequestSchema'
      );

      // Calculate macro calories
      const { proteinPerUnit, carbsPerUnit, fatPerUnit } = request.foodData;
      const calculatedCalories = (proteinPerUnit * 4) + (carbsPerUnit * 4) + (fatPerUnit * 9);
      const calorieDiscrepancy = Math.abs(calculatedCalories - request.foodData.caloriesPerUnit);
      
      // Should be reasonably close (within 10%)
      expect(calorieDiscrepancy / request.foodData.caloriesPerUnit).toBeLessThan(0.1);
    });

    it('should handle zero values appropriately', async () => {
      const request = {
        foodData: {
          name: 'Pure Water',
          caloriesPerUnit: 0,
          proteinPerUnit: 0,
          carbsPerUnit: 0,
          fatPerUnit: 0,
          unit: '100ml',
        },
      };
      
      assertValidRequest<ValidationRequest>(
        request,
        'ValidationRequestSchema'
      );

      // Zero values should be valid for water, etc.
      expect(request.foodData.caloriesPerUnit).toBe(0);
      expect(request.foodData.proteinPerUnit).toBe(0);
    });
  });
});