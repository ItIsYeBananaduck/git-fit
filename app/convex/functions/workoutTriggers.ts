/**
 * Convex Functions: Workout Triggers Management
 * Task: T030 - Implement workout triggers CRUD operations
 */

import { v } from "convex/values";
import { mutation, query } from "../_generated/server";

/**
 * Create a new workout trigger
 */
export const createTrigger = mutation({
    args: {
        name: v.string(),
        trigger_type: v.union(
            v.literal("form_correction"),
            v.literal("motivation"),
            v.literal("rest_period"),
            v.literal("progression"),
            v.literal("completion")
        ),
        exercise_types: v.array(v.string()),
        conditions: v.object({
            rep_threshold: v.optional(v.number()),
            weight_threshold: v.optional(v.number()),
            heart_rate_threshold: v.optional(v.number()),
            time_threshold: v.optional(v.number()),
            form_score_threshold: v.optional(v.number()),
            consecutive_failures: v.optional(v.number()),
            rest_duration: v.optional(v.number()),
        }),
        response_templates: v.array(v.string()),
        priority: v.number(),
        active: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        // Validate priority (1-10)
        if (args.priority < 1 || args.priority > 10) {
            throw new Error("Priority must be between 1 and 10");
        }

        // Check if trigger name already exists
        const existingTrigger = await ctx.db
            .query("workoutTriggers")
            .filter((q) => q.eq(q.field("name"), args.name))
            .first();

        if (existingTrigger) {
            throw new Error(`Trigger with name "${args.name}" already exists`);
        }

        const triggerId = await ctx.db.insert("workoutTriggers", {
            ...args,
            active: args.active ?? true,
            created_at: Date.now(),
            updated_at: Date.now(),
        });

        return triggerId;
    },
});

/**
 * Get triggers for specific exercise type and trigger type
 */
export const getTriggersForExercise = query({
    args: {
        exercise_type: v.string(),
        trigger_type: v.optional(v.union(
            v.literal("form_correction"),
            v.literal("motivation"),
            v.literal("rest_period"),
            v.literal("progression"),
            v.literal("completion")
        )),
    },
    handler: async (ctx, args) => {
        let triggers = await ctx.db
            .query("workoutTriggers")
            .filter((q) => q.eq(q.field("active"), true))
            .collect();

        // Filter by exercise type
        triggers = triggers.filter((trigger) =>
            trigger.exercise_types.includes(args.exercise_type)
        );

        // Filter by trigger type if provided
        if (args.trigger_type) {
            triggers = triggers.filter((trigger) =>
                trigger.trigger_type === args.trigger_type
            );
        }

        // Sort by priority (higher number = higher priority)
        triggers.sort((a, b) => b.priority - a.priority);

        return triggers.map((trigger) => ({
            _id: trigger._id,
            name: trigger.name,
            trigger_type: trigger.trigger_type,
            conditions: trigger.conditions,
            response_templates: trigger.response_templates,
            priority: trigger.priority,
        }));
    },
});

/**
 * Get all active triggers
 */
export const getAllTriggers = query({
    handler: async (ctx) => {
        const triggers = await ctx.db
            .query("workoutTriggers")
            .filter((q) => q.eq(q.field("active"), true))
            .order("desc")
            .collect();

        return triggers.map((trigger) => ({
            _id: trigger._id,
            name: trigger.name,
            trigger_type: trigger.trigger_type,
            exercise_types: trigger.exercise_types,
            priority: trigger.priority,
            created_at: trigger.created_at,
        }));
    },
});

/**
 * Get a specific trigger by ID
 */
export const getTrigger = query({
    args: { triggerId: v.id("workoutTriggers") },
    handler: async (ctx, args) => {
        const trigger = await ctx.db.get(args.triggerId);

        if (!trigger) {
            throw new Error("Trigger not found");
        }

        return trigger;
    },
});

/**
 * Update an existing trigger
 */
export const updateTrigger = mutation({
    args: {
        triggerId: v.id("workoutTriggers"),
        name: v.optional(v.string()),
        trigger_type: v.optional(v.union(
            v.literal("form_correction"),
            v.literal("motivation"),
            v.literal("rest_period"),
            v.literal("progression"),
            v.literal("completion")
        )),
        exercise_types: v.optional(v.array(v.string())),
        conditions: v.optional(v.object({
            rep_threshold: v.optional(v.number()),
            weight_threshold: v.optional(v.number()),
            heart_rate_threshold: v.optional(v.number()),
            time_threshold: v.optional(v.number()),
            form_score_threshold: v.optional(v.number()),
            consecutive_failures: v.optional(v.number()),
            rest_duration: v.optional(v.number()),
        })),
        response_templates: v.optional(v.array(v.string())),
        priority: v.optional(v.number()),
        active: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const { triggerId, ...updates } = args;

        // Check if trigger exists
        const existingTrigger = await ctx.db.get(triggerId);
        if (!existingTrigger) {
            throw new Error("Trigger not found");
        }

        // Validate priority if provided
        if (updates.priority && (updates.priority < 1 || updates.priority > 10)) {
            throw new Error("Priority must be between 1 and 10");
        }

        // If updating name, check for duplicates
        if (updates.name && updates.name !== existingTrigger.name) {
            const duplicateTrigger = await ctx.db
                .query("workoutTriggers")
                .filter((q) => q.eq(q.field("name"), updates.name))
                .first();

            if (duplicateTrigger) {
                throw new Error(`Trigger with name "${updates.name}" already exists`);
            }
        }

        await ctx.db.patch(triggerId, {
            ...updates,
            updated_at: Date.now(),
        });

        return triggerId;
    },
});

