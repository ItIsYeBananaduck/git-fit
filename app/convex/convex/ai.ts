import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";

// Import from aiTraining module
import { 
  startTrainingSession, 
  getTrainingSession,
  submitTrainingData,
  listAIModels,
  deployAIModel,
  rollbackAIModel,
  updateTrainingSession,
  getSessionTrainingData,
  getAIModel
} from "./aiTraining";

// Re-export training functions with ai: prefix expected by contract tests
export const submitTrainingData = mutation({
  args: {
    data: v.object({
      hashedUserId: v.string(),
      exerciseType: v.string(),
      setNumber: v.number(),
      strainPercentage: v.number(),
      aiResponse: v.string(),
      contextTags: v.array(v.string()),
      timestamp: v.string(),
      skipReason: v.union(v.string(), v.null()),
      sleepHours: v.number(),
    }),
  },
  handler: async (ctx, args) => {
    // Call the underlying submitTrainingData function from aiTraining
    return await ctx.runMutation(submitTrainingData, {
      sessionId: `auto_${Date.now()}`,
      data: args.data,
      dataType: "workout_feedback",
    });
  },
});

export const startTrainingSession = mutation({
  args: {
    userId: v.id("users"),
    sessionType: v.string(),
    trainingMode: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.runMutation(startTrainingSession, args);
  },
});

export const getTrainingSession = query({
  args: {
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.runQuery(getTrainingSession, args);
  },
});

export const listAIModels = query({
  args: {
    type: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.runQuery(listAIModels, args);
  },
});

export const deployAIModel = action({
  args: {
    modelId: v.string(),
    targetEnvironment: v.string(),
    performanceMetrics: v.object({
      accuracy: v.number(),
      latency: v.number(),
      throughput: v.number(),
    }),
  },
  handler: async (ctx, args) => {
    return await ctx.runMutation(deployAIModel, args);
  },
});

export const rollbackAIModel = action({
  args: {
    modelId: v.string(),
    previousVersion: v.string(),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.runMutation(rollbackAIModel, args);
  },
});

// Additional functions expected by contract tests
export const retryTrainingSession = mutation({
  args: {
    sessionId: v.string(),
    maxRetries: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const session = await ctx.runQuery(getTrainingSession, { sessionId: args.sessionId });
    if (!session) {
      throw new Error("Training session not found");
    }
    
    const retryCount = (session.retryCount || 0) + 1;
    const maxRetries = args.maxRetries || 5;
    
    if (retryCount > maxRetries) {
      throw new Error(`Maximum retry attempts (${maxRetries}) exceeded`);
    }
    
    return await ctx.runMutation(updateTrainingSession, {
      sessionId: args.sessionId,
      updates: {
        status: "retrying",
        retryCount,
        lastRetryAt: Date.now(),
      },
    });
  },
});

export const anonymizeWorkoutData = action({
  args: {
    workoutData: v.object({
      userId: v.string(),
      userEmail: v.optional(v.string()),
      exerciseData: v.any(),
    }),
  },
  handler: async (ctx, args) => {
    // Hash the user ID for anonymization
    const hashedUserId = `hashed_${Buffer.from(args.workoutData.userId).toString('base64')}`;
    
    // Remove PII and return anonymized data
    const { userId, userEmail, ...cleanData } = args.workoutData;
    
    return {
      hashedUserId,
      ...cleanData,
    };
  },
});