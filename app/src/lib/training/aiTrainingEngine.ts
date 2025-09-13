// File: aiTrainingEngine.ts

/**
 * AI Training Engine
 * Purpose: Core AI decision-making for all training adaptations
 */

import type { TrainingProgram, RecoveryData, TrainingSession } from '../types/sharedTypes';

export interface AITrainingEngine {
  /**
   * Analyze weekly performance data
   * @param userId - ID of the user
   * @param weekData - Weekly training data
   */
  analyzeWeeklyPerformance(userId: string, weekData: WeeklyData): Promise<PerformanceAnalysis>;

  /**
   * Calculate program adjustments based on performance analysis
   * @param analysis - Performance analysis data
   * @param currentProgram - Current training program
   */
  calculateProgramAdjustments(analysis: PerformanceAnalysis, currentProgram: TrainingProgram): Promise<ProgramAdjustments>;

  /**
   * Predict Reps in Reserve (RIR) for a specific exercise set
   * @param userId - ID of the user
   * @param exercise - Exercise details
   * @param setNumber - Set number in the workout
   */
  predictRIR(userId: string, exercise: Exercise, setNumber: number): Promise<RIRPrediction>;

  /**
   * Assess recovery status based on recovery data
   * @param recoveryData - Array of recovery data
   */
  assessRecoveryStatus(recoveryData: RecoveryData[]): Promise<RecoveryStatus>;

  /**
   * Determine the timing for a deload week
   * @param userId - ID of the user
   * @param currentWeek - Current week number in the program
   * @param recoveryTrend - Recovery trend data
   */
  determineDeloadTiming(userId: string, currentWeek: number, recoveryTrend: RecoveryTrend): Promise<DeloadRecommendation>;

  /**
   * Calculate rest period adjustments based on real-time strain metrics
   * @param realtimeStrain - Real-time strain metrics
   * @param baseRestTime - Base rest time in seconds
   */
  calculateRestAdjustment(realtimeStrain: StrainMetrics, baseRestTime: number): Promise<RestAdjustment>;

  /**
   * Generate safety overrides based on danger signals
   * @param dangerSignals - Array of safety signals
   */
  generateSafetyOverride(dangerSignals: SafetySignal[]): Promise<SafetyOverride>;
}

// Define the types used in the interface
export interface WeeklyData {
  sessions: TrainingSession[];
  recoveryMetrics: RecoveryData[];
}

export interface PerformanceAnalysis {
  consistencyScore: number;
  effortTrend: number;
  recoveryTrend: number;
  adaptationScore: number;
}

export interface ProgramAdjustments {
  loadAdjustment: number;
  volumeAdjustment: number;
  intensityAdjustment: number;
}

export interface Exercise {
  name: string;
  muscleGroup: string;
  equipment: string;
}

export interface RIRPrediction {
  predictedRIR: number;
  confidence: number;
}

export interface RecoveryStatus {
  recoveryScore: number;
  fatigueLevel: string;
}

export interface RecoveryTrend {
  trend: 'improving' | 'stable' | 'declining';
  averageRecovery: number;
}

export interface DeloadRecommendation {
  shouldDeload: boolean;
  reasoning: string;
}

export interface SafetySignal {
  type: 'hrv_drop' | 'excessive_strain' | 'fatigue_spike' | 'pain_reported';
  severity: 'low' | 'moderate' | 'high';
  value: number;
  threshold: number;
}

export interface SafetyOverride {
  shouldStop: boolean;
  shouldReduceIntensity: boolean;
  restPeriodMultiplier: number;
  warnings: string[];
}

/**
 * Implementation of the AI Training Engine
 * Provides intelligent training adaptations and decision-making
 */
export class AITrainingEngineImpl implements AITrainingEngine {
  private rirModels: Map<string, RIRModel> = new Map();
  private userProfiles: Map<string, UserProfile> = new Map();

  constructor() {
    // Initialize with default models
  }

  async analyzeWeeklyPerformance(userId: string, weekData: WeeklyData): Promise<PerformanceAnalysis> {
    const sessions = weekData.sessions;
    const recoveryMetrics = weekData.recoveryMetrics;

    // Calculate consistency score (0-100)
    const plannedSessions = 7; // Assume 7 planned sessions per week
    const completedSessions = sessions.filter(s => s.completed).length;
    const consistencyScore = (completedSessions / plannedSessions) * 100;

    // Calculate effort trend (-100 to +100)
    const effortValues = sessions.map(s => s.perceivedExertion || 5);
    const effortTrend = this.calculateTrend(effortValues);

    // Calculate recovery trend (-100 to +100)
    const recoveryValues = recoveryMetrics.map(r => r.recoveryScore);
    const recoveryTrend = this.calculateTrend(recoveryValues);

    // Calculate adaptation score (0-100)
    const completionRates = sessions.map(s => this.calculateCompletionRate(s));
    const adaptationScore = this.calculateAverage(completionRates) * 100;

    return {
      consistencyScore,
      effortTrend,
      recoveryTrend,
      adaptationScore
    };
  }

  async calculateProgramAdjustments(
    analysis: PerformanceAnalysis, 
    currentProgram: TrainingProgram
  ): Promise<ProgramAdjustments> {
    let loadAdjustment = 0;
    let volumeAdjustment = 0;
    let intensityAdjustment = 0;

    // Base adjustments on performance analysis
    if (analysis.consistencyScore > 90 && analysis.adaptationScore > 80) {
      // High performance - increase load
      loadAdjustment = 0.05; // 5% increase
      if (analysis.recoveryTrend > 10) {
        volumeAdjustment = 0.1; // 10% volume increase if recovery is good
      }
    } else if (analysis.consistencyScore < 70 || analysis.recoveryTrend < -20) {
      // Poor performance or declining recovery - reduce load
      loadAdjustment = -0.05; // 5% decrease
      volumeAdjustment = -0.1; // 10% volume decrease
    }

    // Adjust intensity based on effort trend
    if (analysis.effortTrend > 20) {
      intensityAdjustment = -0.05; // Reduce intensity if effort is trending high
    } else if (analysis.effortTrend < -20) {
      intensityAdjustment = 0.05; // Increase intensity if effort is trending low
    }

    return {
      loadAdjustment,
      volumeAdjustment,
      intensityAdjustment
    };
  }

