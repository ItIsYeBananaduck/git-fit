import { query, mutation } from '../_generated/server';
import { v } from 'convex/values';
import type { Id } from '../_generated/dataModel';

// Advanced recommendation engine
export interface UserProfile {
  userId: string;
  goals: string[];
  experience: 'beginner' | 'intermediate' | 'advanced';
  workoutFrequency: number;
  preferredExercises: string[];
  equipment: string[];
  injuries: string[];
  preferences: Record<string, any>;
}

export interface PerformanceMetrics {
  userId: string;
  period: 'week' | 'month' | 'quarter';
  workoutConsistency: number; // 0-100
  averageIntensity: number; // 0-100
  strengthProgress: Record<string, number>; // exercise -> progress %
  enduranceProgress: number;
  recoveryScore: number; // 0-100
  nutritionAdherence: number; // 0-100
  goalProgress: Record<string, number>; // goal -> progress %
}

export interface RecommendationContext {
  userProfile: UserProfile;
  currentMetrics: PerformanceMetrics;
  historicalData: PerformanceMetrics[];
  recentWorkouts: any[];
  nutritionLogs: any[];
  goalAlignment: Record<string, number>;
}

// Advanced recommendation engine
export const generateSmartRecommendations = query({
  args: {
    userId: v.string(),
    context: v.optional(v.object({
      includeHistorical: v.optional(v.boolean()),
      focusAreas: v.optional(v.array(v.string())),
      maxRecommendations: v.optional(v.number())
    }))
  },
  handler: async ({ db }, { userId, context = {} }) => {
    const {
      includeHistorical = true,
      focusAreas = [],
      maxRecommendations = 5
    } = context;

    // Build comprehensive context
    const recommendationContext = await buildRecommendationContext(userId, db, includeHistorical);

    // Generate recommendations using multiple strategies
    const recommendations = await generateMultiStrategyRecommendations(recommendationContext, focusAreas);

    // Rank and filter recommendations
    const rankedRecommendations = rankRecommendations(recommendations, recommendationContext);

    return rankedRecommendations.slice(0, maxRecommendations);
  },
});

// Build comprehensive recommendation context
async function buildRecommendationContext(userId: string, db: any, includeHistorical: boolean): Promise<RecommendationContext> {
  // Get user profile
  const userProfile = await getUserProfile(userId, db);

  // Get current performance metrics
  const currentMetrics = await calculateCurrentMetrics(userId, db);

  // Get historical data if requested
  const historicalData = includeHistorical ?
    await getHistoricalMetrics(userId, db) : [];

  // Get recent activity data
  const recentWorkouts = await getRecentWorkouts(userId, db, 30); // Last 30 days
  const nutritionLogs = await getRecentNutritionLogs(userId, db, 30);

  // Calculate goal alignment
  const goalAlignment = await calculateGoalAlignment(userId, db, currentMetrics);

  return {
    userProfile,
    currentMetrics,
    historicalData,
    recentWorkouts,
    nutritionLogs,
    goalAlignment
  };
}

// Generate recommendations using multiple strategies
async function generateMultiStrategyRecommendations(
  context: RecommendationContext,
  focusAreas: string[]
): Promise<any[]> {
  const recommendations = [];

  // Strategy 1: Performance-based recommendations
  const performanceRecs = await generatePerformanceBasedRecommendations(context);
  recommendations.push(...performanceRecs);

  // Strategy 2: Trend analysis recommendations
  const trendRecs = await generateTrendBasedRecommendations(context);
  recommendations.push(...trendRecs);

  // Strategy 3: Goal alignment recommendations
  const goalRecs = await generateGoalAlignmentRecommendations(context);
  recommendations.push(...goalRecs);

  // Strategy 4: Comparative recommendations
  const comparativeRecs = await generateComparativeRecommendations(context);
  recommendations.push(...comparativeRecs);

  // Strategy 5: Predictive recommendations
  const predictiveRecs = await generatePredictiveRecommendations(context);
  recommendations.push(...predictiveRecs);

  // Filter by focus areas if specified
  if (focusAreas.length > 0) {
    return recommendations.filter(rec =>
      focusAreas.some(area => rec.category?.includes(area) || rec.type?.includes(area))
    );
  }

  return recommendations;
}

