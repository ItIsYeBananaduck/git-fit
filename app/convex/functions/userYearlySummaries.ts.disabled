import { mutation, query } from "../_generated/server";
import { v } from "convex/values";

// Set or update yearly summary for a user
export const setUserYearlySummary = mutation({
    args: {
        userId: v.id("users"),
        yearlySummaryJson: v.string(),
        subscriptionStartDate: v.string(), // Unix timestamp as string
    },
    handler: async (ctx, args) => {
        const now = new Date().toISOString();
        // Check if summary exists
        const existing = await ctx.db
            .query("user_yearly_summaries")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .first();
        if (existing) {
            await ctx.db.patch(existing._id, {
                yearlySummaryJson: args.yearlySummaryJson,
                subscriptionStartDate: args.subscriptionStartDate,
                updatedAt: now,
            });
            return { updated: true };
        } else {
            await ctx.db.insert("user_yearly_summaries", {
                userId: args.userId,
                yearlySummaryJson: args.yearlySummaryJson,
                subscriptionStartDate: args.subscriptionStartDate,
                createdAt: now,
                updatedAt: now,
            });
            return { created: true };
        }
    },
});

// Get yearly summary for a user
export const getUserYearlySummary = query({
    args: {
        userId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const summary = await ctx.db
            .query("user_yearly_summaries")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .first();
        return summary || null;
    },
});
