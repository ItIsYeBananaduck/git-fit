/**
 * Convex Functions: User Subscriptions Management
 * Task: T032 - Implement user subscriptions CRUD operations
 */

import { v } from "convex/values";
import { mutation, query } from "../_generated/server";

/**
 * Create a new user subscription to AI coaching
 */
export const createSubscription = mutation({
    args: {
        user_id: v.id("users"),
        persona_id: v.id("aiCoachingPersonas"),
        subscription_type: v.union(
            v.literal("basic"),
            v.literal("premium"),
            v.literal("enterprise")
        ),
        preferences: v.object({
            voice_enabled: v.boolean(),
            frequency: v.union(
                v.literal("high"),
                v.literal("medium"),
                v.literal("low")
            ),
            trigger_types: v.array(v.union(
                v.literal("form_correction"),
                v.literal("motivation"),
                v.literal("rest_period"),
                v.literal("progression"),
                v.literal("completion")
            )),
            quiet_hours: v.optional(v.object({
                start_time: v.string(),
                end_time: v.string(),
                timezone: v.string(),
            })),
            exercise_focus: v.optional(v.array(v.string())),
        }),
        billing_cycle: v.optional(v.union(
            v.literal("monthly"),
            v.literal("yearly")
        )),
        trial_end_date: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        // Validate user exists
        const user = await ctx.db.get(args.user_id);
        if (!user) {
            throw new Error("User not found");
        }

        // Validate persona exists and is active
        const persona = await ctx.db.get(args.persona_id);
        if (!persona || !persona.active) {
            throw new Error("Persona not found or inactive");
        }

        // Check if user already has an active subscription
        const existingSubscription = await ctx.db
            .query("userSubscriptions")
            .filter((q) =>
                q.and(
                    q.eq(q.field("user_id"), args.user_id),
                    q.eq(q.field("status"), "active")
                )
            )
            .first();

        if (existingSubscription) {
            throw new Error("User already has an active subscription");
        }

        // Set default trial period if not provided (7 days)
        const trialEndDate = args.trial_end_date ?? (Date.now() + (7 * 24 * 60 * 60 * 1000));

        const subscriptionId = await ctx.db.insert("userSubscriptions", {
            ...args,
            status: "active",
            trial_end_date: trialEndDate,
            created_at: Date.now(),
            updated_at: Date.now(),
        });

        return subscriptionId;
    },
});

/**
 * Get user's active subscription
 */
export const getUserSubscription = query({
    args: { user_id: v.id("users") },
    handler: async (ctx, args) => {
        const subscription = await ctx.db
            .query("userSubscriptions")
            .filter((q) =>
                q.and(
                    q.eq(q.field("user_id"), args.user_id),
                    q.eq(q.field("status"), "active")
                )
            )
            .first();

        if (!subscription) {
            return null;
        }

        // Get persona details
        const persona = await ctx.db.get(subscription.persona_id);

        return {
            _id: subscription._id,
            persona_id: subscription.persona_id,
            persona_name: persona?.name,
            subscription_type: subscription.subscription_type,
            preferences: subscription.preferences,
            billing_cycle: subscription.billing_cycle,
            trial_end_date: subscription.trial_end_date,
            created_at: subscription.created_at,
            is_trial: subscription.trial_end_date ? subscription.trial_end_date > Date.now() : false,
        };
    },
});

/**
 * Update subscription preferences
 */
export const updateSubscriptionPreferences = mutation({
    args: {
        user_id: v.id("users"),
        preferences: v.object({
            voice_enabled: v.optional(v.boolean()),
            frequency: v.optional(v.union(
                v.literal("high"),
                v.literal("medium"),
                v.literal("low")
            )),
            trigger_types: v.optional(v.array(v.union(
                v.literal("form_correction"),
                v.literal("motivation"),
                v.literal("rest_period"),
                v.literal("progression"),
                v.literal("completion")
            ))),
            quiet_hours: v.optional(v.object({
                start_time: v.string(),
                end_time: v.string(),
                timezone: v.string(),
            })),
            exercise_focus: v.optional(v.array(v.string())),
        }),
    },
    handler: async (ctx, args) => {
        const subscription = await ctx.db
            .query("userSubscriptions")
            .filter((q) =>
                q.and(
                    q.eq(q.field("user_id"), args.user_id),
                    q.eq(q.field("status"), "active")
                )
            )
            .first();

        if (!subscription) {
            throw new Error("No active subscription found");
        }

        // Merge preferences
        const updatedPreferences = {
            ...subscription.preferences,
            ...args.preferences,
        };

        await ctx.db.patch(subscription._id, {
            preferences: updatedPreferences,
            updated_at: Date.now(),
        });

        return subscription._id;
    },
});