// Performance-based recommendations
async function generatePerformanceBasedRecommendations(context: RecommendationContext) {
  const recommendations = [];
  const { currentMetrics, userProfile } = context;

  // Workout consistency analysis
  if (currentMetrics.workoutConsistency < 70) {
    recommendations.push({
      id: `consistency_${Date.now()}`,
      type: 'workout',
      category: 'consistency',
      title: 'Improve Workout Consistency',
      description: 'Building consistent habits is key to long-term success.',
      reasoning: `Your current consistency is ${currentMetrics.workoutConsistency}%. Consistent training leads to better results.`,
      actions: [
        {
          type: 'schedule_optimization',
          description: 'Set up a consistent workout schedule',
          parameters: {
            targetConsistency: 85,
            preferredDays: userProfile.preferences?.workoutDays || []
          }
        }
      ],
      priority: currentMetrics.workoutConsistency < 50 ? 'urgent' : 'high',
      confidence: Math.min(95, 50 + currentMetrics.workoutConsistency),
      expectedImpact: 'high'
    });
  }

  // Intensity optimization
  if (currentMetrics.averageIntensity < 60 && userProfile.experience !== 'beginner') {
    recommendations.push({
      id: `intensity_${Date.now()}`,
      type: 'workout',
      category: 'intensity',
      title: 'Optimize Training Intensity',
      description: 'Increase workout intensity for better results.',
      reasoning: `Your average intensity is ${currentMetrics.averageIntensity}%. Higher intensity can accelerate progress.`,
      actions: [
        {
          type: 'progressive_overload',
          description: 'Implement progressive overload in compound exercises',
          parameters: {
            targetIntensity: 75,
            focusExercises: ['squat', 'bench_press', 'deadlift', 'overhead_press']
          }
        }
      ],
      priority: 'high',
      confidence: 80,
      expectedImpact: 'high'
    });
  }

  // Recovery optimization
  if (currentMetrics.recoveryScore < 70) {
    recommendations.push({
      id: `recovery_${Date.now()}`,
      type: 'recovery',
      category: 'recovery',
      title: 'Enhance Recovery Strategies',
      description: 'Improve recovery to support consistent high performance.',
      reasoning: `Your recovery score is ${currentMetrics.recoveryScore}%. Better recovery leads to better performance.`,
      actions: [
        {
          type: 'recovery_protocol',
          description: 'Implement comprehensive recovery strategies',
          parameters: {
            sleepTarget: 8,
            includeMobility: true,
            nutritionTiming: 'optimized'
          }
        }
      ],
      priority: currentMetrics.recoveryScore < 50 ? 'urgent' : 'medium',
      confidence: 85,
      expectedImpact: 'medium'
    });
  }

  return recommendations;
}

// Trend-based recommendations
async function generateTrendBasedRecommendations(context: RecommendationContext) {
  const recommendations: any[] = [];
  const { historicalData, currentMetrics } = context;

  if (historicalData.length < 2) return recommendations;

  // Analyze strength progress trends
  for (const [exercise, progress] of Object.entries(currentMetrics.strengthProgress)) {
    const trend = calculateTrend(exercise, historicalData);

    if (trend === 'plateau' && progress < 80) {
      recommendations.push({
        id: `plateau_${exercise}_${Date.now()}`,
        type: 'plateau_buster',
        category: 'progression',
        title: `Break ${exercise.replace('_', ' ')} Plateau`,
        description: `Your ${exercise.replace('_', ' ')} progress has stalled.`,
        reasoning: `Trend analysis shows stagnation in ${exercise.replace('_', ' ')}. A strategic intervention can restart progress.`,
        actions: [
          {
            type: 'plateau_buster',
            description: 'Try exercise variations and periodization',
            parameters: {
              exercise,
              strategies: ['variation', 'deload', 'periodization'],
              duration: '4_weeks'
            }
          }
        ],
        priority: 'high',
        confidence: 75,
        expectedImpact: 'high'
      });
    }
  }

  // Analyze consistency trends
  const consistencyTrend = calculateConsistencyTrend(historicalData);
  if (consistencyTrend === 'declining') {
    recommendations.push({
      id: `consistency_trend_${Date.now()}`,
      type: 'motivation',
      category: 'consistency',
      title: 'Address Declining Consistency',
      description: 'Your workout consistency has been trending downward.',
      reasoning: 'Trend analysis shows decreasing workout frequency. Identifying and addressing barriers can help.',
      actions: [
        {
          type: 'motivation_strategy',
          description: 'Implement strategies to improve consistency',
          parameters: {
            accountability: true,
            habitStacking: true,
            rewardSystem: true
          }
        }
      ],
      priority: 'medium',
      confidence: 70,
      expectedImpact: 'medium'
    });
  }

  return recommendations;
}

// Goal alignment recommendations
async function generateGoalAlignmentRecommendations(context: RecommendationContext) {
  const recommendations = [];
  const { goalAlignment, userProfile } = context;

  for (const [goal, alignment] of Object.entries(goalAlignment)) {
    if (alignment < 70) {
      const goalSpecificRecs = getGoalSpecificRecommendations(goal, alignment, userProfile);
      recommendations.push(...goalSpecificRecs);
    }
  }

  return recommendations;
}

