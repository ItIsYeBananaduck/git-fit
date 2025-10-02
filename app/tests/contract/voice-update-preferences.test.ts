/**
 * Contract Test: updateVoicePreferences
 * Tests the /voice/preferences PUT endpoint
 * 
 * MUST FAIL initially (TDD approach)
 * Implements OpenAPI contract from voice-synthesis-api.openapi.yaml
 */

import { describe, test, expect } from 'vitest';
import { api } from '../../convex/_generated/api';

describe('Voice Preferences Update Contract', () => {
  test('should update voice preferences for premium user', async () => {
    // Arrange: Valid preferences update
    const preferencesUpdate = {
      voiceId: 'voice_alice_premium',
      tonePreferences: {
        default: 'encouraging',
        motivation: 'energetic',
        encouragement: 'warm'
      },
      personalityTraits: ['supportive', 'knowledgeable', 'patient'],
      speechRate: 1.1,
      pitch: 0.9
    };

    // Act: Update voice preferences (WILL FAIL - function doesn't exist yet)
    const result = await api.voice.updateVoicePreferences({ preferencesUpdate });

    // Assert: Contract compliance
    expect(result).toBeDefined();
    expect(result.voiceId).toBe('voice_alice_premium');
    expect(result.tonePreferences.default).toBe('encouraging');
    expect(result.personalityTraits).toContain('supportive');
    expect(result.updatedAt).toBeInstanceOf(Date);
  });

  test('should reject invalid preferences data', async () => {
    // Arrange: Invalid preferences (missing required fields)
    const invalidUpdate = {
      speechRate: 2.5 // Invalid rate > 2.0
    };

    // Act & Assert: Should throw error for invalid data
    await expect(
      api.voice.updateVoicePreferences({ preferencesUpdate: invalidUpdate })
    ).rejects.toThrow(/Invalid preferences data|400/);
  });

  test('should require premium subscription for advanced features', async () => {
    // Arrange: Premium features for non-premium user
    const premiumUpdate = {
      voiceId: 'voice_custom_clone',
      tonePreferences: {
        default: 'custom_trained'
      }
    };

    // Act & Assert: Should throw subscription error
    await expect(
      api.voice.updateVoicePreferences({ preferencesUpdate: premiumUpdate }, { userTier: 'free' })
    ).rejects.toThrow(/Premium subscription required|403/);
  });
});