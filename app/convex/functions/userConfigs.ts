import { mutation, query } from "../_generated/server";
import { v } from "convex/values";

// Set or update user config (latest version only)
export const setUserConfig = mutation({
    args: {
        userId: v.id("users"),
        configJson: v.string(),
    },
    handler: async (ctx, args) => {
        const now = new Date().toISOString();
        // Check if config exists
        const existing = await ctx.db
            .query("user_configs")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .first();
        if (existing) {
            await ctx.db.patch(existing._id, {
                configJson: args.configJson,
                updatedAt: now,
            });
            return { updated: true };
        } else {
            await ctx.db.insert("user_configs", {
                userId: args.userId,
                configJson: args.configJson,
                createdAt: now,
                updatedAt: now,
            });
            return { created: true };
        }
    },
});

// Get user config (latest version)
export const getUserConfig = query({
    args: {
        userId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const config = await ctx.db
            .query("user_configs")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .first();
        return config || null;
    },
});
