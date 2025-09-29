/**
 * Subscription Management API Endpoints
 * Task: T037 - Subscription CRUD endpoints
 */

import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../convex/_generated/api';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL || '');

/**
 * Get user's active subscription
 * GET /api/subscriptions
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const user_id = searchParams.get('user_id');

        if (!user_id) {
            return NextResponse.json(
                { error: 'Missing required parameter: user_id' },
                { status: 400 }
            );
        }

        const subscription = await convex.query(api.functions.userSubscriptions.getUserSubscription, {
            user_id,
        });

        if (!subscription) {
            return NextResponse.json({
                success: true,
                subscription: null,
                has_subscription: false,
            });
        }

        return NextResponse.json({
            success: true,
            subscription,
            has_subscription: true,
        });

    } catch (error) {
        console.error('Subscription retrieval error:', error);
        return NextResponse.json(
            {
                error: 'Failed to retrieve subscription',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

/**
 * Create a new subscription
 * POST /api/subscriptions
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            user_id,
            persona_id,
            subscription_type = 'basic',
            preferences,
            billing_cycle = 'monthly',
            trial_end_date,
        } = body;

        // Validate required fields
        if (!user_id || !persona_id || !preferences) {
            return NextResponse.json(
                { error: 'Missing required fields: user_id, persona_id, preferences' },
                { status: 400 }
            );
        }

        // Validate subscription type
        if (!['basic', 'premium', 'enterprise'].includes(subscription_type)) {
            return NextResponse.json(
                { error: 'Invalid subscription_type. Must be basic, premium, or enterprise' },
                { status: 400 }
            );
        }

        // Validate preferences structure
        if (typeof preferences.voice_enabled !== 'boolean' ||
            !preferences.frequency ||
            !['high', 'medium', 'low'].includes(preferences.frequency) ||
            !Array.isArray(preferences.trigger_types)) {
            return NextResponse.json(
                { error: 'Invalid preferences structure' },
                { status: 400 }
            );
        }

        const subscriptionId = await convex.mutation(api.functions.userSubscriptions.createSubscription, {
            user_id,
            persona_id,
            subscription_type,
            preferences,
            billing_cycle,
            trial_end_date,
        });

        return NextResponse.json({
            success: true,
            subscription_id: subscriptionId,
            message: 'Subscription created successfully',
        }, { status: 201 });

    } catch (error) {
        console.error('Subscription creation error:', error);
        return NextResponse.json(
            {
                error: 'Failed to create subscription',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

/**
 * Update subscription preferences
 * PATCH /api/subscriptions/preferences
 */
export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json();
        const { user_id, preferences } = body;

        if (!user_id || !preferences) {
            return NextResponse.json(
                { error: 'Missing required fields: user_id, preferences' },
                { status: 400 }
            );
        }

        // Validate preferences structure if provided
        if (preferences.frequency && !['high', 'medium', 'low'].includes(preferences.frequency)) {
            return NextResponse.json(
                { error: 'Invalid frequency. Must be high, medium, or low' },
                { status: 400 }
            );
        }

        if (preferences.trigger_types && !Array.isArray(preferences.trigger_types)) {
            return NextResponse.json(
                { error: 'trigger_types must be an array' },
                { status: 400 }
            );
        }

        await convex.mutation(api.functions.userSubscriptions.updateSubscriptionPreferences, {
            user_id,
            preferences,
        });

        return NextResponse.json({
            success: true,
            message: 'Preferences updated successfully',
        });

    } catch (error) {
        console.error('Preferences update error:', error);
        return NextResponse.json(
            {
                error: 'Failed to update preferences',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

/**
 * Change subscription persona
 * PUT /api/subscriptions/persona
 */
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { user_id, new_persona_id } = body;

        if (!user_id || !new_persona_id) {
            return NextResponse.json(
                { error: 'Missing required fields: user_id, new_persona_id' },
                { status: 400 }
            );
        }

        await convex.mutation(api.functions.userSubscriptions.changePersona, {
            user_id,
            new_persona_id,
        });

        return NextResponse.json({
            success: true,
            message: 'Persona changed successfully',
        });

    } catch (error) {
        console.error('Persona change error:', error);
        return NextResponse.json(
            {
                error: 'Failed to change persona',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

/**
 * Cancel subscription
 * DELETE /api/subscriptions
 */
export async function DELETE(request: NextRequest) {
    try {
        const body = await request.json();
        const { user_id, cancellation_reason } = body;

        if (!user_id) {
            return NextResponse.json(
                { error: 'Missing required field: user_id' },
                { status: 400 }
            );
        }

        await convex.mutation(api.functions.userSubscriptions.cancelSubscription, {
            user_id,
            cancellation_reason,
        });

        return NextResponse.json({
            success: true,
            message: 'Subscription cancelled successfully',
        });

    } catch (error) {
        console.error('Subscription cancellation error:', error);
        return NextResponse.json(
            {
                error: 'Failed to cancel subscription',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}