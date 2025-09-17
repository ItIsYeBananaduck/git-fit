import { httpAction } from "../_generated/server";
import { v } from "convex/values";

// Stripe webhook handler for purchase/expiration events
// Route this action in convex/http.js for endpoint exposure
export const stripeWebhook = httpAction(async (ctx, request) => {
    // 1. Read the raw body for Stripe signature verification
    const rawBody = await request.text();
    const signature = request.headers.get("stripe-signature");
    const stripeSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!stripeSecret) {
        return {
            status: 500,
            body: "Missing STRIPE_WEBHOOK_SECRET env var"
        };
    }

    let Stripe;
    try {
        Stripe = require("stripe");
    } catch (e) {
        return {
            status: 500,
            body: "Stripe SDK not installed."
        };
    }
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2022-11-15" });

    let event;
    try {
        event = stripe.webhooks.constructEvent(rawBody, signature, stripeSecret);
    } catch (err) {
        return {
            status: 400,
            body: `Webhook signature verification failed: ${err instanceof Error ? err.message : String(err)}`
        };
    }

    // 2. Handle event types
    switch (event.type) {
        case "checkout.session.completed": {
            // Extract relevant data from the session
            const session = event.data.object;
            // TODO: Map session metadata or line_items to referenceId, trainerId, clientId, type
            // Example assumes metadata contains these fields (set when creating the session)
            const referenceId = session.metadata?.referenceId; // e.g. programPurchaseId or coachingServiceId
            const trainerId = session.metadata?.trainerId;
            const clientId = session.metadata?.clientId;
            const grossAmount = session.amount_total ? session.amount_total / 100 : 0; // Stripe amount is in cents
            const purchaseType = session.metadata?.type || "program_purchase"; // or "coaching_service"
            // Defensive: Only proceed if all required fields are present
            if (referenceId && trainerId && clientId && grossAmount > 0) {
                try {
                    await ctx.runMutation("payments/recordRevenueTransaction", {
                        referenceId,
                        trainerId,
                        clientId,
                        grossAmount,
                        type: purchaseType,
                        paymentMethod: session.payment_method_types?.[0]
                    });
                } catch (err) {
                    // Log error but do not fail webhook
                    console.error("Failed to record revenue transaction:", err);
                }
            } else {
                // TODO: Log or handle missing metadata
            }
            break;
        }
        case "customer.subscription.deleted":
            // TODO: Mark subscription as expired, revoke access
            break;
        // Add more event types as needed
        default:
            // Unhandled event type
            break;
    }

    return { status: 200, body: "Webhook received" };
});
