import { mutation, query } from "../_generated/server";
import { v } from "convex/values";

/**
 * Store Monday workout intensity data with SHA-256 hash
 */
export const storeMondayWorkoutData = mutation({
  args: {
    userId: v.id("users"),
    weekOfYear: v.string(),
    workoutHash: v.string(),
    intensityScore: v.number(),
    intensityBreakdown: v.object({
      baseScore: v.number(),
      hrVarianceScore: v.number(),
      spo2DriftScore: v.number(),
      sleepScore: v.number(),
      feedbackScore: v.number(),
    }),
    actions: v.object({
      adjustVolume: v.boolean(),
      adjustment: v.number(),
      flagForReview: v.boolean(),
    }),
    exerciseId: v.string(),
    workoutMetrics: v.object({
      reps: v.number(),
      sets: v.number(),
      volume: v.number(),
      workoutTime: v.number(),
      estimatedCalories: v.number(),
    }),
    healthData: v.optional(v.object({
      heartRate: v.optional(v.object({
        avgHR: v.number(),
        maxHR: v.number(),
        variance: v.number(),
      })),
      spo2: v.optional(v.object({
        avgSpO2: v.number(),
        drift: v.number(),
      })),
      sleepScore: v.optional(v.number()),
    })),
    userFeedback: v.optional(v.union(
      v.literal("keep_going"),
      v.literal("neutral"),
      v.literal("finally_challenge"),
      v.literal("easy_killer"),
      v.literal("flag_review")
    )),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();

    // Check if hash already exists to prevent duplicates
    const existingData = await ctx.db
      .query("mondayWorkoutData")
      .withIndex("by_workout_hash", (q) => q.eq("workoutHash", args.workoutHash))
      .first();

    if (existingData) {
      throw new Error(`Workout data with hash ${args.workoutHash} already exists`);
    }

    // Store the Monday workout data
    const mondayDataId = await ctx.db.insert("mondayWorkoutData", {
      ...args,
      processed: true,
      processedAt: now,
      createdAt: now,
    });

    // If volume adjustment is needed, create volume adjustment record
    if (args.actions.adjustVolume) {
      await ctx.db.insert("volumeAdjustments", {
        userId: args.userId,
        exerciseId: args.exerciseId,
        adjustmentType: args.actions.flagForReview ? "review_flagged" : "automatic",
        previousVolume: args.workoutMetrics.volume,
        newVolume: args.workoutMetrics.volume * (1 + args.actions.adjustment / 100),
        adjustmentPercentage: args.actions.adjustment,
        reason: `Automatic adjustment based on Monday intensity analysis (${args.intensityScore}%)`,
        intensityScore: args.intensityScore,
        mondayDataId,
        appliedAt: now,
        effectiveDate: now,
        reviewStatus: args.actions.flagForReview ? "pending" : undefined,
        createdAt: now,
      });
    }

    return mondayDataId;
  },
});

/**
 * Batch store multiple Monday workout data entries
 */
export const storeMondayWorkoutDataBatch = mutation({
  args: {
    workouts: v.array(v.object({
      userId: v.id("users"),
      weekOfYear: v.string(),
      workoutHash: v.string(),
      intensityScore: v.number(),
      intensityBreakdown: v.object({
        baseScore: v.number(),
        hrVarianceScore: v.number(),
        spo2DriftScore: v.number(),
        sleepScore: v.number(),
        feedbackScore: v.number(),
      }),
      actions: v.object({
        adjustVolume: v.boolean(),
        adjustment: v.number(),
        flagForReview: v.boolean(),
      }),
      exerciseId: v.string(),
      workoutMetrics: v.object({
        reps: v.number(),
        sets: v.number(),
        volume: v.number(),
        workoutTime: v.number(),
        estimatedCalories: v.number(),
      }),
      healthData: v.optional(v.object({
        heartRate: v.optional(v.object({
          avgHR: v.number(),
          maxHR: v.number(),
          variance: v.number(),
        })),
        spo2: v.optional(v.object({
          avgSpO2: v.number(),
          drift: v.number(),
        })),
        sleepScore: v.optional(v.number()),
      })),
      userFeedback: v.optional(v.union(
        v.literal("keep_going"),
        v.literal("neutral"),
        v.literal("finally_challenge"),
        v.literal("easy_killer"),
        v.literal("flag_review")
      )),
    })),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    const results = [];

    for (const workout of args.workouts) {
      // Check for duplicates
      const existingData = await ctx.db
        .query("mondayWorkoutData")
        .withIndex("by_workout_hash", (q) => q.eq("workoutHash", workout.workoutHash))
        .first();

      if (existingData) {
        console.warn(`Skipping duplicate workout hash: ${workout.workoutHash}`);
        continue;
      }

      // Store Monday data
      const mondayDataId = await ctx.db.insert("mondayWorkoutData", {
        ...workout,
        processed: true,
        processedAt: now,
        createdAt: now,
      });

      results.push(mondayDataId);

      // Create volume adjustment if needed
      if (workout.actions.adjustVolume) {
        await ctx.db.insert("volumeAdjustments", {
          userId: workout.userId,
          exerciseId: workout.exerciseId,
          adjustmentType: workout.actions.flagForReview ? "review_flagged" : "automatic",
          previousVolume: workout.workoutMetrics.volume,
          newVolume: workout.workoutMetrics.volume * (1 + workout.actions.adjustment / 100),
          adjustmentPercentage: workout.actions.adjustment,
          reason: `Automatic adjustment based on Monday intensity analysis (${workout.intensityScore}%)`,
          intensityScore: workout.intensityScore,
          mondayDataId,
          appliedAt: now,
          effectiveDate: now,
          reviewStatus: workout.actions.flagForReview ? "pending" : undefined,
          createdAt: now,
        });
      }
    }

    return {
      stored: results.length,
      total: args.workouts.length,
      mondayDataIds: results,
    };
  },
});

