// Convex mutation to calculate and record a payout for a trainer
import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const createTrainerPayout = mutation({
    args: {
        trainerId: v.string(),
        periodStart: v.number(),
        periodEnd: v.number(),
        currency: v.string(),
    },
    handler: async (ctx: any, args: {
        trainerId: string,
        periodStart: number,
        periodEnd: number,
        currency: string,
    }) => {
        // Fetch trainer
        const trainer = await ctx.db.query("trainers")
            .withIndex("trainerId", (q: any) => q.eq("trainerId", args.trainerId))
            .first();
        if (!trainer) throw new Error("Trainer not found");
        const commissionPercent = trainer.commissionPercent ?? 30;


        // 1. Get all programs for this trainer
        const programs = await ctx.db.query("trainingPrograms")
            .withIndex("userId", (q: any) => q.eq("userId", trainer.userId))
            .collect();
        const programIds = programs.map((p: any) => p._id);

        // 2. Get all purchases for those programs in the period
        const purchases = await ctx.db.query("purchases")
            .collect();
        const filteredPurchases = purchases.filter((purchase: any) =>
            programIds.includes(purchase.programId) &&
            purchase.startDate >= args.periodStart &&
            purchase.startDate <= args.periodEnd &&
            purchase.status === "active"
        );


        // 3. Sum the purchase amounts and calculate payout using per-purchase commission
        let grossAmount = 0;
        let payoutAmount = 0;
        for (const purchase of filteredPurchases) {
            // Find program price
            const program = programs.find((p: any) => p._id === purchase.programId);
            if (!program) continue;
            const price = program.price || 0;
            grossAmount += price;
            const commission = purchase.commission ?? 0.3;
            payoutAmount += price * (1 - commission);
        }

        // Record payout
        await ctx.db.insert("payouts", {
            trainerId: args.trainerId,
            amount: payoutAmount,
            currency: args.currency,
            periodStart: args.periodStart,
            periodEnd: args.periodEnd,
            status: "pending",
            createdAt: Date.now(),
        });
        return { payoutAmount };
    },
});
