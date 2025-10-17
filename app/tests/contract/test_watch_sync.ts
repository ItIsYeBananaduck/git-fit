// Contract tests for watch sync state mutations
import { describe, it, expect, beforeEach } from 'vitest';
import { ConvexTestingHelper } from 'convex/testing';
import { api } from '../../../convex/_generated/api';

describe('Watch Sync Contract Tests', () => {
	let t: ConvexTestingHelper;

	beforeEach(async () => {
		t = new ConvexTestingHelper();
	});

	describe('syncWatchState mutation', () => {
		it('should synchronize watch state with main app', async () => {
			// This test MUST FAIL until implementation exists
			await expect(
				t.mutation(api.watchSync.syncWatchState, {
					deviceId: 'test-watch-001',
					connectionStatus: 'connected',
					pendingUpdates: {}
				})
			).rejects.toThrow();
		});

		it('should validate connection status values', async () => {
			await expect(
				t.mutation(api.watchSync.syncWatchState, {
					deviceId: 'test-watch-001',
					connectionStatus: 'invalid-status',
					pendingUpdates: {}
				})
			).rejects.toThrow('INVALID_CONNECTION_STATUS');
		});

		it('should return sync result with conflict resolution info', async () => {
			const result = await t.mutation(api.watchSync.syncWatchState, {
				deviceId: 'test-watch-001',
				connectionStatus: 'connected',
				pendingUpdates: { reps: 10, weight: 135 }
			});

			expect(result).toBeDefined();
			expect(result.success).toBeTypeOf('boolean');
			expect(result.conflictsResolved).toBeTypeOf('number');
			expect(result.pendingCount).toBeTypeOf('number');
			expect(result.lastSyncTimestamp).toBeTypeOf('number');
		});

		it('should handle offline updates queue', async () => {
			const offlineUpdates = {
				timestamp1: { reps: 8, weight: 140 },
				timestamp2: { reps: 9, weight: 140 }
			};

			const result = await t.mutation(api.watchSync.syncWatchState, {
				deviceId: 'test-watch-001',
				connectionStatus: 'syncing',
				pendingUpdates: offlineUpdates
			});

			expect(result.pendingCount).toBeGreaterThanOrEqual(0);
		});

		it('should require valid device ID', async () => {
			await expect(
				t.mutation(api.watchSync.syncWatchState, {
					deviceId: '',
					connectionStatus: 'connected',
					pendingUpdates: {}
				})
			).rejects.toThrow('INVALID_DEVICE_ID');
		});
	});
});
