/**
 * Contract test for alice:updateUserPreferences Convex function
 *
 * This test MUST FAIL initially as the function doesn't exist yet.
 * Tests the contract for updating Alice AI user preferences.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { describe, it, expect, beforeEach } from 'vitest';
import type { AliceConfig } from '$types/alice.js';

describe('alice:updateUserPreferences Convex function contract', () => {
	// Placeholder for convexTest when dependency is available
	let mockConvex: any;

	beforeEach(() => {
		// Instantiate a fresh harness instance for each test when possible to
		// avoid shared state; otherwise use vi mocks.
		const existing = (globalThis as any).__convexTestHarness || (globalThis as any).t;
		if (existing && existing.constructor) {
			const HarnessClass = existing.constructor;
			const fresh = new HarnessClass();
			(globalThis as any).__convexTestHarness = fresh;
			(globalThis as any).t = fresh;
			mockConvex = fresh;
		} else {
			mockConvex = {
				query: vi.fn(),
				mutation: vi.fn()
			};
		}
	});

	it('should update user preferences and return updated config', async () => {
		const newPreferences: Partial<AliceConfig> = {
			primaryColor: '#ff6b6b',
			voiceEnabled: false,
			coachingFrequency: 'high'
		};

		// This will fail until the function is implemented
		const result = await mockConvex.mutation('alice:updateUserPreferences', {
			userId: 'test_user_123',
			preferences: newPreferences
		});

		expect(result.primaryColor).toBe('#ff6b6b');
		expect(result.voiceEnabled).toBe(false);
		expect(result.coachingFrequency).toBe('high');
	});

	it('should validate preference values', async () => {
		const invalidPreferences = {
			primaryColor: 'not-a-color',
			size: 'extra-huge', // Invalid size
			coachingFrequency: 'invalid-frequency'
		};

		await expect(
			mockConvex.mutation('alice:updateUserPreferences', {
				userId: 'test_user_123',
				preferences: invalidPreferences
			})
		).rejects.toThrow();
	});

	it('should merge with existing preferences', async () => {
		const partialUpdate: Partial<AliceConfig> = {
			voiceEnabled: false
		};

		const result = await mockConvex.mutation('alice:updateUserPreferences', {
			userId: 'test_user_123',
			preferences: partialUpdate
		});

		// Should keep other preferences unchanged
		expect(result.primaryColor).toBe('#00bfff'); // Default unchanged
		expect(result.voiceEnabled).toBe(false); // Updated
		expect(result.size).toBe('medium'); // Default unchanged
	});

	it('should handle color validation', async () => {
		const validColors: Partial<AliceConfig> = {
			primaryColor: '#ff0000',
			accentColor: 'rgb(255, 0, 0)'
		};

		const result = await mockConvex.mutation('alice:updateUserPreferences', {
			userId: 'test_user_123',
			preferences: validColors
		});

		expect(result.primaryColor).toBe('#ff0000');
		expect(result.accentColor).toBe('rgb(255, 0, 0)');
	});

	it('should validate required userId', async () => {
		const preferences: Partial<AliceConfig> = {
			voiceEnabled: false
		};

		await expect(
			mockConvex.mutation('alice:updateUserPreferences', {
				userId: '',
				preferences
			})
		).rejects.toThrow();
	});
});
