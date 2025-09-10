import type { WorkoutSession, TrainingParameters } from './adaptiveTraining';

export interface ProgressionDecision {
  shouldProgress: boolean;
  loadIncrease: number; // percentage increase (0.025 = 2.5%)
  repIncrease: number; // absolute rep increase
  reasoning: string;
  nextReview: string; // date for next progression check
  confidence: number; // 0-1 scale
}

export interface AdaptationMetrics {
  completionRate: number; // 0-1 scale
  consistencyScore: number; // 0-1 scale
  recoveryTrend: number; // -1 to 1 scale
  effortTrend: number; // RPE trend
  strengthGains: number; // estimated strength gain
}

export class ProgressionEngine {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  /**
   * Analyze recent performance to decide if progression is appropriate
   */
  analyzeProgression(
    exercise: string,
    currentParams: TrainingParameters,
    recentSessions: WorkoutSession[],
    timeframeDays: number = 14
  ): ProgressionDecision {
    // Filter sessions for this exercise within timeframe
    const exerciseSessions = recentSessions
      .filter(s => s.exerciseId === exercise)
      .slice(0, Math.ceil(timeframeDays / 2)); // Assume training every 2 days

    if (exerciseSessions.length < 4) {
      return {
        shouldProgress: false,
        loadIncrease: 0,
        repIncrease: 0,
        reasoning: 'Need at least 4 recent sessions to assess progression',
        nextReview: this.getNextReviewDate(7),
        confidence: 0
      };
    }

    const metrics = this.calculateAdaptationMetrics(exerciseSessions);
    return this.makeProgressionDecision(currentParams, metrics, exerciseSessions);
  }

  private calculateAdaptationMetrics(sessions: WorkoutSession[]): AdaptationMetrics {
    // Completion Rate: How well are planned sets/reps being completed
    const completionRates = sessions.map(s => {
      if (!s.completedReps || !s.plannedParams.reps) return 0.8; // default if no data
      const totalCompleted = s.completedReps.reduce((sum, reps) => sum + reps, 0);
      const totalPlanned = s.plannedParams.reps * s.plannedParams.sets;
      return Math.min(1, totalCompleted / totalPlanned);
    });
    const completionRate = completionRates.reduce((sum, rate) => sum + rate, 0) / completionRates.length;

    // Consistency Score: How consistent is performance session to session
    const completionVariance = this.calculateVariance(completionRates);
    const consistencyScore = Math.max(0, 1 - (completionVariance * 2));

    // Recovery Trend: Is recovery improving or declining over time
    const recoveries = sessions.map(s => s.recoveryBefore || 60);
    const recoveryTrend = this.calculateTrend(recoveries);

    // Effort Trend: Is perceived effort decreasing (getting easier)
    const efforts = sessions.map(s => s.perceivedEffort || 6);
    const effortTrend = this.calculateTrend(efforts);

    // Strength Gains: Estimated based on completion rate and effort trends
    const strengthGains = this.estimateStrengthGains(sessions);

    return {
      completionRate,
      consistencyScore,
      recoveryTrend,
      effortTrend,
      strengthGains
    };
  }

  private makeProgressionDecision(
    currentParams: TrainingParameters,
    metrics: AdaptationMetrics,
    sessions: WorkoutSession[]
  ): ProgressionDecision {
    const avgRecovery = sessions.reduce((sum, s) => sum + (s.recoveryBefore || 60), 0) / sessions.length;
    let shouldProgress = false;
    let loadIncrease = 0;
    let repIncrease = 0;
    let reasoning = '';
    let confidence = 0;

    // Primary progression criteria: High completion rate + declining effort
    if (metrics.completionRate >= 0.9 && metrics.effortTrend < -0.3 && metrics.consistencyScore > 0.7) {
      shouldProgress = true;
      
      // Decide between load or volume progression
      if (currentParams.reps >= 12) {
        // High rep range - increase load instead of reps
        loadIncrease = 0.025; // 2.5%
        reasoning = `Excellent completion (${(metrics.completionRate * 100).toFixed(0)}%) with decreasing effort - increasing load`;
      } else {
        // Lower rep range - can add volume
        repIncrease = 1;
        reasoning = `Strong performance - adding 1 rep to build volume`;
      }
      confidence = 0.9;
      
    // Secondary progression: Very high completion with stable recovery
    } else if (metrics.completionRate >= 0.95 && metrics.recoveryTrend > -0.1 && avgRecovery > 65) {
      shouldProgress = true;
      loadIncrease = 0.02; // 2% conservative increase
      reasoning = `Consistent excellent completion with good recovery - small load increase`;
      confidence = 0.8;
      
    // Volume progression: Good completion but high effort
    } else if (metrics.completionRate >= 0.85 && metrics.effortTrend > -0.1 && currentParams.reps < 10) {
      shouldProgress = true;
      repIncrease = 1;
      reasoning = `Good completion rate - adding volume before load progression`;
      confidence = 0.7;
      
    // Deload needed: Poor completion or declining recovery
    } else if (metrics.completionRate < 0.75 || metrics.recoveryTrend < -0.3) {
      shouldProgress = true;
      loadIncrease = -0.05; // 5% deload
      reasoning = `Poor completion (${(metrics.completionRate * 100).toFixed(0)}%) or recovery decline - reducing load`;
      confidence = 0.8;
      
    // Maintain current load
    } else {
      reasoning = `Maintaining current parameters - completion: ${(metrics.completionRate * 100).toFixed(0)}%, effort stable`;
      confidence = 0.6;
    }

    const nextReviewDays = shouldProgress ? 7 : 14; // Review sooner after changes

    return {
      shouldProgress,
      loadIncrease,
      repIncrease,
      reasoning,
      nextReview: this.getNextReviewDate(nextReviewDays),
      confidence
    };
  }

