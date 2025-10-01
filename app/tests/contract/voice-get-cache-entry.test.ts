/**
 * import { describe, test, expect } from "vitest";
import { api } from "../../convex/_generated/api";ntract Test: getCachedVoiceClip
 * Tests the /voice/cache/{cacheKey} GET endpoint
 * 
 * MUST FAIL initially (TDD approach)
 * Implements OpenAPI contract from voice-synthesis-api.openapi.yaml
 */

import { describe, test, expect } from 'vitest';
import { api } from '../../convex/_generated/api';

describe('Voice Cache Entry Get Contract', () => {
  test('should get specific cached voice clip', async () => {
    // Arrange: Valid cache key
    const cacheKey = 'welcome_back_encouraging_v1';

    // Act: Get cached clip (WILL FAIL - function doesn't exist yet)
    const result = await api.voice.getCachedVoiceClip({ cacheKey });

    // Assert: Contract compliance
    expect(result).toBeDefined();
    expect(result.cacheKey).toBe(cacheKey);
    expect(result.audioUrl).toMatch(/^https?:\/\/.*\.(mp3|wav)$/);
    expect(result.duration).toBeTypeOf('number');
    expect(result.cachedAt).toBeInstanceOf(Date);
    expect(result.lastAccessed).toBeInstanceOf(Date);
  });

  test('should return 404 for nonexistent cache key', async () => {
    // Act & Assert: Should throw not found error
    await expect(
      api.voice.getCachedVoiceClip({ cacheKey: 'nonexistent_cache_key' })
    ).rejects.toThrow(/Cached voice clip not found|404/);
  });
});