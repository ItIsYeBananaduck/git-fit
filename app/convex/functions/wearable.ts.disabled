import { mutation } from "../_generated/server";
import { v } from "convex/values";

// Only log feedback and summary data from wearables
export const logWearableFeedback = mutation({
    args: {
        userId: v.id("users"),
        timestamp: v.string(),
        feedback: v.string(), // e.g. "Set Completed", "Too Easy", "Too Hard"
        summary: v.optional(v.any()), // e.g. { avgHR, avgSpO2, strain, sessionDuration }
    },
    handler: async (ctx, args) => {
        await ctx.db.insert("wearableFeedback", {
            userId: args.userId,
            timestamp: args.timestamp,
            feedback: args.feedback,
            summary: args.summary,
        });
    },
});

// Query for recent feedback and summaries
export const getRecentWearableFeedback = mutation({
    args: {
        userId: v.id("users"),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("wearableFeedback")
            .filter((q) => q.eq(q.field("userId"), args.userId))
            .order("desc")
            .take(args.limit ?? 20);
    },
});
