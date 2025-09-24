import { mutation } from "../../_generated/server";
import { v } from "convex/values";

// Mutation to record a revenue transaction and trigger payout logic
export const recordRevenueTransaction = mutation({
    args: {
        referenceId: v.string(), // programPurchases or coachingServices
        trainerId: v.id("users"),
        clientId: v.id("users"),
        grossAmount: v.number(),
        type: v.union(v.literal("program_purchase"), v.literal("coaching_service")),
        paymentMethod: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        // Commission logic: 20% after Apple/Google tax markup for one-time purchases, 20% for custom coaching
        let platformFee = 0;
        let trainerEarnings = 0;
        if (args.type === "program_purchase") {
            // Assume grossAmount includes Apple/Google markup already
            platformFee = Math.round(args.grossAmount * 0.20 * 100) / 100;
            trainerEarnings = args.grossAmount - platformFee;
        } else if (args.type === "coaching_service") {
            platformFee = Math.round(args.grossAmount * 0.20 * 100) / 100;
            trainerEarnings = args.grossAmount - platformFee;
        }
        // Record the transaction
        const transactionId = await ctx.db.insert("revenueTransactions", {
            type: args.type,
            referenceId: args.referenceId,
            trainerId: args.trainerId,
            clientId: args.clientId,
            grossAmount: args.grossAmount,
            platformFee,
            trainerEarnings,
            processingFees: 0, // TODO: Calculate from Stripe
            netPlatformEarnings: platformFee, // minus processing fees if available
            payoutStatus: "pending",
            transactionDate: new Date().toISOString(),
            metadata: {
                paymentMethod: args.paymentMethod || null,
            },
        });
        // TODO: Trigger payout aggregation logic for trainer
        return { transactionId };
    },
});
