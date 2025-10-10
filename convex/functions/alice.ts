/**
 * Alice AI Convex Functions
 * 
 * Provides real-time state management and data synchronization for Alice AI companion
 */

import { v } from 'convex/values';
import { mutation, query } from '../_generated/server.js';

// Alice AI State mutations and queries
export const updateState = mutation({
  args: {
    userId: v.string(),
    updates: v.object({
      currentShape: v.optional(v.union(v.literal('neutral'), v.literal('intense'), v.literal('rhythmic'))),
      morphProgress: v.optional(v.number()),
      isAnimating: v.optional(v.boolean()),
      interactionMode: v.optional(v.union(
        v.literal('idle'),
        v.literal('listening'),
        v.literal('speaking'),
        v.literal('coaching')
      )),
      visibilityState: v.optional(v.union(
        v.literal('visible'),
        v.literal('hidden'),
        v.literal('minimized')
      )),
      isInteractive: v.optional(v.boolean()),
      isVoiceEnabled: v.optional(v.boolean()),
      isSpeaking: v.optional(v.boolean()),
      currentMessage: v.optional(v.string()),
      lastSyncTimestamp: v.optional(v.number()),
      isOnline: v.optional(v.boolean()),
      currentPage: v.optional(v.string()),
      shouldShowOnPage: v.optional(v.boolean()),
      lastUpdated: v.optional(v.number())
    })
  },
  handler: async (ctx: any, args: any) => {
    // Check if Alice state exists for this user
    const existingState = await ctx.db
      .query('alice_states')
      .withIndex('by_user', (q: any) => q.eq('userId', args.userId))
      .first();

    const updateData = {
      ...args.updates,
      lastUpdated: Date.now()
    };

    if (existingState) {
      // Update existing state
      await ctx.db.patch(existingState._id, updateData);
      return existingState._id;
    } else {
      // Create new state with defaults
      const newState = {
        userId: args.userId,
        currentShape: 'neutral' as const,
        morphProgress: 0,
        isAnimating: false,
        interactionMode: 'idle' as const,
        visibilityState: 'visible' as const,
        isInteractive: false,
        isVoiceEnabled: true,
        isSpeaking: false,
        lastSyncTimestamp: Date.now(),
        isOnline: true,
        currentPage: '/',
        shouldShowOnPage: true,
        ...updateData
      };

      return await ctx.db.insert('alice_states', newState);
    }
  }
});

export const getState = query({
  args: {
    userId: v.string()
  },
  handler: async (ctx: any, args: any) => {
    const state = await ctx.db
      .query('alice_states')
      .withIndex('by_user', (q: any) => q.eq('userId', args.userId))
      .first();

    if (!state) {
      // Return default Alice state
      return {
        userId: args.userId,
        currentShape: 'neutral' as const,
        morphProgress: 0,
        isAnimating: false,
        interactionMode: 'idle' as const,
        visibilityState: 'visible' as const,
        isInteractive: false,
        isVoiceEnabled: true,
        isSpeaking: false,
        lastSyncTimestamp: Date.now(),
        isOnline: true,
        currentPage: '/',
        shouldShowOnPage: true,
        lastUpdated: Date.now()
      };
    }

    return state;
  }
});

export const getUserPreferences = query({
  args: {
    userId: v.string()
  },
  handler: async (ctx: any, args: any) => {
    const preferences = await ctx.db
      .query('alice_preferences')
      .withIndex('by_user', (q: any) => q.eq('userId', args.userId))
      .first();

    if (!preferences) {
      // Return default preferences
      return {
        userId: args.userId,
        voiceCoachingEnabled: true,
        hapticsEnabled: true,
        morphingEnabled: true,
        colorScheme: 'electric_blue',
        coachingIntensity: 'medium',
        autoMorphThreshold: 15,
        voiceVolume: 0.8,
        lastUpdated: Date.now()
      };
    }

    return preferences;
  }
});

export const updateUserPreferences = mutation({
  args: {
    userId: v.string(),
    preferences: v.object({
      voiceCoachingEnabled: v.optional(v.boolean()),
      hapticsEnabled: v.optional(v.boolean()),
      morphingEnabled: v.optional(v.boolean()),
      colorScheme: v.optional(v.string()),
      coachingIntensity: v.optional(v.union(v.literal('low'), v.literal('medium'), v.literal('high'))),
      autoMorphThreshold: v.optional(v.number()),
      voiceVolume: v.optional(v.number())
    })
  },
  handler: async (ctx: any, args: any) => {
    const existing = await ctx.db
      .query('alice_preferences')
      .withIndex('by_user', (q: any) => q.eq('userId', args.userId))
      .first();

    const updateData = {
      ...args.preferences,
      lastUpdated: Date.now()
    };

    if (existing) {
      await ctx.db.patch(existing._id, updateData);
      return existing._id;
    } else {
      const newPreferences = {
        userId: args.userId,
        voiceCoachingEnabled: true,
        hapticsEnabled: true,
        morphingEnabled: true,
        colorScheme: 'electric_blue',
        coachingIntensity: 'medium' as const,
        autoMorphThreshold: 15,
        voiceVolume: 0.8,
        ...updateData
      };

      return await ctx.db.insert('alice_preferences', newPreferences);
    }
  }
});

export const getWorkoutMetrics = query({
  args: {
    userId: v.string(),
    sessionId: v.optional(v.string())
  },
  handler: async (ctx: any, args: any) => {
    // Get current workout session
    let query = ctx.db
      .query('workouts')
      .withIndex('by_user_active', (q: any) =>
        q.eq('userId', args.userId).eq('isActive', true)
      );

    if (args.sessionId) {
      query = query.filter((q: any) => q.eq('sessionId', args.sessionId));
    }

    const activeWorkout = await query.first();

    if (!activeWorkout) {
      return null;
    }

    // Get latest health data for this user
    const healthData = await ctx.db
      .query('health_data')
      .withIndex('by_user_timestamp', (q: any) =>
        q.eq('userId', args.userId)
      )
      .order('desc')
      .first();

    return {
      workoutId: activeWorkout._id,
      strain: healthData?.strain || 0,
      heartRate: healthData?.heartRate || 0,
      calories: activeWorkout.caloriesBurned || 0,
      power: healthData?.power || 0,
      cadence: healthData?.cadence || 0,
      timestamp: Date.now()
    };
  }
});

export const getHealthData = query({
  args: {
    userId: v.string()
  },
  handler: async (ctx: any, args: any) => {
    const healthData = await ctx.db
      .query('health_data')
      .withIndex('by_user_timestamp', (q: any) =>
        q.eq('userId', args.userId)
      )
      .order('desc')
      .first();

    return healthData || {
      userId: args.userId,
      heartRateVariability: 50,
      sleepQuality: 75,
      stressLevel: 30,
      recoveryScore: 80,
      timestamp: Date.now()
    };
  }
});

export const logInteraction = mutation({
  args: {
    userId: v.string(),
    interactionType: v.string(),
    context: v.object({
      page: v.optional(v.string()),
      strain: v.optional(v.number()),
      message: v.optional(v.string()),
      duration: v.optional(v.number())
    })
  },
  handler: async (ctx: any, args: any) => {
    return await ctx.db.insert('alice_interactions', {
      userId: args.userId,
      interactionType: args.interactionType,
      context: args.context,
      timestamp: Date.now()
    });
  }
});