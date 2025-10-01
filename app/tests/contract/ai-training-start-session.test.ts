/**
 * Contract Test: startTrainingSession
 * Tests the AI training session start functionality
 * 
 * MUST FAIL initially (TDD approach)
 * Implements Convex contract for AI training session management
 */

import { describe, test, expect } from 'vitest';
import { api } from '../../convex/_generated/api';

describe('AI Training Start Session Contract', () => {
  test('should start AI training session with valid configuration', async () => {
    // Arrange: Valid training session configuration
    const sessionConfig = {
      sessionType: 'coaching',
      trainingMode: 'incremental',
      dataRetentionDays: 180
    };

    // Act: Start training session (WILL FAIL - function doesn't exist yet)
    const result = await api["functions/aiTraining"].startTrainingSession({ config: sessionConfig });

    // Assert: Contract compliance
    expect(result).toBeDefined();
    expect(result.sessionId).toMatch(/^ts_[a-zA-Z0-9]{20}$/);
    expect(result.status).toBe('scheduled');
    expect(result.sessionType).toBe('coaching');
    expect(result.estimatedDuration).toBeTypeOf('number');
  });

  test('should reject training session when one is already running', async () => {
    // Arrange: Valid session request
    const sessionConfig = {
      sessionType: 'coaching',
      trainingMode: 'full',
      dataRetentionDays: 180
    };

    // Act & Assert: Should reject if training already in progress
    await expect(
      api["functions/aiTraining"].startTrainingSession({ config: sessionConfig })
    ).rejects.toThrow(/Training session already in progress|409/);
  });

  test('should validate session configuration parameters', async () => {
    // Arrange: Invalid training config
    const invalidSessionConfig = {
      sessionType: 'invalid_type',
      trainingMode: 'unknown_mode',
      dataRetentionDays: -1 // Invalid negative retention
    };

    // Act & Assert: Should reject invalid config
    await expect(
      api["functions/aiTraining"].startTrainingSession({ config: invalidSessionConfig })
    ).rejects.toThrow(/Invalid session configuration|400/);
  });

  test('should apply default configuration when not specified', async () => {
    // Arrange: Minimal session request
    const sessionConfig = {
      sessionType: 'coaching'
    };

    // Act: Start with minimal config
    const result = await api["functions/aiTraining"].startTrainingSession({ config: sessionConfig });

    // Assert: Should apply defaults
    expect(result.trainingMode).toBe('incremental'); // Default mode
    expect(result.dataRetentionDays).toBe(180); // Default retention
    expect(result.priority).toBe('normal'); // Default priority
  });

  test('should generate unique session ID for each training session', async () => {
    // Arrange: Same session request
    const sessionConfig = {
      sessionType: 'coaching',
      trainingMode: 'incremental'
    };

    // Act: Start multiple sessions (assuming previous ones complete)
    const result1 = await api["functions/aiTraining"].startTrainingSession({ config: sessionConfig });
    const result2 = await api["functions/aiTraining"].startTrainingSession({ config: sessionConfig });

    // Assert: Should have unique IDs
    expect(result1.sessionId).not.toBe(result2.sessionId);
    expect(result1.sessionId).toMatch(/^ts_[a-zA-Z0-9]{20}$/);
    expect(result2.sessionId).toMatch(/^ts_[a-zA-Z0-9]{20}$/);
  });
});
