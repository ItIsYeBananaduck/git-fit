/**
 * Training Data Management API Endpoints
 * Task: T038 - Training data CRUD endpoints
 */

import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../convex/_generated/api';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL || '');

/**
 * Get training data with filters
 * GET /api/training-data
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const persona_id = searchParams.get('persona_id');
        const exercise_type = searchParams.get('exercise_type');
        const response_type = searchParams.get('response_type');
        const validation_status = searchParams.get('validation_status');
        const min_quality_score = searchParams.get('min_quality_score');
        const approved_only = searchParams.get('approved_only') === 'true';
        const limit = parseInt(searchParams.get('limit') || '50');

        let trainingData;

        if (exercise_type) {
            // Get training data by exercise type
            trainingData = await convex.query(api.functions.trainingData.getTrainingDataByExercise, {
                exercise_type,
                response_type: response_type as 'motivation' | 'correction' | 'encouragement' | 'instruction' | 'celebration' | undefined,
                approved_only,
            });
        } else if (persona_id) {
            // Get training data for specific persona
            trainingData = await convex.query(api.functions.trainingData.getPersonaTrainingData, {
                persona_id,
                validation_status: validation_status as 'pending' | 'approved' | 'rejected' | undefined,
                min_quality_score: min_quality_score ? parseFloat(min_quality_score) : undefined,
                limit,
            });
        } else {
            return NextResponse.json(
                { error: 'Must specify either persona_id or exercise_type' },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
            training_data: trainingData,
            total_count: trainingData.length,
        });

    } catch (error) {
        console.error('Training data retrieval error:', error);
        return NextResponse.json(
            {
                error: 'Failed to retrieve training data',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

/**
 * Create new training data entry
 * POST /api/training-data
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            user_id,
            persona_id,
            input_context,
            expected_response,
            response_type,
            quality_score = 5,
            source = 'manual',
            validation_status = 'pending',
        } = body;

        // Validate required fields
        if (!user_id || !persona_id || !input_context || !expected_response || !response_type) {
            return NextResponse.json(
                { error: 'Missing required fields: user_id, persona_id, input_context, expected_response, response_type' },
                { status: 400 }
            );
        }

        // Validate input_context structure
        if (!input_context.exercise_type || !input_context.user_performance || !input_context.workout_phase) {
            return NextResponse.json(
                { error: 'Invalid input_context structure. Must include exercise_type, user_performance, and workout_phase' },
                { status: 400 }
            );
        }

        // Validate response_type
        if (!['motivation', 'correction', 'encouragement', 'instruction', 'celebration'].includes(response_type)) {
            return NextResponse.json(
                { error: 'Invalid response_type' },
                { status: 400 }
            );
        }

        // Validate source
        if (!['user_feedback', 'expert_annotation', 'automated_collection', 'user_correction', 'manual'].includes(source)) {
            return NextResponse.json(
                { error: 'Invalid source' },
                { status: 400 }
            );
        }

        const trainingDataId = await convex.mutation(api.functions.trainingData.createTrainingData, {
            user_id,
            persona_id,
            input_context,
            expected_response,
            response_type,
            quality_score,
            source,
            validation_status,
        });

        return NextResponse.json({
            success: true,
            training_data_id: trainingDataId,
            message: 'Training data created successfully',
        }, { status: 201 });

    } catch (error) {
        console.error('Training data creation error:', error);
        return NextResponse.json(
            {
                error: 'Failed to create training data',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

/**
 * Update training data validation status
 * PATCH /api/training-data/validation
 */
export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json();
        const { training_data_id, validation_status, reviewer_notes, quality_score } = body;

        if (!training_data_id || !validation_status) {
            return NextResponse.json(
                { error: 'Missing required fields: training_data_id, validation_status' },
                { status: 400 }
            );
        }

        // Validate validation_status
        if (!['pending', 'approved', 'rejected'].includes(validation_status)) {
            return NextResponse.json(
                { error: 'Invalid validation_status. Must be pending, approved, or rejected' },
                { status: 400 }
            );
        }

        await convex.mutation(api.functions.trainingData.updateValidationStatus, {
            trainingDataId: training_data_id,
            validation_status,
            reviewer_notes,
            quality_score,
        });

        return NextResponse.json({
            success: true,
            message: 'Validation status updated successfully',
        });

    } catch (error) {
        console.error('Validation status update error:', error);
        return NextResponse.json(
            {
                error: 'Failed to update validation status',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

/**
 * Collect user feedback for training
 * POST /api/training-data/feedback
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { user_id, response_id, feedback_type, improved_response, feedback_notes } = body;

        if (!user_id || !response_id || !feedback_type) {
            return NextResponse.json(
                { error: 'Missing required fields: user_id, response_id, feedback_type' },
                { status: 400 }
            );
        }

        // Validate feedback_type
        if (!['positive', 'negative', 'correction'].includes(feedback_type)) {
            return NextResponse.json(
                { error: 'Invalid feedback_type. Must be positive, negative, or correction' },
                { status: 400 }
            );
        }

        const trainingDataId = await convex.mutation(api.functions.trainingData.collectUserFeedback, {
            user_id,
            response_id,
            feedback_type,
            improved_response,
            feedback_notes,
        });

        return NextResponse.json({
            success: true,
            training_data_id: trainingDataId,
            message: 'Feedback collected successfully',
        });

    } catch (error) {
        console.error('Feedback collection error:', error);
        return NextResponse.json(
            {
                error: 'Failed to collect feedback',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

/**
 * Get training data statistics
 * GET /api/training-data/stats
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const persona_id = searchParams.get('persona_id');
        const days = parseInt(searchParams.get('days') || '30');

        const stats = await convex.query(api.functions.trainingData.getTrainingDataStats, {
            persona_id: persona_id || undefined,
            days,
        });

        return NextResponse.json({
            success: true,
            stats,
        });

    } catch (error) {
        console.error('Training data stats error:', error);
        return NextResponse.json(
            {
                error: 'Failed to retrieve training data statistics',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

/**
 * Get fine-tuning data for a persona
 * GET /api/training-data/fine-tuning
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const persona_id = searchParams.get('persona_id');
        const min_quality_score = parseFloat(searchParams.get('min_quality_score') || '7');
        const max_samples = parseInt(searchParams.get('max_samples') || '1000');

        if (!persona_id) {
            return NextResponse.json(
                { error: 'Missing required parameter: persona_id' },
                { status: 400 }
            );
        }

        const fineTuningData = await convex.query(api.functions.trainingData.getFineTuningData, {
            persona_id,
            min_quality_score,
            max_samples,
        });

        return NextResponse.json({
            success: true,
            fine_tuning_data: fineTuningData,
            total_samples: fineTuningData.length,
        });

    } catch (error) {
        console.error('Fine-tuning data retrieval error:', error);
        return NextResponse.json(
            {
                error: 'Failed to retrieve fine-tuning data',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

/**
 * Delete training data entry
 * DELETE /api/training-data
 */
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const training_data_id = searchParams.get('training_data_id');

        if (!training_data_id) {
            return NextResponse.json(
                { error: 'Missing required parameter: training_data_id' },
                { status: 400 }
            );
        }

        await convex.mutation(api.functions.trainingData.deleteTrainingData, {
            trainingDataId: training_data_id,
        });

        return NextResponse.json({
            success: true,
            message: 'Training data deleted successfully',
        });

    } catch (error) {
        console.error('Training data deletion error:', error);
        return NextResponse.json(
            {
                error: 'Failed to delete training data',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}