// Comparative recommendations
async function generateComparativeRecommendations(context: RecommendationContext) {
  const recommendations = [];
  const { userProfile, currentMetrics } = context;

  // Compare against similar users
  const peerComparison = await getPeerComparison(userProfile, currentMetrics);

  if (peerComparison.workoutFrequency < currentMetrics.workoutConsistency) {
    recommendations.push({
      id: `peer_frequency_${Date.now()}`,
      type: 'workout',
      category: 'optimization',
      title: 'Match Peer Workout Frequency',
      description: 'Users with similar profiles workout more frequently.',
      reasoning: `Similar users average ${peerComparison.workoutFrequency}% consistency vs your ${currentMetrics.workoutConsistency}%.`,
      actions: [
        {
          type: 'frequency_optimization',
          description: 'Increase workout frequency to match peers',
          parameters: {
            targetFrequency: Math.min(peerComparison.workoutFrequency + 10, 90),
            peerBenchmark: peerComparison.workoutFrequency
          }
        }
      ],
      priority: 'medium',
      confidence: 65,
      expectedImpact: 'medium'
    });
  }

  return recommendations;
}

// Predictive recommendations
async function generatePredictiveRecommendations(context: RecommendationContext) {
  const recommendations = [];
  const { historicalData, currentMetrics } = context;

  // Predict potential plateaus
  const plateauPrediction = predictPotentialPlateau(historicalData, currentMetrics);
  if (plateauPrediction.likelihood > 70) {
    recommendations.push({
      id: `preventive_${plateauPrediction.exercise}_${Date.now()}`,
      type: 'preventive',
      category: 'progression',
      title: `Prevent ${plateauPrediction.exercise} Plateau`,
      description: 'Proactive measures to avoid upcoming stagnation.',
      reasoning: `Based on your progress patterns, ${plateauPrediction.exercise} may plateau in ${plateauPrediction.timeframe} weeks.`,
      actions: [
        {
          type: 'preventive_measure',
          description: 'Implement preventive strategies',
          parameters: {
            exercise: plateauPrediction.exercise,
            strategies: ['variation', 'accessory_work', 'periodization'],
            timeframe: plateauPrediction.timeframe
          }
        }
      ],
      priority: 'low',
      confidence: plateauPrediction.likelihood,
      expectedImpact: 'high'
    });
  }

  return recommendations;
}

// Ranking algorithm
function rankRecommendations(recommendations: any[], context: RecommendationContext) {
  return recommendations
    .map(rec => ({
      ...rec,
      score: calculateRecommendationScore(rec, context)
    }))
    .sort((a, b) => b.score - a.score);
}

// Calculate recommendation score based on multiple factors
function calculateRecommendationScore(recommendation: any, context: RecommendationContext) {
  let score = 0;

  // Priority weight (0-40 points)
  const priorityWeights = { urgent: 40, high: 30, medium: 20, low: 10 };
  score += priorityWeights[recommendation.priority] || 10;

  // Confidence weight (0-30 points)
  score += (recommendation.confidence / 100) * 30;

  // Expected impact weight (0-20 points)
  const impactWeights = { high: 20, medium: 15, low: 10 };
  score += impactWeights[recommendation.expectedImpact] || 10;

  // Personalization bonus (0-10 points)
  if (recommendation.category === 'personalized') {
    score += 10;
  }

  // Urgency bonus for time-sensitive recommendations
  if (recommendation.expiresAt) {
    const daysUntilExpiry = (recommendation.expiresAt - Date.now()) / (1000 * 60 * 60 * 24);
    if (daysUntilExpiry < 7) {
      score += Math.max(0, 10 - daysUntilExpiry);
    }
  }

  return score;
}

// Helper functions (mock implementations)
async function getUserProfile(userId: string, db: any): Promise<UserProfile> {
  return {
    userId,
    goals: ['muscle_gain', 'strength'],
    experience: 'intermediate',
    workoutFrequency: 4,
    preferredExercises: ['squat', 'bench_press', 'deadlift'],
    equipment: ['barbell', 'dumbbells', 'rack'],
    injuries: [],
    preferences: { workoutDays: ['monday', 'wednesday', 'friday'] }
  };
}

async function calculateCurrentMetrics(userId: string, db: any): Promise<PerformanceMetrics> {
  return {
    userId,
    period: 'week',
    workoutConsistency: 75,
    averageIntensity: 70,
    strengthProgress: { squat: 85, bench_press: 78, deadlift: 82 },
    enduranceProgress: 80,
    recoveryScore: 75,
    nutritionAdherence: 80,
    goalProgress: { muscle_gain: 75, strength: 80 }
  };
}