/**
 * Get Monday workout data for a user and specific week
 */
export const getMondayWorkoutData = query({
  args: {
    userId: v.id("users"),
    weekOfYear: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { userId, weekOfYear, limit = 50 }) => {
    let queryBuilder = ctx.db
      .query("mondayWorkoutData")
      .withIndex("by_user", (q) => q.eq("userId", userId));

    if (weekOfYear) {
      queryBuilder = ctx.db
        .query("mondayWorkoutData")
        .withIndex("by_user_and_week", (q) => 
          q.eq("userId", userId).eq("weekOfYear", weekOfYear)
        );
    }

    const results = await queryBuilder
      .order("desc")
      .take(limit);

    return results;
  },
});

/**
 * Get Monday workout data for a specific exercise across weeks
 */
export const getMondayWorkoutDataByExercise = query({
  args: {
    userId: v.id("users"),
    exerciseId: v.string(),
    weeksBack: v.optional(v.number()),
  },
  handler: async (ctx, { userId, exerciseId, weeksBack = 12 }) => {
    // Get all data for this exercise
    const allData = await ctx.db
      .query("mondayWorkoutData")
      .withIndex("by_exercise_and_week", (q) => q.eq("exerciseId", exerciseId))
      .filter((q) => q.eq(q.field("userId"), userId))
      .order("desc")
      .take(weeksBack);

    return allData;
  },
});

/**
 * Get volume adjustments for a user
 */
export const getVolumeAdjustments = query({
  args: {
    userId: v.id("users"),
    exerciseId: v.optional(v.string()),
    reviewStatus: v.optional(v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected")
    )),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { userId, exerciseId, reviewStatus, limit = 50 }) => {
    let queryBuilder = ctx.db
      .query("volumeAdjustments")
      .withIndex("by_user", (q) => q.eq("userId", userId));

    if (exerciseId && reviewStatus) {
      // Filter by both exercise and review status in application code
      const results = await queryBuilder
        .filter((q) => 
          q.and(
            q.eq(q.field("exerciseId"), exerciseId),
            q.eq(q.field("reviewStatus"), reviewStatus)
          )
        )
        .order("desc")
        .take(limit);
      return results;
    } else if (exerciseId) {
      const results = await ctx.db
        .query("volumeAdjustments")
        .withIndex("by_user_and_exercise", (q) => 
          q.eq("userId", userId).eq("exerciseId", exerciseId)
        )
        .order("desc")
        .take(limit);
      return results;
    } else if (reviewStatus) {
      const results = await queryBuilder
        .filter((q) => q.eq(q.field("reviewStatus"), reviewStatus))
        .order("desc")
        .take(limit);
      return results;
    }

    return await queryBuilder.order("desc").take(limit);
  },
});

/**
 * Approve or reject a volume adjustment
 */
export const reviewVolumeAdjustment = mutation({
  args: {
    adjustmentId: v.id("volumeAdjustments"),
    reviewedBy: v.id("users"),
    status: v.union(v.literal("approved"), v.literal("rejected")),
    reviewNotes: v.optional(v.string()),
  },
  handler: async (ctx, { adjustmentId, reviewedBy, status, reviewNotes }) => {
    const now = new Date().toISOString();

    await ctx.db.patch(adjustmentId, {
      reviewStatus: status,
      reviewedBy,
      reviewNotes,
    });

    return { success: true, reviewedAt: now };
  },
});

/**
 * Get workout intensity trends for charts/analytics
 */
