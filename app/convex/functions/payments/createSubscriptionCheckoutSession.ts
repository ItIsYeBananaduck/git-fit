import { mutation, MutationCtx } from "../../_generated/server";
import { v } from "convex/values";

// Create a Stripe Checkout session for a subscription purchase
export const createSubscriptionCheckoutSession = mutation({
    args: {
        programId: v.id("trainingPrograms"),
        userId: v.id("users"),
        successUrl: v.string(),
        cancelUrl: v.string(),
    },
    handler: async (
        ctx: MutationCtx,
        args: {
            programId: string;
            userId: string;
            successUrl: string;
            cancelUrl: string;
        }
    ) => {
        // 1. Look up the program and user
        const program = await ctx.db.get(args.programId);
        const user = await ctx.db.get(args.userId);
        if (!program) throw new Error("Program not found");
        if (!user) throw new Error("User not found");
        if (!program.stripePriceId) throw new Error("Program is missing Stripe price ID");
        if (!user.email) throw new Error("User is missing email");

        // 2. Load Stripe SDK and secret key
        let Stripe;
        try {
            Stripe = require('stripe');
        } catch (e) {
            throw new Error('Stripe SDK not installed. Please add it to your Convex backend dependencies.');
        }
        const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
        if (!stripeSecretKey) {
            throw new Error('STRIPE_SECRET_KEY environment variable is not set.');
        }
        const stripe = new Stripe(stripeSecretKey, { apiVersion: '2022-11-15' });

        // 3. Create a Stripe Checkout session for a subscription product
        try {
            const session = await stripe.checkout.sessions.create({
                mode: 'subscription',
                line_items: [{ price: program.stripePriceId, quantity: 1 }],
                customer_email: user.email,
                success_url: args.successUrl,
                cancel_url: args.cancelUrl,
            });
            return { url: session.url };
        } catch (err) {
            throw new Error('Stripe Checkout session creation failed: ' + (err instanceof Error ? err.message : String(err)));
        }
    },
});
