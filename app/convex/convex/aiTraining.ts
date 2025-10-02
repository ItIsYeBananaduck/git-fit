import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const startTrainingSession = mutation({
  args: {
    userId: v.id("users"),
    sessionType: v.string(),
    trainingMode: v.string(),
  },
  handler: async (ctx, args) => {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    
    await ctx.db.insert('trainingSessions', {
      sessionId,
      userId: args.userId,
      sessionType: args.sessionType,
      trainingMode: args.trainingMode,
      status: 'active',
      progress: 0,
      metrics: {},
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { 
      success: true, 
      sessionId,
      message: 'Training session started successfully' 
    };
  },
});

export const getTrainingSession = query({
  args: { sessionId: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query('trainingSessions')
      .filter((q) => q.eq(q.field('sessionId'), args.sessionId))
      .first();

    if (!session) {
      return { error: 'Training session not found' };
    }

    return {
      success: true,
      session: {
        sessionId: session.sessionId,
        status: session.status,
        progress: session.progress,
        sessionType: session.sessionType,
        trainingMode: session.trainingMode,
        startedAt: session.startedAt || null,
        estimatedCompletion: session.completedAt || null,
        metrics: session.metrics
      }
    };
  },
});

export const submitTrainingData = mutation({
  args: {
    sessionId: v.string(),
    dataType: v.string(),
    trainingData: v.any(),
  },
  handler: async (ctx, args) => {
    const dataId = `data_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    
    await ctx.db.insert('aiTrainingData', {
      dataId,
      sessionId: args.sessionId,
      dataType: args.dataType,
      anonymizedData: args.trainingData,
      annotations: {},
      submittedAt: Date.now(),
      createdAt: Date.now(),
    });

    return { 
      success: true, 
      dataId,
      message: 'Training data submitted successfully' 
    };
  },
});

export const listAIModels = query({
  args: {},
  handler: async (ctx, args) => {
    const models = await ctx.db.query('aiModels').collect();
    
    return {
      success: true,
      models: models.map(model => ({
        modelId: model.modelId,
        name: model.name,
        version: model.version,
        type: model.type,
        status: model.status,
      }))
    };
  },
});

export const deployAIModel = mutation({
  args: {
    modelId: v.string(),
    environment: v.string(),
  },
  handler: async (ctx, args) => {
    const model = await ctx.db
      .query('aiModels')
      .filter((q) => q.eq(q.field('modelId'), args.modelId))
      .first();

    if (!model) {
      return { success: false, error: 'Model not found' };
    }

    await ctx.db.patch(model._id, {
      status: 'deployed',
      updatedAt: Date.now()
    });

    return { 
      success: true, 
      message: `Model ${args.modelId} deployed successfully` 
    };
  },
});

export const rollbackAIModel = mutation({
  args: {
    modelId: v.string(),
    targetVersion: v.string(),
  },
  handler: async (ctx, args) => {
    const model = await ctx.db
      .query('aiModels')
      .filter((q) => q.eq(q.field('modelId'), args.modelId))
      .first();

    if (!model) {
      return { success: false, error: 'Model not found' };
    }

    await ctx.db.patch(model._id, {
      status: 'archived',
      updatedAt: Date.now()
    });

    return { 
      success: true, 
      message: `Model ${args.modelId} rolled back successfully` 
    };
  },
});

export const updateTrainingSession = mutation({
  args: {
    sessionId: v.string(),
    status: v.optional(v.string()),
    progress: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query('trainingSessions')
      .filter((q) => q.eq(q.field('sessionId'), args.sessionId))
      .first();

    if (!session) {
      return { error: 'Training session not found' };
    }

    const updateData: any = {
      updatedAt: Date.now()
    };

    if (args.status) {
      updateData.status = args.status;
    }
    if (args.progress !== undefined) {
      updateData.progress = args.progress;
    }

    await ctx.db.patch(session._id, updateData);

    return { 
      success: true, 
      message: 'Training session updated successfully' 
    };
  },
});

export const getSessionTrainingData = query({
  args: { sessionId: v.string() },
  handler: async (ctx, args) => {
    const trainingData = await ctx.db
      .query('aiTrainingData')
      .filter((q) => q.eq(q.field('sessionId'), args.sessionId))
      .collect();

    return {
      success: true,
      data: trainingData.map(data => ({
        dataId: data.dataId,
        dataType: data.dataType,
        submittedAt: new Date(data.submittedAt),
        anonymizedData: data.anonymizedData,
        annotations: data.annotations
      }))
    };
  },
});

export const getAIModel = query({
  args: { modelId: v.string() },
  handler: async (ctx, args) => {
    const model = await ctx.db
      .query('aiModels')
      .filter((q) => q.eq(q.field('modelId'), args.modelId))
      .first();

    if (!model) {
      return { success: false, error: 'Model not found' };
    }

    return {
      success: true,
      model: {
        modelId: model.modelId,
        name: model.name,
        version: model.version,
        type: model.type,
        status: model.status,
      }
    };
  },
});

// Note: For actions that require Node.js (like crypto), create a separate file
// This is a placeholder that will be implemented in a Node.js action file
export const anonymizeWorkoutData = mutation({
  args: {
    workoutData: v.object({
      userId: v.string(),
      userEmail: v.optional(v.string()),
      exerciseType: v.string(),
      sets: v.array(v.object({
        weight: v.number(),
        reps: v.number(),
        strainPercentage: v.number(),
      })),
      timestamp: v.string(),
    }),
  },
  handler: async (ctx, args) => {
    const { workoutData } = args;
    
    // Simple hash simulation without Node.js crypto
    // In production, this should be done with a proper crypto action
    let hash = 0;
    const str = workoutData.userId;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    const hashedUserId = Math.abs(hash).toString(16).padStart(16, '0');
    
    // Remove PII and return anonymized data
    const anonymizedData = {
      hashedUserId,
      exerciseType: workoutData.exerciseType,
      sets: workoutData.sets,
      timestamp: workoutData.timestamp,
      // Remove userId and userEmail
    };
    
    return anonymizedData;
  },
});