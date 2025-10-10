/**
 * Strain Data Convex Functions
 * 
 * Purpose: Server-side functions for workout strain tracking
 * Features:
 * - Real-time strain data updates
 * - Active session management
 * - Strain history tracking
 * - Performance monitoring
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import {
  validateStrainValue,
  validateTimestamp,
  validateSessionId,
  validateStrainUpdateInterval,
  DEFAULT_STRAIN_DATA,
  getStrainCategory,
  generateSessionId,
  calculateSmoothedStrain,
  StrainDataValidationError,
  ActiveSessionError,
  SessionNotFoundError,
} from "../models/strainData";

/**
 * Get current strain data for active workout session
 * 
 * @param userId - User ID
 * @returns Current strain data or null if no active session
 */
export const getCurrentStrain = query({
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

      // Get active strain data
      const activeStrain = await ctx.db
        .query("workoutStrainData")
        .withIndex("by_user_active", (q) => q.eq("userId", userId).eq("isActive", true))
        .first();

      if (!activeStrain) {
        return null; // No active workout session
      }

      // Check if the session is still recent (within 10 minutes)
      const now = Date.now();
      const sessionAge = now - activeStrain.timestamp;
      const maxSessionAge = 10 * 60 * 1000; // 10 minutes

      if (sessionAge > maxSessionAge) {
        // Session is too old - mark as inactive
        await ctx.db.patch(activeStrain._id, { isActive: false });
        return null;
      }

      // Calculate strain category
      const category = getStrainCategory(activeStrain.currentStrain);
      
      return {
        ...activeStrain,
        category,
        sessionAge,
        isRecent: sessionAge <= 5 * 60 * 1000, // within 5 minutes
      };
    } catch (error) {
      console.error("Error getting current strain:", error);
      throw new Error(`Failed to get current strain: ${error.message}`);
    }
  },
});

/**
 * Update strain data for current workout session
 * 
 * @param userId - User ID
 * @param currentStrain - Current strain percentage (0-120)
 * @param sessionId - Workout session ID (optional, will create new session if not provided)
 * @returns Updated strain data
 */
export const updateCurrentStrain = mutation({
  args: {
    userId: v.id("users"),
    currentStrain: v.number(),
    sessionId: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { userId, currentStrain, sessionId, isActive = true } = args;
    
    try {
      // Validate inputs
      if (!validateStrainValue(currentStrain)) {
        throw new StrainDataValidationError(
          "currentStrain",
          currentStrain,
          "Must be between 0 and 120"
        );
      }

      if (sessionId && !validateSessionId(sessionId)) {
        throw new StrainDataValidationError(
          "sessionId",
          sessionId,
          "Must be a valid session identifier"
        );
      }

      // Check if user exists
      const user = await ctx.db.get(userId);
      if (!user) {
        throw new Error(`User not found: ${userId}`);
      }

      const now = Date.now();

      if (sessionId) {
        // Update existing session
        const existingStrain = await ctx.db
          .query("workoutStrainData")
          .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
          .first();

        if (!existingStrain) {
          throw new SessionNotFoundError(sessionId);
        }

        // Validate time interval if updating existing session
        if (!validateStrainUpdateInterval(existingStrain.timestamp, now)) {
          throw new StrainDataValidationError(
            "timestamp",
            now,
            "Update interval too large (max 5 minutes between updates)"
          );
        }

        // Get recent strain history for smoothing
        const recentStrains = await ctx.db
          .query("workoutStrainData")
          .withIndex("by_user", (q) => q.eq("userId", userId))
          .filter((q) => q.gte(q.field("timestamp"), now - 5 * 60 * 1000)) // Last 5 minutes
          .take(5);

        const historicalValues = recentStrains.map(s => s.currentStrain);
        const smoothedStrain = calculateSmoothedStrain(currentStrain, historicalValues);

        // Update strain data
        await ctx.db.patch(existingStrain._id, {
          currentStrain: smoothedStrain,
          timestamp: now,
          isActive,
        });

        const updated = await ctx.db.get(existingStrain._id);
        return {
          ...updated,
          category: getStrainCategory(smoothedStrain),
          wasSmoothed: smoothedStrain !== currentStrain,
          originalStrain: currentStrain,
        };
      } else {
        // Create new session
        
        // Check if user already has an active session
        if (isActive) {
          const existingActiveSession = await ctx.db
            .query("workoutStrainData")
            .withIndex("by_user_active", (q) => q.eq("userId", userId).eq("isActive", true))
            .first();

          if (existingActiveSession) {
            throw new ActiveSessionError(userId, existingActiveSession.sessionId);
          }
        }

        // Generate new session ID
        const newSessionId = sessionId || generateSessionId();

        // Create new strain data entry
        const newStrainData = {
          userId,
          sessionId: newSessionId,
          currentStrain,
          timestamp: now,
          isActive,
        };

        const strainId = await ctx.db.insert("workoutStrainData", newStrainData);
        const created = await ctx.db.get(strainId);
        
        return {
          ...created,
          category: getStrainCategory(currentStrain),
          wasSmoothed: false,
          originalStrain: currentStrain,
        };
      }
    } catch (error) {
      console.error("Error updating strain data:", error);
      
      if (error instanceof StrainDataValidationError ||
          error instanceof ActiveSessionError ||
          error instanceof SessionNotFoundError) {
        throw error;
      }
      
      throw new Error(`Failed to update strain data: ${error.message}`);
    }
  },
});

