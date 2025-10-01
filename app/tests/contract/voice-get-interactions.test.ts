/**
 * Contract Test: getWorkoutVoiceInteractions
 * Tests the voice interactions retrieval functionality
 * 
 * MUST FAIL initially (TDD approach)
 */

import { describe, test, expect } from 'vitest';
import { api } from '../../convex/_generated/api';

describe('Voice Interactions Get Contract', () => {
  test('should get voice interactions for workout session', async () => {
    // Arrange: Valid workoutId
    const workoutId = 'workout_123';

    // Act: Get interactions (WILL FAIL - function doesn't exist yet)
    const result = await api.voice.getWorkoutVoiceInteractions({ workoutId });

    // Assert: Contract compliance
    expect(result).toBeDefined();
    expect(result.interactions).toBeInstanceOf(Array);
    expect(result.workoutId).toBe(workoutId);
    expect(result.totalCount).toBeTypeOf('number');
    
    result.interactions.forEach((interaction: any) => {
      expect(interaction.interactionId).toMatch(/^vi_[a-zA-Z0-9]{20}$/);
      expect(interaction.interactionType).toBeTypeOf('string');
      expect(interaction.text).toBeTypeOf('string');
      expect(interaction.timestamp).toBeInstanceOf(Date);
    });
  });

  test('should return empty array for workout with no interactions', async () => {
    // Act: Get interactions for workout with no voice interactions
    const result = await api.voice.getWorkoutVoiceInteractions({ workoutId: 'workout_no_voice' });

    // Assert: Should handle empty case
    expect(result.interactions).toEqual([]);
    expect(result.totalCount).toBe(0);
  });
});