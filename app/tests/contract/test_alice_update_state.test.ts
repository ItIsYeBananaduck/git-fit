/**
 * Contract test for alice:updateState Convex function
 * 
 * This test MUST FAIL initially as the function doesn't exist yet.
 * Tests the contract for updating Alice AI state in Convex database.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { convexTest } from 'convex-test';
import { api } from '../../../../convex/_generated/api.js';
import type { AliceAIState } from '$types/alice.js';

describe('alice:updateState Convex function contract', () => {
  let t: ReturnType<typeof convexTest>;

  beforeEach(() => {
    t = convexTest();
  });

  it('should accept valid AliceAIState object and return updated state', async () => {
    const mockAliceState: AliceAIState = {
      currentShape: 'neutral',
      morphProgress: 0,
      isAnimating: false,
      interactionMode: 'idle',
      visibilityState: 'visible',
      isInteractive: false,
      isVoiceEnabled: true,
      isSpeaking: false,
      currentMessage: undefined,
      lastSyncTimestamp: Date.now(),
      isOnline: true,
      currentPage: '/',
      shouldShowOnPage: true
    };

    // This will fail until the function is implemented
    const result = await t.mutation(api.alice.updateState, {
      userId: 'test_user_123',
      state: mockAliceState
    });

    expect(result).toBeDefined();
    expect(result.currentShape).toBe('neutral');
    expect(result.lastSyncTimestamp).toBeGreaterThan(0);
  });

  it('should validate required fields in AliceAIState', async () => {
    const invalidState = {
      currentShape: 'invalid_shape', // Invalid enum value
      morphProgress: -1, // Invalid range
      isAnimating: 'not_boolean' // Wrong type
    };

    // This should throw a validation error
    await expect(
      t.mutation(api.alice.updateState, {
        userId: 'test_user_123',
        state: invalidState as any
      })
    ).rejects.toThrow();
  });

  it('should handle strain-based shape transitions', async () => {
    const stateWithStrain: AliceAIState = {
      currentShape: 'intense',
      morphProgress: 0.75,
      isAnimating: true,
      interactionMode: 'idle',
      visibilityState: 'visible',
      isInteractive: false,
      isVoiceEnabled: true,
      isSpeaking: false,
      currentMessage: undefined,
      lastSyncTimestamp: Date.now(),
      isOnline: true,
      currentPage: '/workouts',
      shouldShowOnPage: true
    };

    const result = await t.mutation(api.alice.updateState, {
      userId: 'test_user_123',
      state: stateWithStrain
    });

    expect(result.currentShape).toBe('intense');
    expect(result.morphProgress).toBe(0.75);
    expect(result.isAnimating).toBe(true);
  });

  it('should update sync timestamp automatically', async () => {
    const oldTimestamp = Date.now() - 5000;
    const state: AliceAIState = {
      currentShape: 'neutral',
      morphProgress: 0,
      isAnimating: false,
      interactionMode: 'idle',
      visibilityState: 'visible',
      isInteractive: false,
      isVoiceEnabled: true,
      isSpeaking: false,
      currentMessage: undefined,
      lastSyncTimestamp: oldTimestamp,
      isOnline: true,
      currentPage: '/',
      shouldShowOnPage: true
    };

    const result = await t.mutation(api.alice.updateState, {
      userId: 'test_user_123',
      state
    });

    // Should update timestamp to current time
    expect(result.lastSyncTimestamp).toBeGreaterThan(oldTimestamp);
  });
});