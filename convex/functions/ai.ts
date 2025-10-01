import { v } from "convex/values";
import { mutation, query } from "../_generated/server.js";

// Store AI user preferences
export const storeUserPreferences = mutation({
  args: {
    userId: v.string(),
    preferences: v.object({
      preferred_intensity: v.number(),
      volume_tolerance: v.number(),
      rest_time_preference: v.number(),
      exercise_variety: v.number(),
      progression_rate: v.number(),
      form_focus: v.number(),
      time_constraints: v.optional(v.object({
        typical_session_length: v.number(),
        preferred_times: v.array(v.string()),
        rush_tolerance: v.number()
      }))
    }),
    feedback_patterns: v.object({
      acceptance_rate: v.number(),
      modification_frequency: v.number(),
      skip_rate: v.number()
    }),
    confidence_scores: v.object({
      workout_confidence: v.number(),
      exercise_confidence: v.number(),
      intensity_confidence: v.number()
    }),
    learning_metadata: v.object({
      total_interactions: v.number(),
      last_updated: v.string(),
      learning_rate: v.number(),
      adaptation_speed: v.number()
    })
  },
  handler: async (ctx, args) => {
    // Check if preferences already exist
    const existing = await ctx.db
      .query("aiUserPreferences")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (existing) {
      // Update existing preferences
      return await ctx.db.patch(existing._id, {
        preferences: args.preferences,
        feedback_patterns: args.feedback_patterns,
        confidence_scores: args.confidence_scores,
        learning_metadata: args.learning_metadata,
        updatedAt: Date.now()
      });
    } else {
      // Create new preferences
      return await ctx.db.insert("aiUserPreferences", {
        userId: args.userId,
        preferences: args.preferences,
        feedback_patterns: args.feedback_patterns,
        confidence_scores: args.confidence_scores,
        learning_metadata: args.learning_metadata,
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
    }
  },
});

// Get AI user preferences
export const getUserPreferences = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("aiUserPreferences")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();
  },
});

// Store AI workout tweak/recommendation
export const storeWorkoutTweak = mutation({
  args: {
    userId: v.string(),
    tweakId: v.string(),
    exercise: v.object({
      name: v.string(),
      type: v.string(),
      muscle_groups: v.array(v.string()),
      difficulty_level: v.optional(v.number())
    }),
    recommendation: v.object({
      type: v.string(),
      original_value: v.any(),
      suggested_value: v.any(),
      confidence: v.number(),
      reasoning: v.string(),
      factors: v.array(v.string()),
      expected_outcome: v.string(),
      risk_assessment: v.string(),
      alternative_options: v.optional(v.array(v.any()))
    }),
    context: v.object({
      workout_phase: v.string(),
      time_of_day: v.string(),
      day_of_week: v.number(),
      user_energy: v.optional(v.number()),
      user_motivation: v.optional(v.number()),
      available_time: v.optional(v.number()),
      equipment_availability: v.optional(v.array(v.string())),
      gym_crowding: v.optional(v.string()),
      environmental_factors: v.optional(v.object({
        temperature: v.optional(v.number()),
        noise_level: v.optional(v.string()),
        crowding: v.optional(v.string())
      }))
    }),
    user_response: v.optional(v.object({
      accepted: v.boolean(),
      modified: v.boolean(),
      skipped: v.boolean(),
      actual_value: v.optional(v.any()),
      feedback_ratings: v.optional(v.object({
        difficulty: v.number(),
        effectiveness: v.number(),
        satisfaction: v.number(),
        perceived_exertion: v.number(),
        form_quality: v.number()
      })),
      completion_time: v.optional(v.number()),
      notes: v.optional(v.string()),
      responded_at: v.optional(v.number())
    }))
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("aiWorkoutTweaks", {
      userId: args.userId,
      tweakId: args.tweakId,
      exercise: args.exercise,
      recommendation: args.recommendation,
      context: args.context,
      user_response: args.user_response,
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
  },
});

// Update workout tweak with user response
export const updateTweakResponse = mutation({
  args: {
    tweakId: v.string(),
    userResponse: v.object({
      accepted: v.boolean(),
      modified: v.boolean(),
      skipped: v.boolean(),
      actual_value: v.optional(v.any()),
      feedback_ratings: v.optional(v.object({
        difficulty: v.number(),
        effectiveness: v.number(),
        satisfaction: v.number(),
        perceived_exertion: v.number(),
        form_quality: v.number()
      })),
      completion_time: v.optional(v.number()),
      notes: v.optional(v.string()),
      responded_at: v.number()
    })
  },
  handler: async (ctx, args) => {
    const tweak = await ctx.db
      .query("aiWorkoutTweaks")
      .withIndex("by_tweakId", (q) => q.eq("tweakId", args.tweakId))
      .first();

    if (!tweak) {
      throw new Error(`Tweak with ID ${args.tweakId} not found`);
    }

    return await ctx.db.patch(tweak._id, {
      user_response: args.userResponse,
      updatedAt: Date.now()
    });
  },
});

// Store AI learning event
export const storeLearningEvent = mutation({
  args: {
    userId: v.string(),
    eventType: v.string(),
    eventData: v.object({
      exercise_name: v.optional(v.string()),
      recommendation_type: v.optional(v.string()),
      user_action: v.optional(v.string()),
      context_factors: v.optional(v.array(v.string())),
      performance_metrics: v.optional(v.object({
        accuracy: v.optional(v.number()),
        user_satisfaction: v.optional(v.number()),
        outcome_quality: v.optional(v.number())
      })),
      learning_signals: v.optional(v.object({
        preference_shift: v.optional(v.number()),
        confidence_change: v.optional(v.number()),
        pattern_strength: v.optional(v.number())
      }))
    }),
    metadata: v.object({
      model_version: v.string(),
      algorithm_version: v.string(),
      confidence_threshold: v.number(),
      processing_time: v.optional(v.number())
    })
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("aiLearningEvents", {
      userId: args.userId,
      eventType: args.eventType,
      eventData: args.eventData,
      metadata: args.metadata,
      timestamp: Date.now()
    });
  },
});

// Get user's learning events for analysis
export const getUserLearningEvents = query({
  args: { 
    userId: v.string(),
    limit: v.optional(v.number()),
    eventType: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("aiLearningEvents")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId));

    if (args.eventType) {
      query = query.filter((q) => q.eq(q.field("eventType"), args.eventType));
    }

    query = query.order("desc");

    if (args.limit) {
      query = query.take(args.limit);
    }

    return await query.collect();
  },
});

