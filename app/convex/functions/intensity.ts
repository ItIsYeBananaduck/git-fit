import { mutation, query } from "../_generated/server";
import { v, ConvexError } from "convex/values";
import { Id } from "../_generated/dataModel";

// Calculate and store intensity score for a workout set
export const calculateScore = mutation({
  args: {
    workoutSessionId: v.id("workoutSessions"),
    setId: v.string(), // Using string instead of v.id("workoutSets")
    tempoScore: v.number(),
    motionSmoothnessScore: v.number(),
    repConsistencyScore: v.number(),
    userFeedbackScore: v.number(),
    strainModifier: v.number(),
    isEstimated: v.boolean()
  },
  handler: async (ctx, args) => {
    // Get current user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) {
      throw new ConvexError("User not found");
    }

    // Validate workout session ownership
    const session = await ctx.db.get(args.workoutSessionId);
    if (!session) {
      throw new ConvexError("Workout session not found");
    }

    if (session.userId !== user._id) {
      throw new ConvexError("Access denied: not your workout session");
    }

    // Validate score ranges
    if (args.tempoScore < 0 || args.tempoScore > 100) {
      throw new ConvexError("Tempo score must be between 0 and 100");
    }
    if (args.motionSmoothnessScore < 0 || args.motionSmoothnessScore > 100) {
      throw new ConvexError("Motion smoothness score must be between 0 and 100");
    }
    if (args.repConsistencyScore < 0 || args.repConsistencyScore > 100) {
      throw new ConvexError("Rep consistency score must be between 0 and 100");
    }
    if (args.userFeedbackScore < -15 || args.userFeedbackScore > 20) {
      throw new ConvexError("User feedback score must be between -15 and 20");
    }
    if (![0.85, 0.95, 1.0].includes(args.strainModifier)) {
      throw new ConvexError("Strain modifier must be 0.85, 0.95, or 1.0");
    }

    // Calculate total score
    const baseScore = (args.tempoScore + args.motionSmoothnessScore + args.repConsistencyScore) / 3;
    const adjustedScore = baseScore + args.userFeedbackScore;
    const totalScore = Math.max(0, Math.min(100, adjustedScore * args.strainModifier));

    // Store intensity score
    const intensityScoreId = await ctx.db.insert("intensityScores", {
      userId: user._id,
      workoutSessionId: args.workoutSessionId,
      setId: args.setId,
      tempoScore: args.tempoScore,
      motionSmoothnessScore: args.motionSmoothnessScore,
      repConsistencyScore: args.repConsistencyScore,
      userFeedbackScore: args.userFeedbackScore,
      strainModifier: args.strainModifier,
      totalScore,
      isEstimated: args.isEstimated,
      createdAt: Date.now()
    });

    return {
      id: intensityScoreId,
      totalScore,
      breakdown: {
        tempo: args.tempoScore,
        smoothness: args.motionSmoothnessScore,
        consistency: args.repConsistencyScore,
        userFeedback: args.userFeedbackScore,
        strainModifier: args.strainModifier
      },
      isEstimated: args.isEstimated
    };
  }
});

