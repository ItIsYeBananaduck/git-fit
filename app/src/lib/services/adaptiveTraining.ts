import type { StrainAssessment } from './dailyStrainAssessmentService';

export interface TrainingParameters {
  load: number; // percentage of 1RM or RPE scale
  reps: number;
  sets: number;
  restBetweenSets: number; // seconds
  restBetweenExercises: number; // seconds
  intensity: 'light' | 'moderate' | 'high' | 'max';
  isDeloadWeek?: boolean; // indicates if this is deload week parameters
}

export interface WorkoutSession {
  id: string;
  userId: string;
  date: string;
  exerciseId: string;
  plannedParams: TrainingParameters;
  actualParams?: TrainingParameters;
  completedReps?: number[];
  setCompletions?: SetCompletion[]; // New: detailed set completion tracking
  perceivedEffort?: number; // RPE 1-10
  recoveryBefore?: number; // WHOOP recovery score
  strainAfter?: number; // WHOOP strain score
  adaptationScore?: number; // calculated adaptation metric
  targetStrain?: number; // target strain for this session
  actualStrain?: number; // actual strain achieved
  stoppedEarly?: boolean; // true if stopped due to strain target
}

export interface SetCompletion {
  setNumber: number;
  repsCompleted: number;
  difficulty: 'easy' | 'moderate' | 'hard';
  timestamp: string;
  restDuration?: number; // actual rest time before this set
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

export interface AdaptiveTrainingConfig {
  dynamicDeload: boolean;
  cycleLengthWeeks: number;
}

export class AdaptiveTrainingEngine {
  private userId: string;
  private sessions: WorkoutSession[] = [];
  private baselineRecovery: number = 50; // default starting point
  private config: AdaptiveTrainingConfig = { dynamicDeload: true, cycleLengthWeeks: 4 };

  constructor(userId: string, config?: Partial<AdaptiveTrainingConfig>) {
    this.userId = userId;
    if (config) {
      this.config = { ...this.config, ...config };
    }
  }

