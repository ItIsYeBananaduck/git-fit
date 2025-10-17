/**
 * Contract test for alice:getWorkoutMetrics subscription
 *
 * This test MUST FAIL initially as the subscription doesn't exist yet.
 * Tests the contract for real-time workout metrics for Alice morphing.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { describe, it, expect, beforeEach } from 'vitest';
import type { StrainMorphContext } from '$types/alice.js';

interface WorkoutMetrics {
	strain: number;
	heartRate?: number;
	timestamp: number;
	workoutId?: string;
	intensity: 'low' | 'medium' | 'high';
}

describe('alice:getWorkoutMetrics subscription contract', () => {
	// Placeholder for convexTest when dependency is available
	let mockConvex: any;

	beforeEach(() => {
		// Instantiate a fresh harness per-test if available; otherwise use vi mocks.
		const existing = (globalThis as any).__convexTestHarness || (globalThis as any).t;
		if (existing && existing.constructor) {
			const HarnessClass = existing.constructor;
			const fresh = new HarnessClass();
			(globalThis as any).__convexTestHarness = fresh;
			(globalThis as any).t = fresh;
			mockConvex = fresh;
		} else {
			mockConvex = {
				subscription: vi.fn()
			};
		}
	});

	it('should return current workout metrics for active user', async () => {
		// This will fail until the subscription is implemented
		const result = await mockConvex.subscription('alice:getWorkoutMetrics', {
			userId: 'test_user_123'
		});

		expect(result).toBeDefined();
		expect(result.strain).toBeGreaterThanOrEqual(0);
		expect(result.strain).toBeLessThanOrEqual(100);
		expect(result.timestamp).toBeGreaterThan(0);
	});

	it('should provide strain context for morphing decisions', async () => {
		const result = await mockConvex.subscription('alice:getWorkoutMetrics', {
			userId: 'test_user_123'
		});

		// Should be usable to create StrainMorphContext
		const morphContext: StrainMorphContext = {
			currentStrain: result.strain,
			previousStrain: 30, // Mock previous value
			strainDelta: result.strain - 30,
			timestamp: result.timestamp
		};

		expect(morphContext.strainDelta).toBe(15);
		expect(morphContext.currentStrain).toBe(45);
	});

	it('should handle users without active workouts', async () => {
		const result = await mockConvex.subscription('alice:getWorkoutMetrics', {
			userId: 'inactive_user'
		});

		// Should return baseline metrics
		expect(result.strain).toBe(0);
		expect(result.intensity).toBe('low');
		expect(result.workoutId).toBeUndefined();
	});

	it('should update in real-time during workouts', async () => {
		// Mock real-time updates
		const updates: WorkoutMetrics[] = [
			{ strain: 30, timestamp: Date.now(), intensity: 'low' },
			{ strain: 50, timestamp: Date.now() + 1000, intensity: 'medium' },
			{ strain: 75, timestamp: Date.now() + 2000, intensity: 'high' }
		];

		for (let i = 0; i < updates.length; i++) {
			const result = await mockConvex.subscription('alice:getWorkoutMetrics', {
				userId: 'test_user_123'
			});

			expect(result.strain).toBeGreaterThanOrEqual(0);
			expect(['low', 'medium', 'high']).toContain(result.intensity);
		}
	});

	it('should validate userId parameter', async () => {
		await expect(
			mockConvex.subscription('alice:getWorkoutMetrics', {
				userId: null
			})
		).rejects.toThrow();

		await expect(
			mockConvex.subscription('alice:getWorkoutMetrics', {
				userId: ''
			})
		).rejects.toThrow();
	});
});
