/**
 * Contract Test: getTrainingSession
 * Tests the AI training session retrieval functionality
 * 
 * MUST FAIL initially (TDD approach)
 * Implements Convex contract for AI training session management
 */

import { describe, test, expect } from 'vitest';
import { api } from '../../convex/_generated/api';

describe('AI Training Session Retrieval Contract', () => {
  test('should retrieve existing training session by ID', async () => {
    // Arrange: Valid session ID
    const sessionId = 'session_abc123';

    // Act: Get training session (WILL FAIL - function doesn't exist yet)
    const result = await api["functions/aiTraining"].getTrainingSession({ sessionId });

    // Assert: Contract compliance
    expect(result).toBeDefined();
    expect(result.sessionId).toBe(sessionId);
    expect(result.status).toMatch(/^(active|paused|completed|failed)$/);
    expect(result.createdAt).toBeInstanceOf(Date);
    expect(result.metadata).toBeDefined();
    expect(typeof result.progress).toBe('number');
    expect(result.progress).toBeGreaterThanOrEqual(0);
    expect(result.progress).toBeLessThanOrEqual(100);
  });

  test('should throw error for non-existent session', async () => {
    // Arrange: Non-existent session ID
    const nonExistentSessionId = 'session_nonexistent';

    // Act & Assert: Should throw error for missing session
    await expect(
      api["functions/aiTraining"].getTrainingSession({ sessionId: nonExistentSessionId })
    ).rejects.toThrow(/Session not found|404/);
  });

  test('should throw error for invalid session ID format', async () => {
    // Arrange: Invalid session ID format
    const invalidSessionId = 'invalid_format';

    // Act & Assert: Should throw error for invalid format
    await expect(
      api["functions/aiTraining"].getTrainingSession({ sessionId: invalidSessionId })
    ).rejects.toThrow(/Invalid session ID format|400/);
  });

  test('should include training metrics in session response', async () => {
    // Arrange: Valid session ID for session with metrics
    const sessionId = 'session_with_metrics_123';

    // Act: Get training session (WILL FAIL - function doesn't exist yet)
    const result = await api["functions/aiTraining"].getTrainingSession({ sessionId });

    // Assert: Training metrics included
    expect(result.metrics).toBeDefined();
    expect(typeof result.metrics.loss).toBe('number');
    expect(typeof result.metrics.accuracy).toBe('number');
    expect(typeof result.metrics.epochsCompleted).toBe('number');
    expect(result.metrics.epochsCompleted).toBeGreaterThanOrEqual(0);
  });
});
