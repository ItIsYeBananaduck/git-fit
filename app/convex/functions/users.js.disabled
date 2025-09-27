import { query } from "../_generated/server";
import { v } from "convex/values";

/**
 * Get all active users for scheduled processing
 */
export const getAllActiveUsers = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { limit = 1000 }) => {
    const users = await ctx.db
      .query("users")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .take(limit);

    return users;
  },
});