/**
 * End current workout session
 * 
 * @param userId - User ID
 * @param sessionId - Session ID to end (optional, will end any active session if not provided)
 * @returns Session end result
 */
export const endWorkoutSession = mutation({
  args: {
    userId: v.id("users"),
    sessionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId, sessionId } = args;
    
    try {
      // Check if user exists
      const user = await ctx.db.get(userId);
      if (!user) {
        throw new Error(`User not found: ${userId}`);
      }

      let sessionToEnd;

      if (sessionId) {
        // End specific session
        sessionToEnd = await ctx.db
          .query("workoutStrainData")
          .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
          .first();

        if (!sessionToEnd) {
          throw new SessionNotFoundError(sessionId);
        }

        if (sessionToEnd.userId !== userId) {
          throw new Error(`Session ${sessionId} does not belong to user ${userId}`);
        }
      } else {
        // End any active session for user
        sessionToEnd = await ctx.db
          .query("workoutStrainData")
          .withIndex("by_user_active", (q) => q.eq("userId", userId).eq("isActive", true))
          .first();

        if (!sessionToEnd) {
          return { success: true, endedSessionId: null, message: "No active session to end" };
        }
      }

      // Mark session as inactive
      await ctx.db.patch(sessionToEnd._id, { isActive: false });

      return {
        success: true,
        endedSessionId: sessionToEnd.sessionId,
        sessionDuration: Date.now() - sessionToEnd.timestamp,
        finalStrain: sessionToEnd.currentStrain,
      };
    } catch (error) {
      console.error("Error ending workout session:", error);
      
      if (error instanceof SessionNotFoundError) {
        throw error;
      }
      
      throw new Error(`Failed to end workout session: ${error.message}`);
    }
  },
});

/**
 * Get strain history for user
 * 
 * @param userId - User ID
 * @param timeRangeMs - Time range in milliseconds (default: 24 hours)
 * @param limit - Maximum number of records (default: 100)
 * @returns Array of strain data entries
 */
