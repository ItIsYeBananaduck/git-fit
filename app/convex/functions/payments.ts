import { mutation } from "../_generated/server";
import { v } from "convex/values";

/**
 * Stripe checkout/session stubs.
 * These are safe stubs that do not require secrets to be present.
 * They return a descriptive error when Stripe keys are not configured.
 */

export const createCheckoutSession = mutation({
  args: {
    plan: v.union(
      v.literal("consumer_monthly"),
      v.literal("consumer_annual"),
      v.literal("trainer_pro_monthly")
    ),
    // Optional: success and cancel URLs from the client (fallback to defaults)
    successUrl: v.optional(v.string()),
    cancelUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const hasStripe = !!process.env.STRIPE_SECRET_KEY;
    if (!hasStripe) {
      return {
        ok: false,
        error: "Stripe not configured. Add STRIPE_SECRET_KEY to your environment.",
      } as const;
    }

    // TODO: Implement with Stripe SDK. This is a placeholder shape.
    // Keep the API stable for the frontend.
    return {
      ok: false,
      error: "Stripe integration not implemented yet.",
      url: undefined,
    } as const;
  },
});

export const createBillingPortalSession = mutation({
  args: {
    // Optionally pass return URL
    returnUrl: v.optional(v.string()),
  },
  handler: async () => {
    const hasStripe = !!process.env.STRIPE_SECRET_KEY;
    if (!hasStripe) {
      return {
        ok: false,
        error: "Stripe not configured. Add STRIPE_SECRET_KEY to your environment.",
      } as const;
    }

    // TODO: Implement with Stripe SDK. This is a placeholder shape.
    return {
      ok: false,
      error: "Stripe billing portal not implemented yet.",
      url: undefined,
    } as const;
  },
});