  /**
   * Adjust rest interval based on how quickly user returns to baseline or stays strained
   */
  adjustRestBasedOnBaselineReturn(
    baseline: { hr: number; spo2: number },
    inWorkout: { hr: number; spo2: number },
    lastRestDuration: number,
    timeToBaseline: number // seconds to return to baseline after set
  ): number {
    // If user returns to baseline quickly (< 60s), decrease rest by 20%
    if (
      timeToBaseline < 60 &&
      Math.abs(inWorkout.hr - baseline.hr) < 5 &&
      Math.abs(inWorkout.spo2 - baseline.spo2) < 2
    ) {
      return Math.max(20, lastRestDuration * 0.8);
    }
    // If user stays strained (> 120s), increase rest by 30%
    if (
      timeToBaseline > 120 ||
      Math.abs(inWorkout.hr - baseline.hr) > 15 ||
      Math.abs(inWorkout.spo2 - baseline.spo2) > 5
    ) {
      return Math.min(300, lastRestDuration * 1.3);
    }
    // Otherwise, keep rest the same
    return lastRestDuration;
  }
  /**
   * Enhanced daily training recommendation with feedback prioritization
   */
  getDailyTrainingRecommendation(
    recovery: number,
    strain: number,
    hrv: number,
    recentSessions: WorkoutSession[],
    availableDataSources: {
      hasRecovery: boolean;
      hasStrain: boolean;
      hasHRV: boolean;
      hasUserFeedback: boolean;
    } = { hasRecovery: true, hasStrain: true, hasHRV: true, hasUserFeedback: true }
  ): {
    recommendation: string;
    intensity: 'rest' | 'light' | 'moderate' | 'high';
    restMultiplier: number;
    shouldStop: boolean;
    injuryRisk: 'low' | 'moderate' | 'high';
    safetyAlerts: string[];
    reasoning: string[];
    shouldDeload: boolean;
    targetStrain: number;
    strainAlert?: string;
    feedbackConfidence: number;
    dataSourceWeights: Record<string, number>;
  } {
    const reasoning: string[] = [];
    const safetyAlerts: string[] = [];
    let intensity: 'rest' | 'light' | 'moderate' | 'high' = 'moderate';
    let restMultiplier = 1.0;
    let shouldStop = false;
    let injuryRisk: 'low' | 'moderate' | 'high' = 'low';
    let shouldDeload = false;
    let targetStrain = this.calculateTargetStrain(recovery, strain, recentSessions);
    let strainAlert: string | undefined;

    // Calculate data source weights and feedback confidence
    const dataWeights = this.calculateDataSourceWeights(availableDataSources, recentSessions);
    const feedbackAnalysis = this.analyzeUserFeedback(recentSessions);
    const feedbackConfidence = feedbackAnalysis.confidence;

    reasoning.push(`Data sources: ${this.formatDataSources(availableDataSources)}`);
    reasoning.push(`Feedback confidence: ${Math.round(feedbackConfidence * 100)}%`);

    // Recovery-based adjustments (weighted by data availability)
    if (availableDataSources.hasRecovery && recovery < 30) {
      intensity = 'rest';
      shouldStop = true;
      injuryRisk = 'high';
      safetyAlerts.push('🚫 Stop all training - complete rest required');
      reasoning.push(`Recovery ${recovery}% - complete rest day mandatory`);
    } else if (availableDataSources.hasRecovery && recovery < 40) {
      intensity = 'light';
      restMultiplier = 1.5;
      injuryRisk = 'high';
      safetyAlerts.push('⚠️ High injury risk - consider stopping after warm-up');
      safetyAlerts.push('🩹 Monitor for any pain or discomfort');
      reasoning.push(`Recovery ${recovery}% - extend rest periods by 50%`);
    } else if (availableDataSources.hasRecovery && recovery < 55) {
      intensity = 'light';
      restMultiplier = 1.3;
      injuryRisk = 'moderate';
      safetyAlerts.push('⚠️ Moderate injury risk - stop if feeling fatigued');
      reasoning.push(`Recovery ${recovery}% - extend rest periods by 30%`);
    } else if (availableDataSources.hasRecovery && recovery < 70) {
      intensity = 'moderate';
      restMultiplier = 1.1;
      injuryRisk = 'low';
      reasoning.push(`Recovery ${recovery}% - slightly longer rest periods`);
    } else if (availableDataSources.hasRecovery) {
      intensity = 'high';
      restMultiplier = 0.9;
      injuryRisk = 'low';
      reasoning.push(`Recovery ${recovery}% - can reduce rest periods slightly`);
    } else {
      // No recovery data - rely on user feedback
      reasoning.push('No recovery data - using user feedback for intensity guidance');
      intensity = this.determineIntensityFromFeedback(feedbackAnalysis);
      restMultiplier = this.calculateRestFromFeedback(feedbackAnalysis);
    }

    // Strain-based adjustments (if available)
    if (availableDataSources.hasStrain && strain > 18) {
      restMultiplier *= 1.4;
      safetyAlerts.push('⚠️ Yesterday was high strain - prioritize recovery between sets');
      reasoning.push(`High strain (${strain}) - extending rest periods significantly`);
    } else if (availableDataSources.hasStrain && strain > 15) {
      restMultiplier *= 1.2;
      reasoning.push(`Moderate strain (${strain}) - slightly longer rest`);
    }

    // HRV-based safety alerts (if available)
    if (availableDataSources.hasHRV) {
      const avgHrv = this.calculateRecentAverage(recentSessions, 'hrv', 7);
      if (hrv < avgHrv * 0.85) {
        restMultiplier *= 1.3;
        injuryRisk = injuryRisk === 'low' ? 'moderate' : 'high';
        safetyAlerts.push('📉 HRV significantly below average - increase rest and monitor closely');
        reasoning.push(`HRV ${hrv.toFixed(1)}ms vs avg ${avgHrv.toFixed(1)}ms - extended rest needed`);
      }
    }

    // Multi-factor injury risk assessment
    if (availableDataSources.hasRecovery && availableDataSources.hasStrain && recovery < 40 && strain > 16) {
      shouldStop = true;
      injuryRisk = 'high';
      safetyAlerts.push('🛑 STOP: Low recovery + high strain = high injury risk');
    }

    // User feedback-based safety checks (when health data is limited)
    if (!availableDataSources.hasRecovery && !availableDataSources.hasStrain && feedbackAnalysis.recentDifficulty > 2.5) {
      intensity = 'light';
      restMultiplier *= 1.3;
      safetyAlerts.push('⚠️ Recent sets felt very hard - taking it easy today');
      reasoning.push('User feedback indicates high perceived effort - conservative approach');
    }

    // Deload week assessment
    const weeksOfTraining = this.calculateWeeksOfTraining(recentSessions);
    const avgRecoveryTrend = availableDataSources.hasRecovery
      ? this.calculateRecentAverage(recentSessions, 'recovery', 14)
      : this.calculateFeedbackBasedRecoveryTrend(recentSessions);

    // Deload logic: dynamic or standard
    if (this.config.dynamicDeload) {
      if (weeksOfTraining >= 3 && (avgRecoveryTrend < 45 || this.isDeloadWeekScheduled(this.config.cycleLengthWeeks))) {
        shouldDeload = true;
        safetyAlerts.push('🔄 Deload week recommended - reduce intensity and focus on recovery');
        reasoning.push(`${weeksOfTraining} weeks of training completed - time for deload (dynamic)`);
      }
    } else {
      // Standard: deload only on last week of mesocycle
      if (weeksOfTraining > 0 && this.isLastWeekOfMesocycle(weeksOfTraining, this.config.cycleLengthWeeks)) {
        shouldDeload = true;
        safetyAlerts.push('🔄 Standard deload week (end of mesocycle)');
        reasoning.push(`Mesocycle of ${this.config.cycleLengthWeeks} weeks completed - time for deload (standard)`);
      }
    }

    // Strain target calculation and alert
    if (availableDataSources.hasStrain && strain > targetStrain * 0.9) {
      strainAlert = `⚡ Approaching strain target (${strain.toFixed(1)}/${targetStrain}) - prepare to stop`;
    }

    const recommendation = this.generateRecommendationText(intensity, recovery, strain, availableDataSources);

    return {
      recommendation,
      intensity,
      restMultiplier: Math.max(0.8, Math.min(2.5, restMultiplier)), // cap between 80%-250%
      shouldStop,
      injuryRisk,
      safetyAlerts,
      reasoning,
      shouldDeload,
      targetStrain,
      strainAlert,
      feedbackConfidence,
      dataSourceWeights: dataWeights
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
      intensity: baseParams.intensity, // Keep planned intensity
      isDeloadWeek: baseParams.isDeloadWeek
    };
  }

