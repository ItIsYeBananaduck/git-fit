/**
 * Convex Functions: Training Data Management
 * Task: T033 - Implement training data CRUD operations
 */

import { v } from "convex/values";
import { mutation, query } from "../_generated/server";

/**
 * Create a new training data entry
 */
export const createTrainingData = mutation({
    args: {
        user_id: v.id("users"),
        persona_id: v.id("aiCoachingPersonas"),
        input_context: v.object({
            exercise_type: v.string(),
            user_performance: v.object({
                reps: v.optional(v.number()),
                weight: v.optional(v.number()),
                duration: v.optional(v.number()),
                heart_rate: v.optional(v.number()),
                form_score: v.optional(v.number()),
                difficulty_rating: v.optional(v.number()),
            }),
            workout_phase: v.union(
                v.literal("warmup"),
                v.literal("main"),
                v.literal("cooldown"),
                v.literal("rest")
            ),
            environmental_factors: v.optional(v.object({
                time_of_day: v.optional(v.string()),
                gym_crowdedness: v.optional(v.string()),
                equipment_availability: v.optional(v.boolean()),
            })),
        }),
        expected_response: v.string(),
        response_type: v.union(
            v.literal("motivation"),
            v.literal("correction"),
            v.literal("encouragement"),
            v.literal("instruction"),
            v.literal("celebration")
        ),
        quality_score: v.optional(v.number()),
        source: v.union(
            v.literal("user_feedback"),
            v.literal("expert_annotation"),
            v.literal("automated_collection"),
            v.literal("user_correction")
        ),
        validation_status: v.optional(v.union(
            v.literal("pending"),
            v.literal("approved"),
            v.literal("rejected")
        )),
    },
    handler: async (ctx, args) => {
        // Validate user exists
        const user = await ctx.db.get(args.user_id);
        if (!user) {
            throw new Error("User not found");
        }

        // Validate persona exists
        const persona = await ctx.db.get(args.persona_id);
        if (!persona) {
            throw new Error("Persona not found");
        }

        // Validate quality score (1-10)
        if (args.quality_score && (args.quality_score < 1 || args.quality_score > 10)) {
            throw new Error("Quality score must be between 1 and 10");
        }

        const trainingDataId = await ctx.db.insert("trainingData", {
            ...args,
            quality_score: args.quality_score ?? 5,
            validation_status: args.validation_status ?? "pending",
            created_at: Date.now(),
            updated_at: Date.now(),
        });

        return trainingDataId;
    },
});

/**
 * Get training data for a specific persona
 */
export const getPersonaTrainingData = query({
    args: {
        persona_id: v.id("aiCoachingPersonas"),
        validation_status: v.optional(v.union(
            v.literal("pending"),
            v.literal("approved"),
            v.literal("rejected")
        )),
        min_quality_score: v.optional(v.number()),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        let trainingData = await ctx.db
            .query("trainingData")
            .filter((q) => q.eq(q.field("persona_id"), args.persona_id))
            .order("desc")
            .collect();

        // Filter by validation status if provided
        if (args.validation_status) {
            trainingData = trainingData.filter((data) =>
                data.validation_status === args.validation_status
            );
        }

        // Filter by minimum quality score if provided
        if (args.min_quality_score) {
            trainingData = trainingData.filter((data) =>
                data.quality_score >= args.min_quality_score
            );
        }

        // Apply limit
        if (args.limit) {
            trainingData = trainingData.slice(0, args.limit);
        }

        return trainingData.map((data) => ({
            _id: data._id,
            input_context: data.input_context,
            expected_response: data.expected_response,
            response_type: data.response_type,
            quality_score: data.quality_score,
            source: data.source,
            validation_status: data.validation_status,
            created_at: data.created_at,
        }));
    },
});

/**
 * Get training data by exercise type
 */
