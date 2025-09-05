import type { WHOOPRecovery, WHOOPStrain } from '$lib/api/whoop';

export interface TrainingParameters {
  load: number; // percentage of 1RM or RPE scale
  reps: number;
  sets: number;
  restBetweenSets: number; // seconds
  restBetweenExercises: number; // seconds
  intensity: 'light' | 'moderate' | 'high' | 'max';
}

export interface WorkoutSession {
  id: string;
  userId: string;
  date: string;
  exerciseId: string;
  plannedParams: TrainingParameters;
  actualParams?: TrainingParameters;
  completedReps?: number[];
  perceivedEffort?: number; // RPE 1-10
  recoveryBefore?: number; // WHOOP recovery score
  strainAfter?: number; // WHOOP strain score
  adaptationScore?: number; // calculated adaptation metric
}

export interface ProgressionRule {
  metric: 'recovery' | 'strain' | 'hrv' | 'adaptation';
  condition: 'improving' | 'stable' | 'declining';
  adjustment: {
    load?: number; // percentage change
    reps?: number; // absolute change
    rest?: number; // percentage change of rest time
  };
}

export class AdaptiveTrainingEngine {
  private userId: string;
  private sessions: WorkoutSession[] = [];
  private baselineRecovery: number = 50; // default starting point

  constructor(userId: string) {
    this.userId = userId;
  }

  /**
   * Calculate daily training recommendations based on current recovery
   * Only adjusts rest periods and safety recommendations in real-time
   */
  getDailyTrainingRecommendation(
    recovery: number, 
    strain: number, 
    hrv: number, 
    recentSessions: WorkoutSession[]
  ): {
    recommendation: string;
    intensity: 'rest' | 'light' | 'moderate' | 'high';
    restMultiplier: number;
    shouldStop: boolean;
    injuryRisk: 'low' | 'moderate' | 'high';
    safetyAlerts: string[];
    reasoning: string[];
  } {
    const reasoning: string[] = [];
    const safetyAlerts: string[] = [];
    let intensity: 'rest' | 'light' | 'moderate' | 'high' = 'moderate';
    let restMultiplier = 1.0;
    let shouldStop = false;
    let injuryRisk: 'low' | 'moderate' | 'high' = 'low';

    // Recovery-based rest adjustments and safety recommendations
    if (recovery < 30) {
      intensity = 'rest';
      shouldStop = true;
      injuryRisk = 'high';
      safetyAlerts.push('🚫 Stop all training - complete rest required');
      reasoning.push(`Recovery ${recovery}% - complete rest day mandatory`);
    } else if (recovery < 40) {
      intensity = 'light';
      restMultiplier = 1.5;
      injuryRisk = 'high';
      safetyAlerts.push('⚠️ High injury risk - consider stopping after warm-up');
      safetyAlerts.push('🩹 Monitor for any pain or discomfort');
      reasoning.push(`Recovery ${recovery}% - extend rest periods by 50%`);
    } else if (recovery < 55) {
      intensity = 'light';
      restMultiplier = 1.3;
      injuryRisk = 'moderate';
      safetyAlerts.push('⚠️ Moderate injury risk - stop if feeling fatigued');
      reasoning.push(`Recovery ${recovery}% - extend rest periods by 30%`);
    } else if (recovery < 70) {
      intensity = 'moderate';
      restMultiplier = 1.1;
      injuryRisk = 'low';
      reasoning.push(`Recovery ${recovery}% - slightly longer rest periods`);
    } else {
      intensity = 'high';
      restMultiplier = 0.9;
      injuryRisk = 'low';
      reasoning.push(`Recovery ${recovery}% - can reduce rest periods slightly`);
    }

    // Strain-based rest adjustments
    if (strain > 18) {
      restMultiplier *= 1.4;
      safetyAlerts.push('⚠️ Yesterday was high strain - prioritize recovery between sets');
      reasoning.push(`High strain (${strain}) - extending rest periods significantly`);
    } else if (strain > 15) {
      restMultiplier *= 1.2;
      reasoning.push(`Moderate strain (${strain}) - slightly longer rest`);
    }

    // HRV-based safety alerts
    const avgHrv = this.calculateRecentAverage(recentSessions, 'hrv', 7);
    if (hrv < avgHrv * 0.85) {
      restMultiplier *= 1.3;
      injuryRisk = injuryRisk === 'low' ? 'moderate' : 'high';
      safetyAlerts.push('📉 HRV significantly below average - increase rest and monitor closely');
      reasoning.push(`HRV ${hrv.toFixed(1)}ms vs avg ${avgHrv.toFixed(1)}ms - extended rest needed`);
    }

    // Multi-factor injury risk assessment
    if (recovery < 40 && strain > 16) {
      shouldStop = true;
      injuryRisk = 'high';
      safetyAlerts.push('🛑 STOP: Low recovery + high strain = high injury risk');
    }

    const recommendation = this.generateRecommendationText(intensity, recovery, strain);

    return {
      recommendation,
      intensity,
      restMultiplier: Math.max(0.8, Math.min(2.5, restMultiplier)), // cap between 80%-250%
      shouldStop,
      injuryRisk,
      safetyAlerts,
      reasoning
    };
  }

