// Convex mutation to update purchase status by Stripe subscription ID
import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const updatePurchaseStatusBySubscriptionId = mutation({
    args: {
        stripeSubscriptionId: v.string(),
        status: v.string(), // "active" | "canceled"
        endDate: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const purchases = await ctx.db.query("purchases")
            .withIndex("by_stripeSubscriptionId", q => q.eq("stripeSubscriptionId", args.stripeSubscriptionId))
            .collect();
        for (const purchase of purchases) {
            await ctx.db.patch(purchase._id, {
                status: args.status,
                endDate: args.endDate ?? null,
            });
        }
    },
});
