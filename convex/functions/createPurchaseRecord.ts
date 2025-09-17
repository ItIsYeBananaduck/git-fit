// Convex mutation to create a purchase record
import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const createPurchaseRecord = mutation({
    args: {
        userId: v.string(),
        programId: v.string(),
        type: v.string(), // "oneTime" | "subscription"
        status: v.string(), // "active" | "expired" | "canceled"
        startDate: v.number(),
        endDate: v.optional(v.number()),
        stripeSubscriptionId: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        await ctx.db.insert("purchases", {
            userId: args.userId,
            programId: args.programId,
            type: args.type,
            status: args.status,
            startDate: args.startDate,
            endDate: args.endDate ?? null,
            stripeSubscriptionId: args.stripeSubscriptionId ?? null,
        });
    },
});
