// payments.ts
// Convex function for Stripe checkout session creation
import { mutation } from "../_generated/server";
import { v } from "convex/values";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2023-08-16",
});

export const createCheckoutSession = mutation({
    args: {
        priceId: v.string(),
        userId: v.string(),
    },
    handler: async (ctx, args) => {
        const { priceId, userId } = args;
        // Create Stripe Checkout Session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            mode: "payment",
            success_url: `${process.env.BASE_URL}/payments/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.BASE_URL}/payments/cancel`,
            metadata: { userId },
        });
        return { sessionId: session.id, url: session.url };
    },
});