async function getHistoricalMetrics(userId: string, db: any): Promise<PerformanceMetrics[]> {
  return [
    {
      userId,
      period: 'week',
      workoutConsistency: 80,
      averageIntensity: 75,
      strengthProgress: { squat: 80, bench_press: 75, deadlift: 78 },
      enduranceProgress: 85,
      recoveryScore: 80,
      nutritionAdherence: 85,
      goalProgress: { muscle_gain: 80, strength: 85 }
    }
  ];
}

async function getRecentWorkouts(userId: string, db: any, days: number) {
  return Array.from({ length: Math.floor(Math.random() * 20) + 10 }, (_, i) => ({
    id: `workout_${i}`,
    date: Date.now() - (i * 24 * 60 * 60 * 1000),
    exercises: ['squat', 'bench_press', 'deadlift'],
    intensity: Math.floor(Math.random() * 30) + 60
  }));
}

async function getRecentNutritionLogs(userId: string, db: any, days: number) {
  return Array.from({ length: Math.floor(Math.random() * 30) + 20 }, (_, i) => ({
    id: `nutrition_${i}`,
    date: Date.now() - (i * 24 * 60 * 60 * 1000),
    calories: Math.floor(Math.random() * 500) + 2000,
    protein: Math.floor(Math.random() * 50) + 100
  }));
}

async function calculateGoalAlignment(userId: string, db: any, metrics: PerformanceMetrics) {
  return {
    muscle_gain: 75,
    strength: 80,
    weight_loss: 85
  };
}

function calculateTrend(exercise: string, historicalData: PerformanceMetrics[]): string {
  // Simple trend calculation
  if (historicalData.length < 2) return 'stable';

  const recent = historicalData[historicalData.length - 1].strengthProgress[exercise] || 0;
  const previous = historicalData[historicalData.length - 2].strengthProgress[exercise] || 0;

  const change = recent - previous;
  if (change < -5) return 'declining';
  if (change > 5) return 'improving';
  return 'plateau';
}

function calculateConsistencyTrend(historicalData: PerformanceMetrics[]): string {
  if (historicalData.length < 3) return 'stable';

  const recent = historicalData.slice(-3).map(d => d.workoutConsistency);
  const trend = recent[2] - recent[0];

  if (trend < -10) return 'declining';
  if (trend > 10) return 'improving';
  return 'stable';
}

function getGoalSpecificRecommendations(goal: string, alignment: number, userProfile: UserProfile) {
  const recommendations = [];

  switch (goal) {
    case 'muscle_gain':
      if (alignment < 70) {
        recommendations.push({
          id: `muscle_gain_${Date.now()}`,
          type: 'nutrition',
          category: 'goal_alignment',
          title: 'Optimize for Muscle Gain',
          description: 'Adjust your nutrition and training for better muscle growth.',
          reasoning: `Your current routine is ${alignment}% aligned with muscle gain goals.`,
          actions: [
            {
              type: 'calorie_surplus',
              description: 'Maintain a moderate calorie surplus',
              parameters: { surplus: 250, protein_target: '2.0g/kg' }
            }
          ],
          priority: 'high',
          confidence: 80,
          expectedImpact: 'high'
        });
      }
      break;

    case 'weight_loss':
      if (alignment < 70) {
        recommendations.push({
          id: `weight_loss_${Date.now()}`,
          type: 'nutrition',
          category: 'goal_alignment',
          title: 'Optimize for Fat Loss',
          description: 'Fine-tune your deficit and training for sustainable weight loss.',
          reasoning: `Your current approach is ${alignment}% aligned with weight loss goals.`,
          actions: [
            {
              type: 'calorie_deficit',
              description: 'Maintain a sustainable calorie deficit',
              parameters: { deficit: 500, preserve_protein: true }
            }
          ],
          priority: 'high',
          confidence: 75,
          expectedImpact: 'high'
        });
      }
      break;
  }

  return recommendations;
}

async function getPeerComparison(userProfile: UserProfile, metrics: PerformanceMetrics) {
  return {
    workoutFrequency: 82,
    averageIntensity: 78,
    strengthProgress: 85
  };
}

function predictPotentialPlateau(historicalData: PerformanceMetrics[], currentMetrics: PerformanceMetrics) {
  // Simple prediction based on recent trends
  const recentStrength = Object.values(currentMetrics.strengthProgress);
  const avgProgress = recentStrength.reduce((a, b) => a + b, 0) / recentStrength.length;

  if (avgProgress > 90) {
    return {
      exercise: 'compound_lifts',
      likelihood: 80,
      timeframe: 2
    };
  }

  return {
    exercise: 'none',
    likelihood: 20,
    timeframe: 6
  };
}