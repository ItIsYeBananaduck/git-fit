/**
 * Contract test for alice:getUserPreferences Convex function
 *
 * This test MUST FAIL initially as the function doesn't exist yet.
 * Tests the contract for retrieving Alice AI user preferences.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { describe, it, expect, beforeEach } from 'vitest';
import type { AliceConfig } from '$types/alice.js';

describe('alice:getUserPreferences Convex function contract', () => {
	// Placeholder for convexTest when dependency is available
	let mockConvex: any;

	beforeEach(() => {
		// If a harness class is available, instantiate a fresh instance for each
		// test to avoid cross-test state pollution. Otherwise fall back to vi mocks.
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

	it('should return default Alice preferences for new user', async () => {
		const expectedDefaults: AliceConfig = {
			primaryColor: '#00bfff',
			accentColor: '#ffffff',
			size: 'medium',
			voiceEnabled: true,
			coachingFrequency: 'medium',
			hapticsEnabled: true,
			autoHide: false,
			syncInterval: 2000,
			offlineMode: false
		};

		// This will fail until the function is implemented
		const result = await mockConvex.query('alice:getUserPreferences', {
			userId: 'new_user_123'
		});

		expect(result).toEqual(expectedDefaults);
	});

	it('should return custom preferences for existing user', async () => {
		const result = await mockConvex.query('alice:getUserPreferences', {
			userId: 'existing_user_456'
		});

		expect(result.primaryColor).toBe('#ff6b6b');
		expect(result.voiceEnabled).toBe(false);
		expect(result.size).toBe('large');
	});

	it('should handle missing user gracefully', async () => {
		// Should return default preferences for non-existent user
		const result = await mockConvex.query('alice:getUserPreferences', {
			userId: 'nonexistent_user'
		});

		expect(result).toBeDefined();
		expect(result.primaryColor).toBe('#00bfff'); // Default color
	});

	it('should validate userId parameter', async () => {
		// Should throw error for invalid userId
		await expect(
			mockConvex.query('alice:getUserPreferences', {
				userId: null
			})
		).rejects.toThrow();

		await expect(
			mockConvex.query('alice:getUserPreferences', {
				userId: ''
			})
		).rejects.toThrow();
	});
});
