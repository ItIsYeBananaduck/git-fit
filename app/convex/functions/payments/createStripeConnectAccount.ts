import { mutation } from "../../_generated/server";
import { v } from "convex/values";

// Mutation to create a Stripe Connect account for a trainer and store the account ID
export const createStripeConnectAccount = mutation({
    args: {
        trainerId: v.id("users"),
        email: v.string(),
    },
    handler: async (ctx, args) => {
        let Stripe;
        try {
            Stripe = require("stripe");
        } catch (e) {
            throw new Error("Stripe SDK not installed. Please add it to your Convex backend dependencies.");
        }
        const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
        if (!stripeSecretKey) {
            throw new Error("STRIPE_SECRET_KEY environment variable is not set.");
        }
        const stripe = new Stripe(stripeSecretKey, { apiVersion: "2022-11-15" });

        // 1. Create a Stripe Connect account
        let account;
        try {
            account = await stripe.accounts.create({
                type: "express",
                email: args.email,
                capabilities: {
                    transfers: { requested: true },
                },
            });
        } catch (err) {
            throw new Error("Stripe Connect account creation failed: " + (err instanceof Error ? err.message : String(err)));
        }

        // 2. Store the Stripe account ID in the user's record
        await ctx.db.patch(args.trainerId, { stripeAccountId: account.id });

        // 3. Optionally, create an onboarding link for the trainer
        let onboardingUrl = null;
        try {
            const accountLink = await stripe.accountLinks.create({
                account: account.id,
                refresh_url: process.env.STRIPE_ONBOARDING_REFRESH_URL || "https://yourapp.com/onboarding/refresh",
                return_url: process.env.STRIPE_ONBOARDING_RETURN_URL || "https://yourapp.com/onboarding/complete",
                type: "account_onboarding",
            });
            onboardingUrl = accountLink.url;
        } catch (err) {
            // If onboarding link creation fails, just return account ID
            onboardingUrl = null;
        }

        return { stripeAccountId: account.id, onboardingUrl };
    },
});