/**
 * Change subscription persona
 */
export const changePersona = mutation({
    args: {
        user_id: v.id("users"),
        new_persona_id: v.id("aiCoachingPersonas"),
    },
    handler: async (ctx, args) => {
        // Validate new persona exists and is active
        const persona = await ctx.db.get(args.new_persona_id);
        if (!persona || !persona.active) {
            throw new Error("Persona not found or inactive");
        }

        const subscription = await ctx.db
            .query("userSubscriptions")
            .filter((q) =>
                q.and(
                    q.eq(q.field("user_id"), args.user_id),
                    q.eq(q.field("status"), "active")
                )
            )
            .first();

        if (!subscription) {
            throw new Error("No active subscription found");
        }

        await ctx.db.patch(subscription._id, {
            persona_id: args.new_persona_id,
            updated_at: Date.now(),
        });

        return subscription._id;
    },
});

/**
 * Upgrade subscription type
 */
export const upgradeSubscription = mutation({
    args: {
        user_id: v.id("users"),
        new_subscription_type: v.union(
            v.literal("basic"),
            v.literal("premium"),
            v.literal("enterprise")
        ),
        billing_cycle: v.optional(v.union(
            v.literal("monthly"),
            v.literal("yearly")
        )),
    },
    handler: async (ctx, args) => {
        const subscription = await ctx.db
            .query("userSubscriptions")
            .filter((q) =>
                q.and(
                    q.eq(q.field("user_id"), args.user_id),
                    q.eq(q.field("status"), "active")
                )
            )
            .first();

        if (!subscription) {
            throw new Error("No active subscription found");
        }

        // Validate upgrade path
        const typeHierarchy = { basic: 1, premium: 2, enterprise: 3 };
        const currentLevel = typeHierarchy[subscription.subscription_type];
        const newLevel = typeHierarchy[args.new_subscription_type];

        if (newLevel <= currentLevel) {
            throw new Error("Can only upgrade to a higher subscription tier");
        }

        await ctx.db.patch(subscription._id, {
            subscription_type: args.new_subscription_type,
            billing_cycle: args.billing_cycle ?? subscription.billing_cycle,
            updated_at: Date.now(),
        });

        return subscription._id;
    },
});

/**
 * Cancel subscription (set to cancelled status)
 */
export const cancelSubscription = mutation({
    args: {
        user_id: v.id("users"),
        cancellation_reason: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const subscription = await ctx.db
            .query("userSubscriptions")
            .filter((q) =>
                q.and(
                    q.eq(q.field("user_id"), args.user_id),
                    q.eq(q.field("status"), "active")
                )
            )
            .first();

        if (!subscription) {
            throw new Error("No active subscription found");
        }

        await ctx.db.patch(subscription._id, {
            status: "cancelled",
            cancelled_at: Date.now(),
            cancellation_reason: args.cancellation_reason,
            updated_at: Date.now(),
        });

        return subscription._id;
    },
});

/**
 * Reactivate a cancelled subscription
 */
export const reactivateSubscription = mutation({
    args: { user_id: v.id("users") },
    handler: async (ctx, args) => {
        const subscription = await ctx.db
            .query("userSubscriptions")
            .filter((q) =>
                q.and(
                    q.eq(q.field("user_id"), args.user_id),
                    q.eq(q.field("status"), "cancelled")
                )
            )
            .first();

        if (!subscription) {
            throw new Error("No cancelled subscription found");
        }

        await ctx.db.patch(subscription._id, {
            status: "active",
            cancelled_at: undefined,
            cancellation_reason: undefined,
            updated_at: Date.now(),
        });

        return subscription._id;
    },
});