// Store workout session data
export const storeWorkoutSession = mutation({
  args: {
    userId: v.string(),
    sessionId: v.string(),
    sessionData: v.object({
      workout_type: v.string(),
      duration: v.number(),
      total_exercises: v.number(),
      completed_exercises: v.number(),
      ai_recommendations_count: v.number(),
      ai_recommendations_accepted: v.number(),
      overall_difficulty: v.number(),
      overall_satisfaction: v.number(),
      energy_before: v.optional(v.number()),
      energy_after: v.optional(v.number()),
      perceived_exertion: v.optional(v.number()),
      notes: v.optional(v.string())
    }),
    exercises: v.array(v.object({
      name: v.string(),
      sets: v.number(),
      reps: v.array(v.number()),
      weights: v.array(v.number()),
      rest_times: v.array(v.number()),
      ai_tweaks_applied: v.number(),
      completion_quality: v.number()
    })),
    wearableData: v.optional(v.object({
      heart_rate_avg: v.optional(v.number()),
      heart_rate_max: v.optional(v.number()),
      heart_rate_zones: v.optional(v.object({
        zone1: v.number(),
        zone2: v.number(),
        zone3: v.number(),
        zone4: v.number(),
        zone5: v.number()
      })),
      calories_burned: v.optional(v.number()),
      steps: v.optional(v.number()),
      active_time: v.optional(v.number())
    }))
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("workoutSessions", {
      userId: args.userId,
      sessionId: args.sessionId,
      sessionData: args.sessionData,
      exercises: args.exercises,
      wearableData: args.wearableData,
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
  },
});

// Get user's recent workout sessions
export const getUserWorkoutSessions = query({
  args: { 
    userId: v.string(),
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("workoutSessions")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .order("desc");

    if (args.limit) {
      query = query.take(args.limit);
    }

    return await query.collect();
  },
});

// Store AI model version metadata
export const storeModelVersion = mutation({
  args: {
    version: v.string(),
    modelType: v.string(),
    capabilities: v.array(v.string()),
    performance_metrics: v.object({
      accuracy: v.number(),
      response_time: v.number(),
      memory_usage: v.number(),
      personalization_score: v.number()
    }),
    deployment_info: v.object({
      deployed_at: v.string(),
      environment: v.string(),
      config_hash: v.string()
    }),
    active: v.boolean()
  },
  handler: async (ctx, args) => {
    // Deactivate previous versions of the same model type
    const existingVersions = await ctx.db
      .query("aiModelVersions")
      .withIndex("by_modelType", (q) => q.eq("modelType", args.modelType))
      .collect();

    for (const version of existingVersions) {
      if (version.active) {
        await ctx.db.patch(version._id, { active: false });
      }
    }

    // Insert new version
    return await ctx.db.insert("aiModelVersions", {
      version: args.version,
      modelType: args.modelType,
      capabilities: args.capabilities,
      performance_metrics: args.performance_metrics,
      deployment_info: args.deployment_info,
      active: args.active,
      createdAt: Date.now()
    });
  },
});

// Get active AI model version
export const getActiveModelVersion = query({
  args: { modelType: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("aiModelVersions")
      .withIndex("by_modelType", (q) => q.eq("modelType", args.modelType))
      .filter((q) => q.eq(q.field("active"), true))
      .first();
  },
});

// Get user AI analytics summary
export const getUserAIAnalytics = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const preferences = await ctx.db
      .query("aiUserPreferences")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    const recentTweaks = await ctx.db
      .query("aiWorkoutTweaks")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(50)
      .collect();

    const recentSessions = await ctx.db
      .query("workoutSessions")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(10)
      .collect();

    const learningEvents = await ctx.db
      .query("aiLearningEvents")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(100)
      .collect();

    return {
      preferences,
      recentTweaks,
      recentSessions,
      learningEvents,
      summary: {
        totalTweaks: recentTweaks.length,
        totalSessions: recentSessions.length,
        totalLearningEvents: learningEvents.length,
        lastActivity: Math.max(
          ...recentTweaks.map(t => t.createdAt),
          ...recentSessions.map(s => s.createdAt),
          ...learningEvents.map(e => e.timestamp)
        ) || 0
      }
    };
  },
});