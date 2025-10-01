/**
 * import { describe, test, expect } from "vitest";
import { api } from "../../convex/_generated/api";ntract Test: recordVoiceInteraction
 * Tests the /voice/interactions POST endpoint
 * 
 * MUST FAIL initially (TDD approach)
 * Implements OpenAPI contract from voice-synthesis-api.openapi.yaml
 */

import { describe, test, expect } from 'vitest';
import { api } from '../../convex/_generated/api';

describe('Voice Interaction Record Contract', () => {
  test('should record voice interaction for workout session', async () => {
    // Arrange: Valid interaction data
    const interaction = {
      workoutId: 'workout_123',
      interactionType: 'encouragement',
      text: 'Great form on that last rep!',
      voiceId: 'voice_alice_encouraging',
      tone: 'supportive',
      audioUrl: 'https://cache.git-fit.app/voice/abc123.mp3',
      duration: 2.5,
      timestamp: new Date().toISOString()
    };

    // Act: Record interaction (WILL FAIL - function doesn't exist yet)
    const result = await api.voice.recordVoiceInteraction({ interaction });

    // Assert: Contract compliance
    expect(result).toBeDefined();
    expect(result.interactionId).toMatch(/^vi_[a-zA-Z0-9]{20}$/);
    expect(result.workoutId).toBe('workout_123');
    expect(result.recordedAt).toBeInstanceOf(Date);
    expect(result.status).toBe('recorded');
  });
});