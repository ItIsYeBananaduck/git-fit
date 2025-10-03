/**
 * Watch Sync Convex Functions
 * 
 * Purpose: Server-side functions for smartwatch synchronization
 * Features:
 * - Sync state management
 * - Offline operation queue
 * - Conflict resolution
 * - Data consistency validation
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import {
  validateSyncState,
  validateSyncOperation,
  validateConflictResolution,
  DEFAULT_SYNC_STATE,
  SYNC_OPERATION_TYPES,
  SYNC_CONFLICT_STRATEGIES,
  SyncStateError,
  SyncOperationError,
  ConflictResolutionError,
  OfflineQueueFullError,
  createSyncOperation,
  calculateSyncPriority,
  shouldAttemptSync,
  resolveSyncConflict,
  generateSyncChecksum,
} from "../models/watchSync";

/**
 * Get current sync state for user's watch
 * 
 * @param userId - User ID
 * @returns Current sync state
 */
export const getSyncState = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const { userId } = args;
    
    try {
      // Check if user exists
      const user = await ctx.db.get(userId);
      if (!user) {
        throw new Error(`User not found: ${userId}`);
      }

      // Get current sync state
      const syncState = await ctx.db
        .query("watchSyncState")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .first();

      if (!syncState) {
        // Create default sync state
        const defaultState = {
          userId,
          ...DEFAULT_SYNC_STATE,
          lastSyncAttempt: Date.now(),
          lastSuccessfulSync: Date.now(),
        };

        const syncStateId = await ctx.db.insert("watchSyncState", defaultState);
        const created = await ctx.db.get(syncStateId);
        
        return {
          ...created,
          timeSinceLastSync: 0,
          syncHealth: "unknown",
          needsSync: false,
        };
      }

      // Calculate derived fields
      const now = Date.now();
      const timeSinceLastSync = now - syncState.lastSuccessfulSync;
      const timeSinceLastAttempt = now - syncState.lastSyncAttempt;
      
      // Determine sync health
      let syncHealth = "good";
      if (timeSinceLastSync > 24 * 60 * 60 * 1000) { // 24 hours
        syncHealth = "poor";
      } else if (timeSinceLastSync > 6 * 60 * 60 * 1000) { // 6 hours
        syncHealth = "warning";
      }

      // Check if sync is needed
      const needsSync = syncState.pendingOperations > 0 || 
                       timeSinceLastSync > 30 * 60 * 1000; // 30 minutes

      return {
        ...syncState,
        timeSinceLastSync,
        timeSinceLastAttempt,
        syncHealth,
        needsSync,
        canAttemptSync: shouldAttemptSync(syncState.lastSyncAttempt, syncState.failureCount),
      };
    } catch (error) {
      console.error("Error getting sync state:", error);
      throw new Error(`Failed to get sync state: ${error.message}`);
    }
  },
});

/**
 * Update sync state
 * 
 * @param userId - User ID
 * @param updates - Sync state updates
 * @returns Updated sync state
 */
