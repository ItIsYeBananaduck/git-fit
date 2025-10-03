/**
 * WatchSyncState Model
 * 
 * Purpose: Track synchronization state between main app and watch interface
 * Features:
 * - Multi-device sync support (phone, watch, tablet)
 * - Offline-first architecture with conflict resolution
 * - Connection status tracking
 * - Exercise data synchronization
 */

import { v } from "convex/values";
import { defineTable } from "convex/server";

/**
 * WatchSyncState Schema Definition
 * 
 * Data Structure:
 * - userId: Foreign key to users table
 * - deviceId: Unique watch/device identifier (unique per user)
 * - lastSyncTimestamp: Last successful sync time
 * - pendingUpdates: Offline changes awaiting sync (JSON object)
 * - connectionStatus: Current connection state
 * - exerciseData: Current exercise state for watch interface
 */
export const watchSyncStateTable = defineTable({
  userId: v.id("users"),
  deviceId: v.string(), // Unique device identifier (per user)
  lastSyncTimestamp: v.number(), // Unix timestamp of last successful sync
  pendingUpdates: v.string(), // JSON string of pending offline changes
  connectionStatus: v.union(
    v.literal("connected"),
    v.literal("offline"),
    v.literal("syncing"),
    v.literal("connecting"),
    v.literal("error")
  ),
  exerciseData: v.string(), // JSON string of current exercise state
})
  .index("by_user", ["userId"])
  .index("by_user_device", ["userId", "deviceId"])
  .index("by_connection_status", ["connectionStatus"])
  .index("by_last_sync", ["lastSyncTimestamp"]);

/**
 * Validation Functions
 */

export function validateDeviceId(deviceId: string): boolean {
  // Device ID should be non-empty, reasonable length (UUID-like)
  return typeof deviceId === 'string' && 
         deviceId.length > 0 && 
         deviceId.length <= 100 &&
         /^[a-zA-Z0-9_-]+$/.test(deviceId);
}

export function validateTimestamp(timestamp: number): boolean {
  const now = Date.now();
  // Allow timestamps from past to current time (no future timestamps)
  return timestamp >= 0 && timestamp <= now;
}

export function validateConnectionStatus(status: string): boolean {
  const validStatuses = ['connected', 'offline', 'syncing', 'connecting', 'error'];
  return validStatuses.includes(status);
}

export function validateJsonString(jsonStr: string): boolean {
  try {
    JSON.parse(jsonStr);
    return true;
  } catch {
    return false;
  }
}

/**
 * Default Values
 */
export const DEFAULT_SYNC_STATE = {
  connectionStatus: 'offline' as const,
  pendingUpdates: '{}', // Empty JSON object
  exerciseData: '{}', // Empty exercise state
} as const;

/**
 * Type Definitions for Exercise Data
 */
export interface ExerciseState {
  exerciseId?: string;
  exerciseName?: string;
  currentSet?: number;
  totalSets?: number;
  currentReps?: number;
  targetReps?: number;
  weight?: number; // kg
  restTimeRemaining?: number; // seconds
  isResting?: boolean;
  workoutStartTime?: number; // Unix timestamp
  setStartTime?: number; // Unix timestamp
}

export interface PendingUpdate {
  type: 'exercise_complete' | 'set_complete' | 'weight_change' | 'reps_change' | 'rest_start' | 'rest_complete';
  data: Partial<ExerciseState>;
  timestamp: number;
  id: string; // Unique update ID
}

export interface PendingUpdatesCollection {
  updates: PendingUpdate[];
  lastUpdateId: string;
  totalUpdates: number;
}

/**
 * Business Logic Functions
 */

/**
 * Create new device sync state
 * @param userId - User ID
 * @param deviceId - Device identifier
 * @returns Initial sync state
 */
export function createInitialSyncState(userId: string, deviceId: string): {
  userId: string;
  deviceId: string;
  lastSyncTimestamp: number;
  pendingUpdates: string;
  connectionStatus: 'offline';
  exerciseData: string;
} {
  if (!validateDeviceId(deviceId)) {
    throw new Error(`Invalid device ID: ${deviceId}`);
  }

  return {
    userId,
    deviceId,
    lastSyncTimestamp: Date.now(),
    pendingUpdates: JSON.stringify({ updates: [], lastUpdateId: '', totalUpdates: 0 }),
    connectionStatus: 'offline',
    exerciseData: JSON.stringify({}),
  };
}

/**
 * Add pending update to sync queue
 * @param currentPendingUpdates - Current pending updates JSON string
 * @param newUpdate - New update to add
 * @returns Updated pending updates JSON string
 */
