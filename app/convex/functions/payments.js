import { mutation } from "../_generated/server";
import { v } from "convex/values";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2022-11-15",
});

// Mutation: Create Stripe Checkout session for one-time purchase
export const createOneTimeCheckoutSession = mutation({
  args: {
    programId: v.id("programs"),
    userId: v.id("users"),
    successUrl: v.string(),
    cancelUrl: v.string(),
  },
  handler: async (ctx, args) => {
    const program = await ctx.db.get(args.programId);
    if (!program) throw new Error("Program not found");
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: program.title,
              description: program.description,
            },
            unit_amount: Math.round(program.price * 100),
          },
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
