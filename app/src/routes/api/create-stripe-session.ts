// SvelteKit endpoint for Stripe Checkout session creation
import Stripe from 'stripe';
import type { RequestHandler } from '@sveltejs/kit';
import { rateLimit } from '$lib/server/rateLimiter';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-08-27.basil',
});

function isValidPriceId(priceId: unknown): priceId is string {
    return typeof priceId === 'string' && priceId.startsWith('price_');
}
function isValidUserId(userId: unknown): userId is string {
    return typeof userId === 'string' && userId.length > 0;
}

async function verifyRecaptcha(token: string): Promise<boolean> {
    // TODO: Replace with your secret key
    const secret = process.env.RECAPTCHA_SECRET_KEY;
    if (!secret) return false;
    const res = await fetch('https://www.google.com/recaptcha/api/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `secret=${secret}&response=${token}`
    });
    const data = await res.json();
    return data.success === true;
}

export const POST: RequestHandler = async ({ request }) => {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    if (rateLimit(ip)) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), { status: 429 });
    }

    let body;
    try {
        body = await request.json();
    } catch {
        return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400 });
    }
    const { priceId, userId, recaptchaToken } = body;
    if (!isValidPriceId(priceId) || !isValidUserId(userId) || typeof recaptchaToken !== 'string') {
        return new Response(JSON.stringify({ error: 'Invalid or missing parameters' }), { status: 400 });
    }
    const recaptchaValid = await verifyRecaptcha(recaptchaToken);
    if (!recaptchaValid) {
        return new Response(JSON.stringify({ error: 'reCAPTCHA validation failed' }), { status: 403 });
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
        return new Response(JSON.stringify({ sessionId: session.id, url: session.url }), { status: 200 });
    } catch (error) {
        // Log error internally, but return generic message to client
        console.error('Stripe error:', error);
        return new Response(JSON.stringify({ error: 'Payment processing failed. Please try again.' }), { status: 500 });
    }
};