  /**
   * Adjust only rest periods in real-time, keep load/reps from progression system
   */
  adjustRestPeriods(
    baseParams: TrainingParameters,
    dailyRec: ReturnType<AdaptiveTrainingEngine['getDailyTrainingRecommendation']>
  ): TrainingParameters {
    return {
      load: baseParams.load, // Keep current progression load
      reps: baseParams.reps, // Keep current progression reps
      sets: baseParams.sets,
      restBetweenSets: Math.round(baseParams.restBetweenSets * dailyRec.restMultiplier),
      restBetweenExercises: Math.round(baseParams.restBetweenExercises * dailyRec.restMultiplier),
      intensity: baseParams.intensity // Keep planned intensity
    };
  }

  /**
   * Track long-term progression and adjust baseline parameters
   */
  calculateProgressionAdjustments(
    exercise: string,
    recentSessions: WorkoutSession[],
    timeframe: number = 28 // days
  ): {
    loadProgression: number;
    volumeProgression: number;
    shouldProgress: boolean;
    reasoning: string;
  } {
    const exerciseSessions = recentSessions
      .filter(s => s.exerciseId === exercise)
      .slice(0, timeframe);

    if (exerciseSessions.length < 6) {
      return {
        loadProgression: 0,
        volumeProgression: 0,
        shouldProgress: false,
        reasoning: 'Need more training data (minimum 6 sessions)'
      };
    }

    // Calculate adaptation metrics
    const recoveryTrend = this.calculateRecoveryTrend(exerciseSessions);
    const completionRate = this.calculateCompletionRate(exerciseSessions);
    const effortTrend = this.calculateEffortTrend(exerciseSessions);
    const consistencyScore = this.calculateConsistencyScore(exerciseSessions);

    let shouldProgress = false;
    let loadProgression = 0;
    let volumeProgression = 0;
    let reasoning = '';

    // Progression criteria
    if (completionRate > 0.85 && recoveryTrend > -0.1 && effortTrend < 0.5 && consistencyScore > 0.8) {
      shouldProgress = true;
      loadProgression = 0.025; // 2.5% load increase
      reasoning = 'Strong adaptation - increasing load';
    } else if (completionRate > 0.9 && recoveryTrend > 0.1) {
      shouldProgress = true;
      volumeProgression = 1; // add 1 rep
      reasoning = 'Excellent performance - adding volume';
    } else if (completionRate < 0.7 || recoveryTrend < -0.3) {
      shouldProgress = true;
      loadProgression = -0.05; // 5% load decrease
      reasoning = 'Poor adaptation - reducing load';
    } else {
      reasoning = `Maintaining current parameters (completion: ${(completionRate * 100).toFixed(0)}%, recovery trend: ${recoveryTrend.toFixed(2)})`;
    }

    return {
      loadProgression,
      volumeProgression,
      shouldProgress,
      reasoning
    };
  }

