import { mutation } from "../_generated/server";
import { v } from "convex/values";

type Plan = "consumer_monthly" | "consumer_annual" | "trainer_pro_monthly";

function planToPriceId(plan: Plan): string | undefined {
  switch (plan) {
    case "consumer_monthly":
      return process.env.STRIPE_PRICE_CONSUMER_MONTHLY;
    case "consumer_annual":
      return process.env.STRIPE_PRICE_CONSUMER_ANNUAL;
    case "trainer_pro_monthly":
      return process.env.STRIPE_PRICE_TRAINER_PRO_MONTHLY;
    default:
      return undefined;
  }
}

export const createCheckoutSession = mutation({
  args: {
    plan: v.union(
      v.literal("consumer_monthly"),
      v.literal("consumer_annual"),
      v.literal("trainer_pro_monthly")
    ),
    successUrl: v.optional(v.string()),
    cancelUrl: v.optional(v.string()),
    userEmail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!process.env.STRIPE_SECRET_KEY) {
      return { ok: false as const, error: "Stripe not configured. Add STRIPE_SECRET_KEY." };
    }
    const priceId = planToPriceId(args.plan);
    if (!priceId) {
      return { ok: false as const, error: `Price ID not configured for plan '${args.plan}'.` };
    }

    const successUrl = args.successUrl ?? `${process.env.PUBLIC_APP_URL ?? "http://localhost:5173"}/pricing/success`;
    const cancelUrl = args.cancelUrl ?? `${process.env.PUBLIC_APP_URL ?? "http://localhost:5173"}/pricing/cancel`;

    // Dynamic import to avoid bundling when not configured
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" });

    try {
      // Try to create or reuse a Stripe customer if we have userEmail
      let customerId: string | undefined = undefined;
      if (args.userEmail) {
        // Lookup user by email
        const user = await ctx.db
          .query("users")
          .withIndex("by_email", (q) => q.eq("email", args.userEmail!.toLowerCase().trim()))
          .first();
        // If we already have a stripeCustomerId, reuse
        if (user?.stripeCustomerId) {
          customerId = user.stripeCustomerId as string;
        } else {
          // Try to find an existing Stripe customer for this email
          const list = await stripe.customers.list({ email: args.userEmail!, limit: 1 });
          const existing = list.data?.[0];
          const customer = existing ?? (await stripe.customers.create({ email: args.userEmail! }));
          customerId = customer.id;
          // Store on user if present
          if (user) {
            await ctx.db.patch(user._id, { stripeCustomerId: customerId });
          }
        }
      }

      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        success_url: successUrl,
        cancel_url: cancelUrl,
        customer: customerId,
        customer_email: customerId ? undefined : args.userEmail,
      });

      return { ok: true as const, url: session.url };
    } catch (err: any) {
      return { ok: false as const, error: err?.message || "Failed to create checkout session." };
    }
  },
});

export const createBillingPortalSession = mutation({
  args: { returnUrl: v.optional(v.string()) },
  handler: async (_ctx, args) => {
    if (!process.env.STRIPE_SECRET_KEY) {
      return { ok: false as const, error: "Stripe not configured. Add STRIPE_SECRET_KEY." };
    }
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" });

    // NOTE: We need the customer ID to open the portal. This placeholder returns an error
    // until we wire customer linkage (save customer ID to the user in subscriptions table).
    return { ok: false as const, error: "Billing portal requires a Stripe customer ID linkage." };

    // Example for later:
    // const portal = await stripe.billingPortal.sessions.create({ customer, return_url: args.returnUrl ?? defaultUrl });
    // return { ok: true as const, url: portal.url };
  },
});
