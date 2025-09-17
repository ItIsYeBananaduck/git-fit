import { query } from "../_generated/server";
import { v } from "convex/values";

// Get all programs a user has access to (active purchases only)
export const getUserProgramOwnership = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // Get all active or non-expired purchases for this user
    const purchases = await ctx.db
      .query("purchases")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    const validPurchases = purchases.filter(
      (p) => p.status === "active" || (p.status === "expired" && (!p.endDate || new Date(p.endDate) > new Date()))
    );
    // Get all programIds from valid purchases
    const programIds = validPurchases.map((p) => p.programId);
    if (programIds.length === 0) return [];
    // Fetch all programs for these ids
    const programs = await ctx.db
      .query("programs")
      .collect();
    // Only return programs the user has access to
    return programs.filter((prog) => programIds.includes(prog._id));
  },
});
