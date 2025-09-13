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
  perceivedEffort?: number; // RPE 1-10
  recoveryBefore?: number; // WHOOP recovery score
  strainAfter?: number; // WHOOP strain score
  adaptationScore?: number; // calculated adaptation metric
  targetStrain?: number; // target strain for this session
  actualStrain?: number; // actual strain achieved
  stoppedEarly?: boolean; // true if stopped due to strain target
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
    shouldDeload: boolean;
    targetStrain: number;
    strainAlert?: string;
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

    // Deload week assessment
    const weeksOfTraining = this.calculateWeeksOfTraining(recentSessions);
    const avgRecoveryTrend = this.calculateRecentAverage(recentSessions, 'recovery', 14);
    if (weeksOfTraining >= 3 && (avgRecoveryTrend < 45 || this.isDeloadWeekScheduled())) {
      shouldDeload = true;
      safetyAlerts.push('🔄 Deload week recommended - reduce intensity and focus on recovery');
      reasoning.push(`${weeksOfTraining} weeks of training completed - time for deload`);
    }

    // Strain target calculation and alert
    if (strain > targetStrain * 0.9) {
      strainAlert = `⚡ Approaching strain target (${strain.toFixed(1)}/${targetStrain}) - prepare to stop`;
    }

    const recommendation = this.generateRecommendationText(intensity, recovery, strain);

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
      strainAlert
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

  private isDeloadWeekScheduled(): boolean {
    // Check if it's week 4, 8, 12, etc. in a training cycle
    const weekNumber = Math.floor(Date.now() / (1000 * 60 * 60 * 24 * 7)) % 4;
    return weekNumber === 3; // Every 4th week
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