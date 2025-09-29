/**
 * AI Coaching API Endpoints
 * Task: T035 - Main coaching interaction endpoint
 */

import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../convex/_generated/api';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL || '');

/**
 * Generate AI coaching response
 * POST /api/ai-coaching/generate
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            user_id,
            exercise_type,
            workout_data,
            trigger_type,
            context,
        } = body;

        // Validate required fields
        if (!user_id || !exercise_type) {
            return NextResponse.json(
                { error: 'Missing required fields: user_id, exercise_type' },
                { status: 400 }
            );
        }

        // Check if user should receive coaching
        const coachingCheck = await convex.query(api.functions.userSubscriptions.shouldReceiveCoaching, {
            user_id,
            trigger_type: trigger_type || 'motivation',
            current_time: Date.now(),
        });

        if (!coachingCheck.should_receive) {
            return NextResponse.json({
                success: false,
                reason: coachingCheck.reason,
                coaching_disabled: true,
            });
        }

        // Find applicable triggers
        const triggers = await convex.query(api.functions.workoutTriggers.evaluateTriggers, {
            exercise_type,
            workout_data: workout_data || {},
            trigger_type: trigger_type || undefined,
        });

        if (triggers.length === 0) {
            return NextResponse.json({
                success: false,
                reason: 'No applicable triggers found',
                triggers_available: false,
            });
        }

        // Get the highest priority trigger
        const selectedTrigger = triggers[0];

        // Get persona information
        const persona = await convex.query(api.functions.aiPersonas.getPersona, {
            personaId: coachingCheck.persona_id,
        });

        if (!persona) {
            return NextResponse.json(
                { error: 'Persona not found' },
                { status: 404 }
            );
        }

        // Call AI services to generate response
        const aiResponse = await fetch(`${process.env.AI_SERVICES_URL}/generate-coaching`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.AI_SERVICES_API_KEY}`,
            },
            body: JSON.stringify({
                persona_id: persona.name.toLowerCase(),
                trigger_type: selectedTrigger.trigger_type,
                exercise_type,
                workout_data,
                context: {
                    ...context,
                    user_preferences: coachingCheck,
                    trigger_templates: selectedTrigger.response_templates,
                },
            }),
        });

        if (!aiResponse.ok) {
            throw new Error(`AI service error: ${aiResponse.statusText}`);
        }

        const aiResult = await aiResponse.json();

        // Create voice response record
        const responseId = await convex.mutation(api.functions.voiceResponses.createVoiceResponse, {
            user_id,
            persona_id: persona._id,
            trigger_id: selectedTrigger._id,
            text_content: aiResult.text_response,
            audio_url: aiResult.audio_url,
            response_type: selectedTrigger.trigger_type,
            context_data: {
                exercise_type,
                workout_id: context?.workout_id,
                program_id: context?.program_id,
                performance_data: workout_data,
            },
            generation_metadata: {
                model_version: aiResult.model_version || 'gpt2-base',
                generation_time_ms: aiResult.generation_time,
                tokens_used: aiResult.tokens_used,
                tts_generation_time_ms: aiResult.tts_generation_time,
                audio_cache_hit: aiResult.cache_hit,
            },
            delivered: false,
        });

        return NextResponse.json({
            success: true,
            response_id: responseId,
            text_response: aiResult.text_response,
            audio_url: aiResult.audio_url,
            response_type: selectedTrigger.trigger_type,
            persona: {
                id: persona._id,
                name: persona.name,
                voice_id: persona.voice_id,
            },
            generation_stats: {
                generation_time_ms: aiResult.generation_time,
                cache_hit: aiResult.cache_hit,
                tokens_used: aiResult.tokens_used,
            },
        });

    } catch (error) {
        console.error('AI coaching generation error:', error);
        return NextResponse.json(
            {
                error: 'Failed to generate coaching response',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

/**
 * Mark coaching response as delivered
 * PATCH /api/ai-coaching/delivered
 */
export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json();
        const { response_id, delivery_metadata } = body;

        if (!response_id) {
            return NextResponse.json(
                { error: 'Missing required field: response_id' },
                { status: 400 }
            );
        }

        await convex.mutation(api.functions.voiceResponses.markResponseDelivered, {
            responseId: response_id,
            delivery_metadata: {
                delivery_time: Date.now(),
                ...delivery_metadata,
            },
        });

        return NextResponse.json({
            success: true,
            response_id,
            delivered_at: Date.now(),
        });

    } catch (error) {
        console.error('Delivery marking error:', error);
        return NextResponse.json(
            {
                error: 'Failed to mark response as delivered',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

/**
 * Get user's recent coaching responses
 * GET /api/ai-coaching/history
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const user_id = searchParams.get('user_id');
        const limit = parseInt(searchParams.get('limit') || '20');
        const response_type = searchParams.get('response_type');
        const delivered_only = searchParams.get('delivered_only') === 'true';

        if (!user_id) {
            return NextResponse.json(
                { error: 'Missing required parameter: user_id' },
                { status: 400 }
            );
        }

        const responses = await convex.query(api.functions.voiceResponses.getUserResponses, {
            user_id,
            limit,
            response_type: response_type as 'motivation' | 'correction' | 'encouragement' | 'instruction' | 'celebration' | undefined,
            delivered_only,
        });

        return NextResponse.json({
            success: true,
            responses,
            total_count: responses.length,
        });

    } catch (error) {
        console.error('History retrieval error:', error);
        return NextResponse.json(
            {
                error: 'Failed to retrieve coaching history',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}