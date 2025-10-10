import { mutation, query } from '../_generated/server';
import { v } from 'convex/values';
import type { Id } from '../_generated/dataModel';

// T038: Submit training data
export const submitTrainingData = mutation({
  args: {
    userId: v.string(),
    dataType: v.string(),
    content: v.object({
      workout: v.optional(v.object({
        exercises: v.array(v.string()),
        sets: v.array(v.number()),
        reps: v.array(v.number()),
        weights: v.array(v.number()),
        duration: v.number(),
        intensity: v.number(),
        context: v.object({}),
      })),
      nutrition: v.optional(v.object({
        meals: v.array(v.object({})),
        calories: v.number(),
        macros: v.object({
          protein: v.number(),
          carbs: v.number(),
          fat: v.number(),
        }),
        timing: v.array(v.string()),
      })),
      recovery: v.optional(v.object({
        sleepHours: v.number(),
        recoveryScore: v.number(),
        hrv: v.optional(v.number()),
        stress: v.number(),
        activities: v.array(v.string()),
      })),
      voiceInteraction: v.optional(v.object({
        transcript: v.string(),
        intent: v.string(),
        confidence: v.number(),
        duration: v.number(),
        emotionalTone: v.optional(v.string()),
      })),
    }),
    annotations: v.object({
      labels: v.array(v.string()),
      categories: v.array(v.string()),
      qualityScore: v.number(),
      verified: v.boolean(),
      source: v.string(),
    }),
    privacy: v.object({
      anonymized: v.boolean(),
      consentLevel: v.string(),
      retentionDate: v.number(),
      sharePermission: v.boolean(),
    }),
  },
  handler: async (ctx, args) => {
    // Validate user exists and has training consent
    const user = await ctx.db.get(args.userId as Id<"users">);
    if (!user || !user.aiTrainingConsent) {
      throw new Error('User not found or AI training consent not provided');
    }

    // Validate data type
    const validDataTypes = ['workout', 'nutrition', 'recovery', 'voice_interaction'];
    if (!validDataTypes.includes(args.dataType)) {
      throw new Error(`Invalid data type. Must be one of: ${validDataTypes.join(', ')}`);
    }

    // Validate content matches data type
    if (args.dataType === 'workout' && !args.content.workout) {
      throw new Error('Workout content required for workout data type');
    }
    if (args.dataType === 'nutrition' && !args.content.nutrition) {
      throw new Error('Nutrition content required for nutrition data type');
    }
    if (args.dataType === 'recovery' && !args.content.recovery) {
      throw new Error('Recovery content required for recovery data type');
    }
    if (args.dataType === 'voice_interaction' && !args.content.voiceInteraction) {
      throw new Error('Voice interaction content required for voice_interaction data type');
    }

    // Validate quality score
    if (args.annotations.qualityScore < 0 || args.annotations.qualityScore > 1) {
      throw new Error('Quality score must be between 0 and 1');
    }

    // Validate consent level
    const validConsentLevels = ['none', 'anonymous', 'identified', 'full'];
    if (!validConsentLevels.includes(args.privacy.consentLevel)) {
      throw new Error(`Invalid consent level. Must be one of: ${validConsentLevels.join(', ')}`);
    }

    // Create training data entry
    const now = Date.now();
    const trainingDataId = await ctx.db.insert('aiTrainingData', {
      userId: args.userId,
      dataType: args.dataType,
      content: args.content,
      annotations: args.annotations,
      privacy: args.privacy,
      processingStatus: 'pending',
      createdAt: now,
      updatedAt: now,
    });

    return { id: trainingDataId, status: 'submitted' };
  },
});

// T039: List training sessions
export const listTrainingSessions = query({
  args: {
    modelType: v.optional(v.string()),
    status: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query('trainingSessions');

    // Apply filters
    if (args.status) {
      query = query.filter((q) => q.eq(q.field('status'), args.status));
    }

    // Apply limit (default 50)
    const limit = args.limit || 50;
    const sessions = await query.order('desc').take(limit);

    // If modelType filter is provided, join with aiModels to filter
    if (args.modelType) {
      const filteredSessions = [];
      for (const session of sessions) {
        const model = await ctx.db.get(session.modelId);
        if (model && model.type === args.modelType) {
          filteredSessions.push({
            ...session,
            modelName: model.name,
            modelType: model.type,
          });
        }
      }
      return filteredSessions;
    }

    // Add model info to all sessions
    const sessionsWithModels = [];
    for (const session of sessions) {
      const model = await ctx.db.get(session.modelId);
      sessionsWithModels.push({
        ...session,
        modelName: model?.name || 'Unknown',
        modelType: model?.type || 'Unknown',
      });
    }

    return sessionsWithModels;
  },
});

// T040: Get training session status
export const getTrainingSessionStatus = query({
  args: {
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query('trainingSessions')
      .filter((q) => q.eq(q.field('sessionId'), args.sessionId))
      .first();

    if (!session) {
      throw new Error('Training session not found');
    }

    const model = await ctx.db.get(session.modelId);

    return {
      ...session,
      modelName: model?.name || 'Unknown',
      modelType: model?.type || 'Unknown',
      progressPercentage: session.progress.totalEpochs > 0 
        ? (session.progress.currentEpoch / session.progress.totalEpochs) * 100 
        : 0,
    };
  },
});

// T041: Update training data processing status
export const updateProcessingStatus = mutation({
  args: {
    trainingDataId: v.id('aiTrainingData'),
    status: v.string(),
    annotations: v.optional(v.object({
      labels: v.array(v.string()),
      categories: v.array(v.string()),
      qualityScore: v.number(),
      verified: v.boolean(),
      source: v.string(),
    })),
  },
  handler: async (ctx, args) => {
    const validStatuses = ['pending', 'processing', 'completed', 'failed', 'skipped'];
    if (!validStatuses.includes(args.status)) {
      throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    const trainingData = await ctx.db.get(args.trainingDataId);
    if (!trainingData) {
      throw new Error('Training data not found');
    }

    const updateData: any = {
      processingStatus: args.status,
      updatedAt: Date.now(),
    };

    if (args.annotations) {
      updateData.annotations = args.annotations;
    }

    await ctx.db.patch(args.trainingDataId, updateData);

    return { success: true, status: args.status };
  },
});

// T042: Get user training data
export const getUserTrainingData = query({
  args: {
    userId: v.string(),
    dataType: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query('aiTrainingData')
      .filter((q) => q.eq(q.field('userId'), args.userId));

    if (args.dataType) {
      query = query.filter((q) => q.eq(q.field('dataType'), args.dataType));
    }

    const limit = args.limit || 100;
    const trainingData = await query.order('desc').take(limit);

    return trainingData.map((data) => ({
      id: data._id,
      dataType: data.dataType,
      processingStatus: data.processingStatus,
      qualityScore: data.annotations.qualityScore,
      verified: data.annotations.verified,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      // Don't return the actual content for privacy
      contentSummary: {
        hasWorkout: !!data.content.workout,
        hasNutrition: !!data.content.nutrition,
        hasRecovery: !!data.content.recovery,
        hasVoiceInteraction: !!data.content.voiceInteraction,
      },
    }));
  },
});