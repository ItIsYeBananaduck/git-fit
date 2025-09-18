// List all purchases for a trainer's programs
export const getPurchasesByTrainer = query({
  args: { trainerId: v.id("users") },
  handler: async (ctx, args) => {
    // Get all programs for this trainer
    const programs = await ctx.db
      .query("programs")
      .withIndex("by_trainer", (q) => q.eq("trainerId", args.trainerId))
      .collect();
    const programIds = programs.map((p) => p._id);
    if (programIds.length === 0) return [];
    // Get all purchases for these programs
    return await ctx.db
      .query("purchases")
      .withIndex("by_program", (q) => q.or(...programIds.map(id => q.eq("programId", id))))
      .collect();
  },
});

// Calculate total revenue for a trainer
export const getTrainerRevenue = query({
  args: { trainerId: v.id("users") },
  handler: async (ctx, args) => {
    // Get all programs for this trainer
    const programs = await ctx.db
      .query("programs")
      .withIndex("by_trainer", (q) => q.eq("trainerId", args.trainerId))
      .collect();
    const programIds = programs.map((p) => p._id);
    if (programIds.length === 0) return 0;
    // Get all purchases for these programs
    const purchases = await ctx.db
      .query("purchases")
      .withIndex("by_program", (q) => q.or(...programIds.map(id => q.eq("programId", id))))
      .collect();
    // Sum revenue (assume price is on program)
    let total = 0;
    for (const purchase of purchases) {
      const program = programs.find(p => p._id === purchase.programId);
      if (program && purchase.status === "active") {
        total += program.price;
      }
    }
    return total;
  },
});
import { mutation, query } from "../_generated/server";
import { v } from "convex/values";

// Create a new purchase
export const createPurchase = mutation({
  args: {
    purchaseId: v.string(),
    userId: v.id("users"),
    programId: v.id("programs"),
    type: v.union(v.literal("subscription"), v.literal("oneTime")),
    status: v.union(v.literal("active"), v.literal("expired"), v.literal("canceled")),
    startDate: v.string(),
    endDate: v.optional(v.string()),
    stripeSubscriptionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    // Get program and trainer
    const program = await ctx.db.get(args.programId);
    if (!program) throw new Error("Program not found");
    const trainerId = program.trainerId;
    // Check if user is a Pro client for this trainer
    const proClient = await ctx.db
      .query("trainerClients")
      .withIndex("by_trainer", (q) => q.eq("trainerId", trainerId))
      .collect();
    const isPro = proClient.some(tc => tc.clientId === args.userId && tc.status === "active");
    // Commission: 20% for one-time, 10% for Pro subscription, 30% for non-Pro subscription
    let commission = 0.3;
    if (args.type === "oneTime") {
      commission = 0.2;
    } else if (isPro) {
      commission = 0.1;
    }
    const purchase = {
      ...args,
      commission,
      createdAt: now,
      updatedAt: now,
    };
    const id = await ctx.db.insert("purchases", purchase);
    return { id, ...purchase };
  },
});

// Get purchase by purchaseId
export const getPurchaseById = query({
  args: { purchaseId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("purchases")
      .withIndex("by_user", (q) => q.eq("purchaseId", args.purchaseId))
      .first();
  },
});

// List all purchases for a user
export const getPurchasesByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("purchases")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

// Update purchase
export const updatePurchase = mutation({
  args: {
    purchaseId: v.string(),
    updates: v.object({
      status: v.optional(v.union(v.literal("active"), v.literal("expired"), v.literal("canceled"))),
      endDate: v.optional(v.string()),
      stripeSubscriptionId: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const { purchaseId, updates } = args;
    const purchase = await ctx.db
      .query("purchases")
      .withIndex("by_user", (q) => q.eq("purchaseId", purchaseId))
      .first();
    if (!purchase) throw new Error("Purchase not found");
    await ctx.db.patch(purchase._id, { ...updates, updatedAt: new Date().toISOString() });
    return { success: true };
  },
});