export const getIntensityTrends = query({
  args: {
    userId: v.id("users"),
    exerciseId: v.optional(v.string()),
    weeksBack: v.optional(v.number()),
  },
  handler: async (ctx, { userId, exerciseId, weeksBack = 12 }) => {
    let queryBuilder = ctx.db
      .query("mondayWorkoutData")
      .withIndex("by_user", (q) => q.eq("userId", userId));

    if (exerciseId) {
      queryBuilder = ctx.db
        .query("mondayWorkoutData")
        .withIndex("by_exercise_and_week", (q) => q.eq("exerciseId", exerciseId))
        .filter((q) => q.eq(q.field("userId"), userId));
    }

    const data = await queryBuilder
      .order("desc")
      .take(weeksBack);

    // Transform for chart display
    return data.map(entry => ({
      week: entry.weekOfYear,
      exerciseId: entry.exerciseId,
      intensityScore: entry.intensityScore,
      volume: entry.workoutMetrics.volume,
      adjustment: entry.actions.adjustment,
      flaggedForReview: entry.actions.flagForReview,
      breakdown: entry.intensityBreakdown,
    }));
  },
});

/**
 * Check if hash exists (prevent duplicate processing)
 */
export const checkHashExists = query({
  args: {
    workoutHash: v.string(),
  },
  handler: async (ctx, { workoutHash }) => {
    const existing = await ctx.db
      .query("mondayWorkoutData")
      .withIndex("by_workout_hash", (q) => q.eq("workoutHash", workoutHash))
      .first();

    return { exists: !!existing, data: existing };
  },
});

/**
 * Get old Monday data for cleanup (internal use)
 */
export const getOldMondayData = query({
  args: {
    cutoffWeek: v.string(), // YYYY-WW format
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { cutoffWeek, limit = 1000 }) => {
    // Get all Monday data older than cutoff week
    const oldData = await ctx.db
      .query("mondayWorkoutData")
      .filter((q) => q.lt(q.field("weekOfYear"), cutoffWeek))
      .take(limit);

    return oldData;
  },
});

/**
 * Delete old Monday data entry (internal use)
 */
export const deleteOldMondayData = mutation({
  args: {
    entryId: v.id("mondayWorkoutData"),
  },
  handler: async (ctx, { entryId }) => {
    await ctx.db.delete(entryId);
    return { success: true };
  },
});

/**
 * Get old processing triggers for cleanup
 */
export const getOldProcessingTriggers = query({
  args: {
    cutoffDate: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { cutoffDate, limit = 1000 }) => {
    const oldTriggers = await ctx.db
      .query("mondayProcessingTriggers")
      .withIndex("by_created", (q) => q.lt("createdAt", cutoffDate))
      .take(limit);

    return oldTriggers;
  },
});

/**
 * Delete old processing trigger
 */
export const deleteOldProcessingTrigger = mutation({
  args: {
    triggerId: v.id("mondayProcessingTriggers"),
  },
  handler: async (ctx, { triggerId }) => {
    await ctx.db.delete(triggerId);
    return { success: true };
  },
});

/**
 * Create Monday processing trigger
 */
export const triggerMondayProcessing = mutation({
  args: {
    userId: v.id("users"),
    weekOfYear: v.string(),
  },
  handler: async (ctx, { userId, weekOfYear }) => {
    const now = new Date().toISOString();

    // Check if trigger already exists
    const existingTrigger = await ctx.db
      .query("mondayProcessingTriggers")
      .withIndex("by_user_and_week", (q) => 
        q.eq("userId", userId).eq("weekOfYear", weekOfYear)
      )
      .first();

    if (existingTrigger) {
      return { success: true, existing: true, triggerId: existingTrigger._id };
    }

    const triggerId = await ctx.db.insert("mondayProcessingTriggers", {
      userId,
      weekOfYear,
      triggered: true,
      processed: false,
      createdAt: now,
    });

    return { success: true, existing: false, triggerId };
  },
});

/**
 * Mark processing trigger as processed
 */
export const markTriggerProcessed = mutation({
  args: {
    triggerId: v.id("mondayProcessingTriggers"),
  },
  handler: async (ctx, { triggerId }) => {
    const now = new Date().toISOString();
    
    await ctx.db.patch(triggerId, {
      processed: true,
      processedAt: now,
    });

    return { success: true, processedAt: now };
  },
});

/**
 * Get pending processing triggers for a user
 */
export const getPendingTriggers = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { userId, limit = 10 }) => {
    const pendingTriggers = await ctx.db
      .query("mondayProcessingTriggers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => 
        q.and(
          q.eq(q.field("triggered"), true),
          q.eq(q.field("processed"), false)
        )
      )
      .order("desc")
      .take(limit);

    return pendingTriggers;
  },
});