  /**
   * Create deload week parameters: half weight, double reps, 90s rest
   */
  createDeloadParameters(baseParams: TrainingParameters): TrainingParameters {
    return {
      load: Math.round(baseParams.load * 0.5), // Half the weight
      reps: Math.min(20, baseParams.reps * 2), // Double the reps, cap at 20
      sets: baseParams.sets,
      restBetweenSets: 90, // Fixed 90 seconds rest
      restBetweenExercises: 120, // Shorter rest between exercises too
      intensity: 'light', // Always light intensity
      isDeloadWeek: true
    };
  }

  /**
   * Check if current strain target is reached and should stop
   */
  checkStrainTarget(currentStrain: number, targetStrain: number): {
    shouldStop: boolean;
    message: string;
    progress: number; // 0-1 scale
  } {
    const progress = Math.min(1, currentStrain / targetStrain);

    if (currentStrain >= targetStrain) {
      return {
        shouldStop: true,
        message: `🛑 STOP: Target strain reached (${currentStrain.toFixed(1)}/${targetStrain})`,
        progress: 1
      };
    } else if (currentStrain >= targetStrain * 0.9) {
      return {
        shouldStop: false,
        message: `⚡ Warning: Approaching strain target (${currentStrain.toFixed(1)}/${targetStrain})`,
        progress
      };
    }

    return {
      shouldStop: false,
      message: `Strain progress: ${currentStrain.toFixed(1)}/${targetStrain} (${Math.round(progress * 100)}%)`,
      progress
    };
  }

