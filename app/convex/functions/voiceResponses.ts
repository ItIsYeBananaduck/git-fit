/**
 * Convex Functions: Voice Responses Management
 * Task: T031 - Implement voice responses CRUD operations
 */

import { v } from "convex/values";
import { mutation, query } from "../_generated/server";

/**
 * Create a new voice response
 */
export const createVoiceResponse = mutation({
    args: {
        user_id: v.id("users"),
        persona_id: v.id("aiCoachingPersonas"),
        trigger_id: v.optional(v.id("workoutTriggers")),
        text_content: v.string(),
        audio_url: v.optional(v.string()),
        response_type: v.union(
            v.literal("motivation"),
            v.literal("correction"),
            v.literal("encouragement"),
            v.literal("instruction"),
            v.literal("celebration")
        ),
        context_data: v.object({
            exercise_type: v.optional(v.string()),
            workout_id: v.optional(v.id("workouts")),
            program_id: v.optional(v.id("trainingPrograms")),
            performance_data: v.optional(v.object({
                reps: v.optional(v.number()),
                weight: v.optional(v.number()),
                duration: v.optional(v.number()),
                heart_rate: v.optional(v.number()),
                form_score: v.optional(v.number()),
            })),
        }),
        generation_metadata: v.object({
            model_version: v.string(),
            generation_time_ms: v.number(),
            tokens_used: v.optional(v.number()),
            tts_generation_time_ms: v.optional(v.number()),
            audio_cache_hit: v.optional(v.boolean()),
        }),
        delivered: v.optional(v.boolean()),
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

        // Validate trigger if provided
        if (args.trigger_id) {
            const trigger = await ctx.db.get(args.trigger_id);
            if (!trigger) {
                throw new Error("Trigger not found");
            }
        }

        const responseId = await ctx.db.insert("voiceResponses", {
            ...args,
            delivered: args.delivered ?? false,
            created_at: Date.now(),
            updated_at: Date.now(),
        });

        return responseId;
    },
});

/**
 * Get voice responses for a user
 */
export const getUserResponses = query({
    args: {
        user_id: v.id("users"),
        limit: v.optional(v.number()),
        response_type: v.optional(v.union(
            v.literal("motivation"),
            v.literal("correction"),
            v.literal("encouragement"),
            v.literal("instruction"),
            v.literal("celebration")
        )),
        delivered_only: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        let responses = await ctx.db
            .query("voiceResponses")
            .filter((q) => q.eq(q.field("user_id"), args.user_id))
            .order("desc")
            .collect();

        // Filter by response type if provided
        if (args.response_type) {
            responses = responses.filter((response) =>
                response.response_type === args.response_type
            );
        }

        // Filter by delivery status if specified
        if (args.delivered_only) {
            responses = responses.filter((response) => response.delivered === true);
        }

        // Apply limit
        if (args.limit) {
            responses = responses.slice(0, args.limit);
        }

        return responses.map((response) => ({
            _id: response._id,
            persona_id: response.persona_id,
            trigger_id: response.trigger_id,
            text_content: response.text_content,
            audio_url: response.audio_url,
            response_type: response.response_type,
            context_data: response.context_data,
            delivered: response.delivered,
            created_at: response.created_at,
        }));
    },
});

/**
 * Get a specific voice response
 */
export const getVoiceResponse = query({
    args: { responseId: v.id("voiceResponses") },
    handler: async (ctx, args) => {
        const response = await ctx.db.get(args.responseId);

        if (!response) {
            throw new Error("Voice response not found");
        }

        return response;
    },
});

/**
 * Mark a voice response as delivered
 */
export const markResponseDelivered = mutation({
    args: {
        responseId: v.id("voiceResponses"),
        delivery_metadata: v.optional(v.object({
            delivery_time: v.number(),
            device_type: v.optional(v.string()),
            audio_played: v.optional(v.boolean()),
            user_interaction: v.optional(v.string()),
        })),
    },
    handler: async (ctx, args) => {
        const response = await ctx.db.get(args.responseId);

        if (!response) {
            throw new Error("Voice response not found");
        }

        await ctx.db.patch(args.responseId, {
            delivered: true,
            delivery_metadata: args.delivery_metadata,
            updated_at: Date.now(),
        });

        return args.responseId;
    },
});

/**
 * Update voice response content
 */
