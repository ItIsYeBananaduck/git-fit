// Stripe Connect onboarding for trainers
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2022-11-15",
});

export const createStripeConnectOnboarding = mutation({
  args: {
    trainerId: v.string(),
    refreshUrl: v.string(),
    returnUrl: v.string(),
  },
  handler: async (ctx, args) => {
    // Get trainer
    const trainer = await ctx.db
      .query("trainers")
      .withIndex("by_user", (q) => q.eq("trainerId", args.trainerId))
      .first();
    if (!trainer) throw new Error("Trainer not found");

    // If already has a Stripe account, use it; otherwise, create one
    let stripeAccountId = trainer.stripeAccountId;
    if (!stripeAccountId) {
      const account = await stripe.accounts.create({
        type: "express",
        email: trainer.email, // optional, if available
        capabilities: { transfers: { requested: true } },
        metadata: { trainerId: args.trainerId },
      });
      stripeAccountId = account.id;
      await ctx.db.patch(trainer._id, { stripeAccountId });
    }

    // Create onboarding link
    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: args.refreshUrl,
      return_url: args.returnUrl,
      type: "account_onboarding",
    });
    return { onboardingUrl: accountLink.url, stripeAccountId };
  },
});
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
