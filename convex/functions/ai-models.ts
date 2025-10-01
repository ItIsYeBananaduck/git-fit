import { mutation, query } from '../_generated/server';
import { v } from 'convex/values';

// T048: List available models
export const listAvailableModels = query({
  args: {
    type: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query('aiModels');

    if (args.type) {
      query = query.filter((q) => q.eq(q.field('type'), args.type));
    }

    if (args.status) {
      query = query.filter((q) => q.eq(q.field('status'), args.status));
    }

    const models = await query.collect();

    return models.map((model) => ({
      id: model._id,
      name: model.name,
      version: model.version,
      type: model.type,
      status: model.status,
      accuracy: model.metrics.accuracy,
      latency: model.metrics.latency,
      userSatisfaction: model.metrics.userSatisfaction,
      lastTrainingDate: model.training.lastTrainingDate,
      createdAt: model.createdAt,
    }));
  },
});

// T049: Get model performance
export const getModelPerformance = query({
  args: {
    modelId: v.id('aiModels'),
    timeRange: v.optional(v.string()), // '24h', '7d', '30d'
  },
  handler: async (ctx, args) => {
    const model = await ctx.db.get(args.modelId);
    if (!model) {
      throw new Error('Model not found');
    }

    // Get training sessions for this model
    const trainingSessions = await ctx.db
      .query('trainingSessions')
      .filter((q) => q.eq(q.field('modelId'), args.modelId))
      .order('desc')
      .take(10);

    // Calculate performance metrics
    const completedSessions = trainingSessions.filter(s => s.status === 'completed');
    const averageAccuracy = completedSessions.length > 0
      ? completedSessions.reduce((sum, s) => {
          const lastAccuracy = s.metrics.accuracy[s.metrics.accuracy.length - 1];
          return sum + (lastAccuracy || 0);
        }, 0) / completedSessions.length
      : 0;

    return {
      model: {
        id: model._id,
        name: model.name,
        version: model.version,
        type: model.type,
        status: model.status,
      },
      currentMetrics: model.metrics,
      trainingHistory: {
        totalSessions: trainingSessions.length,
        completedSessions: completedSessions.length,
        averageAccuracy,
        lastTrainingDate: model.training.lastTrainingDate,
        nextScheduledTraining: model.training.nextScheduledTraining,
      },
      recentSessions: trainingSessions.slice(0, 5).map(session => ({
        sessionId: session.sessionId,
        status: session.status,
        startedAt: session.startedAt,
        completedAt: session.completedAt,
        finalAccuracy: session.metrics.accuracy[session.metrics.accuracy.length - 1] || 0,
        duration: session.completedAt ? session.completedAt - session.startedAt : null,
      })),
    };
  },
});

