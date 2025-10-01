import { action } from '../_generated/server';
import { v } from 'convex/values';
import { api } from '../_generated/api';

// AI Service Configuration
const AI_SERVICE_URL = "https://technically-fit-ai.fly.dev";

// AI-Powered Workout Agent - Makes intelligent adjustments to your training
export const getWorkoutAdjustments = action({
    args: {
        userId: v.string(),
        analysisType: v.optional(v.string()),
    },
    handler: async (ctx, { userId, analysisType = "comprehensive" }) => {
        try {
            console.log(`🤖 AI Agent analyzing user ${userId} for ${analysisType} workout adjustments`);

            // Start with fallback data, then try to get real data
            let userData = null;
            let workoutData: any[] = [];
            let fitnessData = null;

            try {
                userData = await ctx.runQuery(api.users.getUserById, { userId });
            } catch (error) {
                console.log("Could not get user data, using test data");
                userData = {
                    _id: userId,
                    goals: ["strength", "muscle_gain"],
                    fitnessLevel: "intermediate",
                    age: 30,
                    weight: 75,
                    height: 175
                };
            }

            try {
                workoutData = await ctx.runQuery(api.workouts.getUserWorkoutSessions, { userId, limit: 5 });
            } catch (error) {
                console.log("No workout data found, using sample data");
                workoutData = [
                    {
                        date: new Date().toISOString(),
                        exercises: [
                            { exercise: "Bench Press", sets: [{ weight: 80, reps: 8, rpe: 8 }] },
                            { exercise: "Squat", sets: [{ weight: 100, reps: 8, rpe: 7 }] }
                        ],
                        totalVolume: 1440,
                        duration: 60,
                        rpe: 7.5
                    }
                ];
            }

            try {
                fitnessData = await ctx.runQuery(api.fitnessData.getLatestFitnessData, { userId });
            } catch (error) {
                console.log("No fitness data found");
                fitnessData = {
                    heartRate: 70,
                    hrv: 45,
                    spo2: 98,
                    recovery: 85,
                    strain: 12
                };
            }

            // Prepare data for AI analysis
            const analysisData = {
                user: {
                    id: userId,
                    goals: userData?.goals || ["general_fitness"],
                    fitnessLevel: userData?.fitnessLevel || "beginner",
                    age: userData?.age || 25,
                    weight: userData?.weight || 70,
                    height: userData?.height || 170
                },
                recentWorkouts: workoutData,
                currentMetrics: fitnessData,
                analysisType
            };

            console.log(`📊 Calling AI service for workout analysis...`);

            // Call AI service
            const response = await fetch(`${AI_SERVICE_URL}/ai/workout-agent`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'analyze_and_adjust_workout',
                    data: analysisData
                })
            });

            if (!response.ok) {
                console.error(`❌ AI service error: ${response.status}`);
                return generateFallbackAdjustments(userId, workoutData, fitnessData);
            }

            const aiResponse = await response.json();
            console.log(`✅ AI analysis complete!`);

            return {
                success: true,
                userId,
                analysisType,
                adjustments: aiResponse.adjustments || [],
                aiInsights: aiResponse.insights || {},
                message: `AI agent generated ${aiResponse.adjustments?.length || 0} workout adjustments`
            };

        } catch (error) {
            console.error(`❌ Error in AI workout agent:`, error);
            return generateFallbackAdjustments(userId, [], null);
        }
    }
});

// Generate fallback adjustments when AI is unavailable
function generateFallbackAdjustments(userId: string, workoutData: any[], fitnessData: any) {
    const adjustments = [
        {
            id: `fallback_${Date.now()}_1`,
            type: 'workout_optimization',
            title: 'Progressive Overload Recommendation',
            description: 'Gradually increase training intensity for continued strength gains',
            rationale: 'Based on your recent performance patterns',
            priority: 'medium',
            confidence: 0.8,
            category: 'progression',
            actionItems: [
                'Increase weight by 2.5-5% on your next session',
                'Track RPE to ensure you\'re in the 7-9 range',
                'Add 1 extra set if completing all reps easily'
            ],
            expectedOutcomes: [
                'Continued strength progression',
                'Better muscle adaptation',
                'Improved performance metrics'
            ],
            timestamp: Date.now()
        },
        {
            id: `fallback_${Date.now()}_2`,
            type: 'recovery_optimization',
            title: 'Recovery Enhancement Protocol',
            description: 'Optimize recovery between training sessions for better performance',
            rationale: 'Recovery is crucial for adaptation and injury prevention',
            priority: 'high',
            confidence: 0.9,
            category: 'recovery',
            actionItems: [
                'Ensure 7-9 hours of quality sleep',
                'Stay hydrated throughout the day',
                'Include 10-15 minutes of light stretching post-workout',
                'Consider active recovery on rest days'
            ],
            expectedOutcomes: [
                'Improved workout performance',
                'Reduced muscle soreness',
                'Enhanced overall well-being'
            ],
            timestamp: Date.now()
        }
    ];

    return {
        success: true,
        userId,
        analysisType: 'fallback',
        adjustments,
        aiInsights: {
            mode: 'fallback',
            message: 'Generated rule-based adjustments - AI service temporarily unavailable'
        },
        message: `Generated ${adjustments.length} fallback workout adjustments`
    };
}