import { query, mutation } from '../_generated/server';
import { v } from 'convex/values';
import type { Id } from '../_generated/dataModel';

// Recommendation types
export type RecommendationType = 'workout' | 'nutrition' | 'recovery' | 'progression' | 'plateau_buster';
export type RecommendationPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface AdaptiveRecommendation {
  id: string;
  type: RecommendationType;
  title: string;
  description: string;
  reasoning: string;
  actions: RecommendationAction[];
  priority: RecommendationPriority;
  confidence: number; // 0-100
  expiresAt?: number;
  createdAt: number;
}

export interface RecommendationAction {
  type: 'adjust_workout' | 'modify_nutrition' | 'rest_day' | 'increase_intensity' | 'change_exercise' | 'add_supplement';
  description: string;
  parameters: Record<string, any>;
}

// Get adaptive recommendations for a user
export const getAdaptiveRecommendations = query({
  args: {
    userId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async ({ db }, { userId, limit = 10 }) => {
    const recommendations = await generateRecommendations(userId, db);

    // Sort by priority and confidence
    const sortedRecommendations = recommendations
      .sort((a, b) => {
        const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return b.confidence - a.confidence;
      })
      .slice(0, limit);

    return sortedRecommendations;
  },
});

// Generate personalized recommendations based on user data
async function generateRecommendations(userId: string, db: any): Promise<AdaptiveRecommendation[]> {
  const recommendations: AdaptiveRecommendation[] = [];
  const now = Date.now();

  // Analyze workout performance
  const workoutAnalysis = await analyzeWorkoutPerformance(userId, db);
  if (workoutAnalysis) {
    recommendations.push(...workoutAnalysis);
  }

  // Analyze nutrition patterns
  const nutritionAnalysis = await analyzeNutritionPatterns(userId, db);
  if (nutritionAnalysis) {
    recommendations.push(...nutritionAnalysis);
  }

  // Analyze progress plateaus
  const plateauAnalysis = await analyzeProgressPlateaus(userId, db);
  if (plateauAnalysis) {
    recommendations.push(...plateauAnalysis);
  }

  // Analyze recovery needs
  const recoveryAnalysis = await analyzeRecoveryNeeds(userId, db);
  if (recoveryAnalysis) {
    recommendations.push(...recoveryAnalysis);
  }

  // Analyze goal alignment
  const goalAnalysis = await analyzeGoalAlignment(userId, db);
  if (goalAnalysis) {
    recommendations.push(...goalAnalysis);
  }

  return recommendations;
}

// Analyze workout performance patterns
async function analyzeWorkoutPerformance(userId: string, db: any): Promise<AdaptiveRecommendation[]> {
  const recommendations: AdaptiveRecommendation[] = [];

  try {
    // Get recent workout data (mock implementation)
    const recentWorkouts = await getRecentWorkouts(userId, db);
    const workoutStreak = await getWorkoutStreak(userId, db);
    const averageIntensity = await getAverageIntensity(userId, db);

    // Check for workout consistency
    if (workoutStreak < 3) {
      recommendations.push({
        id: `workout_consistency_${Date.now()}`,
        type: 'workout',
        title: 'Build Workout Consistency',
        description: 'Establishing a consistent workout routine will help you achieve your goals faster.',
        reasoning: `You've completed ${workoutStreak} workouts this week. Building consistency is key to long-term success.`,
        actions: [
          {
            type: 'adjust_workout',
            description: 'Schedule 3-4 workouts per week',
            parameters: { frequency: '3-4', duration: '45-60' }
          }
        ],
        priority: 'high',
        confidence: 85,
        createdAt: Date.now()
      });
    }

    // Check for intensity progression
    if (averageIntensity < 60) {
      recommendations.push({
        id: `intensity_progression_${Date.now()}`,
        type: 'progression',
        title: 'Increase Training Intensity',
        description: 'Gradually increasing workout intensity can accelerate your progress.',
        reasoning: `Your average workout intensity is ${averageIntensity}%. Consider adding more challenging exercises or increasing weights.`,
        actions: [
          {
            type: 'increase_intensity',
            description: 'Add progressive overload to your workouts',
            parameters: { target_intensity: 75, timeframe: '2_weeks' }
          }
        ],
        priority: 'medium',
        confidence: 75,
        createdAt: Date.now()
      });
    }

    // Check for overtraining signs
    if (recentWorkouts.length > 6 && averageIntensity > 85) {
      recommendations.push({
        id: `recovery_needed_${Date.now()}`,
        type: 'recovery',
        title: 'Prioritize Recovery',
        description: 'Your recent workouts have been very intense. Consider adding rest days.',
        reasoning: `You've completed ${recentWorkouts.length} high-intensity workouts recently. Recovery is crucial for continued progress.`,
        actions: [
          {
            type: 'rest_day',
            description: 'Take 1-2 rest days this week',
            parameters: { rest_days: '1-2', focus: 'active_recovery' }
          }
        ],
        priority: 'urgent',
        confidence: 90,
        createdAt: Date.now()
      });
    }

  } catch (error) {
    console.error('Error analyzing workout performance:', error);
  }

  return recommendations;
}

// Analyze nutrition patterns
async function analyzeNutritionPatterns(userId: string, db: any): Promise<AdaptiveRecommendation[]> {
  const recommendations: AdaptiveRecommendation[] = [];

  try {
    // Get nutrition data (mock implementation)
    const nutritionData = await getNutritionData(userId, db);
    const calorieConsistency = await getCalorieConsistency(userId, db);
    const proteinIntake = await getProteinIntake(userId, db);

    // Check protein intake
    if (proteinIntake < 1.2) { // grams per kg of body weight
      recommendations.push({
        id: `protein_optimization_${Date.now()}`,
        type: 'nutrition',
        title: 'Optimize Protein Intake',
        description: 'Increasing protein intake can support muscle growth and recovery.',
        reasoning: `Your current protein intake is ${proteinIntake}g/kg. Aim for 1.6-2.2g/kg for optimal muscle protein synthesis.`,
        actions: [
          {
            type: 'modify_nutrition',
            description: 'Increase protein intake to 1.6-2.2g per kg of body weight',
            parameters: { target_protein: '1.6-2.2', timeframe: '1_week' }
          }
        ],
        priority: 'high',
        confidence: 80,
        createdAt: Date.now()
      });
    }

    // Check calorie consistency
    if (calorieConsistency < 70) {
      recommendations.push({
        id: `calorie_consistency_${Date.now()}`,
        type: 'nutrition',
        title: 'Improve Calorie Consistency',
        description: 'Consistent calorie intake helps maintain energy levels and supports your goals.',
        reasoning: `Your calorie intake varies significantly (${calorieConsistency}% consistency). More consistent intake can improve results.`,
        actions: [
          {
            type: 'modify_nutrition',
            description: 'Aim for consistent daily calorie intake',
            parameters: { consistency_target: 85, tracking: 'daily' }
          }
        ],
        priority: 'medium',
        confidence: 70,
        createdAt: Date.now()
      });
    }

  } catch (error) {
    console.error('Error analyzing nutrition patterns:', error);
  }

  return recommendations;
}

// Analyze progress plateaus
async function analyzeProgressPlateaus(userId: string, db: any): Promise<AdaptiveRecommendation[]> {
  const recommendations: AdaptiveRecommendation[] = [];

  try {
    // Check for strength plateaus
    const strengthPlateau = await detectStrengthPlateau(userId, db);
    if (strengthPlateau) {
      recommendations.push({
        id: `plateau_buster_${Date.now()}`,
        type: 'plateau_buster',
        title: 'Break Through Your Plateau',
        description: 'Try periodization or deload weeks to overcome training plateaus.',
        reasoning: `Your ${strengthPlateau.exercise} progress has stalled for ${strengthPlateau.weeks} weeks. A strategic change can help.`,
        actions: [
          {
            type: 'change_exercise',
            description: 'Try exercise variations or periodization',
            parameters: {
              exercise: strengthPlateau.exercise,
              suggestion: 'variation_or_deload'
            }
          }
        ],
        priority: 'high',
        confidence: 85,
        createdAt: Date.now()
      });
    }

  } catch (error) {
    console.error('Error analyzing progress plateaus:', error);
  }

  return recommendations;
}

// Analyze recovery needs
async function analyzeRecoveryNeeds(userId: string, db: any): Promise<AdaptiveRecommendation[]> {
  const recommendations: AdaptiveRecommendation[] = [];

  try {
    // Check sleep patterns, HRV, etc. (mock implementation)
    const recoveryScore = await getRecoveryScore(userId, db);

    if (recoveryScore < 60) {
      recommendations.push({
        id: `recovery_optimization_${Date.now()}`,
        type: 'recovery',
        title: 'Focus on Recovery',
        description: 'Your recovery metrics indicate you need more rest and recovery activities.',
        reasoning: `Your recovery score is ${recoveryScore}/100. Prioritizing recovery will improve performance and reduce injury risk.`,
        actions: [
          {
            type: 'rest_day',
            description: 'Incorporate more rest and active recovery',
            parameters: { focus: 'sleep_quality', duration: '7_days' }
          }
        ],
        priority: 'urgent',
        confidence: 90,
        createdAt: Date.now()
      });
    }

  } catch (error) {
    console.error('Error analyzing recovery needs:', error);
  }

  return recommendations;
}

// Analyze goal alignment
async function analyzeGoalAlignment(userId: string, db: any): Promise<AdaptiveRecommendation[]> {
  const recommendations: AdaptiveRecommendation[] = [];

  try {
    // Get user goals and current progress
    const goals = await getUserGoals(userId, db);
    const progress = await getGoalProgress(userId, db);

    // Check if current routine aligns with goals
    for (const goal of goals) {
      const alignment = await checkGoalAlignment(goal, progress);

      if (alignment < 70) {
        recommendations.push({
          id: `goal_alignment_${goal.id}_${Date.now()}`,
          type: 'workout',
          title: `Align with ${goal.title}`,
          description: `Adjust your training to better support your ${goal.title.toLowerCase()} goal.`,
          reasoning: `Your current routine is only ${alignment}% aligned with your ${goal.title.toLowerCase()} goal.`,
          actions: [
            {
              type: 'adjust_workout',
              description: `Modify routine for ${goal.title.toLowerCase()}`,
              parameters: { goal_id: goal.id, alignment_target: 80 }
            }
          ],
          priority: 'medium',
          confidence: 75,
          createdAt: Date.now()
        });
      }
    }

  } catch (error) {
    console.error('Error analyzing goal alignment:', error);
  }

  return recommendations;
}

// Helper functions (mock implementations)
async function getRecentWorkouts(userId: string, db: any) {
  // Mock: return array of recent workouts
  return Array.from({ length: Math.floor(Math.random() * 10) + 1 }, (_, i) => ({
    id: `workout_${i}`,
    date: Date.now() - (i * 24 * 60 * 60 * 1000),
    intensity: Math.floor(Math.random() * 40) + 60
  }));
}

async function getWorkoutStreak(userId: string, db: any) {
  // Mock: return workout streak
  return Math.floor(Math.random() * 7) + 1;
}

async function getAverageIntensity(userId: string, db: any) {
  // Mock: return average intensity
  return Math.floor(Math.random() * 30) + 50;
}

async function getNutritionData(userId: string, db: any) {
  // Mock: return nutrition data
  return {
    calories: Math.floor(Math.random() * 500) + 2000,
    protein: Math.floor(Math.random() * 50) + 100,
    consistency: Math.floor(Math.random() * 30) + 70
  };
}

async function getCalorieConsistency(userId: string, db: any) {
  // Mock: return calorie consistency percentage
  return Math.floor(Math.random() * 30) + 70;
}

async function getProteinIntake(userId: string, db: any) {
  // Mock: return protein intake in g/kg
  return Math.random() * 1.5 + 0.8;
}

async function detectStrengthPlateau(userId: string, db: any) {
  // Mock: detect if user has plateaued
  if (Math.random() > 0.7) {
    return {
      exercise: 'Bench Press',
      weeks: Math.floor(Math.random() * 4) + 2
    };
  }
  return null;
}

async function getRecoveryScore(userId: string, db: any) {
  // Mock: return recovery score
  return Math.floor(Math.random() * 40) + 60;
}

async function getUserGoals(userId: string, db: any) {
  // Mock: return user goals
  return [
    { id: 'goal_1', title: 'Muscle Gain', type: 'muscle_gain' },
    { id: 'goal_2', title: 'Weight Loss', type: 'weight_loss' }
  ];
}

async function getGoalProgress(userId: string, db: any) {
  // Mock: return goal progress
  return {
    muscle_gain: Math.floor(Math.random() * 30) + 70,
    weight_loss: Math.floor(Math.random() * 30) + 70
  };
}

async function checkGoalAlignment(goal: any, progress: any) {
  // Mock: return alignment percentage
  return Math.floor(Math.random() * 30) + 70;
}

// Mark recommendation as viewed/dismissed
export const updateRecommendationStatus = mutation({
  args: {
    userId: v.string(),
    recommendationId: v.string(),
    action: v.string(), // 'viewed', 'dismissed', 'applied'
  },
  handler: async ({ db }, { userId, recommendationId, action }) => {
    // In a real implementation, you'd store recommendation interactions
    console.log(`User ${userId} ${action} recommendation ${recommendationId}`);
    return { success: true };
  },
});

// Get recommendation history for a user
export const getRecommendationHistory = query({
  args: {
    userId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async ({ db }, { userId, limit = 20 }) => {
    // Mock: return recommendation history
    return [
      {
        id: 'rec_1',
        type: 'workout',
        title: 'Increase Training Frequency',
        action: 'applied',
        appliedAt: Date.now() - (7 * 24 * 60 * 60 * 1000),
        result: 'positive'
      },
      {
        id: 'rec_2',
        type: 'nutrition',
        title: 'Optimize Protein Intake',
        action: 'viewed',
        viewedAt: Date.now() - (3 * 24 * 60 * 60 * 1000),
        result: null
      }
    ].slice(0, limit);
  },
});