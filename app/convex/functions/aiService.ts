import { action } from '../_generated/server';
import { v } from 'convex/values';

// AI Service Configuration
const AI_SERVICE_URL = 'https://technically-fit-ai.fly.dev';

// Types for AI service responses
export interface AIWorkoutTweak {
    exercise: string;
    original_sets: number;
    original_reps: string;
    suggested_sets: number;
    suggested_reps: string;
    reasoning: string;
    confidence: number;
}

export interface AIRecommendation {
    type: 'workout_tweak' | 'rest_day' | 'intensity_adjustment' | 'exercise_substitution';
    title: string;
    description: string;
    reasoning: string;
    confidence: number;
    parameters: Record<string, any>;
}

// Call AI service to get workout tweaks
export const getAIWorkoutTweaks = action({
    args: {
        userId: v.string(),
        workoutData: v.object({
            exercises: v.array(v.object({
                name: v.string(),
                sets: v.number(),
                reps: v.string(),
                weight: v.optional(v.number()),
                notes: v.optional(v.string())
            })),
            userProfile: v.optional(v.object({
                experience_level: v.string(),
                goals: v.array(v.string()),
                equipment: v.array(v.string()),
                injuries: v.array(v.string())
            }))
        })
    },
    handler: async (ctx, { userId, workoutData }) => {
        try {
            const response = await fetch(`${AI_SERVICE_URL}/tweak-workout`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_id: userId,
                    workout: workoutData
                })
            });

            if (!response.ok) {
                throw new Error(`AI service returned ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();

            // Validate response structure
            if (!result.tweaks || !Array.isArray(result.tweaks)) {
                throw new Error('Invalid response format from AI service');
            }

            return {
                success: true,
                tweaks: result.tweaks as AIWorkoutTweak[],
                model_used: result.model_used || 'unknown'
            };

        } catch (error) {
            console.error('AI service call failed:', error);

            // Return fallback response
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                tweaks: [],
                fallback: true
            };
        }
    }
});

// Call AI service for general recommendations
export const getAIRecommendations = action({
    args: {
        userId: v.string(),
        context: v.object({
            recent_performance: v.optional(v.object({
                workout_consistency: v.number(),
                average_intensity: v.number(),
                strength_progress: v.record(v.string(), v.number())
            })),
            goals: v.array(v.string()),
            experience_level: v.string(),
            focus_areas: v.optional(v.array(v.string()))
        })
    },
    handler: async (ctx, { userId, context }) => {
        try {
            const response = await fetch(`${AI_SERVICE_URL}/recommend`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_id: userId,
                    context: context
                })
            });

            if (!response.ok) {
                throw new Error(`AI service returned ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();

            // Validate response structure
            if (!result.recommendations || !Array.isArray(result.recommendations)) {
                throw new Error('Invalid response format from AI service');
            }

            return {
                success: true,
                recommendations: result.recommendations as AIRecommendation[],
                model_used: result.model_used || 'unknown'
            };

        } catch (error) {
            console.error('AI recommendations call failed:', error);

            // Return fallback response
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                recommendations: [],
                fallback: true
            };
        }
    }
});

// Health check for AI service
export const checkAIServiceHealth = action({
    args: {},
    handler: async () => {
        try {
            const response = await fetch(`${AI_SERVICE_URL}/health`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                return {
                    status: 'unhealthy',
                    response_time: null,
                    error: `HTTP ${response.status}: ${response.statusText}`
                };
            }

            const result = await response.json();

            return {
                status: 'healthy',
                response_time: result.response_time || null,
                model_loaded: result.model_loaded || false,
                model_name: result.model_name || null
            };

        } catch (error) {
            return {
                status: 'unhealthy',
                response_time: null,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
});