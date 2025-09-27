import { mutation, query } from "../_generated/server";
import { v } from "convex/values";

// Mutation to set or update a user's goals (primary/secondary)
export const setUserGoals = mutation({
    args: {
        userId: v.id("users"),
        primaryGoal: v.string(),
        secondaryGoals: v.optional(v.array(v.string())),
        details: v.optional(v.object({})),
    },
    handler: async (ctx, args) => {
        // Upsert logic: remove old goals, insert new ones
        await ctx.db.deleteWhere("goals", q => q.eq(q.field("userId"), args.userId));
        const now = Date.now();
        // Insert primary goal
        await ctx.db.insert("goals", {
            userId: args.userId,
            goalType: "primary",
            primaryGoalType: args.primaryGoal,
            secondaryGoalType: "",
            details: args.details || {},
            priority: 1,
            isActive: true,
            createdAt: now,
            updatedAt: now,
        });
        // Insert secondary goals if any
        if (args.secondaryGoals && args.secondaryGoals.length > 0) {
            for (const [i, sec] of args.secondaryGoals.entries()) {
                await ctx.db.insert("goals", {
                    userId: args.userId,
                    goalType: "secondary",
                    primaryGoalType: args.primaryGoal,
                    secondaryGoalType: sec,
                    details: args.details || {},
                    priority: i + 2,
                    isActive: true,
                    createdAt: now,
                    updatedAt: now,
                });
            }
        }
        return { success: true };
    }
});

// Query to get all goals for a user
export const getUserGoals = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("goals")
            .withIndex("userId", q => q.eq("userId", args.userId))
            .collect();
    }
});