export const getStrainHistory = query({
  args: {
    userId: v.id("users"),
    timeRangeMs: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { userId, timeRangeMs = 24 * 60 * 60 * 1000, limit = 100 } = args;
    
    try {
      // Check if user exists
      const user = await ctx.db.get(userId);
      if (!user) {
        throw new Error(`User not found: ${userId}`);
      }

      const cutoffTime = Date.now() - timeRangeMs;

      // Get strain history within time range
      const strainHistory = await ctx.db
        .query("workoutStrainData")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .filter((q) => q.gte(q.field("timestamp"), cutoffTime))
        .order("desc")
        .take(Math.min(limit, 1000)); // Cap at 1000 for performance

      // Add computed fields
      const enrichedHistory = strainHistory.map(strain => ({
        ...strain,
        category: getStrainCategory(strain.currentStrain),
        age: Date.now() - strain.timestamp,
        isRecent: (Date.now() - strain.timestamp) <= 5 * 60 * 1000,
      }));

      return enrichedHistory;
    } catch (error) {
      console.error("Error getting strain history:", error);
      throw new Error(`Failed to get strain history: ${error.message}`);
    }
  },
});

/**
 * Get strain statistics for user
 * 
 * @param userId - User ID
 * @param timeRangeMs - Time range in milliseconds (default: 7 days)
 * @returns Strain statistics
 */
export const getStrainStatistics = query({
  args: {
    userId: v.id("users"),
    timeRangeMs: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { userId, timeRangeMs = 7 * 24 * 60 * 60 * 1000 } = args;
    
    try {
      // Check if user exists
      const user = await ctx.db.get(userId);
      if (!user) {
        throw new Error(`User not found: ${userId}`);
      }

      const cutoffTime = Date.now() - timeRangeMs;

      // Get strain data within time range
      const strainData = await ctx.db
        .query("workoutStrainData")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .filter((q) => q.gte(q.field("timestamp"), cutoffTime))
        .collect();

      if (strainData.length === 0) {
        return {
          totalSessions: 0,
          averageStrain: 0,
          maxStrain: 0,
          minStrain: 0,
          activeSessions: 0,
          timeRange: timeRangeMs,
          categoryDistribution: {},
        };
      }

      // Calculate statistics
      const strainValues = strainData.map(s => s.currentStrain);
      const averageStrain = strainValues.reduce((sum, strain) => sum + strain, 0) / strainValues.length;
      const maxStrain = Math.max(...strainValues);
      const minStrain = Math.min(...strainValues);
      const activeSessions = strainData.filter(s => s.isActive).length;

      // Calculate category distribution
      const categoryDistribution = {};
      strainData.forEach(strain => {
        const category = getStrainCategory(strain.currentStrain);
        categoryDistribution[category] = (categoryDistribution[category] || 0) + 1;
      });

      // Get unique sessions
      const uniqueSessions = new Set(strainData.map(s => s.sessionId));

      return {
        totalSessions: uniqueSessions.size,
        averageStrain: Math.round(averageStrain * 10) / 10,
        maxStrain,
        minStrain,
        activeSessions,
        timeRange: timeRangeMs,
        categoryDistribution,
        dataPoints: strainData.length,
      };
    } catch (error) {
      console.error("Error getting strain statistics:", error);
      throw new Error(`Failed to get strain statistics: ${error.message}`);
    }
  },
});

/**
 * Clean up old strain data (utility function)
 * 
 * @param retentionDays - Number of days to keep data (default: 30)
 * @returns Cleanup result
 */
export const cleanupOldStrainData = mutation({
  args: {
    retentionDays: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { retentionDays = 30 } = args;
    
    try {
      const cutoffTime = Date.now() - (retentionDays * 24 * 60 * 60 * 1000);

      // Find old strain data
      const oldStrainData = await ctx.db
        .query("workoutStrainData")
        .withIndex("by_timestamp", (q) => q.lt("timestamp", cutoffTime))
        .collect();

      // Delete old entries
      let deletedCount = 0;
      for (const strain of oldStrainData) {
        // Don't delete active sessions regardless of age
        if (!strain.isActive) {
          await ctx.db.delete(strain._id);
          deletedCount++;
        }
      }

      return {
        success: true,
        deletedCount,
        retentionDays,
        cutoffTime,
      };
    } catch (error) {
      console.error("Error cleaning up strain data:", error);
      throw new Error(`Failed to cleanup strain data: ${error.message}`);
    }
  },
});