/**
 * Check if user should receive coaching based on preferences
 */
export const shouldReceiveCoaching = query({
    args: {
        user_id: v.id("users"),
        trigger_type: v.union(
            v.literal("form_correction"),
            v.literal("motivation"),
            v.literal("rest_period"),
            v.literal("progression"),
            v.literal("completion")
        ),
        current_time: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const subscription = await ctx.db
            .query("userSubscriptions")
            .filter((q) =>
                q.and(
                    q.eq(q.field("user_id"), args.user_id),
                    q.eq(q.field("status"), "active")
                )
            )
            .first();

        if (!subscription) {
            return { should_receive: false, reason: "No active subscription" };
        }

        const prefs = subscription.preferences;

        // Check if voice is enabled
        if (!prefs.voice_enabled) {
            return { should_receive: false, reason: "Voice coaching disabled" };
        }

        // Check if trigger type is enabled
        if (!prefs.trigger_types.includes(args.trigger_type)) {
            return { should_receive: false, reason: "Trigger type disabled" };
        }

        // Check quiet hours
        if (prefs.quiet_hours && args.current_time) {
            const currentTime = new Date(args.current_time);
            const userTime = new Intl.DateTimeFormat('en-US', {
                timeZone: prefs.quiet_hours.timezone,
                hour12: false,
                hour: '2-digit',
                minute: '2-digit',
            }).format(currentTime);

            const [currentHour, currentMinute] = userTime.split(':').map(Number);
            const currentTimeMinutes = currentHour * 60 + currentMinute;

            const [startHour, startMinute] = prefs.quiet_hours.start_time.split(':').map(Number);
            const startTimeMinutes = startHour * 60 + startMinute;

            const [endHour, endMinute] = prefs.quiet_hours.end_time.split(':').map(Number);
            const endTimeMinutes = endHour * 60 + endMinute;

            // Handle overnight quiet hours
            if (startTimeMinutes > endTimeMinutes) {
                if (currentTimeMinutes >= startTimeMinutes || currentTimeMinutes <= endTimeMinutes) {
                    return { should_receive: false, reason: "Quiet hours active" };
                }
            } else {
                if (currentTimeMinutes >= startTimeMinutes && currentTimeMinutes <= endTimeMinutes) {
                    return { should_receive: false, reason: "Quiet hours active" };
                }
            }
        }

        return {
            should_receive: true,
            persona_id: subscription.persona_id,
            frequency: prefs.frequency,
            subscription_type: subscription.subscription_type,
        };
    },
});

/**
 * Get subscription analytics
 */
export const getSubscriptionAnalytics = query({
    handler: async (ctx) => {
        const allSubscriptions = await ctx.db.query("userSubscriptions").collect();

        const activeSubscriptions = allSubscriptions.filter((s) => s.status === "active");
        const cancelledSubscriptions = allSubscriptions.filter((s) => s.status === "cancelled");

        // Subscription type distribution
        const typeDistribution = activeSubscriptions.reduce((acc, sub) => {
            acc[sub.subscription_type] = (acc[sub.subscription_type] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        // Trial vs paid
        const currentTime = Date.now();
        const trialSubscriptions = activeSubscriptions.filter((s) =>
            s.trial_end_date && s.trial_end_date > currentTime
        ).length;

        // Churn rate (cancelled in last 30 days)
        const thirtyDaysAgo = currentTime - (30 * 24 * 60 * 60 * 1000);
        const recentCancellations = cancelledSubscriptions.filter((s) =>
            s.cancelled_at && s.cancelled_at >= thirtyDaysAgo
        ).length;

        return {
            total_subscriptions: allSubscriptions.length,
            active_subscriptions: activeSubscriptions.length,
            cancelled_subscriptions: cancelledSubscriptions.length,
            trial_subscriptions: trialSubscriptions,
            paid_subscriptions: activeSubscriptions.length - trialSubscriptions,
            subscription_type_distribution: typeDistribution,
            recent_cancellations: recentCancellations,
            churn_rate: activeSubscriptions.length > 0
                ? (recentCancellations / activeSubscriptions.length) * 100
                : 0,
        };
    },
});