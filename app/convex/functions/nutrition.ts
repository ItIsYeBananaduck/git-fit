/**
 * Convex functions for nutrition tracking system
 */

import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// ==============================================================================
// NUTRITION GOALS
// ==============================================================================

export const createNutritionGoals = mutation({
  args: {
    userId: v.id("users"),
    dailyCalories: v.number(),
    dailyProtein: v.number(),
    dailyCarbs: v.number(),
    dailyFat: v.number(),
    dailyFiber: v.optional(v.number()),
    dailySodium: v.optional(v.number()),
    goalType: v.union(v.literal("weight_loss"), v.literal("muscle_gain"), v.literal("maintenance"), v.literal("performance")),
    activityLevel: v.union(v.literal("sedentary"), v.literal("light"), v.literal("moderate"), v.literal("active"), v.literal("very_active")),
    allowWeeklyBalancing: v.boolean(),
    maxDailyCalorieAdjustment: v.number(),
    maxDailyMacroAdjustment: v.number(),
    adjustForWorkouts: v.boolean(),
    preWorkoutCarbs: v.optional(v.number()),
    postWorkoutProtein: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    
    // Check if user already has goals
    const existing = await ctx.db
      .query("nutritionGoals")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (existing) {
      // Update existing goals
      return await ctx.db.patch(existing._id, {
        ...args,
        updatedAt: now,
      });
    } else {
      // Create new goals
      return await ctx.db.insert("nutritionGoals", {
        ...args,
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});

export const getNutritionGoals = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("nutritionGoals")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
  },
});

// ==============================================================================
// FOOD DATABASE
// ==============================================================================

export const addFood = mutation({
  args: {
    name: v.string(),
    brand: v.optional(v.string()),
    barcode: v.optional(v.string()),
    category: v.optional(v.string()),
    caloriesPer100g: v.number(),
    proteinPer100g: v.number(),
    carbsPer100g: v.number(),
    fatPer100g: v.number(),
    fiberPer100g: v.optional(v.number()),
    sugarPer100g: v.optional(v.number()),
    sodiumPer100g: v.optional(v.number()),
    vitaminAPer100g: v.optional(v.number()),
    vitaminCPer100g: v.optional(v.number()),
    calciumPer100g: v.optional(v.number()),
    ironPer100g: v.optional(v.number()),
    source: v.union(v.literal("open_food_facts"), v.literal("usda"), v.literal("custom")),
    sourceId: v.optional(v.string()),
    qualityScore: v.optional(v.number()),
    commonServings: v.array(v.object({
      name: v.string(),
      grams: v.number()
    })),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    
    return await ctx.db.insert("foods", {
      ...args,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const searchFoods = query({
  args: { 
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;
    
    // Search by name (simple text matching)
    const results = await ctx.db
      .query("foods")
      .filter((q) => 
        q.or(
          q.like(q.field("name"), `%${args.query}%`),
          q.like(q.field("brand"), `%${args.query}%`),
          q.like(q.field("category"), `%${args.query}%`)
        )
      )
      .take(limit);

    return results;
  },
});

export const getFoodByBarcode = query({
  args: { barcode: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("foods")
      .withIndex("by_barcode", (q) => q.eq("barcode", args.barcode))
      .first();
  },
});

export const getFoodById = query({
  args: { foodId: v.id("foods") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.foodId);
  },
});

// ==============================================================================
// FOOD ENTRIES
// ==============================================================================

export const logFoodEntry = mutation({
  args: {
    userId: v.id("users"),
    foodId: v.id("foods"),
    date: v.string(),
    mealType: v.union(v.literal("breakfast"), v.literal("lunch"), v.literal("dinner"), v.literal("snack")),
    servingGrams: v.number(),
    servingDescription: v.optional(v.string()),
    calories: v.number(),
    protein: v.number(),
    carbs: v.number(),
    fat: v.number(),
    fiber: v.optional(v.number()),
    sugar: v.optional(v.number()),
    sodium: v.optional(v.number()),
    timestamp: v.string(),
    notes: v.optional(v.string()),
    photoUrl: v.optional(v.string()),
    isPhotoLogged: v.boolean(),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    
    return await ctx.db.insert("foodEntries", {
      ...args,
      loggedAt: now,
    });
  },
});

export const getFoodEntriesForDate = query({
  args: { 
    userId: v.id("users"),
    date: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("foodEntries")
      .withIndex("by_user_and_date", (q) => 
        q.eq("userId", args.userId).eq("date", args.date)
      )
      .collect();
  },
});

export const getFoodEntriesForDateRange = query({
  args: {
    userId: v.id("users"),
    startDate: v.string(),
    endDate: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("foodEntries")
      .withIndex("by_user_and_date", (q) => q.eq("userId", args.userId))
      .filter((q) => 
        q.and(
          q.gte(q.field("date"), args.startDate),
          q.lte(q.field("date"), args.endDate)
        )
      )
      .collect();
  },
});

export const updateFoodEntry = mutation({
  args: {
    entryId: v.id("foodEntries"),
    servingGrams: v.optional(v.number()),
    calories: v.optional(v.number()),
    protein: v.optional(v.number()),
    carbs: v.optional(v.number()),
    fat: v.optional(v.number()),
    fiber: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { entryId, ...updates } = args;
    return await ctx.db.patch(entryId, updates);
  },
});

export const deleteFoodEntry = mutation({
  args: { entryId: v.id("foodEntries") },
  handler: async (ctx, args) => {
    return await ctx.db.delete(args.entryId);
  },
});

// ==============================================================================
// RECOVERY-AWARE NUTRITION ADJUSTMENTS
// ==============================================================================

export const createRecoveryAdjustment = mutation({
  args: {
    userId: v.id("users"),
    date: v.string(),
    recoveryScore: v.optional(v.number()),
    strainScore: v.optional(v.number()),
    sleepScore: v.optional(v.number()),
    hrv: v.optional(v.number()),
    adjustmentType: v.union(
      v.literal("high_recovery_boost"),
      v.literal("low_recovery_support"),
      v.literal("high_strain_recovery"),
      v.literal("poor_sleep_compensation")
    ),
    calorieAdjustment: v.number(),
    proteinBoost: v.number(),
    carbAdjustment: v.number(),
    hydrationReminder: v.boolean(),
    supplementSuggestions: v.array(v.string()),
    applied: v.boolean(),
    userFeedback: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    
    return await ctx.db.insert("nutritionRecoveryAdjustments", {
      ...args,
      createdAt: now,
    });
  },
});

export const getRecoveryAdjustments = query({
  args: {
    userId: v.id("users"),
    startDate: v.string(),
    endDate: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("nutritionRecoveryAdjustments")
      .withIndex("by_user_and_date", (q) => q.eq("userId", args.userId))
      .filter((q) => 
        q.and(
          q.gte(q.field("date"), args.startDate),
          q.lte(q.field("date"), args.endDate)
        )
      )
      .collect();
  },
});

// ==============================================================================
// WEEKLY MACRO BALANCING
// ==============================================================================

export const createWeeklyMacroBalance = mutation({
  args: {
    userId: v.id("users"),
    weekStartDate: v.string(),
    weekEndDate: v.string(),
    originalDailyCalories: v.number(),
    originalDailyProtein: v.number(),
    originalDailyCarbs: v.number(),
    originalDailyFat: v.number(),
    adjustedTargets: v.array(v.object({
      date: v.string(),
      calories: v.number(),
      protein: v.number(),
      carbs: v.number(),
      fat: v.number(),
      reasonForAdjustment: v.string()
    })),
    totalCalorieVariance: v.number(),
    totalProteinVariance: v.number(),
    totalCarbsVariance: v.number(),
    totalFatVariance: v.number(),
    balancingApplied: v.boolean(),
    userAccepted: v.boolean(),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    
    return await ctx.db.insert("weeklyMacroBalances", {
      ...args,
      createdAt: now,
    });
  },
});

export const getWeeklyMacroBalance = query({
  args: {
    userId: v.id("users"),
    weekStartDate: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("weeklyMacroBalances")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("weekStartDate"), args.weekStartDate))
      .first();
  },
});

// ==============================================================================
// USER ACHIEVEMENTS
// ==============================================================================

export const createAchievement = mutation({
  args: {
    userId: v.id("users"),
    achievementType: v.union(
      v.literal("workout_streak"),
      v.literal("nutrition_consistency"),
      v.literal("recovery_improvement"),
      v.literal("strength_milestone"),
      v.literal("habit_formation"),
      v.literal("goal_achievement"),
      v.literal("consistency_master"),
      v.literal("adaptive_learner")
    ),
    title: v.string(),
    description: v.string(),
    iconName: v.string(),
    currentValue: v.number(),
    targetValue: v.number(),
    isCompleted: v.boolean(),
    completedAt: v.optional(v.string()),
    points: v.number(),
    badgeColor: v.string(),
    celebrationMessage: v.string(),
    nextMilestone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    
    return await ctx.db.insert("userAchievements", {
      ...args,
      createdAt: now,
    });
  },
});

export const getUserAchievements = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("userAchievements")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

export const updateAchievementProgress = mutation({
  args: {
    achievementId: v.id("userAchievements"),
    currentValue: v.number(),
    isCompleted: v.optional(v.boolean()),
    completedAt: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { achievementId, ...updates } = args;
    return await ctx.db.patch(achievementId, updates);
  },
});

// ==============================================================================
// PERSONALIZED RECOMMENDATIONS
// ==============================================================================

export const createRecommendation = mutation({
  args: {
    userId: v.id("users"),
    type: v.union(
      v.literal("nutrition_timing"),
      v.literal("workout_adjustment"),
      v.literal("recovery_optimization"),
      v.literal("habit_suggestion"),
      v.literal("goal_refinement"),
      v.literal("exercise_alternative")
    ),
    title: v.string(),
    description: v.string(),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("urgent")),
    reasoning: v.array(v.string()),
    confidence: v.number(),
    basedOnData: v.array(v.string()),
    validUntil: v.string(),
    showAfter: v.string(),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    
    return await ctx.db.insert("userRecommendations", {
      ...args,
      isRead: false,
      createdAt: now,
    });
  },
});

export const getUserRecommendations = query({
  args: { 
    userId: v.id("users"),
    includeRead: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    const includeRead = args.includeRead || false;
    
    let query = ctx.db
      .query("userRecommendations")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => 
        q.and(
          q.lte(q.field("showAfter"), now),
          q.gte(q.field("validUntil"), now)
        )
      );

    if (!includeRead) {
      query = query.filter((q) => q.eq(q.field("isRead"), false));
    }

    return await query.collect();
  },
});

export const markRecommendationRead = mutation({
  args: {
    recommendationId: v.id("userRecommendations"),
    isAccepted: v.optional(v.boolean()),
    userFeedback: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { recommendationId, ...updates } = args;
    return await ctx.db.patch(recommendationId, {
      isRead: true,
      ...updates,
    });
  },
});

export const dismissRecommendation = mutation({
  args: { recommendationId: v.id("userRecommendations") },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    return await ctx.db.patch(args.recommendationId, {
      dismissedAt: now,
    });
  },
});