export const updateVoiceResponse = mutation({
    args: {
        responseId: v.id("voiceResponses"),
        text_content: v.optional(v.string()),
        audio_url: v.optional(v.string()),
        response_type: v.optional(v.union(
            v.literal("motivation"),
            v.literal("correction"),
            v.literal("encouragement"),
            v.literal("instruction"),
            v.literal("celebration")
        )),
        context_data: v.optional(v.object({
            exercise_type: v.optional(v.string()),
            workout_id: v.optional(v.id("workouts")),
            program_id: v.optional(v.id("trainingPrograms")),
            performance_data: v.optional(v.object({
                reps: v.optional(v.number()),
                weight: v.optional(v.number()),
                duration: v.optional(v.number()),
                heart_rate: v.optional(v.number()),
                form_score: v.optional(v.number()),
            })),
        })),
    },
    handler: async (ctx, args) => {
        const { responseId, ...updates } = args;

        const response = await ctx.db.get(responseId);
        if (!response) {
            throw new Error("Voice response not found");
        }

        await ctx.db.patch(responseId, {
            ...updates,
            updated_at: Date.now(),
        });

        return responseId;
    },
});

/**
 * Delete a voice response
 */
export const deleteVoiceResponse = mutation({
    args: { responseId: v.id("voiceResponses") },
    handler: async (ctx, args) => {
        const response = await ctx.db.get(args.responseId);

        if (!response) {
            throw new Error("Voice response not found");
        }

        await ctx.db.delete(args.responseId);
        return args.responseId;
    },
});

/**
 * Get recent responses for a workout session
 */
export const getWorkoutResponses = query({
    args: {
        workout_id: v.id("workouts"),
        user_id: v.id("users"),
    },
    handler: async (ctx, args) => {
        const responses = await ctx.db
            .query("voiceResponses")
            .filter((q) =>
                q.and(
                    q.eq(q.field("user_id"), args.user_id),
                    q.eq(q.field("context_data.workout_id"), args.workout_id)
                )
            )
            .order("desc")
            .collect();

        return responses.map((response) => ({
            _id: response._id,
            text_content: response.text_content,
            audio_url: response.audio_url,
            response_type: response.response_type,
            delivered: response.delivered,
            created_at: response.created_at,
        }));
    },
});

/**
 * Get response analytics
 */
export const getResponseAnalytics = query({
    args: {
        user_id: v.optional(v.id("users")),
        persona_id: v.optional(v.id("aiCoachingPersonas")),
        days: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const days = args.days ?? 30;
        const startTime = Date.now() - (days * 24 * 60 * 60 * 1000);

        let responses = await ctx.db
            .query("voiceResponses")
            .filter((q) => q.gte(q.field("created_at"), startTime))
            .collect();

        // Filter by user if provided
        if (args.user_id) {
            responses = responses.filter((r) => r.user_id === args.user_id);
        }

        // Filter by persona if provided
        if (args.persona_id) {
            responses = responses.filter((r) => r.persona_id === args.persona_id);
        }

        // Calculate statistics
        const totalResponses = responses.length;
        const deliveredResponses = responses.filter((r) => r.delivered).length;
        const deliveryRate = totalResponses > 0 ? (deliveredResponses / totalResponses) * 100 : 0;

        // Response type distribution
        const typeDistribution = responses.reduce((acc, response) => {
            acc[response.response_type] = (acc[response.response_type] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        // Average generation time
        const avgGenerationTime = responses.length > 0
            ? responses.reduce((sum, r) => sum + r.generation_metadata.generation_time_ms, 0) / responses.length
            : 0;

        // Cache hit rate for TTS
        const ttsResponses = responses.filter((r) => r.generation_metadata.audio_cache_hit !== undefined);
        const cacheHitRate = ttsResponses.length > 0
            ? (ttsResponses.filter((r) => r.generation_metadata.audio_cache_hit).length / ttsResponses.length) * 100
            : 0;

        return {
            period_days: days,
            total_responses: totalResponses,
            delivered_responses: deliveredResponses,
            delivery_rate: Math.round(deliveryRate * 100) / 100,
            response_type_distribution: typeDistribution,
            avg_generation_time_ms: Math.round(avgGenerationTime),
            tts_cache_hit_rate: Math.round(cacheHitRate * 100) / 100,
        };
    },
});

/**
 * Get undelivered responses for a user (for retry mechanism)
 */
export const getUndeliveredResponses = query({
    args: {
        user_id: v.id("users"),
        max_age_hours: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const maxAge = args.max_age_hours ?? 24;
        const cutoffTime = Date.now() - (maxAge * 60 * 60 * 1000);

        const responses = await ctx.db
            .query("voiceResponses")
            .filter((q) =>
                q.and(
                    q.eq(q.field("user_id"), args.user_id),
                    q.eq(q.field("delivered"), false),
                    q.gte(q.field("created_at"), cutoffTime)
                )
            )
            .order("desc")
            .collect();

        return responses.map((response) => ({
            _id: response._id,
            text_content: response.text_content,
            audio_url: response.audio_url,
            response_type: response.response_type,
            context_data: response.context_data,
            created_at: response.created_at,
        }));
    },
});