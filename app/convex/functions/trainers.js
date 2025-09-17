import { mutation, query } from "../_generated/server";
import { v } from "convex/values";

// Create a new trainer profile
export const createTrainer = mutation({
  args: {
    trainerId: v.string(),
    userId: v.id("users"),
    certificationVerified: v.boolean(),
    bio: v.optional(v.string()),
    specialties: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    const trainer = {
      ...args,
      createdAt: now,
      updatedAt: now,
    };
    const id = await ctx.db.insert("trainers", trainer);
    return { id, ...trainer };
  },
});

// Get trainer by userId
export const getTrainerByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("trainers")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
  },
});

// Update trainer profile
export const updateTrainer = mutation({
  args: {
    trainerId: v.string(),
    updates: v.object({
      certificationVerified: v.optional(v.boolean()),
      bio: v.optional(v.string()),
      specialties: v.optional(v.array(v.string())),
    }),
  },
  handler: async (ctx, args) => {
    const { trainerId, updates } = args;
    const trainer = await ctx.db
      .query("trainers")
      .withIndex("by_user", (q) => q.eq("trainerId", trainerId))
      .first();
    if (!trainer) throw new Error("Trainer not found");
    await ctx.db.patch(trainer._id, { ...updates, updatedAt: new Date().toISOString() });
    return { success: true };
  },
});
