/**
 * import { describe, test, expect } from "vitest";
import { api } from "../../convex/_generated/api";ntract Test: getVoiceCloneStatus
 * Tests the /voice/clone/{cloneId}/status GET endpoint
 * 
 * MUST FAIL initially (TDD approach)
 * Implements OpenAPI contract from voice-synthesis-api.openapi.yaml
 */

import { describe, test, expect } from 'vitest';
import { api } from '../../convex/_generated/api';

describe('Voice Clone Status Contract', () => {
  test('should get voice clone status for valid cloneId', async () => {
    // Arrange: Valid cloneId
    const cloneId = 'vc_abcdefghijklmnopqrst';

    // Act: Get clone status (WILL FAIL - function doesn't exist yet)
    const result = await api.voice.getVoiceCloneStatus({ cloneId });

    // Assert: Contract compliance
    expect(result).toBeDefined();
    expect(result.cloneId).toBe(cloneId);
    expect(result.status).toMatch(/processing|completed|failed/);
    expect(result.progress).toBeTypeOf('number');
    expect(result.estimatedCompletion).toBeInstanceOf(Date);
  });

  test('should return 404 for nonexistent cloneId', async () => {
    // Act & Assert: Should throw not found error
    await expect(
      api.voice.getVoiceCloneStatus({ cloneId: 'vc_nonexistent12345' })
    ).rejects.toThrow(/Voice clone not found|404/);
  });
});