export function addPendingUpdate(
  currentPendingUpdates: string,
  newUpdate: Omit<PendingUpdate, 'id' | 'timestamp'>
): string {
  let pendingCollection: PendingUpdatesCollection;
  
  try {
    pendingCollection = JSON.parse(currentPendingUpdates);
  } catch {
    // Initialize if invalid JSON
    pendingCollection = { updates: [], lastUpdateId: '', totalUpdates: 0 };
  }

  const updateId = `update_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  const fullUpdate: PendingUpdate = {
    ...newUpdate,
    id: updateId,
    timestamp: Date.now(),
  };

  pendingCollection.updates.push(fullUpdate);
  pendingCollection.lastUpdateId = updateId;
  pendingCollection.totalUpdates++;

  // Keep only last 50 updates to prevent unlimited growth
  if (pendingCollection.updates.length > 50) {
    pendingCollection.updates = pendingCollection.updates.slice(-50);
  }

  return JSON.stringify(pendingCollection);
}

/**
 * Clear pending updates after successful sync
 * @param currentPendingUpdates - Current pending updates JSON string
 * @param syncedUpdateIds - IDs of updates that were successfully synced
 * @returns Updated pending updates JSON string
 */
export function clearSyncedUpdates(
  currentPendingUpdates: string,
  syncedUpdateIds: string[]
): string {
  let pendingCollection: PendingUpdatesCollection;
  
  try {
    pendingCollection = JSON.parse(currentPendingUpdates);
  } catch {
    return JSON.stringify({ updates: [], lastUpdateId: '', totalUpdates: 0 });
  }

  // Remove synced updates
  pendingCollection.updates = pendingCollection.updates.filter(
    update => !syncedUpdateIds.includes(update.id)
  );

  return JSON.stringify(pendingCollection);
}

/**
 * Resolve sync conflicts between local and remote exercise data
 * @param localExerciseData - Local device exercise state
 * @param remoteExerciseData - Remote/server exercise state
 * @returns Resolved exercise state
 */
export function resolveExerciseDataConflict(
  localExerciseData: ExerciseState,
  remoteExerciseData: ExerciseState
): ExerciseState {
  // Most recent activity wins
  const localTime = localExerciseData.setStartTime || localExerciseData.workoutStartTime || 0;
  const remoteTime = remoteExerciseData.setStartTime || remoteExerciseData.workoutStartTime || 0;

  if (localTime > remoteTime) {
    return localExerciseData;
  } else if (remoteTime > localTime) {
    return remoteExerciseData;
  } else {
    // Same timestamp: merge data, preferring higher set/rep counts
    return {
      ...remoteExerciseData,
      ...localExerciseData,
      currentSet: Math.max(localExerciseData.currentSet || 0, remoteExerciseData.currentSet || 0),
      currentReps: Math.max(localExerciseData.currentReps || 0, remoteExerciseData.currentReps || 0),
    };
  }
}

/**
 * Generate device ID for new devices
 * @param deviceType - Type of device (watch, phone, tablet)
 * @returns Unique device identifier
 */
export function generateDeviceId(deviceType: 'watch' | 'phone' | 'tablet' = 'watch'): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `${deviceType}_${timestamp}_${random}`;
}

/**
 * Check if sync is needed based on last sync time
 * @param lastSyncTimestamp - Last sync timestamp
 * @param maxSyncIntervalMs - Maximum time between syncs (default 30 seconds)
 * @returns Whether sync is needed
 */
export function isSyncNeeded(
  lastSyncTimestamp: number,
  maxSyncIntervalMs: number = 30 * 1000
): boolean {
  const now = Date.now();
  return (now - lastSyncTimestamp) > maxSyncIntervalMs;
}

/**
 * Type Definitions for Client Use
 */
export type WatchSyncState = {
  _id: string;
  userId: string;
  deviceId: string;
  lastSyncTimestamp: number;
  pendingUpdates: string;
  connectionStatus: 'connected' | 'offline' | 'syncing' | 'connecting' | 'error';
  exerciseData: string;
  _creationTime: number;
};

export type CreateSyncStateInput = {
  userId: string;
  deviceId: string;
  connectionStatus?: 'connected' | 'offline' | 'syncing' | 'connecting' | 'error';
};

export type UpdateSyncStateInput = {
  lastSyncTimestamp?: number;
  pendingUpdates?: string;
  connectionStatus?: 'connected' | 'offline' | 'syncing' | 'connecting' | 'error';
  exerciseData?: string;
};

/**
 * Error Types
 */
export class SyncStateValidationError extends Error {
  constructor(field: string, value: any, reason: string) {
    super(`Invalid ${field}: ${value}. ${reason}`);
    this.name = 'SyncStateValidationError';
  }
}

export class DeviceAlreadyExistsError extends Error {
  constructor(userId: string, deviceId: string) {
    super(`Device ${deviceId} already exists for user ${userId}`);
    this.name = 'DeviceAlreadyExistsError';
  }
}

export class SyncConflictError extends Error {
  constructor(message: string) {
    super(`Sync conflict: ${message}`);
    this.name = 'SyncConflictError';
  }
}

/**
 * Constants
 */
export const SYNC_INTERVALS = {
  BACKGROUND: 30 * 1000,    // 30 seconds for background sync
  ACTIVE_WORKOUT: 5 * 1000, // 5 seconds during active workout
  REAL_TIME: 1 * 1000,      // 1 second for real-time updates
} as const;

export const MAX_PENDING_UPDATES = 50;
export const CONNECTION_TIMEOUT_MS = 10 * 1000; // 10 seconds

/**
 * Utility Functions
 */

/**
 * Parse exercise data safely
 * @param exerciseDataJson - JSON string of exercise data
 * @returns Parsed exercise state or empty object
 */
export function parseExerciseData(exerciseDataJson: string): ExerciseState {
  try {
    return JSON.parse(exerciseDataJson) as ExerciseState;
  } catch {
    return {};
  }
}

/**
 * Parse pending updates safely
 * @param pendingUpdatesJson - JSON string of pending updates
 * @returns Parsed pending updates collection
 */
export function parsePendingUpdates(pendingUpdatesJson: string): PendingUpdatesCollection {
  try {
    return JSON.parse(pendingUpdatesJson) as PendingUpdatesCollection;
  } catch {
    return { updates: [], lastUpdateId: '', totalUpdates: 0 };
  }
}

/**
 * Get connection status display text
 * @param status - Connection status
 * @returns Human-readable status text
 */
export function getConnectionStatusDisplay(status: string): string {
  switch (status) {
    case 'connected':
      return 'Connected';
    case 'offline':
      return 'Offline';
    case 'syncing':
      return 'Syncing...';
    case 'connecting':
      return 'Connecting...';
    case 'error':
      return 'Connection Error';
    default:
      return 'Unknown';
  }
}