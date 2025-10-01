/**
 * import { describe, test, expect } from "vitest";
import { api } from "../../convex/_generated/api";ntract Test: deleteCachedVoiceClip
 * Tests the /voice/cache/{cacheKey} DELETE endpoint
 * 
 * MUST FAIL initially (TDD approach)
 * Implements OpenAPI contract from voice-synthesis-api.openapi.yaml
 */

import { describe, test, expect } from 'vitest';
import { api } from '../../convex/_generated/api';

describe('Voice Cache Entry Delete Contract', () => {
  test('should delete specific cached voice clip', async () => {
    // Arrange: Valid cache key
    const cacheKey = 'old_cached_clip_v1';

    // Act: Delete cached clip (WILL FAIL - function doesn't exist yet)
    const result = await api.voice.deleteCachedVoiceClip({ cacheKey });

    // Assert: Contract compliance
    expect(result).toBeDefined();
    expect(result.cacheKey).toBe(cacheKey);
    expect(result.deletedAt).toBeInstanceOf(Date);
    expect(result.status).toBe('deleted');
  });

  test('should return 404 for nonexistent cache key', async () => {
    // Act & Assert: Should throw not found error
    await expect(
      api.voice.deleteCachedVoiceClip({ cacheKey: 'nonexistent_key' })
    ).rejects.toThrow(/Cached voice clip not found|404/);
  });
});