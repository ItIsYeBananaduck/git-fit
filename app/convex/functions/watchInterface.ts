/**
 * Watch Interface Convex Functions
 * 
 * Purpose: Server-side functions for smartwatch integration
 * Features:
 * - Exercise command transmission
 * - Sync queue management
 * - Performance monitoring
 * - Device status tracking
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import {
  validateExerciseCommand,
  validateCommandParams,
  validateSyncQueue,
  validatePerformanceMetrics,
  DEFAULT_COMMAND_PARAMS,
  DEFAULT_WATCH_PERFORMANCE,
  EXERCISE_COMMAND_TYPES,
  ExerciseCommandError,
  InvalidCommandParamsError,
  SyncQueueFullError,
  WatchConnectionError,
  createExerciseCommand,
  calculateCommandPriority,
  shouldRetryCommand,
  getCommandTimeout,
} from "../models/watchInterface";

/**
 * Send exercise command to smartwatch
 * 
 * @param userId - User ID
 * @param commandType - Type of exercise command
 * @param params - Command parameters
 * @returns Command execution result
 */
export const sendExerciseCommand = mutation({
  args: {
    userId: v.id("users"),
    commandType: v.string(),
    params: v.optional(v.object({
      intensity: v.optional(v.number()),
      duration: v.optional(v.number()),
      exerciseType: v.optional(v.string()),
      targetHeartRate: v.optional(v.number()),
      recoveryTime: v.optional(v.number()),
      customData: v.optional(v.any()),
    })),
    priority: v.optional(v.string()),
    retryCount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { 
      userId, 
      commandType, 
      params = DEFAULT_COMMAND_PARAMS,
      priority = "normal",
      retryCount = 0 
    } = args;
    
    try {
      // Validate inputs
      if (!EXERCISE_COMMAND_TYPES.includes(commandType)) {
        throw new ExerciseCommandError(
          commandType,
          `Invalid command type. Must be one of: ${EXERCISE_COMMAND_TYPES.join(", ")}`
        );
      }

      if (!validateCommandParams(params)) {
        throw new InvalidCommandParamsError(params, "Command parameters validation failed");
      }

      // Check if user exists
      const user = await ctx.db.get(userId);
      if (!user) {
        throw new Error(`User not found: ${userId}`);
      }

      // Check current sync queue size
      const queueSize = await ctx.db
        .query("watchInterface")
        .withIndex("by_user_pending", (q) => 
          q.eq("userId", userId)
           .eq("status", "pending")
        )
        .collect()
        .then(commands => commands.length);

      if (queueSize >= 10) { // Max queue size
        throw new SyncQueueFullError(userId, queueSize);
      }

      // Create exercise command
      const commandId = `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const command = createExerciseCommand(commandType, params, {
        id: commandId,
        priority,
        retryCount,
      });

      // Store command in database
      const watchInterfaceId = await ctx.db.insert("watchInterface", {
        userId,
        commandId,
        commandType,
        params,
        priority,
        status: "pending",
        timestamp: Date.now(),
        retryCount,
        timeoutMs: getCommandTimeout(commandType),
        metadata: {
          deviceType: "smartwatch",
          version: "1.0",
          source: "convex_api",
        },
      });

      // Get the created record
      const createdCommand = await ctx.db.get(watchInterfaceId);

      return {
        success: true,
        commandId,
        command: createdCommand,
        queuePosition: queueSize + 1,
        estimatedDeliveryMs: calculateCommandPriority(priority) * 1000,
      };
    } catch (error) {
      console.error("Error sending exercise command:", error);
      
      if (error instanceof ExerciseCommandError ||
          error instanceof InvalidCommandParamsError ||
          error instanceof SyncQueueFullError) {
        throw error;
      }
      
      throw new Error(`Failed to send exercise command: ${error.message}`);
    }
  },
});

/**
 * Get pending exercise commands for user's watch
 * 
 * @param userId - User ID
 * @param limit - Maximum number of commands to return
 * @returns Array of pending commands
 */
export const getPendingCommands = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { userId, limit = 10 } = args;
    
    try {
      // Check if user exists
      const user = await ctx.db.get(userId);
      if (!user) {
        throw new Error(`User not found: ${userId}`);
      }

      // Get pending commands
      const pendingCommands = await ctx.db
        .query("watchInterface")
        .withIndex("by_user_pending", (q) => 
          q.eq("userId", userId)
           .eq("status", "pending")
        )
        .order("desc") // Most recent first
        .take(Math.min(limit, 50)); // Cap at 50 for performance

      // Check for timed-out commands
      const now = Date.now();
      const commandsWithTimeout = pendingCommands.map(cmd => ({
        ...cmd,
        isTimedOut: (now - cmd.timestamp) > cmd.timeoutMs,
        age: now - cmd.timestamp,
        priorityScore: calculateCommandPriority(cmd.priority),
      }));

      // Sort by priority and timestamp
      commandsWithTimeout.sort((a, b) => {
        if (a.priorityScore !== b.priorityScore) {
          return a.priorityScore - b.priorityScore; // Lower score = higher priority
        }
        return a.timestamp - b.timestamp; // Older commands first
      });

      return commandsWithTimeout;
    } catch (error) {
      console.error("Error getting pending commands:", error);
      throw new Error(`Failed to get pending commands: ${error.message}`);
    }
  },
});

/**
 * Update command status (e.g., mark as delivered, failed, etc.)
 * 
 * @param userId - User ID
 * @param commandId - Command ID to update
 * @param status - New status
 * @param errorMessage - Error message if status is "failed"
 * @returns Update result
 */
export const updateCommandStatus = mutation({
  args: {
    userId: v.id("users"),
    commandId: v.string(),
    status: v.string(),
    errorMessage: v.optional(v.string()),
    deliveryTime: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { userId, commandId, status, errorMessage, deliveryTime } = args;
    
    try {
      // Validate status
      const validStatuses = ["pending", "delivered", "failed", "timeout", "cancelled"];
      if (!validStatuses.includes(status)) {
        throw new Error(`Invalid status: ${status}. Must be one of: ${validStatuses.join(", ")}`);
      }

      // Find the command
      const command = await ctx.db
        .query("watchInterface")
        .withIndex("by_command_id", (q) => q.eq("commandId", commandId))
        .first();

      if (!command) {
        throw new Error(`Command not found: ${commandId}`);
      }

      if (command.userId !== userId) {
        throw new Error(`Command ${commandId} does not belong to user ${userId}`);
      }

      // Update command status
      const updateData = {
        status,
        lastUpdated: Date.now(),
      };

      if (errorMessage) {
        updateData.errorMessage = errorMessage;
      }

      if (deliveryTime) {
        updateData.deliveryTime = deliveryTime;
        updateData.deliveryDuration = deliveryTime - command.timestamp;
      }

      // Handle retry logic for failed commands
      if (status === "failed" && shouldRetryCommand(command.commandType, command.retryCount)) {
        updateData.retryCount = command.retryCount + 1;
        updateData.status = "pending"; // Reset to pending for retry
        updateData.timestamp = Date.now(); // Reset timestamp for timeout calculation
      }

      await ctx.db.patch(command._id, updateData);

      const updatedCommand = await ctx.db.get(command._id);
      
      return {
        success: true,
        command: updatedCommand,
        wasRetried: status === "failed" && updatedCommand.status === "pending",
      };
    } catch (error) {
      console.error("Error updating command status:", error);
      throw new Error(`Failed to update command status: ${error.message}`);
    }
  },
});

/**
 * Get sync queue status for user
 * 
 * @param userId - User ID
 * @returns Sync queue statistics
 */
export const getSyncQueueStatus = query({
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

      // Get all commands for user within last 24 hours
      const last24Hours = Date.now() - (24 * 60 * 60 * 1000);
      const recentCommands = await ctx.db
        .query("watchInterface")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .filter((q) => q.gte(q.field("timestamp"), last24Hours))
        .collect();

      // Calculate statistics
      const pending = recentCommands.filter(cmd => cmd.status === "pending").length;
      const delivered = recentCommands.filter(cmd => cmd.status === "delivered").length;
      const failed = recentCommands.filter(cmd => cmd.status === "failed").length;
      const timedOut = recentCommands.filter(cmd => cmd.status === "timeout").length;
      const cancelled = recentCommands.filter(cmd => cmd.status === "cancelled").length;

      // Calculate success rate
      const total = recentCommands.length;
      const successRate = total > 0 ? (delivered / total) * 100 : 0;

      // Get oldest pending command
      const oldestPending = recentCommands
        .filter(cmd => cmd.status === "pending")
        .sort((a, b) => a.timestamp - b.timestamp)[0];

      // Check for connection issues
      const now = Date.now();
      const connectionIssues = recentCommands.some(cmd => 
        cmd.status === "pending" && (now - cmd.timestamp) > cmd.timeoutMs
      );

      return {
        queueSize: pending,
        totalCommands: total,
        statistics: {
          pending,
          delivered,
          failed,
          timedOut,
          cancelled,
        },
        successRate: Math.round(successRate * 10) / 10,
        oldestPendingAge: oldestPending ? now - oldestPending.timestamp : 0,
        hasConnectionIssues: connectionIssues,
        isHealthy: successRate >= 80 && pending <= 5,
      };
    } catch (error) {
      console.error("Error getting sync queue status:", error);
      throw new Error(`Failed to get sync queue status: ${error.message}`);
    }
  },
});

/**
 * Clear sync queue (cancel all pending commands)
 * 
 * @param userId - User ID
 * @param reason - Reason for clearing queue
 * @returns Clear operation result
 */
export const clearSyncQueue = mutation({
  args: {
    userId: v.id("users"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId, reason = "Manual clear" } = args;
    
    try {
      // Check if user exists
      const user = await ctx.db.get(userId);
      if (!user) {
        throw new Error(`User not found: ${userId}`);
      }

      // Get all pending commands
      const pendingCommands = await ctx.db
        .query("watchInterface")
        .withIndex("by_user_pending", (q) => 
          q.eq("userId", userId)
           .eq("status", "pending")
        )
        .collect();

      // Cancel all pending commands
      let cancelledCount = 0;
      for (const command of pendingCommands) {
        await ctx.db.patch(command._id, {
          status: "cancelled",
          errorMessage: reason,
          lastUpdated: Date.now(),
        });
        cancelledCount++;
      }

      return {
        success: true,
        cancelledCount,
        reason,
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error("Error clearing sync queue:", error);
      throw new Error(`Failed to clear sync queue: ${error.message}`);
    }
  },
});

/**
 * Get watch performance metrics
 * 
 * @param userId - User ID
 * @param timeRangeMs - Time range in milliseconds (default: 1 hour)
 * @returns Performance metrics
 */
export const getWatchPerformance = query({
  args: {
    userId: v.id("users"),
    timeRangeMs: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { userId, timeRangeMs = 60 * 60 * 1000 } = args;
    
    try {
      // Check if user exists
      const user = await ctx.db.get(userId);
      if (!user) {
        throw new Error(`User not found: ${userId}`);
      }

      const cutoffTime = Date.now() - timeRangeMs;

      // Get commands within time range
      const commands = await ctx.db
        .query("watchInterface")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .filter((q) => q.gte(q.field("timestamp"), cutoffTime))
        .collect();

      if (commands.length === 0) {
        return {
          ...DEFAULT_WATCH_PERFORMANCE,
          timeRange: timeRangeMs,
          sampleSize: 0,
        };
      }

      // Calculate metrics
      const deliveredCommands = commands.filter(cmd => cmd.status === "delivered" && cmd.deliveryDuration);
      const avgDeliveryTime = deliveredCommands.length > 0
        ? deliveredCommands.reduce((sum, cmd) => sum + cmd.deliveryDuration, 0) / deliveredCommands.length
        : 0;

      const successRate = (commands.filter(cmd => cmd.status === "delivered").length / commands.length) * 100;
      const errorRate = (commands.filter(cmd => cmd.status === "failed").length / commands.length) * 100;

      // Calculate connection quality
      const recentFailures = commands.filter(cmd => 
        cmd.status === "failed" || cmd.status === "timeout"
      ).length;
      const connectionQuality = Math.max(0, 100 - (recentFailures * 10));

      // Get battery level (mock implementation - would come from actual device)
      const batteryLevel = 85; // Mock value

      return {
        avgDeliveryTime: Math.round(avgDeliveryTime),
        successRate: Math.round(successRate * 10) / 10,
        errorRate: Math.round(errorRate * 10) / 10,
        connectionQuality: Math.round(connectionQuality),
        batteryLevel,
        timeRange: timeRangeMs,
        sampleSize: commands.length,
        lastUpdated: Date.now(),
      };
    } catch (error) {
      console.error("Error getting watch performance:", error);
      throw new Error(`Failed to get watch performance: ${error.message}`);
    }
  },
});

/**
 * Cleanup old watch interface data
 * 
 * @param retentionDays - Number of days to keep data (default: 7)
 * @returns Cleanup result
 */
export const cleanupOldWatchData = mutation({
  args: {
    retentionDays: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { retentionDays = 7 } = args;
    
    try {
      const cutoffTime = Date.now() - (retentionDays * 24 * 60 * 60 * 1000);

      // Find old commands (but keep pending ones regardless of age)
      const oldCommands = await ctx.db
        .query("watchInterface")
        .withIndex("by_timestamp", (q) => q.lt("timestamp", cutoffTime))
        .filter((q) => q.neq(q.field("status"), "pending"))
        .collect();

      // Delete old commands
      let deletedCount = 0;
      for (const command of oldCommands) {
        await ctx.db.delete(command._id);
        deletedCount++;
      }

      return {
        success: true,
        deletedCount,
        retentionDays,
        cutoffTime,
      };
    } catch (error) {
      console.error("Error cleaning up watch data:", error);
      throw new Error(`Failed to cleanup watch data: ${error.message}`);
    }
  },
});