/**
 * Delete a trigger (soft delete)
 */
export const deleteTrigger = mutation({
    args: { triggerId: v.id("workoutTriggers") },
    handler: async (ctx, args) => {
        const trigger = await ctx.db.get(args.triggerId);

        if (!trigger) {
            throw new Error("Trigger not found");
        }

        await ctx.db.patch(args.triggerId, {
            active: false,
            updated_at: Date.now(),
        });

        return args.triggerId;
    },
});

/**
 * Evaluate workout data against triggers to find matches
 */
export const evaluateTriggers = query({
    args: {
        exercise_type: v.string(),
        workout_data: v.object({
            reps: v.optional(v.number()),
            weight: v.optional(v.number()),
            heart_rate: v.optional(v.number()),
            duration: v.optional(v.number()),
            form_score: v.optional(v.number()),
            consecutive_failures: v.optional(v.number()),
            rest_time: v.optional(v.number()),
        }),
        trigger_type: v.optional(v.union(
            v.literal("form_correction"),
            v.literal("motivation"),
            v.literal("rest_period"),
            v.literal("progression"),
            v.literal("completion")
        )),
    },
    handler: async (ctx, args) => {
        // Get applicable triggers
        let triggers = await ctx.db
            .query("workoutTriggers")
            .filter((q) => q.eq(q.field("active"), true))
            .collect();

        // Filter by exercise type
        triggers = triggers.filter((trigger) =>
            trigger.exercise_types.includes(args.exercise_type)
        );

        // Filter by trigger type if provided
        if (args.trigger_type) {
            triggers = triggers.filter((trigger) =>
                trigger.trigger_type === args.trigger_type
            );
        }

        // Evaluate conditions
        const matchedTriggers = triggers.filter((trigger) => {
            const conditions = trigger.conditions;
            const data = args.workout_data;

            // Check each condition
            if (conditions.rep_threshold && data.reps && data.reps < conditions.rep_threshold) return true;
            if (conditions.weight_threshold && data.weight && data.weight > conditions.weight_threshold) return true;
            if (conditions.heart_rate_threshold && data.heart_rate && data.heart_rate > conditions.heart_rate_threshold) return true;
            if (conditions.time_threshold && data.duration && data.duration > conditions.time_threshold) return true;
            if (conditions.form_score_threshold && data.form_score && data.form_score < conditions.form_score_threshold) return true;
            if (conditions.consecutive_failures && data.consecutive_failures && data.consecutive_failures >= conditions.consecutive_failures) return true;
            if (conditions.rest_duration && data.rest_time && data.rest_time >= conditions.rest_duration) return true;

            return false;
        });

        // Sort by priority
        matchedTriggers.sort((a, b) => b.priority - a.priority);

        return matchedTriggers.map((trigger) => ({
            _id: trigger._id,
            name: trigger.name,
            trigger_type: trigger.trigger_type,
            response_templates: trigger.response_templates,
            priority: trigger.priority,
        }));
    },
});

/**
 * Get trigger usage statistics
 */
export const getTriggerStats = query({
    args: { triggerId: v.id("workoutTriggers") },
    handler: async (ctx, args) => {
        const trigger = await ctx.db.get(args.triggerId);

        if (!trigger) {
            throw new Error("Trigger not found");
        }

        // Count voice responses that used this trigger
        const responseCount = await ctx.db
            .query("voiceResponses")
            .filter((q) => q.eq(q.field("trigger_id"), args.triggerId))
            .collect()
            .then((responses) => responses.length);

        // Get recent responses (last 30 days)
        const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
        const recentResponses = await ctx.db
            .query("voiceResponses")
            .filter((q) =>
                q.and(
                    q.eq(q.field("trigger_id"), args.triggerId),
                    q.gte(q.field("created_at"), thirtyDaysAgo)
                )
            )
            .collect()
            .then((responses) => responses.length);

        return {
            trigger_id: args.triggerId,
            total_uses: responseCount,
            recent_uses: recentResponses,
            created_at: trigger.created_at,
            last_updated: trigger.updated_at,
        };
    },
});