  async predictRIR(userId: string, exercise: Exercise, setNumber: number): Promise<RIRPrediction> {
    const modelKey = `${userId}-${exercise.name}`;
    const model = this.rirModels.get(modelKey);

    if (!model) {
      // No model exists yet - return conservative estimate
      return {
        predictedRIR: Math.max(3 - setNumber, 0), // Conservative: start with 3 RIR, decrease by set
        confidence: 0.3 // Low confidence without historical data
      };
    }

    // Use enhanced ML model for prediction
    const prediction = this.predictRIRWithML(model, exercise, setNumber);
    
    return {
      predictedRIR: Math.round(prediction.rir),
      confidence: prediction.confidence
    };
  }

  /**
   * Enhanced RIR prediction using machine learning model
   */
  private predictRIRWithML(model: RIRModel, exercise: Exercise, setNumber: number): { rir: number; confidence: number } {
    // Extract features for prediction
    const features = {
      setNumber,
      exerciseType: this.categorizeExercise(exercise),
      muscleGroup: exercise.muscleGroup,
      equipment: exercise.equipment,
      timeOfDay: new Date().getHours(),
      recentFatigue: this.calculateRecentFatigue(),
      trainingAge: model.trainingAge || 0,
      lastSessionRIR: model.lastSessionRIR || 3
    };

    // Use trained model parameters for prediction
    const baseRIR = this.calculateBaseRIR(model, features);
    const adjustment = this.calculateContextualAdjustment(model, features);
    
    const predictedRIR = Math.max(0, Math.min(5, baseRIR + adjustment));
    const confidence = this.calculatePredictionConfidence(model, features);

    return { rir: predictedRIR, confidence };
  }

  // RIR Model Helper Methods
  private categorizeExercise(exercise: Exercise): string {
    // Categorize exercises by movement pattern
    const compoundExercises = ['squat', 'deadlift', 'bench press', 'overhead press', 'pull-up', 'row'];
    const isolationExercises = ['bicep curl', 'tricep extension', 'leg extension', 'leg curl', 'lateral raise'];
    
    const exerciseName = exercise.name.toLowerCase();
    if (compoundExercises.some(compound => exerciseName.includes(compound))) {
      return 'compound';
    } else if (isolationExercises.some(isolation => exerciseName.includes(isolation))) {
      return 'isolation';
    }
    return 'other';
  }

  private calculateRecentFatigue(): number {
    // Simplified fatigue calculation - in real implementation would use recent recovery data
    return Math.random() * 10; // Placeholder
  }

  private calculateBaseRIR(model: RIRModel, features: any): number {
    let baseRIR = model.parameters.baselineRIR;
    
    // Apply exercise type modifier
    const exerciseModifier = model.parameters.exerciseTypeModifier[features.exerciseType] || 0;
    baseRIR += exerciseModifier;
    
    // Apply muscle group modifier
    const muscleModifier = model.parameters.muscleGroupModifier[features.muscleGroup] || 0;
    baseRIR += muscleModifier;
    
    // Apply time of day modifier
    const timeModifier = model.parameters.timeOfDayModifier[Math.floor(features.timeOfDay / 6)] || 0;
    baseRIR += timeModifier;
    
    return Math.max(0, Math.min(5, baseRIR));
  }

  private calculateContextualAdjustment(model: RIRModel, features: any): number {
    let adjustment = 0;
    
    // Fatigue adjustment
    adjustment -= features.recentFatigue * 0.1;
    
    // Training age adjustment (more experienced = better RIR estimation)
    adjustment += Math.min(features.trainingAge * 0.01, 0.5);
    
    // Set number adjustment (later sets typically have lower RIR)
    adjustment -= features.setNumber * model.parameters.fatigueRate;
    
    return adjustment;
  }

  private calculatePredictionConfidence(model: RIRModel, features: any): number {
    let confidence = model.accuracy;
    
    // Reduce confidence for new/unfamiliar contexts
    if (features.trainingAge < 10) confidence *= 0.8;
    if (features.recentFatigue > 7) confidence *= 0.9;
    
    return Math.max(0.1, Math.min(1.0, confidence));
  }

  private performModelTraining(performanceData: RIRTrainingData[], existingModel?: RIRModel): ModelTrainingResult {
    // Simplified training algorithm - in production would use proper ML
    const avgRIR = performanceData.reduce((sum, data) => sum + data.actualRIR, 0) / performanceData.length;
    const accuracy = 0.85; // Placeholder accuracy
    
    const parameters: RIRModelParameters = {
      baselineRIR: avgRIR,
      fatigueRate: 0.2,
      exerciseTypeModifier: { compound: 0.1, isolation: -0.1, other: 0 },
      muscleGroupModifier: {},
      timeOfDayModifier: { 0: -0.2, 1: 0, 2: 0.1, 3: -0.1 }, // Early morning, morning, afternoon, evening
      confidenceThreshold: 0.7
    };
    
    return {
      success: true,
      accuracy,
      improvement: 0,
      newVersion: 1,
      parameters
    };
  }

  private getUserTrainingAge(userId: string): number {
    // Placeholder - would retrieve from user profile
    return 30; // months
  }

  private storeRIRFeedback(feedback: RIRFeedback): void {
    // Placeholder - would store in database
    console.log('Storing RIR feedback:', feedback);
  }

  private getStoredFeedbackCount(userId: string, exercise: string): number {
    // Placeholder - would query database
    return 5; // Mock count
  }

  private async triggerModelRetraining(userId: string, exercise: Exercise): Promise<void> {
    // Placeholder - would trigger background model retraining
    console.log(`Triggering model retraining for ${userId} - ${exercise.name}`);
  }

  private getStoredFeedback(userId: string, exercise: string): RIRFeedback[] {
    // Placeholder - would retrieve from database
    return [];
  }

  private calculateRecentAccuracy(feedbackData: RIRFeedback[]): number {
    if (feedbackData.length === 0) return 0;
    
    const recentFeedback = feedbackData.slice(-10); // Last 10 feedback points
    const avgRating = recentFeedback.reduce((sum, fb) => sum + fb.performanceRating, 0) / recentFeedback.length;
    
    return avgRating / 5; // Convert 1-5 scale to 0-1
  }