  /**
   * Enhanced progression calculation with feedback prioritization
   */
  calculateProgressionAdjustments(
    exercise: string,
    recentSessions: WorkoutSession[],
    timeframe: number = 28,
    availableDataSources: {
      hasRecovery: boolean;
      hasStrain: boolean;
      hasHRV: boolean;
      hasUserFeedback: boolean;
    } = { hasRecovery: true, hasStrain: true, hasHRV: true, hasUserFeedback: true }
  ): {
    loadProgression: number;
    volumeProgression: number;
    shouldProgress: boolean;
    reasoning: string;
    feedbackConfidence: number;
    dataCompleteness: number;
  } {
    const exerciseSessions = recentSessions
      .filter(s => s.exerciseId === exercise)
      .slice(0, timeframe);

    if (exerciseSessions.length < 6) {
      return {
        loadProgression: 0,
        volumeProgression: 0,
        shouldProgress: false,
        reasoning: 'Need more training data (minimum 6 sessions)',
        feedbackConfidence: 0,
        dataCompleteness: 0
      };
    }

    // Calculate data completeness score
    const dataCompleteness = this.calculateDataCompleteness(availableDataSources, exerciseSessions);

    // Enhanced feedback analysis
    const feedbackAnalysis = this.analyzeUserFeedback(exerciseSessions);
    const difficultyAnalysis = this.analyzeDifficultyFeedback(exerciseSessions);

    // Calculate adaptation metrics (weighted by data availability)
    const recoveryTrend = availableDataSources.hasRecovery
      ? this.calculateRecoveryTrend(exerciseSessions)
      : this.calculateFeedbackBasedRecoveryTrend(exerciseSessions) / 100; // Convert to -1 to 1 range

    const completionRate = this.calculateCompletionRate(exerciseSessions);
    const effortTrend = availableDataSources.hasRecovery
      ? this.calculateEffortTrend(exerciseSessions)
      : this.calculateFeedbackBasedEffortTrend(exerciseSessions);

    const consistencyScore = this.calculateConsistencyScore(exerciseSessions);

    let shouldProgress = false;
    let loadProgression = 0;
    let volumeProgression = 0;
    let reasoning = '';

    // Enhanced progression criteria with feedback prioritization
    const healthDataScore = (recoveryTrend + 1) * 50; // Convert to 0-100 scale
    const feedbackScore = (3 - difficultyAnalysis.averageDifficulty) * 33.33; // Convert difficulty to recovery-like score

    // Weight the scores based on data availability
    const healthDataWeight = dataCompleteness;
    const feedbackWeight = 1 - dataCompleteness;
    const combinedRecoveryScore = (healthDataScore * healthDataWeight) + (feedbackScore * feedbackWeight);

    if (completionRate > 0.85 && combinedRecoveryScore > 60 && consistencyScore > 0.8) {
      // Check difficulty feedback for more nuanced progression
      if (difficultyAnalysis.easyPercentage > 0.6 && feedbackAnalysis.confidence > 0.4) {
        // Sets are consistently too easy - increase load more aggressively
        shouldProgress = true;
        loadProgression = dataCompleteness > 0.5 ? 0.05 : 0.03; // More conservative without health data
        reasoning = `Strong adaptation + ${Math.round(difficultyAnalysis.easyPercentage * 100)}% easy sets - ${dataCompleteness > 0.5 ? 'significant' : 'moderate'} load increase`;
      } else if (difficultyAnalysis.easyPercentage > 0.4 && feedbackAnalysis.confidence > 0.3) {
        // Sets are mostly easy - standard progression
        shouldProgress = true;
        loadProgression = 0.025;
        reasoning = 'Strong adaptation - increasing load';
      } else if (difficultyAnalysis.hardPercentage > 0.4 && feedbackAnalysis.confidence > 0.4) {
        // Sets are too hard - reduce load
        shouldProgress = true;
        loadProgression = -0.025;
        reasoning = `${Math.round(difficultyAnalysis.hardPercentage * 100)}% hard sets - reducing load for recovery`;
      } else if (feedbackAnalysis.trend === 'improving' && feedbackAnalysis.confidence > 0.5) {
        // Feedback shows improvement - can progress
        shouldProgress = true;
        volumeProgression = 1;
        reasoning = 'User feedback shows improvement - adding volume';
      } else {
        // Sets are appropriately challenging or data is inconclusive
        shouldProgress = completionRate > 0.9 && combinedRecoveryScore > 70;
        if (shouldProgress) {
          volumeProgression = 1;
          reasoning = 'Sets appropriately challenging - adding volume';
        } else {
          reasoning = `Maintaining current parameters (completion: ${(completionRate * 100).toFixed(0)}%, combined recovery: ${combinedRecoveryScore.toFixed(0)}%)`;
        }
      }
    } else if (completionRate > 0.9 && combinedRecoveryScore > 70) {
      shouldProgress = true;
      volumeProgression = 1;
      reasoning = 'Excellent performance - adding volume';
    } else if (completionRate < 0.7 || combinedRecoveryScore < 40) {
      shouldProgress = true;
      loadProgression = -0.05;
      reasoning = 'Poor adaptation - reducing load';
    } else {
      reasoning = `Maintaining current parameters (completion: ${(completionRate * 100).toFixed(0)}%, combined recovery: ${combinedRecoveryScore.toFixed(0)}%)`;
    }

    // Adjust progression based on feedback confidence
    if (feedbackAnalysis.confidence < 0.3 && dataCompleteness < 0.5) {
      // Low confidence in both health data and feedback - be conservative
      loadProgression *= 0.5;
      volumeProgression = Math.max(0, volumeProgression - 1);
      reasoning += ' (conservative approach due to limited data)';
    }

    return {
      loadProgression,
      volumeProgression,
      shouldProgress,
      reasoning,
      feedbackConfidence: feedbackAnalysis.confidence,
      dataCompleteness
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

  /**
   * Analyze difficulty feedback from set completions
   */
  private analyzeDifficultyFeedback(sessions: WorkoutSession[]): {
    easyPercentage: number;
    moderatePercentage: number;
    hardPercentage: number;
    averageDifficulty: number;
    totalSets: number;
  } {
    const allCompletions = sessions
      .flatMap(s => s.setCompletions || [])
      .filter(c => c !== undefined);

    if (allCompletions.length === 0) {
      return {
        easyPercentage: 0,
        moderatePercentage: 0,
        hardPercentage: 0,
        averageDifficulty: 2, // Default to moderate
        totalSets: 0
      };
    }

    const easyCount = allCompletions.filter(c => c.difficulty === 'easy').length;
    const moderateCount = allCompletions.filter(c => c.difficulty === 'moderate').length;
    const hardCount = allCompletions.filter(c => c.difficulty === 'hard').length;

    const totalSets = allCompletions.length;

    return {
      easyPercentage: easyCount / totalSets,
      moderatePercentage: moderateCount / totalSets,
      hardPercentage: hardCount / totalSets,
      averageDifficulty: (easyCount * 1 + moderateCount * 2 + hardCount * 3) / totalSets,
      totalSets
    };
  }

  private calculateTargetStrain(recovery: number, yesterdayStrain: number, sessions: WorkoutSession[]): number {
    // Base target strain calculation
    let baseTarget = 12; // Default moderate target

    // Adjust based on recovery
    if (recovery > 70) baseTarget = 16; // Can push harder
    else if (recovery > 50) baseTarget = 14; // Moderate push
    else if (recovery > 30) baseTarget = 10; // Easy day
    else baseTarget = 6; // Very light

    // Adjust based on yesterday's strain
    if (yesterdayStrain > 16) baseTarget *= 0.8; // Reduce if high strain yesterday
    else if (yesterdayStrain < 8) baseTarget *= 1.1; // Can increase if low strain

    return Math.round(baseTarget);
  }

  private calculateWeeksOfTraining(sessions: WorkoutSession[]): number {
    if (sessions.length < 6) return 0;

    const firstSession = sessions[sessions.length - 1];
    const lastSession = sessions[0];
    const daysDiff = (new Date(lastSession.date).getTime() - new Date(firstSession.date).getTime()) / (1000 * 60 * 60 * 24);

    return Math.floor(daysDiff / 7);
  }

  private isDeloadWeekScheduled(cycleLength: number): boolean {
    // Check if it's the last week of the cycle (default: every 4th week)
    const weekNumber = Math.floor(Date.now() / (1000 * 60 * 60 * 24 * 7)) % cycleLength;
    return weekNumber === (cycleLength - 1);
  }

  private isLastWeekOfMesocycle(weeksOfTraining: number, cycleLength: number): boolean {
    // True if current week is the last week of the mesocycle
    return weeksOfTraining % cycleLength === 0;
  }

  private generateRecommendationText(intensity: string, recovery: number, strain: number, availableDataSources?: any): string {
    const base = {
      'rest': 'Complete rest and recovery',
      'light': 'Light activity and mobility work',
      'moderate': 'Moderate intensity training',
      'high': 'High intensity training optimal'
    }[intensity];

    let context = '';
    if (availableDataSources?.hasRecovery) {
      context = recovery < 50 ? 'Focus on recovery today' :
        recovery > 70 ? 'Your body is ready to be challenged' :
          'Maintain steady training progress';
    } else {
      context = 'Using your feedback to guide training intensity';
    }

    return `${base}. ${context}`;
  }

  /**
   * Calculate weights for different data sources based on availability
   */
  private calculateDataSourceWeights(
    availableDataSources: { hasRecovery: boolean; hasStrain: boolean; hasHRV: boolean; hasUserFeedback: boolean },
    recentSessions: WorkoutSession[]
  ): Record<string, number> {
    const weights: Record<string, number> = {
      recovery: availableDataSources.hasRecovery ? 1.0 : 0.0,
      strain: availableDataSources.hasStrain ? 1.0 : 0.0,
      hrv: availableDataSources.hasHRV ? 0.8 : 0.0,
      userFeedback: availableDataSources.hasUserFeedback ? 0.9 : 0.0
    };

    // Normalize weights so they sum to 1.0
    const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
    if (totalWeight > 0) {
      Object.keys(weights).forEach(key => {
        weights[key] = weights[key] / totalWeight;
      });
    }

    // Boost user feedback weight when health data is limited
    const healthDataCount = [availableDataSources.hasRecovery, availableDataSources.hasStrain, availableDataSources.hasHRV].filter(Boolean).length;
    if (healthDataCount <= 1 && availableDataSources.hasUserFeedback) {
      weights.userFeedback *= 1.5; // Increase feedback weight when health data is sparse
    }

    return weights;
  }

  /**
   * Analyze user feedback from recent sessions
   */
  private analyzeUserFeedback(sessions: WorkoutSession[]): {
    recentDifficulty: number;
    trend: 'improving' | 'stable' | 'declining';
    confidence: number;
    consistency: number;
  } {
    const recentSessions = sessions.slice(0, 10); // Last 10 sessions
    const allCompletions = recentSessions.flatMap(s => s.setCompletions || []);

    if (allCompletions.length === 0) {
      return {
        recentDifficulty: 2, // Default moderate
        trend: 'stable',
        confidence: 0,
        consistency: 0
      };
    }

    // Calculate recent difficulty average (1=easy, 2=moderate, 3=hard)
    const recentCompletions = allCompletions.slice(0, 20); // Last 20 sets
    const difficultyScores = recentCompletions.map(c => {
      switch (c.difficulty) {
        case 'easy': return 1;
        case 'moderate': return 2;
        case 'hard': return 3;
        default: return 2;
      }
    });

    const recentDifficulty = difficultyScores.reduce((sum, score) => sum + score, 0) / difficultyScores.length;

    // Calculate trend
    const firstHalf = difficultyScores.slice(0, Math.floor(difficultyScores.length / 2));
    const secondHalf = difficultyScores.slice(Math.floor(difficultyScores.length / 2));

    const firstAvg = firstHalf.length > 0 ? firstHalf.reduce((sum, score) => sum + score, 0) / firstHalf.length : 2;
    const secondAvg = secondHalf.length > 0 ? secondHalf.reduce((sum, score) => sum + score, 0) / secondHalf.length : 2;

    let trend: 'improving' | 'stable' | 'declining' = 'stable';
    if (secondAvg < firstAvg - 0.2) trend = 'improving'; // Getting easier
    if (secondAvg > firstAvg + 0.2) trend = 'declining'; // Getting harder

    // Calculate confidence based on data quantity and consistency
    const dataPoints = difficultyScores.length;
    const variance = difficultyScores.reduce((sum, score) => sum + Math.pow(score - recentDifficulty, 2), 0) / dataPoints;
    const consistency = Math.max(0, 1 - variance / 2); // Lower variance = higher consistency

    const confidence = Math.min(1.0, (dataPoints / 20) * consistency);

    return {
      recentDifficulty,
      trend,
      confidence,
      consistency
    };
  }

  /**
   * Format available data sources for display
   */
  private formatDataSources(availableDataSources: { hasRecovery: boolean; hasStrain: boolean; hasHRV: boolean; hasUserFeedback: boolean }): string {
    const sources: string[] = [];
    if (availableDataSources.hasRecovery) sources.push('Recovery');
    if (availableDataSources.hasStrain) sources.push('Strain');
    if (availableDataSources.hasHRV) sources.push('HRV');
    if (availableDataSources.hasUserFeedback) sources.push('User Feedback');

    return sources.length > 0 ? sources.join(', ') : 'None';
  }

  /**
   * Determine training intensity based on user feedback when health data is unavailable
   */
  private determineIntensityFromFeedback(feedbackAnalysis: any): 'rest' | 'light' | 'moderate' | 'high' {
    const { recentDifficulty, trend, confidence } = feedbackAnalysis;

    // Low confidence = conservative approach
    if (confidence < 0.3) {
      return 'light';
    }

    if (recentDifficulty <= 1.3) {
      // Sets feeling very easy
      return trend === 'improving' ? 'high' : 'moderate';
    } else if (recentDifficulty <= 2.3) {
      // Sets feeling moderate
      return 'moderate';
    } else {
      // Sets feeling hard
      return trend === 'declining' ? 'light' : 'moderate';
    }
  }

  /**
   * Calculate rest multiplier based on user feedback
   */
  private calculateRestFromFeedback(feedbackAnalysis: any): number {
    const { recentDifficulty, trend } = feedbackAnalysis;

    let multiplier = 1.0;

    if (recentDifficulty <= 1.3) {
      multiplier = 0.9; // Can reduce rest when sets feel easy
    } else if (recentDifficulty <= 2.3) {
      multiplier = 1.0; // Standard rest for moderate sets
    } else {
      multiplier = 1.2; // Increase rest when sets feel hard
    }

    // Adjust based on trend
    if (trend === 'declining') {
      multiplier *= 1.1; // Extra rest if getting harder
    } else if (trend === 'improving') {
      multiplier *= 0.95; // Slightly less rest if getting easier
    }

    return multiplier;
  }

  /**
   * Calculate data completeness score based on available data sources
   */
  private calculateDataCompleteness(
    availableDataSources: {
      hasRecovery: boolean;
      hasStrain: boolean;
      hasHRV: boolean;
      hasUserFeedback: boolean;
    },
    sessions: WorkoutSession[]
  ): number {
    let score = 0;
    let totalSources = 4;

    if (availableDataSources.hasRecovery) score += 0.25;
    if (availableDataSources.hasStrain) score += 0.25;
    if (availableDataSources.hasHRV) score += 0.25;
    if (availableDataSources.hasUserFeedback) score += 0.25;

    // Bonus for having multiple sessions with feedback
    const sessionsWithFeedback = sessions.filter(s =>
      s.setCompletions && s.setCompletions.length > 0
    ).length;

    if (sessionsWithFeedback > sessions.length * 0.5) {
      score += 0.1; // Bonus for feedback consistency
    }

    return Math.min(1, score);
  }

  /**
   * Calculate effort trend based on feedback when health data is unavailable
   */
  private calculateFeedbackBasedEffortTrend(sessions: WorkoutSession[]): number {
    const recentSessions = sessions.slice(0, 10); // Last 10 sessions
    const difficultyScores: number[] = [];

    recentSessions.forEach(session => {
      if (session.setCompletions) {
        session.setCompletions.forEach(completion => {
          // Convert difficulty string to effort score (1=easy, 2=moderate, 3=hard)
          let difficultyScore = 2; // default moderate
          switch (completion.difficulty) {
            case 'easy': difficultyScore = 1; break;
            case 'moderate': difficultyScore = 2; break;
            case 'hard': difficultyScore = 3; break;
          }
          difficultyScores.push(difficultyScore);
        });
      }
    });

    if (difficultyScores.length < 3) return 0.5; // Neutral if insufficient data

    // Calculate trend in difficulty (increasing difficulty = increasing effort)
    const recent = difficultyScores.slice(-5);
    const earlier = difficultyScores.slice(0, -5);

    if (earlier.length === 0) return 0.5;

    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const earlierAvg = earlier.reduce((a, b) => a + b, 0) / earlier.length;

    // Normalize to 0-1 range (higher = more effort)
    const trend = (recentAvg - earlierAvg) / 2; // Divide by 2 to keep in reasonable range
    return Math.max(0, Math.min(1, 0.5 + trend));
  }

  /**
   * Calculate recovery trend based on user feedback when health data is unavailable
   */
  private calculateFeedbackBasedRecoveryTrend(sessions: WorkoutSession[]): number {
    const feedbackAnalysis = this.analyzeUserFeedback(sessions);

    // Convert difficulty trend to recovery-like score (0-100)
    // Easy sets = good recovery (high score), Hard sets = poor recovery (low score)
    const baseScore = 60; // Neutral recovery score

    if (feedbackAnalysis.recentDifficulty <= 1.3) {
      // Sets feeling easy = good recovery
      return baseScore + 20;
    } else if (feedbackAnalysis.recentDifficulty <= 2.3) {
      // Sets feeling moderate = normal recovery
      return baseScore;
    } else {
      // Sets feeling hard = poor recovery
      return baseScore - 20;
    }
  }

  /**
   * Integrate daily strain assessment with training recommendations
   */
  getStrainAdjustedRecommendation(
    strainAssessment: StrainAssessment,
    recovery: number,
    baseStrain: number,
    baseHrv: number,
    recentSessions: WorkoutSession[]
  ): {
    recommendation: string;
    intensity: 'rest' | 'light' | 'moderate' | 'high';
    restMultiplier: number;
    shouldStop: boolean;
    injuryRisk: 'low' | 'moderate' | 'high';
    safetyAlerts: string[];
    reasoning: string[];
    shouldDeload: boolean;
    targetStrain: number;
    strainAlert?: string;
    strainAssessment: StrainAssessment;
  } {
    // Start with base recommendation
    const baseRec = this.getDailyTrainingRecommendation(
      recovery,
      baseStrain,
      baseHrv,
      recentSessions
    );

    // Apply strain assessment adjustments
    const adjustedRec = this.applyStrainAssessmentAdjustments(baseRec, strainAssessment);

    return {
      ...adjustedRec,
      strainAssessment
    };
  }

  /**
   * Apply strain assessment adjustments to base recommendation
   */
  private applyStrainAssessmentAdjustments(
    baseRec: ReturnType<AdaptiveTrainingEngine['getDailyTrainingRecommendation']>,
    strainAssessment: StrainAssessment
  ): ReturnType<AdaptiveTrainingEngine['getDailyTrainingRecommendation']> {
    const adjusted = { ...baseRec };
    const { overallStatus, compositeScore, healthAlerts, trainingRecommendation } = strainAssessment;

    // Override intensity based on strain assessment
    switch (overallStatus) {
      case 'high_risk':
        adjusted.intensity = 'rest';
        adjusted.shouldStop = true;
        adjusted.injuryRisk = 'high';
        break;
      case 'compromised':
        adjusted.intensity = 'light';
        adjusted.injuryRisk = adjusted.injuryRisk === 'low' ? 'moderate' : 'high';
        break;
      case 'moderate':
        // Keep moderate or reduce to light if current is high
        if (adjusted.intensity === 'high') {
          adjusted.intensity = 'moderate';
        }
        break;
      case 'ready':
        // Keep base recommendation
        break;
    }

    // Apply training recommendation modifications
    if (trainingRecommendation.status === 'reduce_load' && trainingRecommendation.loadReductionPercent) {
      adjusted.restMultiplier *= (1 + trainingRecommendation.loadReductionPercent / 100);
    }

    // Add strain assessment alerts
    healthAlerts.forEach(alert => {
      adjusted.safetyAlerts.push(`🚨 ${alert.message}`);
    });

    // Add training recommendation modifications
    trainingRecommendation.modifications.forEach(mod => {
      adjusted.safetyAlerts.push(`💡 ${mod}`);
    });

    // Update reasoning with strain assessment
    adjusted.reasoning.push(`Strain assessment: ${overallStatus} (score: ${compositeScore})`);
    adjusted.reasoning.push(`Training recommendation: ${trainingRecommendation.reasoning}`);

    // Adjust target strain based on assessment
    if (overallStatus === 'high_risk') {
      adjusted.targetStrain = Math.round(adjusted.targetStrain * 0.3);
    } else if (overallStatus === 'compromised') {
      adjusted.targetStrain = Math.round(adjusted.targetStrain * 0.6);
    } else if (overallStatus === 'moderate') {
      adjusted.targetStrain = Math.round(adjusted.targetStrain * 0.8);
    }

    return adjusted;
  }

  /**
   * Generate comprehensive daily training plan with strain assessment
   */
  generateDailyTrainingPlan(
    strainAssessment: StrainAssessment,
    plannedWorkouts: any[],
    userProfile: any
  ): {
    canTrain: boolean;
    recommendedWorkouts: any[];
    modifications: string[];
    restDayAlternatives: string[];
    monitoringPoints: string[];
    nextAssessmentTime: Date;
  } {
    const { overallStatus, trainingRecommendation, healthAlerts } = strainAssessment;

    // Determine if training is recommended
    const canTrain = overallStatus !== 'high_risk';

    // Apply modifications to planned workouts
    const recommendedWorkouts = plannedWorkouts.map(workout => {
      return this.modifyWorkoutForStrain(workout, strainAssessment);
    });

    // Generate rest day alternatives if needed
    const restDayAlternatives = overallStatus === 'high_risk' || overallStatus === 'compromised'
      ? this.generateRestDayAlternatives(strainAssessment)
      : [];

    // Generate monitoring points
    const monitoringPoints = this.generateMonitoringPoints(strainAssessment);

    // Calculate next assessment time
    const nextAssessmentTime = new Date();
    nextAssessmentTime.setHours(6, 0, 0, 0); // Next morning at 6 AM
    nextAssessmentTime.setDate(nextAssessmentTime.getDate() + 1);

    return {
      canTrain,
      recommendedWorkouts,
      modifications: trainingRecommendation.modifications,
      restDayAlternatives,
      monitoringPoints,
      nextAssessmentTime
    };
  }

  /**
   * Modify workout based on strain assessment
   */
  private modifyWorkoutForStrain(workout: any, strainAssessment: StrainAssessment): any {
    const { overallStatus, trainingRecommendation } = strainAssessment;
    const modifiedWorkout = { ...workout };

    switch (overallStatus) {
      case 'high_risk':
        // Replace with rest or very light activity
        return {
          ...workout,
          type: 'rest',
          duration: 0,
          exercises: [],
          note: 'Rest day - high risk detected'
        };

      case 'compromised':
        // Replace with mobility or light activity
        if (trainingRecommendation.alternativeActivities) {
          return {
            ...workout,
            type: 'recovery',
            duration: Math.round(workout.duration * 0.5),
            exercises: trainingRecommendation.alternativeActivities,
            note: 'Modified for recovery - compromised status'
          };
        }
        break;

      case 'moderate':
        // Reduce load and volume
        if (trainingRecommendation.loadReductionPercent) {
          modifiedWorkout.loadReduction = trainingRecommendation.loadReductionPercent;
          modifiedWorkout.note = `Reduced load by ${trainingRecommendation.loadReductionPercent}% - moderate strain`;
        }
        break;

      case 'ready':
        // Keep as planned
        modifiedWorkout.note = 'Ready for planned workout';
        break;
    }

    return modifiedWorkout;
  }

  /**
   * Generate rest day alternatives
   */
  private generateRestDayAlternatives(strainAssessment: StrainAssessment): string[] {
    const { trainingRecommendation } = strainAssessment;

    if (trainingRecommendation.alternativeActivities) {
      return trainingRecommendation.alternativeActivities;
    }

    return [
      'Light walking (20-30 minutes)',
      'Gentle yoga or stretching',
      'Meditation or deep breathing exercises',
      'Reading or relaxation activities',
      'Light household activities',
      'Nature walk or fresh air time'
    ];
  }

  /**
   * Generate monitoring points for the day
   */
  private generateMonitoringPoints(strainAssessment: StrainAssessment): string[] {
    const { overallStatus, healthAlerts, zones } = strainAssessment;
    const monitoringPoints: string[] = [];

    // Add health alert monitoring
    healthAlerts.forEach(alert => {
      if (alert.requiresAttention) {
        monitoringPoints.push(`Monitor: ${alert.recommendation}`);
      }
    });

    // Add zone-specific monitoring
    if (zones.hrZone === 'red') {
      monitoringPoints.push('Monitor resting heart rate throughout the day');
    }

    if (zones.spo2Zone === 'red') {
      monitoringPoints.push('Monitor blood oxygen levels, avoid high altitude if possible');
    }

    // Add general monitoring based on status
    switch (overallStatus) {
      case 'high_risk':
        monitoringPoints.push('Monitor for illness symptoms (fever, fatigue, body aches)');
        monitoringPoints.push('Track energy levels and sleep quality');
        break;
      case 'compromised':
        monitoringPoints.push('Monitor workout performance and perceived effort');
        monitoringPoints.push('Track heart rate response during activity');
        break;
      case 'moderate':
        monitoringPoints.push('Monitor recovery between sets');
        monitoringPoints.push('Note any unusual fatigue or discomfort');
        break;
    }

    return monitoringPoints;
  }

  /**
   * Get strain assessment summary for dashboard
   */
  getStrainAssessmentSummary(strainAssessment: StrainAssessment): {
    status: string;
    statusColor: 'green' | 'yellow' | 'orange' | 'red';
    keyMetrics: Record<string, any>;
    recommendations: string[];
    alerts: string[];
  } {
    const { overallStatus, compositeScore, zones, trainingRecommendation, healthAlerts } = strainAssessment;

    // Determine status color
    const statusColor = {
      'ready': 'green' as const,
      'moderate': 'yellow' as const,
      'compromised': 'orange' as const,
      'high_risk': 'red' as const
    }[overallStatus];

    // Key metrics
    const keyMetrics = {
      'Overall Status': overallStatus.charAt(0).toUpperCase() + overallStatus.slice(1),
      'Composite Score': `${compositeScore}/100`,
      'HR Zone': zones.hrZone.toUpperCase(),
      'SpO₂ Zone': zones.spo2Zone.toUpperCase(),
      'Confidence': `${strainAssessment.confidence}%`
    };

    // Recommendations
    const recommendations = [
      trainingRecommendation.reasoning,
      ...trainingRecommendation.modifications.slice(0, 2) // Limit to 2 modifications
    ];

    // Alerts
    const alerts = healthAlerts.map(alert => alert.message);

    return {
      status: overallStatus,
      statusColor,
      keyMetrics,
      recommendations,
      alerts
    };
  }
}