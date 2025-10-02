/**
 * import { describe, test, expect } from "vitest";
import { api } from "../../convex/_generated/api";ntract Test: getVoicePreferences
 * Tests the /voice/preferences GET endpoint
 * 
 * MUST FAIL initially (TDD approach)
 * Implements OpenAPI contract from voice-synthesis-api.openapi.yaml
 */

import { describe, test, expect } from 'vitest';
import { api } from '../../convex/_generated/api';

describe('Voice Preferences Get Contract', () => {
  test('should get user voice preferences', async () => {
    // Act: Get voice preferences (WILL FAIL - function doesn't exist yet)
    const result = await api.voice.getVoicePreferences({});

    // Assert: Contract compliance
    expect(result).toBeDefined();
    expect(result.voiceId).toBeTypeOf('string');
    expect(result.tonePreferences).toHaveProperty('default');
    expect(result.tonePreferences).toHaveProperty('motivation');
    expect(result.tonePreferences).toHaveProperty('encouragement');
    expect(result.personalityTraits).toBeInstanceOf(Array);
    expect(result.isVoiceCloned).toBeTypeOf('boolean');
  });

  test('should return 404 for unconfigured preferences', async () => {
    // Act & Assert: Should throw not found error for new user
    await expect(
      api.voice.getVoicePreferences({}, { userId: 'new_user_123' })
    ).rejects.toThrow(/Voice preferences not configured|404/);
  });
});