export const updateSyncState = mutation({
  args: {
    userId: v.id("users"),
    isOnline: v.optional(v.boolean()),
    lastSyncAttempt: v.optional(v.number()),
    lastSuccessfulSync: v.optional(v.number()),
    pendingOperations: v.optional(v.number()),
    failureCount: v.optional(v.number()),
    lastError: v.optional(v.string()),
    syncVersion: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { 
      userId, 
      isOnline,
      lastSyncAttempt,
      lastSuccessfulSync,
      pendingOperations,
      failureCount,
      lastError,
      syncVersion,
    } = args;
    
    try {
      // Check if user exists
      const user = await ctx.db.get(userId);
      if (!user) {
        throw new Error(`User not found: ${userId}`);
      }

      // Get current sync state
      let syncState = await ctx.db
        .query("watchSyncState")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .first();

      if (!syncState) {
        // Create new sync state
        const newState = {
          userId,
          ...DEFAULT_SYNC_STATE,
          isOnline: isOnline ?? DEFAULT_SYNC_STATE.isOnline,
          lastSyncAttempt: lastSyncAttempt ?? Date.now(),
          lastSuccessfulSync: lastSuccessfulSync ?? Date.now(),
          pendingOperations: pendingOperations ?? DEFAULT_SYNC_STATE.pendingOperations,
          failureCount: failureCount ?? DEFAULT_SYNC_STATE.failureCount,
          lastError: lastError ?? DEFAULT_SYNC_STATE.lastError,
          syncVersion: syncVersion ?? DEFAULT_SYNC_STATE.syncVersion,
        };

        const syncStateId = await ctx.db.insert("watchSyncState", newState);
        syncState = await ctx.db.get(syncStateId);
      } else {
        // Update existing sync state
        const updates = {};
        
        if (isOnline !== undefined) updates.isOnline = isOnline;
        if (lastSyncAttempt !== undefined) updates.lastSyncAttempt = lastSyncAttempt;
        if (lastSuccessfulSync !== undefined) {
          updates.lastSuccessfulSync = lastSuccessfulSync;
          // Reset failure count on successful sync
          updates.failureCount = 0;
          updates.lastError = null;
        }
        if (pendingOperations !== undefined) updates.pendingOperations = pendingOperations;
        if (failureCount !== undefined) updates.failureCount = failureCount;
        if (lastError !== undefined) updates.lastError = lastError;
        if (syncVersion !== undefined) updates.syncVersion = syncVersion;

        await ctx.db.patch(syncState._id, updates);
        syncState = await ctx.db.get(syncState._id);
      }

      // Calculate health metrics
      const now = Date.now();
      const timeSinceLastSync = now - syncState.lastSuccessfulSync;
      
      let syncHealth = "good";
      if (timeSinceLastSync > 24 * 60 * 60 * 1000) {
        syncHealth = "poor";
      } else if (timeSinceLastSync > 6 * 60 * 60 * 1000) {
        syncHealth = "warning";
      }

      return {
        ...syncState,
        timeSinceLastSync,
        syncHealth,
        canAttemptSync: shouldAttemptSync(syncState.lastSyncAttempt, syncState.failureCount),
      };
    } catch (error) {
      console.error("Error updating sync state:", error);
      throw new Error(`Failed to update sync state: ${error.message}`);
    }
  },
});

/**
 * Queue operation for offline sync
 * 
 * @param userId - User ID
 * @param operation - Sync operation to queue
 * @returns Queue operation result
 */
