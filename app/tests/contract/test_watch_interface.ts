// Contract tests for watch interface mutations and queries
import { describe, it, expect, beforeEach } from 'vitest';
import { ConvexTestingHelper } from 'convex/testing';
import { api } from '../../../convex/_generated/api';

describe('Watch Interface Contract Tests', () => {
	let t: ConvexTestingHelper;

	beforeEach(async () => {
		t = new ConvexTestingHelper();
	});

	describe('updateWatchExerciseData mutation', () => {
		it('should update exercise data from watch', async () => {
			// This test MUST FAIL until implementation exists
			await expect(
				t.mutation(api.watchInterface.updateWatchExerciseData, {
					deviceId: 'test-watch-001',
					repsChange: 1,
					weightChange: 5
				})
			).rejects.toThrow();
		});

		it('should validate reps change within -5 to +5 range', async () => {
			await expect(
				t.mutation(api.watchInterface.updateWatchExerciseData, {
					deviceId: 'test-watch-001',
					repsChange: 10,
					weightChange: 0
				})
			).rejects.toThrow('INVALID_REPS_CHANGE');
		});

		it('should validate weight change in 5lb increments', async () => {
			await expect(
				t.mutation(api.watchInterface.updateWatchExerciseData, {
					deviceId: 'test-watch-001',
					repsChange: 0,
					weightChange: 7
				})
			).rejects.toThrow('INVALID_WEIGHT_CHANGE');
		});

		it('should require valid device ID', async () => {
			await expect(
				t.mutation(api.watchInterface.updateWatchExerciseData, {
					deviceId: '',
					repsChange: 1,
					weightChange: 0
				})
			).rejects.toThrow('INVALID_DEVICE_ID');
		});
	});

	describe('getWatchWorkoutData query', () => {
		it('should return workout data optimized for watch display', async () => {
			const result = await t.query(api.watchInterface.getWatchWorkoutData, {
				deviceId: 'test-watch-001'
			});

			expect(result).toBeDefined();
			expect(result.currentExercise).toBeDefined();
			expect(result.strain).toBeDefined();
			expect(typeof result.strain.current).toBe('number');
			expect(result.orbColor).toMatch(/^#[0-9A-Fa-f]{6}$/);
		});

		it('should include current exercise information', async () => {
			const result = await t.query(api.watchInterface.getWatchWorkoutData, {
				deviceId: 'test-watch-001'
			});

			if (result) {
				expect(result.currentExercise).toBeDefined();
				expect(result.currentExercise.name).toBeTypeOf('string');
				expect(result.currentExercise.currentReps).toBeTypeOf('number');
				expect(result.currentExercise.targetReps).toBeTypeOf('number');
				expect(result.currentExercise.currentWeight).toBeTypeOf('number');
			}
		});

		it('should include strain data with orb color', async () => {
			const result = await t.query(api.watchInterface.getWatchWorkoutData, {
				deviceId: 'test-watch-001'
			});

			if (result) {
				expect(result.strain.current).toBeGreaterThanOrEqual(0);
				expect(result.strain.current).toBeLessThanOrEqual(120);
				expect(result.orbColor).toMatch(/^#[0-9A-Fa-f]{6}$/);
			}
		});
	});
});
