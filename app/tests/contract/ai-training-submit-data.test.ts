/**
 * Contract Test: submitTrainingData
 * Tests the AI training data submission functionality
 * 
 * MUST FAIL initially (TDD approach)
 * Implements Convex contract for AI training data management
 */

import { describe, test, expect } from 'vitest';
import { api } from '../../convex/_generated/api';

describe('AI Training Data Submission Contract', () => {
  test('should submit valid training data and return success', async () => {
    // Arrange: Valid training data payload
    const trainingData = {
      workoutId: 'workout_123',
      userConsent: true,
      anonymizedData: {
        exerciseType: 'weight_training',
        duration: 3600,
        intensity: 8
      }
    };

    // Act: Submit training data (WILL FAIL - function doesn't exist yet)
    const result = await api["functions/aiTraining"].submitTrainingData({ trainingData });

    // Assert: Contract compliance
    expect(result).toBeDefined();
    expect(result.status).toBe('accepted');
    expect(result.dataId).toMatch(/^td_[a-zA-Z0-9]{20}$/);
    expect(result.submittedAt).toBeInstanceOf(Date);
  });

  test('should reject training data without user consent', async () => {
    // Arrange: Data without consent
    const trainingData = {
      workoutId: 'workout_123',
      userConsent: false,
      anonymizedData: {
        exerciseType: 'cardio',
        duration: 1800,
        intensity: 6
      }
    };

    // Act & Assert: Should throw error for no consent
    await expect(
      api["functions/aiTraining"].submitTrainingData({ trainingData })
    ).rejects.toThrow(/User consent not provided|403/);
  });

  test('should reject invalid training data format', async () => {
    // Arrange: Invalid data format
    const invalidTrainingData = {
      workoutId: 'workout_123',
      userConsent: true
      // Missing required anonymizedData field
    };

    // Act & Assert: Should throw error for invalid format
    await expect(
      api["functions/aiTraining"].submitTrainingData({ trainingData: invalidTrainingData })
    ).rejects.toThrow(/Invalid training data format|400/);
  });
});
