/**
 * Contract Test: getAIModel
 * Tests the AI model retrieval functionality
 * 
 * MUST FAIL initially (TDD approach)
 * Implements Convex contract for AI model management
 */

import { describe, test, expect } from 'vitest';
import { api } from '../../convex/_generated/api';

describe('AI Model Retrieval Contract', () => {
  test('should retrieve existing AI model by ID', async () => {
    // Arrange: Valid model ID
    const modelId = 'model_abc123';

    // Act: Get AI model (WILL FAIL - function doesn't exist yet)
    const result = await api["functions/aiTraining"].getAIModel({ modelId });

    // Assert: Contract compliance
    expect(result).toBeDefined();
    expect(result.modelId).toBe(modelId);
    expect(result.status).toMatch(/^(training|deployed|archived)$/);
    expect(result.version).toMatch(/^\d+\.\d+\.\d+$/);
    expect(result.createdAt).toBeInstanceOf(Date);
    expect(result.metadata).toBeDefined();
    expect(typeof result.metadata.accuracy).toBe('number');
  });

  test('should throw error for non-existent model', async () => {
    // Arrange: Non-existent model ID
    const nonExistentModelId = 'model_nonexistent';

    // Act & Assert: Should throw error for missing model
    await expect(
      api["functions/aiTraining"].getAIModel({ modelId: nonExistentModelId })
    ).rejects.toThrow(/Model not found|404/);
  });

  test('should throw error for invalid model ID format', async () => {
    // Arrange: Invalid model ID format
    const invalidModelId = 'invalid_format';

    // Act & Assert: Should throw error for invalid format
    await expect(
      api["functions/aiTraining"].getAIModel({ modelId: invalidModelId })
    ).rejects.toThrow(/Invalid model ID format|400/);
  });

  test('should include performance metrics in model response', async () => {
    // Arrange: Valid model ID for model with metrics
    const modelId = 'model_with_metrics_123';

    // Act: Get AI model (WILL FAIL - function doesn't exist yet)
    const result = await api["functions/aiTraining"].getAIModel({ modelId });

    // Assert: Performance metrics included
    expect(result.performanceMetrics).toBeDefined();
    expect(typeof result.performanceMetrics.accuracy).toBe('number');
    expect(typeof result.performanceMetrics.precision).toBe('number');
    expect(typeof result.performanceMetrics.recall).toBe('number');
    expect(result.performanceMetrics.accuracy).toBeGreaterThanOrEqual(0);
    expect(result.performanceMetrics.accuracy).toBeLessThanOrEqual(1);
  });
});
