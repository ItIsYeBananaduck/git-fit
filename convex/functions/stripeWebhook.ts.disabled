// convex/functions/stripeWebhook.ts
// Convex HTTP action for handling Stripe webhooks
import { httpAction } from "../_generated/server";
import Stripe from "stripe";


const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-08-27.basil",
});


import { createPurchaseRecord } from "./createPurchaseRecord";
import { updatePurchaseStatusBySubscriptionId } from "./updatePurchaseStatusBySubscriptionId";

import type { ActionCtx } from "../_generated/server";

export const stripeWebhook = httpAction(async (ctx: ActionCtx, request: Request) => {
    const sig = request.headers.get("stripe-signature");
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!sig || !webhookSecret) {
        return new Response("Missing Stripe signature or webhook secret", { status: 400 });
    }
    const body = await request.text();
    let event: Stripe.Event;
    try {
        event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } catch (err) {
        console.error("Webhook signature verification failed.", err);
        return new Response("Webhook Error", { status: 400 });
    }

    // Handle event types
    switch (event.type) {
        case "checkout.session.completed": {
            const session = event.data.object as Stripe.Checkout.Session;
            // Extract userId and programId from metadata if present
            const userId = session.metadata?.userId;
            const programId = session.metadata?.programId;
            const type = session.mode === "subscription" ? "subscription" : "oneTime";
            if (userId && programId) {
                // Create a new purchase record
                await ctx.runMutation(createPurchaseRecord, {
                    userId,
                    programId,
                    type,
                    status: "active",
                    startDate: Date.now(),
                    endDate: undefined,
                    stripeSubscriptionId: session.subscription ?? undefined,
                });
            }
            break;
        }
        case "customer.subscription.deleted":
        case "customer.subscription.updated": {
            const subscription = event.data.object as Stripe.Subscription;
            // Find purchase by stripeSubscriptionId and update status
            await ctx.runMutation(updatePurchaseStatusBySubscriptionId, {
                stripeSubscriptionId: subscription.id,
                status: subscription.status === "active" ? "active" : "canceled",
                endDate: subscription.ended_at ? subscription.ended_at * 1000 : undefined,
            });
            break;
        }
        default:
            console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response("ok", { status: 200 });
});
