import { v } from "convex/values";
import { mutation, query } from "../_generated/server.js";
// import { Id } from "../_generated/dataModel";

// Enhanced Nutrition AI Convex Functions

// User Health Profile Management
export const createUserHealthProfile = mutation({
  args: {
    userId: v.string(),
    medicalConditions: v.array(v.string()),
    allergies: v.array(v.string()),
    medications: v.array(v.object({
      name: v.string(),
      dosage: v.optional(v.string()),
      nutritionInteractions: v.optional(v.array(v.string())),
      timingRestrictions: v.optional(v.string()),
    })),
    safetyFlags: v.object({
      diabetesFlag: v.boolean(),
      heartConditionFlag: v.boolean(),
      kidneyIssueFlag: v.boolean(),
      digestiveIssueFlag: v.boolean(),
      eatingDisorderHistory: v.boolean(),
    }),
    metabolicData: v.object({
      basalMetabolicRate: v.optional(v.number()),
      totalDailyEnergyExpenditure: v.optional(v.number()),
      metabolicFlexibility: v.optional(v.number()),
      insulinSensitivity: v.optional(v.number()),
    }),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("userHealthProfiles", {
      userId: args.userId,
      medicalConditions: args.medicalConditions,
      allergies: args.allergies,
      medications: args.medications,
      safetyFlags: args.safetyFlags,
      metabolicData: args.metabolicData,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const getUserHealthProfile = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("userHealthProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();
  },
});

export const updateUserHealthProfile = mutation({
  args: {
    profileId: v.id("userHealthProfiles"),
    medicalConditions: v.optional(v.array(v.string())),
    allergies: v.optional(v.array(v.string())),
    medications: v.optional(v.array(v.object({
      name: v.string(),
      dosage: v.optional(v.string()),
      nutritionInteractions: v.optional(v.array(v.string())),
      timingRestrictions: v.optional(v.string()),
    }))),
    safetyFlags: v.optional(v.object({
      diabetesFlag: v.boolean(),
      heartConditionFlag: v.boolean(),
      kidneyIssueFlag: v.boolean(),
      digestiveIssueFlag: v.boolean(),
      eatingDisorderHistory: v.boolean(),
    })),
    metabolicData: v.optional(v.object({
      basalMetabolicRate: v.optional(v.number()),
      totalDailyEnergyExpenditure: v.optional(v.number()),
      metabolicFlexibility: v.optional(v.number()),
      insulinSensitivity: v.optional(v.number()),
    })),
  },
  handler: async (ctx, args) => {
    const { profileId, ...updateData } = args;
    const updates = Object.fromEntries(
      Object.entries(updateData).filter(([_, value]) => value !== undefined)
    );
    
    return await ctx.db.patch(profileId, {
      ...updates,
      updatedAt: Date.now(),
    });
  },
});

// Recovery Metrics Management
export const recordRecoveryMetrics = mutation({
  args: {
    userId: v.string(),
    date: v.string(),
    hrvScore: v.optional(v.number()),
    restingHeartRate: v.optional(v.number()),
    sleepQuality: v.optional(v.number()),
    sleepDuration: v.optional(v.number()),
    stressLevel: v.optional(v.number()),
    hydrationStatus: v.optional(v.number()),
    recoveryScore: v.number(),
    source: v.string(),
    rawData: v.optional(v.object({})),
  },
  handler: async (ctx, args) => {
    // Check if entry already exists for this user and date
    const existing = await ctx.db
      .query("recoveryMetrics")
      .withIndex("by_userId_date", (q) => 
        q.eq("userId", args.userId).eq("date", args.date)
      )
      .first();

    if (existing) {
      // Update existing entry
      return await ctx.db.patch(existing._id, {
        hrvScore: args.hrvScore,
        restingHeartRate: args.restingHeartRate,
        sleepQuality: args.sleepQuality,
        sleepDuration: args.sleepDuration,
        stressLevel: args.stressLevel,
        hydrationStatus: args.hydrationStatus,
        recoveryScore: args.recoveryScore,
        source: args.source,
        rawData: args.rawData,
        updatedAt: Date.now(),
      });
    } else {
      // Create new entry
      return await ctx.db.insert("recoveryMetrics", {
        userId: args.userId,
        date: args.date,
        hrvScore: args.hrvScore,
        restingHeartRate: args.restingHeartRate,
        sleepQuality: args.sleepQuality,
        sleepDuration: args.sleepDuration,
        stressLevel: args.stressLevel,
        hydrationStatus: args.hydrationStatus,
        recoveryScore: args.recoveryScore,
        source: args.source,
        rawData: args.rawData,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
  },
});

export const getRecoveryMetrics = query({
  args: { 
    userId: v.string(),
    date: v.optional(v.string()),
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    if (args.date) {
      // Get specific date
      return await ctx.db
        .query("recoveryMetrics")
        .withIndex("by_userId_date", (q) => 
          q.eq("userId", args.userId).eq("date", args.date)
        )
        .first();
    } else {
      // Get recent days
      const daysToFetch = args.days || 7;
      return await ctx.db
        .query("recoveryMetrics")
        .withIndex("by_userId_timestamp", (q) => q.eq("userId", args.userId))
        .order("desc")
        .take(daysToFetch);
    }
  },
});

// Adaptive Nutrition Goals Management
export const createAdaptiveNutritionGoals = mutation({
  args: {
    userId: v.string(),
    baseGoals: v.object({
      calories: v.number(),
      protein: v.number(),
      carbs: v.number(),
      fat: v.number(),
      fiber: v.optional(v.number()),
      sugar: v.optional(v.number()),
      sodium: v.optional(v.number()),
    }),
    recoveryAdjustments: v.object({
      lowRecoveryMultiplier: v.number(),
      highRecoveryMultiplier: v.number(),
      hydrationBoostThreshold: v.number(),
      proteinBoostThreshold: v.number(),
    }),
    currentAdjustedGoals: v.object({
      calories: v.number(),
      protein: v.number(),
      carbs: v.number(),
      fat: v.number(),
      hydration: v.number(),
      adjustmentReason: v.string(),
      lastAdjustedAt: v.number(),
    }),
    weeklyTargets: v.object({
      proteinMakeupDeficit: v.number(),
      calorieMakeupDeficit: v.number(),
      maxMakeupDays: v.number(),
    }),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("adaptiveNutritionGoals", {
      userId: args.userId,
      baseGoals: args.baseGoals,
      recoveryAdjustments: args.recoveryAdjustments,
      currentAdjustedGoals: args.currentAdjustedGoals,
      weeklyTargets: args.weeklyTargets,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const getAdaptiveNutritionGoals = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("adaptiveNutritionGoals")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();
  },
});

export const updateAdaptiveNutritionGoals = mutation({
  args: {
    userId: v.string(),
    currentAdjustedGoals: v.object({
      calories: v.number(),
      protein: v.number(),
      carbs: v.number(),
      fat: v.number(),
      hydration: v.number(),
      adjustmentReason: v.string(),
      lastAdjustedAt: v.number(),
    }),
    weeklyTargets: v.optional(v.object({
      proteinMakeupDeficit: v.number(),
      calorieMakeupDeficit: v.number(),
      maxMakeupDays: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    const goals = await ctx.db
      .query("adaptiveNutritionGoals")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (!goals) {
      throw new Error("No adaptive nutrition goals found for user");
    }

    const updates: any = {
      currentAdjustedGoals: args.currentAdjustedGoals,
      updatedAt: Date.now(),
    };

    if (args.weeklyTargets) {
      updates.weeklyTargets = args.weeklyTargets;
    }

    return await ctx.db.patch(goals._id, updates);
  },
});

// Hydration Tracking
export const recordHydrationTracking = mutation({
  args: {
    userId: v.string(),
    date: v.string(),
    targetHydration: v.number(),
    currentIntake: v.number(),
    recommendations: v.array(v.object({
      time: v.string(),
      amount: v.number(),
      reason: v.string(),
      priority: v.string(),
      completed: v.boolean(),
    })),
    recoveryBasedAdjustment: v.optional(v.number()),
    environmentFactors: v.optional(v.object({
      temperature: v.optional(v.number()),
      humidity: v.optional(v.number()),
      altitude: v.optional(v.number()),
    })),
  },
  handler: async (ctx, args) => {
    // Check if entry already exists for this user and date
    const existing = await ctx.db
      .query("hydrationTracking")
      .withIndex("by_userId_date", (q) => 
        q.eq("userId", args.userId).eq("date", args.date)
      )
      .first();

    if (existing) {
      // Update existing entry
      return await ctx.db.patch(existing._id, {
        targetHydration: args.targetHydration,
        currentIntake: args.currentIntake,
        recommendations: args.recommendations,
        recoveryBasedAdjustment: args.recoveryBasedAdjustment,
        environmentFactors: args.environmentFactors,
        updatedAt: Date.now(),
      });
    } else {
      // Create new entry
      return await ctx.db.insert("hydrationTracking", {
        userId: args.userId,
        date: args.date,
        targetHydration: args.targetHydration,
        currentIntake: args.currentIntake,
        recommendations: args.recommendations,
        recoveryBasedAdjustment: args.recoveryBasedAdjustment,
        environmentFactors: args.environmentFactors,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
  },
});

export const getHydrationTracking = query({
  args: { 
    userId: v.string(),
    date: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.date) {
      return await ctx.db
        .query("hydrationTracking")
        .withIndex("by_userId_date", (q) => 
          q.eq("userId", args.userId).eq("date", args.date)
        )
        .first();
    } else {
      // Get recent entries
      return await ctx.db
        .query("hydrationTracking")
        .withIndex("by_userId_timestamp", (q) => q.eq("userId", args.userId))
        .order("desc")
        .take(7);
    }
  },
});

export const updateHydrationProgress = mutation({
  args: {
    userId: v.string(),
    date: v.string(),
    currentIntake: v.number(),
    completedRecommendations: v.array(v.object({
      time: v.string(),
      amount: v.number(),
      reason: v.string(),
      priority: v.string(),
      completed: v.boolean(),
    })),
  },
  handler: async (ctx, args) => {
    const tracking = await ctx.db
      .query("hydrationTracking")
      .withIndex("by_userId_date", (q) => 
        q.eq("userId", args.userId).eq("date", args.date)
      )
      .first();

    if (!tracking) {
      throw new Error("No hydration tracking found for this date");
    }

    return await ctx.db.patch(tracking._id, {
      currentIntake: args.currentIntake,
      recommendations: args.completedRecommendations,
      updatedAt: Date.now(),
    });
  },
});

// Nutrition AI Recommendations
export const storeNutritionRecommendation = mutation({
  args: {
    userId: v.string(),
    recommendationType: v.string(),
    recommendation: v.object({
      title: v.string(),
      description: v.string(),
      action: v.string(),
      targetValue: v.optional(v.number()),
      targetUnit: v.optional(v.string()),
      priority: v.string(),
      safetyChecked: v.boolean(),
    }),
    reasoning: v.object({
      recoveryScore: v.optional(v.number()),
      hrvTrend: v.optional(v.string()),
      deficitDays: v.optional(v.number()),
      workoutIntensity: v.optional(v.string()),
      medicalConsiderations: v.optional(v.array(v.string())),
    }),
    aiModelVersion: v.string(),
    confidence: v.number(),
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("nutritionAIRecommendations", {
      userId: args.userId,
      recommendationType: args.recommendationType,
      recommendation: args.recommendation,
      reasoning: args.reasoning,
      userResponse: undefined,
      aiModelVersion: args.aiModelVersion,
      confidence: args.confidence,
      createdAt: Date.now(),
      expiresAt: args.expiresAt,
    });
  },
});

export const updateNutritionRecommendationResponse = mutation({
  args: {
    recommendationId: v.id("nutritionAIRecommendations"),
    userResponse: v.object({
      accepted: v.boolean(),
      implemented: v.boolean(),
      feedback: v.optional(v.string()),
      modifiedValue: v.optional(v.number()),
      responseAt: v.number(),
    }),
  },
  handler: async (ctx, args) => {
    return await ctx.db.patch(args.recommendationId, {
      userResponse: args.userResponse,
    });
  },
});

export const getNutritionRecommendations = query({
  args: { 
    userId: v.string(),
    active: v.optional(v.boolean()),
    recommendationType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let q = ctx.db
      .query("nutritionAIRecommendations")
      .withIndex("by_userId_timestamp", (q) => q.eq("userId", args.userId));

    if (args.recommendationType) {
      q = ctx.db
        .query("nutritionAIRecommendations")
        .withIndex("by_userId_type", (q) => 
          q.eq("userId", args.userId).eq("recommendationType", args.recommendationType)
        );
    }

    const recommendations = await q.order("desc").take(20);

    if (args.active) {
      const now = Date.now();
      return recommendations.filter(rec => 
        !rec.expiresAt || rec.expiresAt > now
      );
    }

    return recommendations;
  },
});

// Nutrition Safety Alerts
export const createNutritionSafetyAlert = mutation({
  args: {
    userId: v.string(),
    alertType: v.string(),
    severity: v.string(),
    message: v.string(),
    nutritionData: v.object({
      currentIntake: v.object({}),
      recommendedRange: v.object({}),
      violatedThreshold: v.string(),
    }),
    medicalRelevance: v.optional(v.array(v.string())),
    actionRequired: v.boolean(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("nutritionSafetyAlerts", {
      userId: args.userId,
      alertType: args.alertType,
      severity: args.severity,
      message: args.message,
      nutritionData: args.nutritionData,
      medicalRelevance: args.medicalRelevance,
      actionRequired: args.actionRequired,
      acknowledged: false,
      resolvedAt: undefined,
      createdAt: Date.now(),
    });
  },
});

export const acknowledgeNutritionSafetyAlert = mutation({
  args: {
    alertId: v.id("nutritionSafetyAlerts"),
    resolved: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const updates: any = {
      acknowledged: true,
    };

    if (args.resolved) {
      updates.resolvedAt = Date.now();
    }

    return await ctx.db.patch(args.alertId, updates);
  },
});

export const getNutritionSafetyAlerts = query({
  args: { 
    userId: v.string(),
    unacknowledged: v.optional(v.boolean()),
    severity: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let q = ctx.db
      .query("nutritionSafetyAlerts")
      .withIndex("by_userId_timestamp", (q) => q.eq("userId", args.userId));

    if (args.severity) {
      q = ctx.db
        .query("nutritionSafetyAlerts")
        .withIndex("by_userId_severity", (q) => 
          q.eq("userId", args.userId).eq("severity", args.severity)
        );
    }

    const alerts = await q.order("desc").take(50);

    if (args.unacknowledged) {
      return alerts.filter(alert => !alert.acknowledged);
    }

    return alerts;
  },
});

// Meal Planning Functions
export const createMealPlan = mutation({
  args: {
    userId: v.string(),
    date: v.string(),
    planType: v.string(),
    meals: v.array(v.object({
      mealType: v.string(),
      foods: v.array(v.object({
        foodId: v.string(),
        name: v.string(),
        quantity: v.number(),
        unit: v.string(),
        nutrition: v.object({
          calories: v.number(),
          protein: v.number(),
          carbs: v.number(),
          fat: v.number(),
        }),
      })),
      timing: v.optional(v.string()),
      recoveryOptimized: v.boolean(),
      workoutRelated: v.boolean(),
    })),
    totalNutrition: v.object({
      calories: v.number(),
      protein: v.number(),
      carbs: v.number(),
      fat: v.number(),
      hydration: v.number(),
    }),
    recoveryConsiderations: v.optional(v.object({
      recoveryScore: v.number(),
      recommendedAdjustments: v.array(v.string()),
      appliedAdjustments: v.array(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("mealPlans", {
      userId: args.userId,
      date: args.date,
      planType: args.planType,
      meals: args.meals,
      totalNutrition: args.totalNutrition,
      recoveryConsiderations: args.recoveryConsiderations,
      adherence: undefined,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const updateMealPlanAdherence = mutation({
  args: {
    userId: v.string(),
    date: v.string(),
    mealsCompleted: v.number(),
    totalMeals: v.number(),
    macroAccuracy: v.number(),
  },
  handler: async (ctx, args) => {
    const mealPlan = await ctx.db
      .query("mealPlans")
      .withIndex("by_userId_date", (q) => 
        q.eq("userId", args.userId).eq("date", args.date)
      )
      .first();

    if (!mealPlan) {
      throw new Error("No meal plan found for this date");
    }

    return await ctx.db.patch(mealPlan._id, {
      adherence: {
        mealsCompleted: args.mealsCompleted,
        totalMeals: args.totalMeals,
        macroAccuracy: args.macroAccuracy,
        updatedAt: Date.now(),
      },
      updatedAt: Date.now(),
    });
  },
});

export const getMealPlans = query({
  args: { 
    userId: v.string(),
    date: v.optional(v.string()),
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    if (args.date) {
      return await ctx.db
        .query("mealPlans")
        .withIndex("by_userId_date", (q) => 
          q.eq("userId", args.userId).eq("date", args.date)
        )
        .first();
    } else {
      const daysToFetch = args.days || 7;
      return await ctx.db
        .query("mealPlans")
        .withIndex("by_userId_timestamp", (q) => q.eq("userId", args.userId))
        .order("desc")
        .take(daysToFetch);
    }
  },
});

// Analytics and Insights
export const getNutritionAnalytics = query({
  args: { 
    userId: v.string(),
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const daysBack = args.days || 7;
    const cutoffTime = Date.now() - (daysBack * 24 * 60 * 60 * 1000);

    // Get recent recommendations
    const recommendations = await ctx.db
      .query("nutritionAIRecommendations")
      .withIndex("by_userId_timestamp", (q) => q.eq("userId", args.userId))
      .filter(q => q.gte(q.field("createdAt"), cutoffTime))
      .collect();

    // Get recent safety alerts
    const safetyAlerts = await ctx.db
      .query("nutritionSafetyAlerts")
      .withIndex("by_userId_timestamp", (q) => q.eq("userId", args.userId))
      .filter(q => q.gte(q.field("createdAt"), cutoffTime))
      .collect();

    // Get recent recovery metrics
    const recoveryMetrics = await ctx.db
      .query("recoveryMetrics")
      .withIndex("by_userId_timestamp", (q) => q.eq("userId", args.userId))
      .filter(q => q.gte(q.field("createdAt"), cutoffTime))
      .collect();

    // Calculate analytics
    const totalRecommendations = recommendations.length;
    const acceptedRecommendations = recommendations.filter(
      r => r.userResponse?.accepted
    ).length;
    
    const acceptanceRate = totalRecommendations > 0 
      ? acceptedRecommendations / totalRecommendations 
      : 0;

    const criticalAlerts = safetyAlerts.filter(a => a.severity === 'critical').length;
    const avgRecoveryScore = recoveryMetrics.length > 0
      ? recoveryMetrics.reduce((sum, m) => sum + m.recoveryScore, 0) / recoveryMetrics.length
      : 50;

    return {
      period_days: daysBack,
      total_recommendations: totalRecommendations,
      acceptance_rate: acceptanceRate,
      critical_safety_alerts: criticalAlerts,
      average_recovery_score: avgRecoveryScore,
      recommendations_by_type: recommendations.reduce((acc, r) => {
        acc[r.recommendationType] = (acc[r.recommendationType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      safety_alerts_by_severity: safetyAlerts.reduce((acc, a) => {
        acc[a.severity] = (acc[a.severity] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };
  },
});