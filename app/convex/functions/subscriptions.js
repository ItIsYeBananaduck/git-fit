import { mutation } from "../_generated/server";
import { v } from "convex/values";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2022-11-15",
});

// Mutation: Create Stripe Checkout session for subscription purchase
export const createSubscriptionCheckoutSession = mutation({
  args: {
    programId: v.id("programs"),
    userId: v.id("users"),
    successUrl: v.string(),
    cancelUrl: v.string(),
  },
  handler: async (ctx, args) => {
    const program = await ctx.db.get(args.programId);
    if (!program) throw new Error("Program not found");
    if (!program.stripePriceId) throw new Error("No Stripe price ID set for this program");
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      line_items: [
        {
          price: program.stripePriceId,
          quantity: 1,
        },
      ],
      metadata: {
        programId: args.programId,
        userId: args.userId,
      },
      success_url: args.successUrl,
      cancel_url: args.cancelUrl,
    });
    return { url: session.url };
  },
});
