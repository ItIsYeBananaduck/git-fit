import { mutation, query } from "../_generated/server";
import { v } from "convex/values";

// Training Program mutations and queries
export const createTrainingProgram = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    price: v.number(),
    trainerId: v.id("users"),
    difficulty: v.union(v.literal("beginner"), v.literal("intermediate"), v.literal("advanced")),
    duration: v.number(),
    category: v.array(v.string()),
    equipment: v.array(v.string()),
    tags: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const program = {
      ...args,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isPublished: false,
      rating: 0,
      totalPurchases: 0,
    };
    const id = await ctx.db.insert("trainingPrograms", program);
    return { id, ...program };
  },
});

export const getTrainingPrograms = query({
  args: {
    difficulty: v.optional(v.union(v.literal("beginner"), v.literal("intermediate"), v.literal("advanced"))),
    trainerId: v.optional(v.id("users")),
    publishedOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let q = ctx.db.query("trainingPrograms");

    if (args.publishedOnly) {
      q = q.filter((qq) => qq.eq(qq.field("isPublished"), true));
    }

    if (args.difficulty) {
      q = q.filter((qq) => qq.eq(qq.field("difficulty"), args.difficulty));
    }

    if (args.trainerId) {
      q = q.filter((qq) => qq.eq(qq.field("trainerId"), args.trainerId));
    }

    return await q.collect();
  },
});

export const getTrainingProgramById = query({
  args: { programId: v.id("trainingPrograms") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.programId);
  },
});

export const publishTrainingProgram = mutation({
  args: { programId: v.id("trainingPrograms") },
  handler: async (ctx, args) => {
    const program = await ctx.db.get(args.programId);
    if (!program) throw new Error("Program not found");

    await ctx.db.patch(args.programId, {
      isPublished: true,
      updatedAt: new Date().toISOString(),
    });

    return { success: true };
  },
});

// Legacy function for backward compatibility
export const addTrainingProgram = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    price: v.number(),
  },
  handler: async (ctx, args) => {
    // Create a default trainer user for legacy compatibility
    const program = {
      ...args,
      trainerId: "default_trainer", // TODO: replace with actual trainer ID
      difficulty: "beginner",
      duration: 4,
      category: ["general"],
      equipment: [],
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isPublished: true,
      rating: 0,
      totalPurchases: 0,
    };
    const id = await ctx.db.insert("trainingPrograms", program);
    return { id, ...program };
  },
});