// ==============================================================================
// RIR MODELS
// ==============================================================================

export const createRIRModel = mutation({
  args: {
    userId: v.id("users"),
    exerciseId: v.id("exercises"),
    baselineRIR: v.number(),
    adaptationRate: v.number(),
    recoveryFactor: v.number(),
    consistencyScore: v.number(),
    sessionCount: v.number(),
    lastCalibration: v.string(),
    accuracyScore: v.number(),
    coefficients: v.object({
      recovery: v.number(),
      strain: v.number(),
      sleep: v.number(),
      timeOfDay: v.number(),
      daysSinceLastWorkout: v.number()
    }),
    isCalibrated: v.boolean(),
    needsRecalibration: v.boolean(),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    
    // Check if model already exists
    const existing = await ctx.db
      .query("rirModels")
      .withIndex("by_user_and_exercise", (q) => 
        q.eq("userId", args.userId).eq("exerciseId", args.exerciseId)
      )
      .first();

    if (existing) {
      // Update existing model
      return await ctx.db.patch(existing._id, {
        ...args,
        updatedAt: now,
      });
    } else {
      // Create new model
      return await ctx.db.insert("rirModels", {
        ...args,
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});

export const getRIRModel = query({
  args: {
    userId: v.id("users"),
    exerciseId: v.id("exercises"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("rirModels")
      .withIndex("by_user_and_exercise", (q) => 
        q.eq("userId", args.userId).eq("exerciseId", args.exerciseId)
      )
      .first();
  },
});

export const getUserRIRModels = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("rirModels")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

export const updateRIRModel = mutation({
  args: {
    modelId: v.id("rirModels"),
    baselineRIR: v.optional(v.number()),
    adaptationRate: v.optional(v.number()),
    recoveryFactor: v.optional(v.number()),
    consistencyScore: v.optional(v.number()),
    sessionCount: v.optional(v.number()),
    lastCalibration: v.optional(v.string()),
    accuracyScore: v.optional(v.number()),
    coefficients: v.optional(v.object({
      recovery: v.number(),
      strain: v.number(),
      sleep: v.number(),
      timeOfDay: v.number(),
      daysSinceLastWorkout: v.number()
    })),
    isCalibrated: v.optional(v.boolean()),
    needsRecalibration: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { modelId, ...updates } = args;
    const now = new Date().toISOString();
    
    return await ctx.db.patch(modelId, {
      ...updates,
      updatedAt: now,
    });
  },
});