// Get intensity score history for analysis and coaching
export const getHistory = query({
  args: {
    userId: v.optional(v.id("users")),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
    exerciseId: v.optional(v.string()),
    dateFrom: v.optional(v.number()),
    dateTo: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    // Get current user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Not authenticated");
    }

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!currentUser) {
      throw new ConvexError("User not found");
    }

    // Use provided userId or current user
    const userId = args.userId || currentUser._id;

    // Only allow accessing own data unless admin
    if (userId !== currentUser._id && currentUser.role !== "admin") {
      throw new ConvexError("Access denied");
    }

    // Set limits
    const limit = Math.min(args.limit || 50, 200);
    const offset = args.offset || 0;

    // Build query
    let query = ctx.db
      .query("intensityScores")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc");

    // Apply date filters
    if (args.dateFrom || args.dateTo) {
      query = query.filter((q) => {
        const conditions = [];
        if (args.dateFrom) {
          conditions.push(q.gte(q.field("createdAt"), args.dateFrom));
        }
        if (args.dateTo) {
          conditions.push(q.lte(q.field("createdAt"), args.dateTo));
        }
        return conditions.reduce((acc, condition) => q.and(acc, condition));
      });
    }

    // Get paginated results
    const allScores = await query.collect();
    const scores = allScores.slice(offset, offset + limit);
    const totalCount = allScores.length;
    const hasMore = offset + limit < totalCount;

    // Calculate statistics
    const avgScore = allScores.length > 0
      ? allScores.reduce((sum, score) => sum + score.totalScore, 0) / allScores.length
      : 0;

    // Calculate trend (last 10 vs previous 10)
    let trendDirection: "up" | "down" | "stable" = "stable";
    if (allScores.length >= 20) {
      const recent = allScores.slice(0, 10);
      const older = allScores.slice(10, 20);
      const recentAvg = recent.reduce((sum, s) => sum + s.totalScore, 0) / recent.length;
      const olderAvg = older.reduce((sum, s) => sum + s.totalScore, 0) / older.length;
      
      if (recentAvg > olderAvg + 2) {
        trendDirection = "up";
      } else if (recentAvg < olderAvg - 2) {
        trendDirection = "down";
      }
    }

    return {
      scores,
      totalCount,
      hasMore,
      avgScore: Math.round(avgScore * 100) / 100,
      trendDirection
    };
  }
});

// Watch real-time intensity scores for active workout
export const watchWorkoutIntensity = query({
  args: {
    workoutSessionId: v.id("workoutSessions")
  },
  handler: async (ctx, args) => {
    // Get current user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Not authenticated");
    }

    // Get intensity scores for this workout session
    return await ctx.db
      .query("intensityScores")
      .withIndex("by_workout_session", (q) =>
        q.eq("workoutSessionId", args.workoutSessionId)
      )
      .order("desc")
      .collect();
  }
});

// Get latest intensity score for user
export const getLatestScore = query({
  args: {
    userId: v.optional(v.id("users"))
  },
  handler: async (ctx, args) => {
    // Get current user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Not authenticated");
    }

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!currentUser) {
      throw new ConvexError("User not found");
    }

    const userId = args.userId || currentUser._id;

    return await ctx.db
      .query("intensityScores")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .first();
  }
});

// Get intensity score statistics for user
export const getScoreStatistics = query({
  args: {
    userId: v.optional(v.id("users")),
    days: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    // Get current user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Not authenticated");
    }

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!currentUser) {
      throw new ConvexError("User not found");
    }

    const userId = args.userId || currentUser._id;
    const days = args.days || 30;
    const dateFrom = Date.now() - (days * 24 * 60 * 60 * 1000);

    // Get scores from the specified time period
    const scores = await ctx.db
      .query("intensityScores")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.gte(q.field("createdAt"), dateFrom))
      .collect();

    if (scores.length === 0) {
      return {
        totalScores: 0,
        averageScore: 0,
        highestScore: 0,
        lowestScore: 0,
        trendDirection: "stable" as const,
        period: days
      };
    }

    // Calculate statistics
    const totalScores = scores.map(s => s.totalScore);
    const average = totalScores.reduce((sum, score) => sum + score, 0) / totalScores.length;
    const highest = Math.max(...totalScores);
    const lowest = Math.min(...totalScores);

    // Calculate trend (first half vs second half)
    let trendDirection: "up" | "down" | "stable" = "stable";
    if (scores.length >= 4) {
      const midPoint = Math.floor(scores.length / 2);
      const firstHalf = scores.slice(0, midPoint);
      const secondHalf = scores.slice(midPoint);
      
      const firstAvg = firstHalf.reduce((sum, s) => sum + s.totalScore, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((sum, s) => sum + s.totalScore, 0) / secondHalf.length;
      
      if (secondAvg > firstAvg + 2) {
        trendDirection = "up";
      } else if (secondAvg < firstAvg - 2) {
        trendDirection = "down";
      }
    }

    return {
      totalScores: scores.length,
      averageScore: Math.round(average * 100) / 100,
      highestScore: highest,
      lowestScore: lowest,
      trendDirection,
      period: days
    };
  }
});