// T050: Update model status
export const updateModelStatus = mutation({
  args: {
    modelId: v.id('aiModels'),
    status: v.string(),
    metrics: v.optional(v.object({
      accuracy: v.optional(v.number()),
      latency: v.optional(v.number()),
      throughput: v.optional(v.number()),
      errorRate: v.optional(v.number()),
      userSatisfaction: v.optional(v.number()),
    })),
  },
  handler: async (ctx, args) => {
    const validStatuses = ['training', 'active', 'deprecated', 'failed'];
    if (!validStatuses.includes(args.status)) {
      throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    const model = await ctx.db.get(args.modelId);
    if (!model) {
      throw new Error('Model not found');
    }

    const updateData: any = {
      status: args.status,
      updatedAt: Date.now(),
    };

    if (args.metrics) {
      updateData.metrics = {
        ...model.metrics,
        ...args.metrics,
      };
    }

    await ctx.db.patch(args.modelId, updateData);

    return { success: true, status: args.status };
  },
});

// T051: Create training session
export const createTrainingSession = mutation({
  args: {
    modelId: v.id('aiModels'),
    datasetInfo: v.object({
      totalSamples: v.number(),
      trainingSamples: v.number(),
      validationSamples: v.number(),
      testSamples: v.number(),
      dataTypes: v.array(v.string()),
    }),
    configuration: v.optional(v.object({
      epochs: v.optional(v.number()),
      batchSize: v.optional(v.number()),
      learningRate: v.optional(v.number()),
      computeType: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    const model = await ctx.db.get(args.modelId);
    if (!model) {
      throw new Error('Model not found');
    }

    const sessionId = `train_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const epochs = args.configuration?.epochs || 10;
    const batchSize = args.configuration?.batchSize || 32;
    const learningRate = args.configuration?.learningRate || 0.001;
    const computeType = args.configuration?.computeType || 'cpu';

    const totalBatches = Math.ceil(args.datasetInfo.trainingSamples / batchSize);
    const estimatedCompletion = Date.now() + (epochs * totalBatches * 1000); // rough estimate

    const trainingSessionId = await ctx.db.insert('trainingSessions', {
      modelId: args.modelId,
      sessionId,
      status: 'preparing',
      datasetInfo: args.datasetInfo,
      progress: {
        currentEpoch: 0,
        totalEpochs: epochs,
        currentBatch: 0,
        totalBatches,
        estimatedCompletion,
      },
      metrics: {
        trainingLoss: [],
        validationLoss: [],
        accuracy: [],
        learningRate,
      },
      resources: {
        computeType,
        memoryUsage: 0,
        gpuUtilization: computeType.includes('gpu') ? 0 : undefined,
        estimatedCost: calculateTrainingCost(args.datasetInfo.totalSamples, epochs, computeType),
      },
      logs: [{
        timestamp: Date.now(),
        level: 'info',
        message: 'Training session created',
        details: { sessionId, epochs, batchSize, learningRate },
      }],
      startedAt: Date.now(),
      createdAt: Date.now(),
    });

    return {
      sessionId,
      trainingSessionId,
      estimatedCompletion,
      status: 'preparing',
    };
  },
});

// T052: Update training progress
export const updateTrainingProgress = mutation({
  args: {
    sessionId: v.string(),
    progress: v.object({
      currentEpoch: v.number(),
      currentBatch: v.number(),
      estimatedCompletion: v.optional(v.number()),
    }),
    metrics: v.optional(v.object({
      trainingLoss: v.optional(v.array(v.number())),
      validationLoss: v.optional(v.array(v.number())),
      accuracy: v.optional(v.array(v.number())),
    })),
    resources: v.optional(v.object({
      memoryUsage: v.optional(v.number()),
      gpuUtilization: v.optional(v.number()),
    })),
    log: v.optional(v.object({
      level: v.string(),
      message: v.string(),
      details: v.optional(v.object({})),
    })),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query('trainingSessions')
      .filter((q) => q.eq(q.field('sessionId'), args.sessionId))
      .first();

    if (!session) {
      throw new Error('Training session not found');
    }

    const updateData: any = {
      progress: {
        ...session.progress,
        ...args.progress,
      },
    };

    if (args.metrics) {
      updateData.metrics = {
        ...session.metrics,
        trainingLoss: args.metrics.trainingLoss || session.metrics.trainingLoss,
        validationLoss: args.metrics.validationLoss || session.metrics.validationLoss,
        accuracy: args.metrics.accuracy || session.metrics.accuracy,
      };
    }

    if (args.resources) {
      updateData.resources = {
        ...session.resources,
        ...args.resources,
      };
    }

    if (args.log) {
      updateData.logs = [
        ...session.logs,
        {
          timestamp: Date.now(),
          level: args.log.level,
          message: args.log.message,
          details: args.log.details,
        },
      ];
    }

    // Update status based on progress
    if (args.progress.currentEpoch >= session.progress.totalEpochs) {
      updateData.status = 'completed';
      updateData.completedAt = Date.now();
    } else if (session.status === 'preparing') {
      updateData.status = 'running';
    }

    await ctx.db.patch(session._id, updateData);

    return { success: true, status: updateData.status || session.status };
  },
});

// T053: Get training logs
export const getTrainingLogs = query({
  args: {
    sessionId: v.string(),
    level: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query('trainingSessions')
      .filter((q) => q.eq(q.field('sessionId'), args.sessionId))
      .first();

    if (!session) {
      throw new Error('Training session not found');
    }

    let logs = session.logs;

    if (args.level) {
      logs = logs.filter(log => log.level === args.level);
    }

    const limit = args.limit || 100;
    const recentLogs = logs.slice(-limit);

    return {
      sessionId: args.sessionId,
      totalLogs: logs.length,
      logs: recentLogs,
      session: {
        status: session.status,
        progress: session.progress,
        startedAt: session.startedAt,
        completedAt: session.completedAt,
      },
    };
  },
});

// Helper function to calculate training cost
function calculateTrainingCost(
  totalSamples: number,
  epochs: number,
  computeType: string
): number {
  const baseRatePerSample = computeType.includes('gpu') ? 0.001 : 0.0001;
  return totalSamples * epochs * baseRatePerSample;
}