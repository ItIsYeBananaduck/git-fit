import { mutation } from "../_generated/server";
import { v } from "convex/values";

/**
 * Upsert a subscription record from Stripe webhook payload.
 * This assumes that user linkage via providerCustomerId will be added later.
 */
export const upsertFromStripe = mutation({
  args: {
    providerCustomerId: v.string(),
    providerSubscriptionId: v.string(),
    status: v.string(),
    currentPeriodEnd: v.string(),
    type: v.optional(v.union(v.literal("consumer"), v.literal("trainer_pro"))),
  },
  handler: async (ctx, args) => {
    // Find user by Stripe customer id
    const user = await ctx.db
      .query("users")
      .withIndex("by_stripe_customer", (q) => q.eq("stripeCustomerId", args.providerCustomerId))
      .first();

    if (!user) {
      return { ok: false as const, error: "No user linked to this Stripe customer id." };
    }

    // Map Stripe status to schema union type
    const mapStatus = (s: string): "active" | "trialing" | "past_due" | "canceled" | "incomplete" | "incomplete_expired" => {
      switch (s) {
        case "active":
        case "trialing":
        case "past_due":
        case "canceled":
        case "incomplete":
        case "incomplete_expired":
          return s;
        default:
          // Fallback: treat unknown as past_due
          return "past_due";
      }
    };

    const normalizedStatus = mapStatus(args.status);

    // See if we already have a subscription by providerSubscriptionId
    const existing = await ctx.db
      .query("subscriptions")
      .withIndex("by_provider_sub", (q) => q.eq("providerSubscriptionId", args.providerSubscriptionId))
      .first();

    const doc = {
      userId: user._id,
      type: args.type ?? "consumer",
      provider: "stripe" as const,
      status: normalizedStatus,
      startedAt: new Date().toISOString(),
      currentPeriodEnd: args.currentPeriodEnd,
      cancelAt: undefined,
      providerCustomerId: args.providerCustomerId,
      providerSubscriptionId: args.providerSubscriptionId,
    };

    if (existing) {
      await ctx.db.patch(existing._id, {
        status: doc.status,
        currentPeriodEnd: doc.currentPeriodEnd,
        cancelAt: doc.cancelAt,
        providerCustomerId: doc.providerCustomerId,
      });
      return { ok: true as const, updated: true };
    }

    await ctx.db.insert("subscriptions", doc);
    return { ok: true as const, created: true };
  },
});
