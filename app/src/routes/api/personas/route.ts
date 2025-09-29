/**
 * Persona Management API Endpoints
 * Task: T036 - Persona CRUD endpoints
 */

import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../convex/_generated/api';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL || '');

/**
 * Get all active personas
 * GET /api/personas
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const query = searchParams.get('query');
        const expertise_area = searchParams.get('expertise_area');
        const coaching_style = searchParams.get('coaching_style');

        let personas;

        if (query || expertise_area || coaching_style) {
            // Search personas with filters
            personas = await convex.query(api.functions.aiPersonas.searchPersonas, {
                query: query || '',
                expertise_area: expertise_area || undefined,
                coaching_style: coaching_style || undefined,
            });
        } else {
            // Get all active personas
            personas = await convex.query(api.functions.aiPersonas.getActivePersonas);
        }

        return NextResponse.json({
            success: true,
            personas,
            total_count: personas.length,
        });

    } catch (error) {
        console.error('Personas retrieval error:', error);
        return NextResponse.json(
            {
                error: 'Failed to retrieve personas',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

/**
 * Create a new persona
 * POST /api/personas
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            name,
            description,
            voice_id,
            personality_traits,
            coaching_style,
            expertise_areas,
            sample_phrases,
            response_templates,
            voice_settings,
            active = true,
        } = body;

        // Validate required fields
        if (!name || !description || !voice_id || !coaching_style) {
            return NextResponse.json(
                { error: 'Missing required fields: name, description, voice_id, coaching_style' },
                { status: 400 }
            );
        }

        // Validate response templates structure
        if (!response_templates ||
            !response_templates.motivation ||
            !response_templates.correction ||
            !response_templates.encouragement ||
            !response_templates.instruction) {
            return NextResponse.json(
                { error: 'Invalid response_templates structure. Must include motivation, correction, encouragement, and instruction' },
                { status: 400 }
            );
        }

        // Validate voice settings
        if (!voice_settings ||
            typeof voice_settings.stability !== 'number' ||
            typeof voice_settings.similarity_boost !== 'number') {
            return NextResponse.json(
                { error: 'Invalid voice_settings. Must include stability and similarity_boost numbers' },
                { status: 400 }
            );
        }

        const personaId = await convex.mutation(api.functions.aiPersonas.createPersona, {
            name,
            description,
            voice_id,
            personality_traits: personality_traits || [],
            coaching_style,
            expertise_areas: expertise_areas || [],
            sample_phrases: sample_phrases || [],
            response_templates,
            voice_settings,
            active,
        });

        return NextResponse.json({
            success: true,
            persona_id: personaId,
            message: 'Persona created successfully',
        }, { status: 201 });

    } catch (error) {
        console.error('Persona creation error:', error);
        return NextResponse.json(
            {
                error: 'Failed to create persona',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

/**
 * Update an existing persona
 * PUT /api/personas/[id]
 */
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { persona_id, ...updates } = body;

        if (!persona_id) {
            return NextResponse.json(
                { error: 'Missing required field: persona_id' },
                { status: 400 }
            );
        }

        // Validate voice settings if provided
        if (updates.voice_settings) {
            if (typeof updates.voice_settings.stability !== 'number' ||
                typeof updates.voice_settings.similarity_boost !== 'number') {
                return NextResponse.json(
                    { error: 'Invalid voice_settings. Must include stability and similarity_boost numbers' },
                    { status: 400 }
                );
            }
        }

        await convex.mutation(api.functions.aiPersonas.updatePersona, {
            personaId: persona_id,
            ...updates,
        });

        return NextResponse.json({
            success: true,
            persona_id,
            message: 'Persona updated successfully',
        });

    } catch (error) {
        console.error('Persona update error:', error);
        return NextResponse.json(
            {
                error: 'Failed to update persona',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

/**
 * Delete a persona (soft delete)
 * DELETE /api/personas/[id]
 */
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const persona_id = searchParams.get('persona_id');

        if (!persona_id) {
            return NextResponse.json(
                { error: 'Missing required parameter: persona_id' },
                { status: 400 }
            );
        }

        await convex.mutation(api.functions.aiPersonas.deletePersona, {
            personaId: persona_id,
        });

        return NextResponse.json({
            success: true,
            persona_id,
            message: 'Persona deleted successfully',
        });

    } catch (error) {
        console.error('Persona deletion error:', error);
        return NextResponse.json(
            {
                error: 'Failed to delete persona',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}