import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Re-export functions from aiTraining module with expected names
import { 
  startTrainingSession as _startTrainingSession,
  getTrainingSession as _getTrainingSession,
  submitTrainingData as _submitTrainingData,
  listAIModels as _listAIModels,
  deployAIModel as _deployAIModel,
  rollbackAIModel as _rollbackAIModel,
  updateTrainingSession as _updateTrainingSession,
  getSessionTrainingData as _getSessionTrainingData,
  getAIModel as _getAIModel,
  anonymizeWorkoutData as _anonymizeWorkoutData
} from './aiTraining.js';

// Training Session Management
export const startTrainingSession = _startTrainingSession;
export const getTrainingSession = _getTrainingSession;
export const updateTrainingSession = _updateTrainingSession;

// Training Data Management
export const submitTrainingData = _submitTrainingData;
export const getSessionTrainingData = _getSessionTrainingData;

// AI Model Management
export const listAIModels = _listAIModels;
export const deployAIModel = _deployAIModel;
export const rollbackAIModel = _rollbackAIModel;
export const getAIModel = _getAIModel;

// Data Processing
export const anonymizeWorkoutData = _anonymizeWorkoutData;

// Additional functions expected by contract tests
export const retryTrainingSession = mutation({
  args: {
    sessionId: v.string(),
    retryCount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Get the existing session
    const session = await ctx.db
      .query("trainingSessions")
      .filter((q) => q.eq(q.field("sessionId"), args.sessionId))
      .first();
    
    if (!session) {
      throw new Error(`Training session ${args.sessionId} not found`);
    }

    // Check retry limit (max 5 retries as per contract)
    const currentRetries = session.retryCount || 0;
    if (currentRetries >= 5) {
      throw new Error("Maximum retry attempts (5) exceeded for this training session");
    }

    // Update session with retry
    await ctx.db.patch(session._id, {
      status: "retrying",
      retryCount: currentRetries + 1,
      updatedAt: Date.now(),
    });

    return {
      sessionId: args.sessionId,
      status: "retrying",
      retryCount: currentRetries + 1,
    };
  },
});
