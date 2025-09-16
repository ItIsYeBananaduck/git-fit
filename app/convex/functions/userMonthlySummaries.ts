import { mutation, query } from "../_generated/server";
import { v } from "convex/values";

// Set or update monthly summary for a user
export const setUserMonthlySummary = mutation({
    args: {
        userId: v.id("users"),
        monthKey: v.string(), // e.g. "2025-09"
        monthlySummaryJson: v.string(),
    },
    handler: async (ctx, args) => {
        const now = new Date().toISOString();
        // Check if summary exists
        const existing = await ctx.db
            .query("user_monthly_summaries")
            .withIndex("by_user_and_month", (q) => q.eq("userId", args.userId).eq("monthKey", args.monthKey))
            .first();
        if (existing) {
            await ctx.db.patch(existing._id, {
                monthlySummaryJson: args.monthlySummaryJson,
                updatedAt: now,
            });
            return { updated: true };
        } else {
            await ctx.db.insert("user_monthly_summaries", {
                userId: args.userId,
                monthKey: args.monthKey,
                monthlySummaryJson: args.monthlySummaryJson,
                createdAt: now,
                updatedAt: now,
            });
            return { created: true };
        }
    },
});

// Get monthly summary for a user and month
export const getUserMonthlySummary = query({
    args: {
        userId: v.id("users"),
        monthKey: v.string(),
    },
    handler: async (ctx, args) => {
        const summary = await ctx.db
            .query("user_monthly_summaries")
            .withIndex("by_user_and_month", (q) => q.eq("userId", args.userId).eq("monthKey", args.monthKey))
            .first();
        return summary || null;
    },
});