export const getTrainingDataByExercise = query({
    args: {
        exercise_type: v.string(),
        response_type: v.optional(v.union(
            v.literal("motivation"),
            v.literal("correction"),
            v.literal("encouragement"),
            v.literal("instruction"),
            v.literal("celebration")
        )),
        approved_only: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        let trainingData = await ctx.db
            .query("trainingData")
            .filter((q) => q.eq(q.field("input_context.exercise_type"), args.exercise_type))
            .collect();

        // Filter by response type if provided
        if (args.response_type) {
            trainingData = trainingData.filter((data) =>
                data.response_type === args.response_type
            );
        }

        // Filter by approved status if requested
        if (args.approved_only) {
            trainingData = trainingData.filter((data) =>
                data.validation_status === "approved"
            );
        }

        return trainingData.map((data) => ({
            _id: data._id,
            persona_id: data.persona_id,
            input_context: data.input_context,
            expected_response: data.expected_response,
            quality_score: data.quality_score,
            source: data.source,
        }));
    },
});

/**
 * Update training data validation status
 */
export const updateValidationStatus = mutation({
    args: {
        trainingDataId: v.id("trainingData"),
        validation_status: v.union(
            v.literal("pending"),
            v.literal("approved"),
            v.literal("rejected")
        ),
        reviewer_notes: v.optional(v.string()),
        quality_score: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const { trainingDataId, ...updates } = args;

        const trainingData = await ctx.db.get(trainingDataId);
        if (!trainingData) {
            throw new Error("Training data not found");
        }

        // Validate quality score if provided
        if (updates.quality_score && (updates.quality_score < 1 || updates.quality_score > 10)) {
            throw new Error("Quality score must be between 1 and 10");
        }

        await ctx.db.patch(trainingDataId, {
            ...updates,
            updated_at: Date.now(),
        });

        return trainingDataId;
    },
});

/**
 * Update training data content
 */
export const updateTrainingData = mutation({
    args: {
        trainingDataId: v.id("trainingData"),
        input_context: v.optional(v.object({
            exercise_type: v.string(),
            user_performance: v.object({
                reps: v.optional(v.number()),
                weight: v.optional(v.number()),
                duration: v.optional(v.number()),
                heart_rate: v.optional(v.number()),
                form_score: v.optional(v.number()),
                difficulty_rating: v.optional(v.number()),
            }),
            workout_phase: v.union(
                v.literal("warmup"),
                v.literal("main"),
                v.literal("cooldown"),
                v.literal("rest")
            ),
            environmental_factors: v.optional(v.object({
                time_of_day: v.optional(v.string()),
                gym_crowdedness: v.optional(v.string()),
                equipment_availability: v.optional(v.boolean()),
            })),
        })),
        expected_response: v.optional(v.string()),
        response_type: v.optional(v.union(
            v.literal("motivation"),
            v.literal("correction"),
            v.literal("encouragement"),
            v.literal("instruction"),
            v.literal("celebration")
        )),
        quality_score: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const { trainingDataId, ...updates } = args;

        const trainingData = await ctx.db.get(trainingDataId);
        if (!trainingData) {
            throw new Error("Training data not found");
        }

        // Validate quality score if provided
        if (updates.quality_score && (updates.quality_score < 1 || updates.quality_score > 10)) {
            throw new Error("Quality score must be between 1 and 10");
        }

        await ctx.db.patch(trainingDataId, {
            ...updates,
            updated_at: Date.now(),
        });

        return trainingDataId;
    },
});

/**
 * Delete training data
 */
export const deleteTrainingData = mutation({
    args: { trainingDataId: v.id("trainingData") },
    handler: async (ctx, args) => {
        const trainingData = await ctx.db.get(args.trainingDataId);

        if (!trainingData) {
            throw new Error("Training data not found");
        }

        await ctx.db.delete(args.trainingDataId);
        return args.trainingDataId;
    },
});

/**
 * Collect training data from user feedback
 */
