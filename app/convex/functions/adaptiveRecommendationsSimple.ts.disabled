import { query } from '../_generated/server.js';
import { v } from 'convex/values';

// Get adaptive recommendations for a user - simplified version
export const getAdaptiveRecommendations = query({
    args: {
        userId: v.string(),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, { userId, limit = 10 }) => {
        // Return simple mock recommendations for now
        const recommendations = [
            {
                id: 'rec_1',
                type: 'workout',
                title: 'Increase Training Intensity',
                description: 'Consider adding more weight or reps to your current routine',
                reasoning: 'Based on your recent progress, you may benefit from progressive overload',
                actions: [{
                    type: 'increase_intensity',
                    description: 'Add 5-10% more weight to your main lifts',
                    parameters: { intensity_increase: 0.1 }
                }],
                priority: 'medium',
                confidence: 75,
                createdAt: Date.now()
            },
            {
                id: 'rec_2',
                type: 'recovery',
                title: 'Schedule Rest Day',
                description: 'Take a rest day to allow for proper muscle recovery',
                reasoning: 'Regular rest days are important for muscle growth and injury prevention',
                actions: [{
                    type: 'rest_day',
                    description: 'Take tomorrow as a complete rest day',
                    parameters: { duration: '24h' }
                }],
                priority: 'low',
                confidence: 60,
                createdAt: Date.now()
            },
            {
                id: 'rec_3',
                type: 'nutrition',
                title: 'Optimize Protein Intake',
                description: 'Increase your daily protein intake for better muscle recovery',
                reasoning: 'Your current workout intensity suggests higher protein needs',
                actions: [{
                    type: 'modify_nutrition',
                    description: 'Add a protein shake after workouts',
                    parameters: { protein_grams: 25 }
                }],
                priority: 'high',
                confidence: 80,
                createdAt: Date.now()
            }
        ];

        // Sort by priority and confidence
        const sortedRecommendations = recommendations
            .sort((a, b) => {
                const priorityOrder: Record<string, number> = { urgent: 4, high: 3, medium: 2, low: 1 };
                const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
                if (priorityDiff !== 0) return priorityDiff;
                return b.confidence - a.confidence;
            })
            .slice(0, limit);

        return sortedRecommendations;
    },
});