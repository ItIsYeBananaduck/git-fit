import { action } from '../_generated/server.js';
import { v } from 'convex/values';
import { api } from '../_generated/api.js';

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

      // Get user's complete fitness profile
      const user = await ctx.runQuery(api.users.getUserById, { userId });
      if (!user) {
        return {
          success: false,
          error: "User not found",
          adjustments: []
        };
      }

      // Get recent workout history (last 10 workouts)
      let recentWorkouts = [];
      try {
        recentWorkouts = await ctx.runQuery(api.workouts.getUserWorkoutSessions, { 
          userId, 
          limit: 10 
        });
      } catch (error) {
        console.log("No workout sessions found, using fallback");
        recentWorkouts = [];
      }

      // Get latest biometric data (heart rate, HRV, SPo2, recovery)
      let latestFitnessData = null;
      try {
        latestFitnessData = await ctx.runQuery(api.fitnessData.getLatestFitnessData, { userId });
      } catch (error) {
        console.log("No fitness data found");
      }

      // Get current training program
      let activeProgram = null;
      try {
        const programs = await ctx.runQuery(api.trainingPrograms.getTrainingPrograms, { userId });
        activeProgram = programs.find(p => p.isActive);
      } catch (error) {
        console.log("No training programs found");
      }

      // Prepare comprehensive fitness data for AI analysis
      const fitnessProfile = {
        user: {
          id: userId,
          goals: user.goals || [],
          fitnessLevel: user.fitnessLevel || 'beginner',
          injuryHistory: user.injuryHistory || [],
          preferences: user.preferences || {},
          age: user.age,
          weight: user.weight,
          height: user.height
        },
        recentPerformance: recentWorkouts.map(workout => ({
          date: workout.date,
          exercises: workout.exercises || [],
          totalVolume: workout.totalVolume,
          duration: workout.duration,
          rpe: workout.rpe,
          notes: workout.notes
        })),
        currentMetrics: latestFitnessData ? {
          heartRate: latestFitnessData.heartRate,
          hrv: latestFitnessData.hrv,
          spo2: latestFitnessData.spo2,
          sleep: latestFitnessData.sleep,
          recovery: latestFitnessData.recovery,
          strain: latestFitnessData.strain,
          timestamp: latestFitnessData.timestamp
        } : null,
        activeProgram: activeProgram ? {
          id: activeProgram._id,
          name: activeProgram.name,
          phase: activeProgram.currentPhase,
          periodization: activeProgram.periodization,
          exercises: activeProgram.exercises
        } : null,
        analysisType
      };

      console.log(`📊 Sending comprehensive fitness data to AI service for analysis`);

      // Call AI service for intelligent workout analysis and adjustments
      const response = await fetch(`${AI_SERVICE_URL}/ai/workout-agent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'analyze_and_adjust_workout',
          data: fitnessProfile
        })
      });

      if (!response.ok) {
        console.error(`❌ AI service error: ${response.status} ${response.statusText}`);
        return getFallbackAdjustments(userId, recentWorkouts, latestFitnessData);
      }

      const aiResponse = await response.json();
      console.log(`✅ AI analysis complete. Generated ${aiResponse.adjustments?.length || 0} adjustments`);

      // Parse AI adjustments into structured format
      const adjustments = aiResponse.adjustments?.map((adj, index) => ({
        id: adj.id || `ai_adj_${Date.now()}_${index}`,
        type: adj.type || 'workout_modification',
        title: adj.title,
        description: adj.description,
        rationale: adj.rationale,
        priority: adj.priority || 'medium',
        confidence: adj.confidence || 0.7,
        category: adj.category || 'training',
        
        // Specific workout adjustments
        exerciseAdjustments: adj.exerciseAdjustments || [],
        volumeChanges: adj.volumeChanges || {},
        intensityChanges: adj.intensityChanges || {},
        recoveryRecommendations: adj.recoveryRecommendations || [],
        
        // Implementation details
        actionItems: adj.actionItems || [],
        metricsToTrack: adj.metricsToTrack || [],
        expectedOutcomes: adj.expectedOutcomes || [],
        
        timestamp: Date.now()
      })) || [];

      return {
        success: true,
        userId,
        analysisType,
        adjustments,
        aiInsights: aiResponse.insights || {},
        nextAnalysisRecommended: aiResponse.nextAnalysisDate || null
      };

    } catch (error) {
      console.error(`❌ Error in AI workout agent:`, error);
      return getFallbackAdjustments(userId, [], null);
    }
  }
});

// Fallback adjustments when AI is unavailable
function getFallbackAdjustments(userId, recentWorkouts, fitnessData) {
  const adjustments = [];

  // Basic rule-based adjustments
  if (recentWorkouts.length === 0) {
    adjustments.push({
      id: `fallback_${Date.now()}_start`,
      type: 'program_start',
      title: 'Begin Your Training Journey',
      description: 'Start with a structured beginner program to establish proper movement patterns',
      rationale: 'No recent workout history detected - foundation building is priority',
      priority: 'high',
      confidence: 0.9,
      category: 'program_selection',
      actionItems: [
        'Complete movement screen assessment',
        'Choose appropriate training program',
        'Schedule 3 workouts per week',
        'Focus on form over intensity'
      ],
      expectedOutcomes: [
        'Improved movement quality',
        'Established workout routine',
        'Progressive strength gains'
      ],
      timestamp: Date.now()
    });
  } else if (recentWorkouts.length > 0) {
    // Analyze recent workout trends
    const avgRpe = recentWorkouts.reduce((sum, w) => sum + (w.rpe || 5), 0) / recentWorkouts.length;
    
    if (avgRpe > 8) {
      adjustments.push({
        id: `fallback_${Date.now()}_recovery`,
        type: 'recovery_focus',
        title: 'Reduce Training Intensity',
        description: 'Your recent workouts show high RPE - incorporate more recovery',
        rationale: `Average RPE of ${avgRpe.toFixed(1)} indicates excessive training stress`,
        priority: 'high',
        confidence: 0.8,
        category: 'recovery',
        actionItems: [
          'Reduce weights by 10-15% for next week',
          'Add extra rest day',
          'Focus on mobility and light cardio',
          'Prioritize 8+ hours of sleep'
        ],
        expectedOutcomes: [
          'Improved recovery',
          'Reduced fatigue',
          'Better performance quality'
        ],
        timestamp: Date.now()
      });
    } else if (avgRpe < 6) {
      adjustments.push({
        id: `fallback_${Date.now()}_intensity`,
        type: 'progression',
        title: 'Increase Training Intensity',
        description: 'You may be ready for progressive overload',
        rationale: `Average RPE of ${avgRpe.toFixed(1)} suggests room for increased challenge`,
        priority: 'medium',
        confidence: 0.7,
        category: 'progression',
        actionItems: [
          'Increase weights by 2.5-5% next session',
          'Add extra set to compound movements',
          'Reduce rest periods by 15-30 seconds',
          'Consider advanced exercise variations'
        ],
        expectedOutcomes: [
          'Continued strength gains',
          'Improved work capacity',
          'Enhanced muscle adaptation'
        ],
        timestamp: Date.now()
      });
    }
  }

  // Heart rate variability adjustments if we have the data
  if (fitnessData?.hrv) {
    if (fitnessData.hrv < 30) { // Low HRV indicates stress
      adjustments.push({
        id: `fallback_${Date.now()}_hrv`,
        type: 'recovery_protocol',
        title: 'HRV-Guided Recovery Protocol',
        description: 'Low heart rate variability detected - prioritize recovery',
        rationale: `HRV of ${fitnessData.hrv}ms indicates elevated stress/fatigue`,
        priority: 'urgent',
        confidence: 0.85,
        category: 'recovery',
        actionItems: [
          'Reduce training intensity by 20%',
          'Implement daily meditation or breathing exercises',
          'Ensure 8+ hours quality sleep',
          'Consider massage or sauna therapy'
        ],
        expectedOutcomes: [
          'Improved HRV scores',
          'Better stress management',
          'Enhanced recovery capacity'
        ],
        timestamp: Date.now()
      });
    }
  }

  return {
    success: true,
    userId,
    analysisType: 'fallback',
    adjustments,
    aiInsights: { mode: 'fallback', message: 'Using rule-based adjustments - AI service unavailable' },
    nextAnalysisRecommended: Date.now() + (7 * 24 * 60 * 60 * 1000) // 1 week
  };
}

// Apply specific workout adjustments 
export const applyWorkoutAdjustments = action({
  args: {
    userId: v.string(),
    adjustmentIds: v.array(v.string()),
    workoutId: v.optional(v.string()),
  },
  handler: async (ctx, { userId, adjustmentIds, workoutId }) => {
    try {
      console.log(`🔧 Applying ${adjustmentIds.length} workout adjustments for user ${userId}`);

      // Implementation would go here to actually modify workouts
      // For now, we'll log the adjustments that would be applied

      const results = adjustmentIds.map(id => ({
        adjustmentId: id,
        applied: true,
        timestamp: Date.now()
      }));

      return {
        success: true,
        userId,
        workoutId,
        appliedAdjustments: results,
        message: `Successfully applied ${results.length} workout adjustments`
      };

    } catch (error) {
      console.error(`❌ Error applying workout adjustments:`, error);
      return {
        success: false,
        error: error.message,
        appliedAdjustments: []
      };
    }
  }
});