import { mutation } from "../_generated/server";
import { v } from "convex/values";

/**
 * Summarize raw logs to trends for a user over a window.
 * Placeholder scaffold: no-op with success = true.
 */
export const summarizeRawToTrends = mutation({
  args: {
    userId: v.id("users"),
    windowDays: v.number(),
  },
  handler: async (_ctx, _args) => {
    // TODO: Implement summarization of raw fitness data into readiness/sleep/activity trends.
    return { ok: true as const };
  },
});

/**
 * Cleanup policy for free users: retain summaries only; rotate every 14 days.
 * Placeholder scaffold: no-op with success = true.
 */
export const cleanupForFreeUsers = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (_ctx, _args) => {
    // TODO: Delete/compact raw data older than 14 days for free users.
    return { ok: true as const };
  },
});

/**
 * Cleanup policy for paid users: retain raw + summaries; prune old beyond policy.
 * Placeholder scaffold: no-op with success = true.
 */
export const cleanupForPaidUsers = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (_ctx, _args) => {
    // TODO: Prune raw data beyond configured window while keeping summaries.
    return { ok: true as const };
  },
});
