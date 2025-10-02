/**
 * Contract Test: synthesizeVoice
 * Tests the /voice/synthesize POST endpoint
 * 
 * MUST FAIL initially (TDD approach)
 * Implements OpenAPI contract from voice-synthesis-api.openapi.yaml
 */

import { describe, test, expect } from 'vitest';
import { api } from '../../convex/_generated/api';

describe('Voice Synthesize Contract', () => {
  test('should synthesize voice for valid text and preferences', async () => {
    // Arrange: Valid synthesis request
    const synthesisRequest = {
      text: 'Great job on completing that set! Keep pushing yourself.',
      voiceId: 'voice_alice_default',
      tone: 'encouraging',
      context: 'post_exercise_feedback',
      cacheKey: 'post_exercise_encouraging_123'
    };

    // Act: Synthesize voice (WILL FAIL - function doesn't exist yet)
    const result = await api.voice.synthesizeVoice({ synthesisRequest });

    // Assert: Contract compliance
    expect(result).toBeDefined();
    expect(result.audioUrl).toMatch(/^https?:\/\/.*\.(mp3|wav)$/);
    expect(result.duration).toBeTypeOf('number');
    expect(result.cacheKey).toBe('post_exercise_encouraging_123');
    expect(result.synthesizedAt).toBeInstanceOf(Date);
  });

  test('should handle cache hit for previously synthesized text', async () => {
    // Arrange: Request with existing cache key
    const cachedRequest = {
      text: 'Welcome back! Ready for another great workout?',
      voiceId: 'voice_alice_default',
      tone: 'welcoming',
      cacheKey: 'welcome_back_default'
    };

    // Act: Request cached synthesis
    const result = await api.voice.synthesizeVoice({ synthesisRequest: cachedRequest });

    // Assert: Should return cached result quickly
    expect(result.fromCache).toBe(true);
    expect(result.audioUrl).toBeDefined();
    expect(result.cacheHit).toBe(true);
  });

  test('should require premium subscription for custom voices', async () => {
    // Arrange: Custom voice request for non-premium user
    const premiumRequest = {
      text: 'Custom voice test',
      voiceId: 'voice_custom_clone_123',
      tone: 'personalized'
    };

    // Act & Assert: Should throw subscription error
    await expect(
      api.voice.synthesizeVoice({ synthesisRequest: premiumRequest }, { userTier: 'free' })
    ).rejects.toThrow(/Premium subscription required|403/);
  });
});