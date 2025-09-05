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
   */
  getDailyTrainingRecommendation(
    recovery: number, 
    strain: number, 
    hrv: number, 
    recentSessions: WorkoutSession[]
  ): {
    recommendation: string;
    intensity: 'rest' | 'light' | 'moderate' | 'high';
    loadMultiplier: number;
    repAdjustment: number;
    restMultiplier: number;
    reasoning: string[];
  } {
    const reasoning: string[] = [];
    let intensity: 'rest' | 'light' | 'moderate' | 'high' = 'moderate';
    let loadMultiplier = 1.0;
    let repAdjustment = 0;
    let restMultiplier = 1.0;

    // Recovery-based adjustments
    if (recovery < 30) {
      intensity = 'rest';
      loadMultiplier = 0.0;
      reasoning.push(`Recovery ${recovery}% - complete rest recommended`);
    } else if (recovery < 50) {
      intensity = 'light';
      loadMultiplier = 0.65;
      repAdjustment = -2;
      restMultiplier = 1.3;
      reasoning.push(`Recovery ${recovery}% - light training with reduced load`);
    } else if (recovery < 70) {
      intensity = 'moderate';
      loadMultiplier = 0.85;
      restMultiplier = 1.1;
      reasoning.push(`Recovery ${recovery}% - moderate training intensity`);
    } else {
      intensity = 'high';
      loadMultiplier = 1.0;
      repAdjustment = 1;
      reasoning.push(`Recovery ${recovery}% - high intensity training allowed`);
    }

    // Strain-based adjustments (yesterday's strain affects today)
    if (strain > 18) {
      loadMultiplier *= 0.7;
      restMultiplier *= 1.4;
      reasoning.push(`High strain (${strain}) - reducing intensity and extending rest`);
    } else if (strain < 10 && recovery > 60) {
      loadMultiplier *= 1.1;
      repAdjustment += 1;
      reasoning.push(`Low strain (${strain}) with good recovery - can push harder`);
    }

    // HRV trend analysis
    const avgHrv = this.calculateRecentAverage(recentSessions, 'hrv', 7);
    if (hrv < avgHrv * 0.9) {
      loadMultiplier *= 0.8;
      restMultiplier *= 1.2;
      reasoning.push(`HRV below recent average - reducing load and extending rest`);
    }

    // Progressive adaptation check
    const adaptationTrend = this.calculateAdaptationTrend(recentSessions);
    if (adaptationTrend > 0.8) {
      loadMultiplier *= 1.05;
      reasoning.push(`Strong adaptation trend - slight load increase`);
    } else if (adaptationTrend < -0.2) {
      loadMultiplier *= 0.9;
      restMultiplier *= 1.15;
      reasoning.push(`Poor adaptation trend - reducing load and extending rest`);
    }

    const recommendation = this.generateRecommendationText(intensity, recovery, strain);

    return {
      recommendation,
      intensity,
      loadMultiplier: Math.max(0, Math.min(1.2, loadMultiplier)), // cap between 0-120%
      repAdjustment: Math.max(-5, Math.min(3, repAdjustment)), // cap between -5 to +3
      restMultiplier: Math.max(0.8, Math.min(2.0, restMultiplier)), // cap between 80%-200%
      reasoning
    };
  }

  /**
   * Adjust workout parameters based on adaptation
   */
  adaptWorkoutParameters(
    baseParams: TrainingParameters,
    dailyRec: ReturnType<AdaptiveTrainingEngine['getDailyTrainingRecommendation']>
  ): TrainingParameters {
    return {
      load: Math.round(baseParams.load * dailyRec.loadMultiplier),
      reps: Math.max(1, baseParams.reps + dailyRec.repAdjustment),
      sets: baseParams.sets,
      restBetweenSets: Math.round(baseParams.restBetweenSets * dailyRec.restMultiplier),
      restBetweenExercises: Math.round(baseParams.restBetweenExercises * dailyRec.restMultiplier),
      intensity: dailyRec.intensity === 'rest' ? 'light' : 
                dailyRec.intensity === 'light' ? 'light' :
                dailyRec.intensity === 'moderate' ? 'moderate' : 'high'
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