  private generateModelRecommendations(model: RIRModel, recentAccuracy: number): string[] {
    const recommendations: string[] = [];
    
    if (model.trainingAge < 20) {
      recommendations.push('Complete more training sessions to improve model accuracy');
    }
    
    if (recentAccuracy < 0.7) {
      recommendations.push('Recent predictions less accurate - model may need retraining');
    }
    
    if (model.accuracy > 0.9) {
      recommendations.push('Model performing excellently - continue providing feedback');
    }
    
  /**
   * Generate fatigue-related notifications based on current state
   */
  async generateFatigueNotifications(
    userId: string,
    recoveryData: RecoveryData[],
    recentSessions: TrainingSession[],
    userPreferences: NotificationPreferences
  ): Promise<FatigueNotification[]> {
    const notifications: FatigueNotification[] = [];

    // Analyze current fatigue state
    const fatigueAnalysis = this.analyzeFatigueState(recoveryData, recentSessions);
    
    // Generate notifications based on fatigue level
    if (fatigueAnalysis.fatigueLevel === 'high') {
      notifications.push({
        id: `fatigue-high-${Date.now()}`,
        type: 'warning',
        title: 'High Fatigue Detected',
        message: `Your recovery metrics indicate high fatigue (${fatigueAnalysis.fatigueScore.toFixed(1)}/100). Consider reducing training intensity.`,
        priority: 'high',
        actions: [
          { label: 'Reduce Load', action: 'reduce_load', value: 0.8 },
          { label: 'Rest Day', action: 'rest_day', value: 1 },
          { label: 'Light Session', action: 'light_session', value: 0.6 }
        ],
        timestamp: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
      });
    } else if (fatigueAnalysis.fatigueLevel === 'moderate') {
      notifications.push({
        id: `fatigue-moderate-${Date.now()}`,
        type: 'info',
        title: 'Moderate Fatigue',
        message: `You're showing signs of moderate fatigue. Monitor your recovery closely.`,
        priority: 'medium',
        actions: [
          { label: 'Monitor Recovery', action: 'monitor_recovery', value: null },
          { label: 'Adjust Intensity', action: 'adjust_intensity', value: 0.9 }
        ],
        timestamp: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString() // 48 hours
      });
    }

    // Recovery trend notifications
    if (fatigueAnalysis.trend === 'worsening') {
      notifications.push({
        id: `recovery-trend-${Date.now()}`,
        type: 'warning',
        title: 'Recovery Trend Declining',
        message: 'Your recovery metrics are trending downward. Consider additional recovery strategies.',
        priority: 'medium',
        actions: [
          { label: 'Sleep Focus', action: 'sleep_focus', value: null },
          { label: 'Nutrition Boost', action: 'nutrition_boost', value: null }
        ],
        timestamp: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString() // 72 hours
      });
    }

    // Strain accumulation warnings
    if (fatigueAnalysis.strainAccumulation > 15) {
      notifications.push({
        id: `strain-accumulation-${Date.now()}`,
        type: 'warning',
        title: 'High Training Strain',
        message: `Accumulated strain is high (${fatigueAnalysis.strainAccumulation.toFixed(1)}). Deload recommended.`,
        priority: 'high',
        actions: [
          { label: 'Schedule Deload', action: 'schedule_deload', value: 1 },
          { label: 'Reduce Volume', action: 'reduce_volume', value: 0.8 }
        ],
        timestamp: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
      });
    }

    // Filter notifications based on user preferences
    return this.filterNotificationsByPreferences(notifications, userPreferences);
  }

  /**
   * Analyze current fatigue state from recovery and training data
   */
  private analyzeFatigueState(recoveryData: RecoveryData[], recentSessions: TrainingSession[]): FatigueAnalysis {
    let fatigueScore = 50; // Base score
    let strainAccumulation = 0;
    
    // Analyze recovery data
    if (recoveryData.length > 0) {
      const latestRecovery = recoveryData[recoveryData.length - 1];
      const avgRecovery = recoveryData.reduce((sum, r) => sum + r.recoveryScore, 0) / recoveryData.length;
      
      // Lower recovery score increases fatigue
      fatigueScore -= (100 - avgRecovery) * 0.5;
      
      // HRV below 40 indicates high fatigue
      if (latestRecovery.hrvScore < 40) {
        fatigueScore += 20;
      }
      
      // High resting heart rate indicates fatigue
      if (latestRecovery.restingHeartRate > 75) {
        fatigueScore += 15;
      }
      
      // Poor sleep increases fatigue
      if (latestRecovery.sleepPerformance < 60) {
        fatigueScore += 10;
      }
      
      // Calculate strain accumulation
      strainAccumulation = recoveryData.slice(-7).reduce((sum, r) => sum + (r.strainYesterday || 0), 0) / 7;
      fatigueScore += strainAccumulation * 2;
    }

    // Analyze recent training load
    if (recentSessions.length > 0) {
      const recentLoad = this.calculateAcuteLoad(recentSessions);
      const chronicLoad = this.calculateChronicLoad(recentSessions);
      const acwr = chronicLoad > 0 ? recentLoad / chronicLoad : 1;
      
      // High ACWR indicates potential overtraining
      if (acwr > 1.3) {
        fatigueScore += (acwr - 1.3) * 20;
      }
    }

    // Determine fatigue level
    let fatigueLevel: 'low' | 'moderate' | 'high';
    if (fatigueScore > 70) {
      fatigueLevel = 'high';
    } else if (fatigueScore > 55) {
      fatigueLevel = 'moderate';
    } else {
      fatigueLevel = 'low';
    }

    // Determine trend
    let trend: 'improving' | 'stable' | 'worsening' = 'stable';
    if (recoveryData.length >= 7) {
      const recent = recoveryData.slice(-3);
      const earlier = recoveryData.slice(-7, -3);
      
      const recentAvg = recent.reduce((sum, r) => sum + r.recoveryScore, 0) / recent.length;
      const earlierAvg = earlier.reduce((sum, r) => sum + r.recoveryScore, 0) / earlier.length;
      
      if (recentAvg > earlierAvg + 5) {
        trend = 'improving';
      } else if (recentAvg < earlierAvg - 5) {
        trend = 'worsening';
      }
    }

    return {
      fatigueScore: Math.max(0, Math.min(100, fatigueScore)),
      fatigueLevel,
      trend,
      strainAccumulation,
      recommendations: this.generateFatigueRecommendations(fatigueLevel, trend)
    };
  }

  /**
   * Generate fatigue management recommendations
   */
  private generateFatigueRecommendations(fatigueLevel: string, trend: string): string[] {
    const recommendations: string[] = [];

    if (fatigueLevel === 'high') {
      recommendations.push('Prioritize sleep - aim for 8+ hours per night');
      recommendations.push('Consider taking 1-2 rest days');
      recommendations.push('Reduce training volume by 20-30%');
      recommendations.push('Focus on recovery nutrition (protein, carbs)');
      recommendations.push('Incorporate active recovery activities');
    } else if (fatigueLevel === 'moderate') {
      recommendations.push('Monitor recovery metrics closely');
      recommendations.push('Ensure adequate sleep and nutrition');
      recommendations.push('Consider lighter training sessions');
      recommendations.push('Include more rest between sets');
    }

    if (trend === 'worsening') {
      recommendations.push('Address underlying causes of declining recovery');
      recommendations.push('Consider consulting a coach or medical professional');
      recommendations.push('Implement deload period');
    }

    return recommendations;
  }

  /**
   * Filter notifications based on user preferences
   */
  private filterNotificationsByPreferences(
    notifications: FatigueNotification[],
    preferences: NotificationPreferences
  ): FatigueNotification[] {
    return notifications.filter(notification => {
      // Filter by priority
      if (notification.priority === 'high' && !preferences.highPriority) {
        return false;
      }
      if (notification.priority === 'medium' && !preferences.mediumPriority) {
        return false;
      }
      if (notification.priority === 'low' && !preferences.lowPriority) {
        return false;
      }

      // Filter by type
      if (notification.type === 'warning' && !preferences.warnings) {
        return false;
      }
      if (notification.type === 'info' && !preferences.info) {
        return false;
      }

      return true;
    });
  }

  /**
   * Train or update RIR model with new performance data
   */
  async trainRIRModel(
    userId: string, 
    exercise: Exercise, 
    performanceData: RIRTrainingData[]
  ): Promise<ModelTrainingResult> {
    const modelKey = `${userId}-${exercise.name}`;
    const existingModel = this.rirModels.get(modelKey);
    
    const trainingResult = this.performModelTraining(performanceData, existingModel);
    
    // Update or create model
    const updatedModel: RIRModel = {
      userId,
      exerciseId: exercise.name,
      modelVersion: existingModel ? existingModel.modelVersion + 1 : 1,
      accuracy: trainingResult.accuracy,
      parameters: trainingResult.parameters,
      lastUpdated: new Date().toISOString(),
      trainingAge: (existingModel?.trainingAge || 0) + performanceData.length,
      lastSessionRIR: performanceData[performanceData.length - 1]?.actualRIR || 3
    };

    this.rirModels.set(modelKey, updatedModel);

    return {
      success: true,
      accuracy: trainingResult.accuracy,
      improvement: existingModel ? trainingResult.accuracy - existingModel.accuracy : 0,
      newVersion: updatedModel.modelVersion,
      parameters: trainingResult.parameters
    };
  }

  /**
   * Collect real-time RIR feedback for model improvement
   */
  async collectRIRFeedback(
    userId: string,
    exercise: Exercise,
    predictedRIR: number,
    actualRIR: number,
    setNumber: number,
    performanceRating: number // 1-5 scale of how accurate the prediction was
  ): Promise<void> {
    const feedback: RIRFeedback = {
      userId,
      exercise: exercise.name,
      predictedRIR,
      actualRIR,
      setNumber,
      performanceRating,
      timestamp: new Date().toISOString(),
      context: {
        fatigueLevel: this.calculateRecentFatigue(),
        trainingAge: this.getUserTrainingAge(userId),
        timeOfDay: new Date().getHours()
      }
    };

    // Store feedback for batch training
    this.storeRIRFeedback(feedback);

    // Trigger model retraining if we have enough new data
    const feedbackCount = this.getStoredFeedbackCount(userId, exercise.name);
    if (feedbackCount >= 10) { // Retrain every 10 feedback points
      await this.triggerModelRetraining(userId, exercise);
    }
  }

  /**
   * Get model performance metrics and recommendations
   */
  async getRIRModelMetrics(userId: string, exercise: Exercise): Promise<RIRModelMetrics> {
    const modelKey = `${userId}-${exercise.name}`;
    const model = this.rirModels.get(modelKey);

    if (!model) {
      return {
        hasModel: false,
        accuracy: 0,
        trainingDataPoints: 0,
        lastUpdated: null,
        recommendations: ['Complete more sets to build personalized RIR model']
      };
    }

    const feedbackData = this.getStoredFeedback(userId, exercise.name);
    const recentAccuracy = this.calculateRecentAccuracy(feedbackData);

    return {
      hasModel: true,
      accuracy: model.accuracy,
      trainingDataPoints: model.trainingAge,
      lastUpdated: model.lastUpdated,
      recentAccuracy,
      recommendations: this.generateModelRecommendations(model, recentAccuracy)
    };
  }

  async assessRecoveryStatus(recoveryData: RecoveryData[]): Promise<RecoveryStatus> {
    if (recoveryData.length === 0) {
      return { recoveryScore: 50, fatigueLevel: 'moderate' };
    }

    const latestRecovery = recoveryData[recoveryData.length - 1];
    const recoveryScore = latestRecovery.recoveryScore;

    let fatigueLevel: string;
    if (recoveryScore < 30) {
      fatigueLevel = 'very_high';
    } else if (recoveryScore < 50) {
      fatigueLevel = 'high';
    } else if (recoveryScore < 70) {
      fatigueLevel = 'moderate';
    } else {
      fatigueLevel = 'low';
    }

    return {
      recoveryScore,
      fatigueLevel
    };
  }

  async determineDeloadTiming(
    userId: string, 
    currentWeek: number, 
    recoveryTrend: RecoveryTrend
  ): Promise<DeloadRecommendation> {
    let shouldDeload = false;
    let reasoning = '';

    // Scheduled deload every 4-6 weeks
    if (currentWeek % 4 === 0) {
      shouldDeload = true;
      reasoning = `Scheduled deload at week ${currentWeek}`;
    }
    
    // Recovery-based deload
    if (recoveryTrend.trend === 'declining' && recoveryTrend.averageRecovery < 40) {
      shouldDeload = true;
      reasoning = `Declining recovery trend (avg: ${recoveryTrend.averageRecovery}%)`;
    }

    return {
      shouldDeload,
      reasoning
    };
  }

  async calculateRestAdjustment(
    realtimeStrain: StrainMetrics, 
    baseRestTime: number
  ): Promise<RestAdjustment> {
    let multiplier = 1.0;
    let reason = 'Normal rest period';

    // Adjust based on current strain
    if (realtimeStrain.currentStrain && realtimeStrain.currentStrain > 15) {
      multiplier *= 1.3;
      reason = 'High strain detected - extended rest';
    } else if (realtimeStrain.currentStrain && realtimeStrain.currentStrain < 8) {
      multiplier *= 0.8;
      reason = 'Low strain - reduced rest period';
    }

    // Adjust based on HRV deviation
    if (realtimeStrain.hrvDeviation && realtimeStrain.hrvDeviation > 20) {
      multiplier *= 1.2;
      reason += ', HRV elevated';
    }

    // Adjust based on perceived exertion
    if (realtimeStrain.perceivedExertion && realtimeStrain.perceivedExertion > 8) {
      multiplier *= 1.4;
      reason += ', high perceived exertion';
    }

    return {
      adjustedRestTime: Math.round(baseRestTime * multiplier),
      reason,
      multiplier
    };
  }

  /**
   * Calculate comprehensive adaptive training load adjustments
   * @param userId - ID of the user
   * @param recentSessions - Recent training sessions (last 7-14 days)
   * @param recoveryData - Recovery metrics for the same period
   * @param performanceMetrics - Performance indicators
   */
  async calculateAdaptiveLoadAdjustments(
    userId: string,
    recentSessions: TrainingSession[],
    recoveryData: RecoveryData[],
    performanceMetrics: PerformanceMetrics
  ): Promise<AdaptiveLoadAdjustment> {
    const adjustments: AdaptiveLoadAdjustment = {
      loadMultiplier: 1.0,
      volumeMultiplier: 1.0,
      intensityMultiplier: 1.0,
      restMultiplier: 1.0,
      reasoning: [],
      riskLevel: 'low',
      recommendations: []
    };

    // Analyze recovery status
    const recoveryStatus = await this.assessRecoveryStatus(recoveryData);
    const avgRecovery = recoveryData.length > 0 
      ? recoveryData.reduce((sum, r) => sum + r.recoveryScore, 0) / recoveryData.length 
      : 50;

    // Analyze recent performance
    const recentPerformance = this.analyzeRecentPerformance(recentSessions);
    
    // HRV-based adjustments
    if (recoveryData.length > 0) {
      const latestRecovery = recoveryData[recoveryData.length - 1];
      
      if (latestRecovery.hrvScore < 30) {
        adjustments.loadMultiplier *= 0.7;
        adjustments.volumeMultiplier *= 0.8;
        adjustments.restMultiplier *= 1.4;
        adjustments.reasoning.push('Severely low HRV detected - significant load reduction');
        adjustments.riskLevel = 'high';
        adjustments.recommendations.push('Consider rest day or light recovery session');
      } else if (latestRecovery.hrvScore < 50) {
        adjustments.loadMultiplier *= 0.85;
        adjustments.volumeMultiplier *= 0.9;
        adjustments.restMultiplier *= 1.2;
        adjustments.reasoning.push('Low HRV detected - moderate load reduction');
        adjustments.riskLevel = 'moderate';
      }

      // Resting heart rate adjustments
      if (latestRecovery.restingHeartRate > 80) {
        adjustments.intensityMultiplier *= 0.9;
        adjustments.reasoning.push('Elevated RHR - reduced training intensity');
        adjustments.recommendations.push('Focus on technique and form');
      }

      // Sleep performance adjustments
      if (latestRecovery.sleepPerformance < 50) {
        adjustments.loadMultiplier *= 0.9;
        adjustments.volumeMultiplier *= 0.85;
        adjustments.reasoning.push('Poor sleep detected - conservative training approach');
        adjustments.recommendations.push('Prioritize sleep hygiene for better recovery');
      }
    }

    // Performance-based adjustments
    if (recentPerformance.completionRate < 0.7) {
      adjustments.loadMultiplier *= 0.9;
      adjustments.volumeMultiplier *= 0.9;
      adjustments.reasoning.push('Low completion rate - reducing training volume');
      adjustments.recommendations.push('Focus on quality over quantity');
    } else if (recentPerformance.completionRate > 0.95 && avgRecovery > 70) {
      adjustments.loadMultiplier *= 1.05;
      adjustments.volumeMultiplier *= 1.1;
      adjustments.reasoning.push('High completion rate with good recovery - progressive overload');
    }

    // Strain accumulation adjustments
    const recentStrain = recoveryData.slice(-3).reduce((sum, r) => sum + (r.strainYesterday || 0), 0) / 3;
    if (recentStrain > 18) {
      adjustments.loadMultiplier *= 0.8;
      adjustments.volumeMultiplier *= 0.85;
      adjustments.reasoning.push('High accumulated strain - deload recommended');
      adjustments.riskLevel = 'high';
      adjustments.recommendations.push('Schedule deload week within next 1-2 weeks');
    } else if (recentStrain > 12) {
      adjustments.loadMultiplier *= 0.95;
      adjustments.reasoning.push('Moderate strain accumulation - monitor closely');
      adjustments.riskLevel = 'moderate';
    }

    // Acute:Chronic workload ratio adjustments
    const acuteLoad = this.calculateAcuteLoad(recentSessions);
    const chronicLoad = this.calculateChronicLoad(recentSessions);
    const acwr = chronicLoad > 0 ? acuteLoad / chronicLoad : 1;

    if (acwr > 1.5) {
      adjustments.loadMultiplier *= 0.85;
      adjustments.volumeMultiplier *= 0.9;
      adjustments.reasoning.push(`High ACWR (${acwr.toFixed(2)}) - risk of overtraining`);
      adjustments.riskLevel = 'high';
      adjustments.recommendations.push('Reduce training load to improve ACWR ratio');
    } else if (acwr < 0.8) {
      adjustments.loadMultiplier *= 1.1;
      adjustments.volumeMultiplier *= 1.05;
      adjustments.reasoning.push(`Low ACWR (${acwr.toFixed(2)}) - can increase training load`);
    }

    // Fatigue level adjustments
    if (recoveryStatus.fatigueLevel === 'very_high') {
      adjustments.loadMultiplier *= 0.6;
      adjustments.volumeMultiplier *= 0.7;
      adjustments.intensityMultiplier *= 0.8;
      adjustments.reasoning.push('Very high fatigue - significant training reduction');
      adjustments.riskLevel = 'high';
      adjustments.recommendations.push('Immediate rest or very light activity only');
    } else if (recoveryStatus.fatigueLevel === 'high') {
      adjustments.loadMultiplier *= 0.8;
      adjustments.volumeMultiplier *= 0.85;
      adjustments.reasoning.push('High fatigue - moderate training reduction');
      adjustments.riskLevel = 'moderate';
    }

    // Ensure multipliers stay within reasonable bounds
    adjustments.loadMultiplier = Math.max(0.5, Math.min(1.3, adjustments.loadMultiplier));
    adjustments.volumeMultiplier = Math.max(0.5, Math.min(1.3, adjustments.volumeMultiplier));
    adjustments.intensityMultiplier = Math.max(0.7, Math.min(1.2, adjustments.intensityMultiplier));
    adjustments.restMultiplier = Math.max(0.8, Math.min(2.0, adjustments.restMultiplier));

    return adjustments;
  }

  async generateSafetyOverride(dangerSignals: SafetySignal[]): Promise<SafetyOverride> {
    let shouldStop = false;
    let shouldReduceIntensity = false;
    let restPeriodMultiplier = 1.0;
    const warnings: string[] = [];

    for (const signal of dangerSignals) {
      if (signal.severity === 'high') {
        shouldStop = true;
        warnings.push(`STOP: ${signal.type} - value ${signal.value} exceeds threshold ${signal.threshold}`);
      } else if (signal.severity === 'moderate') {
        shouldReduceIntensity = true;
        restPeriodMultiplier = Math.max(restPeriodMultiplier, 1.3);
        warnings.push(`Reduce intensity: ${signal.type} warning`);
      } else {
        restPeriodMultiplier = Math.max(restPeriodMultiplier, 1.1);
        warnings.push(`Monitor: ${signal.type} elevated`);
      }
    }

    return {
      shouldStop,
      shouldReduceIntensity,
      restPeriodMultiplier,
      warnings
    };
  }

  // Private helper methods
  private calculateTrend(values: number[]): number {
    if (values.length < 2) return 0;
    
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    
    const firstAvg = this.calculateAverage(firstHalf);
    const secondAvg = this.calculateAverage(secondHalf);
    
    return ((secondAvg - firstAvg) / firstAvg) * 100;
  }

  private calculateAverage(values: number[]): number {
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  private calculateCompletionRate(session: TrainingSession): number {
    if (!session.targetReps || !session.actualReps) return 1;
    return Math.min(session.actualReps / session.targetReps, 1);
  }

  private analyzeRecentPerformance(sessions: TrainingSession[]): PerformanceMetrics {
    if (sessions.length === 0) {
      return {
        completionRate: 1.0,
        averageRPE: 5,
        volumeTrend: 0,
        strengthGains: 0
      };
    }

    const completionRates = sessions.map(s => this.calculateCompletionRate(s));
    const completionRate = this.calculateAverage(completionRates);
    
    // Calculate average RPE (assuming perceivedEffort maps to RPE)
    const rpeValues = sessions.map(s => s.perceivedEffort || 5);
    const averageRPE = this.calculateAverage(rpeValues);
    
    // Calculate volume trend (simplified)
    const volumes = sessions.map(s => (s.actualParams?.reps || 0) * (s.actualParams?.sets || 0));
    const volumeTrend = volumes.length > 1 ? this.calculateTrend(volumes) : 0;
    
    // Calculate strength gains (simplified - based on completion rate improvement)
    const strengthGains = completionRate > 0.9 ? 0.05 : 0; // 5% gain if consistently completing

    return {
      completionRate,
      averageRPE,
      volumeTrend,
      strengthGains
    };
  }

  private calculateAcuteLoad(sessions: TrainingSession[]): number {
    // Calculate acute load (last 7 days)
    const recentSessions = sessions.slice(-7);
    return recentSessions.reduce((total, session) => {
      const volume = (session.actualParams?.load || 0) * 
                    (session.actualParams?.reps || 0) * 
                    (session.actualParams?.sets || 0);
      return total + volume;
    }, 0);
  }

  private calculateChronicLoad(sessions: TrainingSession[]): number {
    // Calculate chronic load (last 28 days, averaged)
    const chronicSessions = sessions.slice(-28);
    const totalLoad = chronicSessions.reduce((total, session) => {
      const volume = (session.actualParams?.load || 0) * 
                    (session.actualParams?.reps || 0) * 
                    (session.actualParams?.sets || 0);
      return total + volume;
    }, 0);
    
    return chronicSessions.length > 0 ? totalLoad / chronicSessions.length : 0;
  }

  private analyzeProgressTrend(userProgress: UserProgressData): ProgressTrend {
    return {
      strengthImprovement: userProgress.strengthImprovement,
      consistencyScore: userProgress.consistencyScore,
      adaptationRate: userProgress.adaptationRate,
      needsAdjustment: userProgress.strengthImprovement < -0.05 || userProgress.consistencyScore < 70
    };
  }

  private analyzeRecoveryTrend(recoveryData: RecoveryData[]): RecoveryTrendAnalysis {
    if (recoveryData.length === 0) {
      return {
        averageRecovery: 50,
        trend: 'stable',
        fatigueLevel: 'moderate',
        needsAdjustment: false
      };
    }

    const averageRecovery = recoveryData.reduce((sum, r) => sum + r.recoveryScore, 0) / recoveryData.length;
    const trend = this.calculateTrend(recoveryData.map(r => r.recoveryScore));
    
    let fatigueLevel: 'low' | 'moderate' | 'high' = 'moderate';
    if (averageRecovery < 40) fatigueLevel = 'high';
    else if (averageRecovery > 70) fatigueLevel = 'low';

    return {
      averageRecovery,
      trend: trend > 10 ? 'improving' : trend < -10 ? 'declining' : 'stable',
      fatigueLevel,
      needsAdjustment: averageRecovery < 50 || Math.abs(trend) > 15
    };
  }

  private analyzePerformanceTrend(performanceHistory: PerformanceData[]): PerformanceTrendAnalysis {
    if (performanceHistory.length === 0) {
      return {
        completionRate: 1.0,
        averageRPE: 5,
        volumeTrend: 0,
        needsAdjustment: false
      };
    }

    const completionRates = performanceHistory.map(p => p.completionRate);
    const completionRate = this.calculateAverage(completionRates);
    
    const rpeValues = performanceHistory.map(p => p.perceivedEffort);
    const averageRPE = this.calculateAverage(rpeValues);
    
    const volumeTrend = this.calculateTrend(
      performanceHistory.map(p => (p.session.actualParams?.reps || 0) * (p.session.actualParams?.sets || 0))
    );

    return {
      completionRate,
      averageRPE,
      volumeTrend,
      needsAdjustment: completionRate < 0.8 || averageRPE > 8 || Math.abs(volumeTrend) > 20
    };
  }

  private evaluateAdjustmentNeed(
    progressTrend: ProgressTrend,
    recoveryTrend: RecoveryTrendAnalysis,
    performanceTrend: PerformanceTrendAnalysis
  ): boolean {
    return progressTrend.needsAdjustment || 
           recoveryTrend.needsAdjustment || 
           performanceTrend.needsAdjustment;
  }

  private generateExerciseSpecificAdjustments(
    performanceHistory: PerformanceData[],
    progressTrend: ProgressTrend
  ): ProgramModification[] {
    const adjustments: ProgramModification[] = [];
    
    // Group by exercise
    const exerciseGroups = performanceHistory.reduce((groups, perf) => {
      if (!groups[perf.exercise]) {
        groups[perf.exercise] = [];
      }
      groups[perf.exercise].push(perf);
      return groups;
    }, {} as Record<string, PerformanceData[]>);

    // Analyze each exercise
    for (const [exercise, performances] of Object.entries(exerciseGroups)) {
      const avgCompletion = this.calculateAverage(performances.map(p => p.completionRate));
      const avgRPE = this.calculateAverage(performances.map(p => p.perceivedEffort));
      
      if (avgCompletion > 0.95 && avgRPE < 7) {
        // Strong performance - can increase difficulty
        adjustments.push({
          type: 'exercise_specific',
          scope: exercise,
          adjustment: {
            action: 'increase_load',
            multiplier: 1.05,
            reasoning: `Strong performance in ${exercise} (${(avgCompletion * 100).toFixed(1)}% completion)`
          }
        });
      } else if (avgCompletion < 0.7) {
        // Struggling - reduce difficulty or add assistance
        adjustments.push({
          type: 'exercise_specific',
          scope: exercise,
          adjustment: {
            action: 'reduce_load',
            multiplier: 0.9,
            reasoning: `Difficulty in ${exercise} (${(avgCompletion * 100).toFixed(1)}% completion)`
          }
        });
      }
    }

    return adjustments;
  }

  /**
   * Automatically adjust training program based on user progress and recovery
   * @param currentProgram - Current training program
   * @param userProgress - User's progress data over time
   * @param recoveryData - Recent recovery metrics
   * @param performanceHistory - Historical performance data
   */
  async autoAdjustTrainingProgram(
    currentProgram: TrainingProgram,
    userProgress: UserProgressData,
    recoveryData: RecoveryData[],
    performanceHistory: PerformanceData[]
  ): Promise<ProgramAdjustmentResult> {
    const adjustments: ProgramAdjustmentResult = {
      programModifications: [],
      reasoning: [],
      riskAssessment: 'low',
      timeline: 'immediate',
      requiresSupervision: false
    };

    // Analyze progress trends
    const progressTrend = this.analyzeProgressTrend(userProgress);
    const recoveryTrend = this.analyzeRecoveryTrend(recoveryData);
    const performanceTrend = this.analyzePerformanceTrend(performanceHistory);

    // Determine if program needs adjustment
    const needsAdjustment = this.evaluateAdjustmentNeed(
      progressTrend, 
      recoveryTrend, 
      performanceTrend
    );

    if (!needsAdjustment) {
      adjustments.reasoning.push('Program performing optimally - no adjustments needed');
      return adjustments;
    }

    // Generate specific adjustments based on analysis
    const loadAdjustments = await this.calculateAdaptiveLoadAdjustments(
      userProgress.userId,
      performanceHistory.slice(-14).map(p => p.session),
      recoveryData,
      {
        completionRate: performanceTrend.completionRate,
        averageRPE: performanceTrend.averageRPE,
        volumeTrend: performanceTrend.volumeTrend,
        strengthGains: progressTrend.strengthImprovement
      }
    );

    // Apply load-based adjustments
    if (loadAdjustments.loadMultiplier !== 1.0) {
      adjustments.programModifications.push({
        type: 'load_adjustment',
        scope: 'all_exercises',
        adjustment: {
          multiplier: loadAdjustments.loadMultiplier,
          reasoning: loadAdjustments.reasoning.join('; ')
        }
      });
    }

    if (loadAdjustments.volumeMultiplier !== 1.0) {
      adjustments.programModifications.push({
        type: 'volume_adjustment',
        scope: 'all_exercises',
        adjustment: {
          multiplier: loadAdjustments.volumeMultiplier,
          reasoning: 'Volume adjusted based on recovery and performance'
        }
      });
    }

    // Progress-based adjustments
    if (progressTrend.strengthImprovement > 0.1) {
      // Significant strength gains - can increase load
      adjustments.programModifications.push({
        type: 'progression_acceleration',
        scope: 'strength_exercises',
        adjustment: {
          multiplier: 1.05,
          reasoning: `Strength improvement of ${(progressTrend.strengthImprovement * 100).toFixed(1)}% detected`
        }
      });
      adjustments.reasoning.push('Accelerating progression due to strong performance gains');
    } else if (progressTrend.strengthImprovement < -0.05) {
      // Declining performance - reduce load or add deload
      adjustments.programModifications.push({
        type: 'deload_insertion',
        scope: 'program_wide',
        adjustment: {
          duration: 1,
          reasoning: 'Performance decline detected - inserting deload week'
        }
      });
      adjustments.reasoning.push('Deload recommended due to performance stagnation');
      adjustments.riskAssessment = 'moderate';
    }

    // Recovery-based adjustments
    if (recoveryTrend.averageRecovery < 40) {
      adjustments.programModifications.push({
        type: 'recovery_focus',
        scope: 'program_wide',
        adjustment: {
          frequency: 'reduce',
          reasoning: `Poor recovery (avg: ${recoveryTrend.averageRecovery.toFixed(1)}%)`
        }
      });
      adjustments.reasoning.push('Reducing training frequency due to poor recovery');
      adjustments.riskAssessment = 'high';
      adjustments.requiresSupervision = true;
    }

    // Fatigue management
    if (recoveryTrend.fatigueLevel === 'high') {
      adjustments.programModifications.push({
        type: 'fatigue_management',
        scope: 'high_intensity_sessions',
        adjustment: {
          replacement: 'reduced_intensity',
          reasoning: 'High fatigue detected - reducing session intensity'
        }
      });
      adjustments.reasoning.push('Implementing fatigue management protocols');
    }

    // Exercise-specific adjustments based on performance
    const exerciseAdjustments = this.generateExerciseSpecificAdjustments(
      performanceHistory,
      progressTrend
    );

    adjustments.programModifications.push(...exerciseAdjustments);

    // Set timeline based on urgency
    if (adjustments.riskAssessment === 'high') {
      adjustments.timeline = 'immediate';
    } else if (adjustments.riskAssessment === 'moderate') {
      adjustments.timeline = 'next_week';
    } else {
      adjustments.timeline = 'next_cycle';
    }

    return adjustments;
  }
}

// Additional type definitions for the implementation
interface RIRModel {
  userId: string;
  exerciseId: string;
  modelVersion: number;
  accuracy: number;
  parameters: RIRModelParameters;
  lastUpdated: string;
  trainingAge: number;
  lastSessionRIR: number;
}

interface UserProfile {
  userId: string;
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
  trainingAge: number; // months
  preferences: {
    restPreference: 'minimal' | 'standard' | 'extended';
    intensityPreference: 'conservative' | 'moderate' | 'aggressive';
  };
}

export interface StrainMetrics {
  strain: number;
  heartRate: number;
  duration: number;
  currentStrain?: number;
  hrvDeviation?: number;
  perceivedExertion?: number;
}

export interface RestAdjustment {
  adjustedRestTime: number;
  reasoning: string;
  multiplier: number;
}

export interface PerformanceMetrics {
  completionRate: number;
  averageRPE: number;
  volumeTrend: number;
  strengthGains: number;
}

export interface AdaptiveLoadAdjustment {
  loadMultiplier: number;
  volumeMultiplier: number;
  intensityMultiplier: number;
  restMultiplier: number;
  reasoning: string[];
  riskLevel: 'low' | 'moderate' | 'high';
  recommendations: string[];
}

export interface UserProgressData {
  userId: string;
  strengthImprovement: number; // percentage improvement
  consistencyScore: number;
  adaptationRate: number;
  weakAreas: string[];
  strongAreas: string[];
}

export interface PerformanceData {
  session: TrainingSession;
  completionRate: number;
  perceivedEffort: number;
  date: string;
  exercise: string;
}

export interface ProgramAdjustmentResult {
  programModifications: ProgramModification[];
  reasoning: string[];
  riskAssessment: 'low' | 'moderate' | 'high';
  timeline: 'immediate' | 'next_week' | 'next_cycle';
  requiresSupervision: boolean;
}

export interface ProgramModification {
  type: 'load_adjustment' | 'volume_adjustment' | 'progression_acceleration' | 'deload_insertion' | 'recovery_focus' | 'fatigue_management' | 'exercise_specific';
  scope: 'program_wide' | 'all_exercises' | 'strength_exercises' | 'high_intensity_sessions' | string;
  adjustment: any; // Flexible to accommodate different adjustment types
}

interface PerformanceTrendAnalysis {
  completionRate: number;
  averageRPE: number;
  volumeTrend: number;
  needsAdjustment: boolean;
}

interface ProgressTrend {
  strengthImprovement: number;
  consistencyScore: number;
  adaptationRate: number;
  needsAdjustment: boolean;
}

interface RecoveryTrendAnalysis {
  averageRecovery: number;
  trend: 'improving' | 'stable' | 'declining';
  fatigueLevel: 'low' | 'moderate' | 'high';
  needsAdjustment: boolean;
}

interface RIRTrainingData {
  exercise: string;
  setNumber: number;
  actualRIR: number;
  weight: number;
  reps: number;
  perceivedEffort: number;
  timestamp: string;
  context?: {
    fatigueLevel: number;
    trainingAge: number;
    timeOfDay: number;
  };
}

interface ModelTrainingResult {
  success: boolean;
  accuracy: number;
  improvement: number;
  newVersion: number;
  parameters: RIRModelParameters;
}

interface RIRModelParameters {
  baselineRIR: number;
  fatigueRate: number;
  exerciseTypeModifier: Record<string, number>;
  muscleGroupModifier: Record<string, number>;
  timeOfDayModifier: Record<number, number>;
  confidenceThreshold: number;
}

interface RIRFeedback {
  userId: string;
  exercise: string;
  predictedRIR: number;
  actualRIR: number;
  setNumber: number;
  performanceRating: number;
  timestamp: string;
  context: {
    fatigueLevel: number;
    trainingAge: number;
    timeOfDay: number;
  };
}

interface FatigueNotification {
  id: string;
  type: 'warning' | 'info' | 'alert';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  actions: NotificationAction[];
  timestamp: string;
  expiresAt: string;
}

interface NotificationAction {
  label: string;
  action: string;
  value: number | null;
}

interface NotificationPreferences {
  highPriority: boolean;
  mediumPriority: boolean;
  lowPriority: boolean;
  warnings: boolean;
  info: boolean;
  fatigueAlerts: boolean;
  recoveryReminders: boolean;
}

interface FatigueAnalysis {
  fatigueScore: number;
  fatigueLevel: 'low' | 'moderate' | 'high';
  trend: 'improving' | 'stable' | 'worsening';
  strainAccumulation: number;
  recommendations: string[];
}

interface RIRModelMetrics {
  hasModel: boolean;
  accuracy: number;
  trainingDataPoints: number;
  lastUpdated: string | null;
  recentAccuracy?: number;
  recommendations: string[];
}
