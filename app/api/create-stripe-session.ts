// Node.js API route for Stripe Checkout session creation
import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-08-27.basil',
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    const { priceId, userId } = req.body;
    if (!priceId || !userId) {
        res.status(400).json({ error: 'Missing required parameters' });
        return;
    }

    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${process.env.BASE_URL}/payments/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.BASE_URL}/payments/cancel`,
            metadata: { userId },
        });
        res.status(200).json({ sessionId: session.id, url: session.url });
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
}