export const queueSyncOperation = mutation({
  args: {
    userId: v.id("users"),
    operation: v.object({
      type: v.string(),
      data: v.any(),
      targetTable: v.string(),
      targetId: v.optional(v.string()),
    }),
    priority: v.optional(v.string()),
    retryCount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { userId, operation, priority = "normal", retryCount = 0 } = args;
    
    try {
      // Validate operation
      if (!SYNC_OPERATION_TYPES.includes(operation.type)) {
        throw new SyncOperationError(
          operation.type,
          `Invalid operation type. Must be one of: ${SYNC_OPERATION_TYPES.join(", ")}`
        );
      }

      if (!validateSyncOperation(operation)) {
        throw new SyncOperationError(
          operation.type,
          "Operation validation failed"
        );
      }

      // Check if user exists
      const user = await ctx.db.get(userId);
      if (!user) {
        throw new Error(`User not found: ${userId}`);
      }

      // Check queue size
      const queueSize = await ctx.db
        .query("watchSyncQueue")
        .withIndex("by_user_pending", (q) => 
          q.eq("userId", userId)
           .eq("status", "pending")
        )
        .collect()
        .then(ops => ops.length);

      if (queueSize >= 100) { // Max queue size
        throw new OfflineQueueFullError(userId, queueSize);
      }

      // Create sync operation
      const operationId = `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const syncOp = createSyncOperation(operation.type, operation.data, {
        id: operationId,
        priority,
        retryCount,
        targetTable: operation.targetTable,
        targetId: operation.targetId,
      });

      // Store in queue
      const queueId = await ctx.db.insert("watchSyncQueue", {
        userId,
        operationId,
        type: operation.type,
        data: operation.data,
        targetTable: operation.targetTable,
        targetId: operation.targetId,
        priority,
        status: "pending",
        timestamp: Date.now(),
        retryCount,
        checksum: generateSyncChecksum(operation.data),
        metadata: {
          queuedAt: Date.now(),
          source: "offline_queue",
        },
      });

      // Update pending operations count
      const syncState = await ctx.db
        .query("watchSyncState")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .first();

      if (syncState) {
        await ctx.db.patch(syncState._id, {
          pendingOperations: syncState.pendingOperations + 1,
        });
      }

      const queuedOperation = await ctx.db.get(queueId);
      
      return {
        success: true,
        operationId,
        operation: queuedOperation,
        queuePosition: queueSize + 1,
        priorityScore: calculateSyncPriority(priority),
      };
    } catch (error) {
      console.error("Error queueing sync operation:", error);
      
      if (error instanceof SyncOperationError ||
          error instanceof OfflineQueueFullError) {
        throw error;
      }
      
      throw new Error(`Failed to queue sync operation: ${error.message}`);
    }
  },
});

/**
 * Get pending sync operations for user
 * 
 * @param userId - User ID
 * @param limit - Maximum operations to return
 * @returns Array of pending operations
 */
export const getPendingSyncOperations = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { userId, limit = 20 } = args;
    
    try {
      // Check if user exists
      const user = await ctx.db.get(userId);
      if (!user) {
        throw new Error(`User not found: ${userId}`);
      }

      // Get pending operations
      const pendingOps = await ctx.db
        .query("watchSyncQueue")
        .withIndex("by_user_pending", (q) => 
          q.eq("userId", userId)
           .eq("status", "pending")
        )
        .order("desc")
        .take(Math.min(limit, 100));

      // Add computed fields and sort by priority
      const enrichedOps = pendingOps.map(op => ({
        ...op,
        age: Date.now() - op.timestamp,
        priorityScore: calculateSyncPriority(op.priority),
        isStale: (Date.now() - op.timestamp) > 24 * 60 * 60 * 1000, // 24 hours
      }));

      // Sort by priority and age
      enrichedOps.sort((a, b) => {
        if (a.priorityScore !== b.priorityScore) {
          return a.priorityScore - b.priorityScore; // Lower score = higher priority
        }
        return a.timestamp - b.timestamp; // Older operations first
      });

      return enrichedOps;
    } catch (error) {
      console.error("Error getting pending sync operations:", error);
      throw new Error(`Failed to get pending sync operations: ${error.message}`);
    }
  },
});

/**
 * Process sync operation (mark as completed, failed, etc.)
 * 
 * @param userId - User ID
 * @param operationId - Operation ID to process
 * @param status - New status
 * @param result - Processing result data
 * @returns Processing result
 */
export const processSyncOperation = mutation({
  args: {
    userId: v.id("users"),
    operationId: v.string(),
    status: v.string(),
    result: v.optional(v.any()),
    errorMessage: v.optional(v.string()),
    conflictData: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const { userId, operationId, status, result, errorMessage, conflictData } = args;
    
    try {
      // Validate status
      const validStatuses = ["pending", "processing", "completed", "failed", "conflict"];
      if (!validStatuses.includes(status)) {
        throw new SyncOperationError(
          operationId,
          `Invalid status: ${status}`
        );
      }

      // Find the operation
      const operation = await ctx.db
        .query("watchSyncQueue")
        .withIndex("by_operation_id", (q) => q.eq("operationId", operationId))
        .first();

      if (!operation) {
        throw new SyncOperationError(operationId, "Operation not found");
      }

      if (operation.userId !== userId) {
        throw new SyncOperationError(
          operationId,
          `Operation does not belong to user ${userId}`
        );
      }

      // Handle conflict resolution
      if (status === "conflict" && conflictData) {
        try {
          const resolution = resolveSyncConflict(
            operation.data,
            conflictData,
            "server_wins" // Default strategy
          );
          
          // Update operation with resolved data
          await ctx.db.patch(operation._id, {
            status: "completed",
            result: resolution,
            processedAt: Date.now(),
            metadata: {
              ...operation.metadata,
              conflictResolved: true,
              resolutionStrategy: "server_wins",
            },
          });
        } catch (conflictError) {
          throw new ConflictResolutionError(
            operationId,
            `Failed to resolve conflict: ${conflictError.message}`
          );
        }
      } else {
        // Normal status update
        const updateData = {
          status,
          processedAt: Date.now(),
        };

        if (result !== undefined) {
          updateData.result = result;
        }

        if (errorMessage) {
          updateData.errorMessage = errorMessage;
        }

        await ctx.db.patch(operation._id, updateData);
      }

      // Update sync state
      const syncState = await ctx.db
        .query("watchSyncState")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .first();

      if (syncState && (status === "completed" || status === "failed")) {
        const pendingDelta = status === "completed" ? -1 : 0;
        const updates = {
          pendingOperations: Math.max(0, syncState.pendingOperations + pendingDelta),
        };

        if (status === "completed") {
          updates.lastSuccessfulSync = Date.now();
          updates.failureCount = 0;
          updates.lastError = null;
        } else if (status === "failed") {
          updates.failureCount = syncState.failureCount + 1;
          updates.lastError = errorMessage || "Unknown sync error";
        }

        await ctx.db.patch(syncState._id, updates);
      }

      const updatedOperation = await ctx.db.get(operation._id);
      
      return {
        success: true,
        operationId,
        previousStatus: operation.status,
        currentStatus: status,
        operation: updatedOperation,
      };
    } catch (error) {
      console.error("Error processing sync operation:", error);
      
      if (error instanceof SyncOperationError ||
          error instanceof ConflictResolutionError) {
        throw error;
      }
      
      throw new Error(`Failed to process sync operation: ${error.message}`);
    }
  },
});

/**
 * Clear completed sync operations
 * 
 * @param userId - User ID
 * @param olderThanMs - Clear operations older than this (default: 7 days)
 * @returns Cleanup result
 */
export const clearCompletedOperations = mutation({
  args: {
    userId: v.id("users"),
    olderThanMs: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { userId, olderThanMs = 7 * 24 * 60 * 60 * 1000 } = args;
    
    try {
      // Check if user exists
      const user = await ctx.db.get(userId);
      if (!user) {
        throw new Error(`User not found: ${userId}`);
      }

      const cutoffTime = Date.now() - olderThanMs;

      // Find completed operations older than cutoff
      const completedOps = await ctx.db
        .query("watchSyncQueue")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .filter((q) => 
          q.and(
            q.or(
              q.eq(q.field("status"), "completed"),
              q.eq(q.field("status"), "failed")
            ),
            q.lt(q.field("timestamp"), cutoffTime)
          )
        )
        .collect();

      // Delete completed operations
      let deletedCount = 0;
      for (const op of completedOps) {
        await ctx.db.delete(op._id);
        deletedCount++;
      }

      return {
        success: true,
        deletedCount,
        olderThanMs,
        cutoffTime,
      };
    } catch (error) {
      console.error("Error clearing completed operations:", error);
      throw new Error(`Failed to clear completed operations: ${error.message}`);
    }
  },
});

/**
 * Force sync attempt (manual sync trigger)
 * 
 * @param userId - User ID
 * @returns Sync attempt result
 */
export const forceSyncAttempt = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const { userId } = args;
    
    try {
      // Check if user exists
      const user = await ctx.db.get(userId);
      if (!user) {
        throw new Error(`User not found: ${userId}`);
      }

      // Get sync state
      const syncState = await ctx.db
        .query("watchSyncState")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .first();

      if (!syncState) {
        throw new SyncStateError(userId, "No sync state found");
      }

      // Check if sync can be attempted
      if (!shouldAttemptSync(syncState.lastSyncAttempt, syncState.failureCount)) {
        const nextAttemptTime = syncState.lastSyncAttempt + (Math.pow(2, syncState.failureCount) * 60 * 1000);
        const waitTime = nextAttemptTime - Date.now();
        
        return {
          success: false,
          reason: "Rate limited",
          waitTimeMs: Math.max(0, waitTime),
          failureCount: syncState.failureCount,
        };
      }

      // Update sync attempt timestamp
      await ctx.db.patch(syncState._id, {
        lastSyncAttempt: Date.now(),
      });

      // Get pending operations count
      const pendingCount = await ctx.db
        .query("watchSyncQueue")
        .withIndex("by_user_pending", (q) => 
          q.eq("userId", userId)
           .eq("status", "pending")
        )
        .collect()
        .then(ops => ops.length);

      return {
        success: true,
        syncTriggered: true,
        pendingOperations: pendingCount,
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error("Error forcing sync attempt:", error);
      
      if (error instanceof SyncStateError) {
        throw error;
      }
      
      throw new Error(`Failed to force sync attempt: ${error.message}`);
    }
  },
});