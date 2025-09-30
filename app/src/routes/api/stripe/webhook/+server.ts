import type { RequestHandler } from '@sveltejs/kit';
import { api } from '$lib/convex';
import { convex } from '$lib/convex';

export const POST: RequestHandler = async ({ request }) => {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const stripeKey = process.env.STRIPE_SECRET_KEY;

  if (!webhookSecret || !stripeKey) {
    return new Response('Stripe not configured', { status: 500 });
  }

  // Read the raw body for signature verification
  const payload = await request.text();
  const sig = request.headers.get('stripe-signature');
  if (!sig) {
    return new Response('Missing signature', { status: 400 });
  }

  try {
    const StripeModule = await import('stripe');
    const Stripe = StripeModule.default;
    const stripe = new Stripe(stripeKey, { apiVersion: '2024-06-20' });

    const event = stripe.webhooks.constructEvent(payload, sig, webhookSecret);

    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = event.data.object as any; // Stripe.Subscription
        // NOTE: We need to map customer->user. For now, call an upsert with placeholders.
        const providerCustomerId = sub.customer as string;
        const providerSubscriptionId = sub.id as string;
        const status = sub.status as string;
        const currentPeriodEnd = new Date((sub.current_period_end as number) * 1000).toISOString();

        // Optional type detection by price/product metadata could be added here
        // const type: 'consumer' | 'trainer_pro' = 'consumer';

        await convex.mutation(api.functions.subscriptions.upsertFromStripe, {
          providerCustomerId,
          providerSubscriptionId,
          status,
          currentPeriodEnd,
        });
        break;
      }
      default: {
        // Ignore other events for now
      }
    }

    return new Response('ok', { status: 200 });
  } catch (err: any) {
    console.error('Stripe webhook error:', err);
    return new Response(err?.message ?? 'Webhook error', { status: 400 });
  }
};
