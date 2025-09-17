// Delete a program
export const deleteProgram = mutation({
  args: { programId: v.string() },
  handler: async (ctx, args) => {
    const program = await ctx.db
      .query("programs")
      .withIndex("by_trainer", (q) => q.eq("programId", args.programId))
      .first();
    if (!program) throw new Error("Program not found");
    await ctx.db.delete(program._id);
    return { success: true };
  },
});
import { mutation, query } from "../_generated/server";
import { v } from "convex/values";

// Create a new program
export const createProgram = mutation({
  args: {
    programId: v.string(),
    trainerId: v.id("users"),
    title: v.string(),
    goal: v.string(),
    description: v.string(),
    durationWeeks: v.number(),
    equipment: v.array(v.string()),
    priceType: v.union(v.literal("subscription"), v.literal("oneTime")),
    price: v.number(),
    jsonData: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if trainer is verified
    const trainer = await ctx.db
      .query("trainers")
      .withIndex("by_user", (q) => q.eq("userId", args.trainerId))
      .first();
    if (!trainer || !trainer.certificationVerified) {
      throw new Error("Only verified trainers can publish programs.");
    }
    const now = new Date().toISOString();
    const program = {
      ...args,
      createdAt: now,
      updatedAt: now,
    };
    const id = await ctx.db.insert("programs", program);
    return { id, ...program };
  },
});

// Get program by programId
export const getProgramById = query({
  args: { programId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("programs")
      .withIndex("by_trainer", (q) => q.eq("programId", args.programId))
      .first();
  },
});

// List all programs for a trainer
export const getProgramsByTrainer = query({
  args: { trainerId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("programs")
      .withIndex("by_trainer", (q) => q.eq("trainerId", args.trainerId))
      .collect();
  },
});

// Update program
export const updateProgram = mutation({
  args: {
    programId: v.string(),
    updates: v.object({
      title: v.optional(v.string()),
      goal: v.optional(v.string()),
      description: v.optional(v.string()),
      durationWeeks: v.optional(v.number()),
      equipment: v.optional(v.array(v.string())),
      priceType: v.optional(v.union(v.literal("subscription"), v.literal("oneTime"))),
      price: v.optional(v.number()),
      jsonData: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const { programId, updates } = args;
    const program = await ctx.db
      .query("programs")
      .withIndex("by_trainer", (q) => q.eq("programId", programId))
      .first();
    if (!program) throw new Error("Program not found");
    await ctx.db.patch(program._id, { ...updates, updatedAt: new Date().toISOString() });
    return { success: true };
  },
});
