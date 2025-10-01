/**
 * Integration Test: AI Training Data Collection
 * Tests end-to-end data collection workflow for AI training
 * 
 * MUST FAIL initially (TDD approach)
 * Tests complete workflow from workout completion to training data submission
 */

import { describe, test, expect } from 'vitest';
import { api } from '../../convex/_generated/api';

describe('AI Training Data Collection Integration', () => {
  test('should collect and submit training data after workout completion', async () => {
    // Arrange: Complete workout session
    const workoutSession = {
      exerciseType: 'strength_training',
      duration: 3600,
      exercises: [
        { name: 'Bench Press', sets: 4, reps: 10, weight: 185 },
        { name: 'Squats', sets: 4, reps: 12, weight: 225 }
      ],
      userConsent: true
    };

    // Act: Complete workout and trigger data collection (WILL FAIL - functions don't exist yet)
    const workoutResult = await api["functions/workouts"].completeWorkout({ session: workoutSession });
    const trainingDataResult = await api["functions/aiTraining"].collectTrainingData({ workoutId: workoutResult.workoutId });

    // Assert: Data collection workflow
    expect(trainingDataResult).toBeDefined();
    expect(trainingDataResult.anonymizedData).toBeDefined();
    expect(trainingDataResult.dataHash).toMatch(/^[a-f0-9]{64}$/);
    expect(trainingDataResult.submittedForTraining).toBe(true);
  });

  test('should respect user consent settings for data collection', async () => {
    // Arrange: Workout without consent
    const workoutSession = {
      exerciseType: 'cardio',
      duration: 1800,
      userConsent: false
    };

    // Act: Complete workout without consent
    const workoutResult = await api["functions/workouts"].completeWorkout({ session: workoutSession });
    
    // Assert: Should not collect training data
    await expect(
      api["functions/aiTraining"].collectTrainingData({ workoutId: workoutResult.workoutId })
    ).rejects.toThrow(/User consent not provided/);
  });

  test('should anonymize sensitive user data properly', async () => {
    // Arrange: Workout with personal data
    const workoutSession = {
      userId: 'user_123_personal',
      exerciseType: 'flexibility',
      duration: 1200,
      location: 'Home Gym',
      userConsent: true
    };

    // Act: Collect and anonymize data
    const workoutResult = await api["functions/workouts"].completeWorkout({ session: workoutSession });
    const trainingData = await api["functions/aiTraining"].collectTrainingData({ workoutId: workoutResult.workoutId });

    // Assert: Personal data should be anonymized
    expect(trainingData.anonymizedData).not.toContain('user_123_personal');
    expect(trainingData.anonymizedData).not.toContain('Home Gym');
    expect(trainingData.dataHash).toBeDefined();
  });
});