export const collectUserFeedback = mutation({
    args: {
        user_id: v.id("users"),
        response_id: v.id("voiceResponses"),
        feedback_type: v.union(
            v.literal("positive"),
            v.literal("negative"),
            v.literal("correction")
        ),
        improved_response: v.optional(v.string()),
        feedback_notes: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        // Get the original voice response
        const response = await ctx.db.get(args.response_id);
        if (!response) {
            throw new Error("Voice response not found");
        }

        // Only create training data for negative feedback or corrections
        if (args.feedback_type === "positive") {
            return null; // Just log the positive feedback, don't create training data
        }

        // Create training data from the feedback
        const trainingDataId = await ctx.db.insert("trainingData", {
            user_id: args.user_id,
            persona_id: response.persona_id,
            input_context: {
                exercise_type: response.context_data.exercise_type || "unknown",
                user_performance: response.context_data.performance_data || {},
                workout_phase: "main", // Default, could be inferred from context
            },
            expected_response: args.improved_response || response.text_content,
            response_type: response.response_type,
            quality_score: args.feedback_type === "negative" ? 2 : 8,
            source: "user_feedback",
            validation_status: "pending",
            feedback_metadata: {
                original_response_id: args.response_id,
                feedback_type: args.feedback_type,
                feedback_notes: args.feedback_notes,
            },
            created_at: Date.now(),
            updated_at: Date.now(),
        });

        return trainingDataId;
    },
});

/**
 * Get training data statistics
 */
export const getTrainingDataStats = query({
    args: {
        persona_id: v.optional(v.id("aiCoachingPersonas")),
        days: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const days = args.days ?? 30;
        const startTime = Date.now() - (days * 24 * 60 * 60 * 1000);

        let trainingData = await ctx.db
            .query("trainingData")
            .filter((q) => q.gte(q.field("created_at"), startTime))
            .collect();

        // Filter by persona if provided
        if (args.persona_id) {
            trainingData = trainingData.filter((data) => data.persona_id === args.persona_id);
        }

        // Calculate statistics
        const totalEntries = trainingData.length;
        const approvedEntries = trainingData.filter((d) => d.validation_status === "approved").length;
        const pendingEntries = trainingData.filter((d) => d.validation_status === "pending").length;
        const rejectedEntries = trainingData.filter((d) => d.validation_status === "rejected").length;

        // Quality distribution
        const qualityDistribution = trainingData.reduce((acc, data) => {
            const score = Math.floor(data.quality_score);
            acc[score] = (acc[score] || 0) + 1;
            return acc;
        }, {} as Record<number, number>);

        // Source distribution
        const sourceDistribution = trainingData.reduce((acc, data) => {
            acc[data.source] = (acc[data.source] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        // Response type distribution
        const responseTypeDistribution = trainingData.reduce((acc, data) => {
            acc[data.response_type] = (acc[data.response_type] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        // Average quality score
        const avgQualityScore = totalEntries > 0
            ? trainingData.reduce((sum, d) => sum + d.quality_score, 0) / totalEntries
            : 0;

        return {
            period_days: days,
            total_entries: totalEntries,
            approved_entries: approvedEntries,
            pending_entries: pendingEntries,
            rejected_entries: rejectedEntries,
            approval_rate: totalEntries > 0 ? (approvedEntries / totalEntries) * 100 : 0,
            quality_distribution: qualityDistribution,
            source_distribution: sourceDistribution,
            response_type_distribution: responseTypeDistribution,
            avg_quality_score: Math.round(avgQualityScore * 100) / 100,
        };
    },
});

/**
 * Get high-quality training samples for fine-tuning
 */
export const getFineTuningData = query({
    args: {
        persona_id: v.id("aiCoachingPersonas"),
        min_quality_score: v.optional(v.number()),
        max_samples: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const minQuality = args.min_quality_score ?? 7;
        const maxSamples = args.max_samples ?? 1000;

        const trainingData = await ctx.db
            .query("trainingData")
            .filter((q) =>
                q.and(
                    q.eq(q.field("persona_id"), args.persona_id),
                    q.eq(q.field("validation_status"), "approved"),
                    q.gte(q.field("quality_score"), minQuality)
                )
            )
            .order("desc")
            .take(maxSamples);

        // Format for fine-tuning (conversation format)
        return trainingData.map((data) => ({
            messages: [
                {
                    role: "system",
                    content: `You are ${data.persona_id} AI coach. Respond to workout situations with ${data.response_type} coaching.`,
                },
                {
                    role: "user",
                    content: JSON.stringify(data.input_context),
                },
                {
                    role: "assistant",
                    content: data.expected_response,
                },
            ],
            quality_score: data.quality_score,
            response_type: data.response_type,
        }));
    },
});