  /**
   * Generate contextual training suggestions
   */
  generateTrainingSuggestions(
    recovery: number,
    strain: number,
    hrv: number,
    sleepScore?: number
  ): string[] {
    const suggestions: string[] = [];

    if (recovery < 30) {
      suggestions.push('🛌 Take a complete rest day');
      suggestions.push('🧘 Light stretching or meditation only');
      suggestions.push('💧 Focus on hydration and nutrition');
    } else if (recovery < 50) {
      suggestions.push('🚶 Light cardio like walking or easy cycling');
      suggestions.push('🧘 Yoga or mobility work');
      suggestions.push('⚖️ Reduce weights by 30-35%');
      suggestions.push('⏱️ Extend rest periods by 30%');
    } else if (recovery < 70) {
      suggestions.push('💪 Normal strength training with moderate intensity');
      suggestions.push('🏃 Moderate cardio sessions');
      suggestions.push('⚖️ Use 80-90% of normal weights');
      suggestions.push('⏱️ Standard rest periods');
    } else {
      suggestions.push('🔥 High intensity training is optimal');
      suggestions.push('💪 Consider progressive overload');
      suggestions.push('🏃 HIIT or intense cardio sessions');
      suggestions.push('⏱️ Can reduce rest periods slightly');
    }

    if (strain > 18) {
      suggestions.push('⚠️ Yesterday was high strain - prioritize recovery');
    }

    if (sleepScore && sleepScore < 70) {
      suggestions.push('😴 Poor sleep detected - extend warm-up');
      suggestions.push('⏰ Consider later workout time');
    }

    return suggestions;
  }

  // Helper methods
  private calculateRecentAverage(sessions: WorkoutSession[], metric: string, days: number): number {
    const recent = sessions.slice(0, days);
    if (recent.length === 0) return 50; // default

    const values = recent.map(s => {
      switch (metric) {
        case 'recovery': return s.recoveryBefore || 50;
        case 'strain': return s.strainAfter || 10;
        case 'hrv': return s.recoveryBefore || 50; // simplified
        default: return 50;
      }
    });

    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  private calculateAdaptationTrend(sessions: WorkoutSession[]): number {
    if (sessions.length < 5) return 0;

    const recent = sessions.slice(0, 10);
    const adaptationScores = recent.map(s => s.adaptationScore || 0);
    
    // Simple linear trend calculation
    let trend = 0;
    for (let i = 1; i < adaptationScores.length; i++) {
      trend += adaptationScores[i] - adaptationScores[i - 1];
    }
    
    return trend / (adaptationScores.length - 1);
  }

  private calculateRecoveryTrend(sessions: WorkoutSession[]): number {
    const recoveries = sessions.map(s => s.recoveryBefore || 50);
    if (recoveries.length < 3) return 0;

    const early = recoveries.slice(-3).reduce((a, b) => a + b, 0) / 3;
    const recent = recoveries.slice(0, 3).reduce((a, b) => a + b, 0) / 3;
    
    return (recent - early) / 100; // normalize to -1 to 1 range
  }

  private calculateCompletionRate(sessions: WorkoutSession[]): number {
    const completed = sessions.filter(s => s.completedReps && s.plannedParams.reps);
    if (completed.length === 0) return 0;

    const rates = completed.map(s => {
      const totalCompleted = s.completedReps!.reduce((a, b) => a + b, 0);
      const totalPlanned = s.plannedParams.reps * s.plannedParams.sets;
      return Math.min(1, totalCompleted / totalPlanned);
    });

    return rates.reduce((a, b) => a + b, 0) / rates.length;
  }

  private calculateEffortTrend(sessions: WorkoutSession[]): number {
    const efforts = sessions.map(s => s.perceivedEffort || 5);
    if (efforts.length < 3) return 0;

    const early = efforts.slice(-3).reduce((a, b) => a + b, 0) / 3;
    const recent = efforts.slice(0, 3).reduce((a, b) => a + b, 0) / 3;
    
    return (recent - early) / 10; // normalize RPE difference
  }

  private calculateConsistencyScore(sessions: WorkoutSession[]): number {
    if (sessions.length < 5) return 0;

    const dates = sessions.map(s => new Date(s.date));
    const intervals = [];
    
    for (let i = 1; i < dates.length; i++) {
      const days = (dates[i - 1].getTime() - dates[i].getTime()) / (1000 * 60 * 60 * 24);
      intervals.push(days);
    }

    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = intervals.reduce((sum, interval) => sum + Math.pow(interval - avgInterval, 2), 0) / intervals.length;
    
    // Lower variance = higher consistency score (0-1 scale)
    return Math.max(0, Math.min(1, 1 - (variance / 10)));
  }

  private generateRecommendationText(intensity: string, recovery: number, strain: number): string {
    const base = {
      'rest': 'Complete rest and recovery',
      'light': 'Light activity and mobility work',
      'moderate': 'Moderate intensity training',
      'high': 'High intensity training optimal'
    }[intensity];

    const context = recovery < 50 ? 'Focus on recovery today' :
                   recovery > 70 ? 'Your body is ready to be challenged' :
                   'Maintain steady training progress';

    return `${base}. ${context}`;
  }
}