  /**
   * Apply progression decision to update training parameters
   */
  applyProgression(
    currentParams: TrainingParameters,
    decision: ProgressionDecision
  ): TrainingParameters {
    if (!decision.shouldProgress) return currentParams;

    const newLoad = Math.round(currentParams.load * (1 + decision.loadIncrease));
    const newReps = Math.max(1, currentParams.reps + decision.repIncrease);

    return {
      ...currentParams,
      load: Math.min(100, Math.max(40, newLoad)), // Cap between 40-100%
      reps: Math.min(20, Math.max(3, newReps)) // Cap between 3-20 reps
    };
  }

  /**
   * Get progression history and trends
   */
  getProgressionHistory(
    exercise: string,
    sessions: WorkoutSession[]
  ): {
    loadProgression: Array<{date: string, load: number}>;
    volumeProgression: Array<{date: string, totalVolume: number}>;
    strengthTrend: number;
    periodization: string;
  } {
    const exerciseSessions = sessions
      .filter(s => s.exerciseId === exercise)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const loadProgression = exerciseSessions.map(s => ({
      date: s.date,
      load: s.plannedParams.load
    }));

    const volumeProgression = exerciseSessions.map(s => ({
      date: s.date,
      totalVolume: s.plannedParams.load * s.plannedParams.reps * s.plannedParams.sets
    }));

    const strengthTrend = this.calculateStrengthTrend(exerciseSessions);
    const periodization = this.identifyPeriodization(exerciseSessions);

    return {
      loadProgression,
      volumeProgression,
      strengthTrend,
      periodization
    };
  }

  // Helper methods
  private calculateVariance(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    return squaredDiffs.reduce((sum, val) => sum + val, 0) / squaredDiffs.length;
  }

  private calculateTrend(values: number[]): number {
    if (values.length < 3) return 0;
    
    // Simple linear trend: compare recent vs early values
    const recent = values.slice(0, Math.ceil(values.length / 2));
    const early = values.slice(Math.floor(values.length / 2));
    
    const recentAvg = recent.reduce((sum, val) => sum + val, 0) / recent.length;
    const earlyAvg = early.reduce((sum, val) => sum + val, 0) / early.length;
    
    return (recentAvg - earlyAvg) / Math.max(earlyAvg, 1); // Normalize
  }

  private estimateStrengthGains(sessions: WorkoutSession[]): number {
    if (sessions.length < 3) return 0;
    
    const first = sessions[sessions.length - 1];
    const last = sessions[0];
    
    const initialVolume = first.plannedParams.load * first.plannedParams.reps * first.plannedParams.sets;
    const currentVolume = last.plannedParams.load * last.plannedParams.reps * last.plannedParams.sets;
    
    return (currentVolume - initialVolume) / initialVolume;
  }

  private calculateStrengthTrend(sessions: WorkoutSession[]): number {
    const loads = sessions.map(s => s.plannedParams.load);
    return this.calculateTrend(loads);
  }

  private identifyPeriodization(sessions: WorkoutSession[]): string {
    const loads = sessions.map(s => s.plannedParams.load);
    const reps = sessions.map(s => s.plannedParams.reps);
    
    const avgLoad = loads.reduce((sum, val) => sum + val, 0) / loads.length;
    const avgReps = reps.reduce((sum, val) => sum + val, 0) / reps.length;
    
    if (avgLoad > 85 && avgReps < 6) return 'Strength Phase';
    if (avgLoad > 75 && avgReps < 8) return 'Power Phase';
    if (avgLoad < 75 && avgReps > 10) return 'Endurance Phase';
    return 'Hypertrophy Phase';
  }

  private getNextReviewDate(days: number): string {
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + days);
    return nextDate.toISOString().split('T')[0];
  }
}