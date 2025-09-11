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

    // Use model parameters to predict RIR
    const baseRIR = model.parameters.baselineRIR;
    const fatigueRate = model.parameters.fatigueRate;
    const setFatigue = setNumber * fatigueRate;
    
    const predictedRIR = Math.max(baseRIR - setFatigue, 0);
    const confidence = Math.min(model.accuracy + 0.1, 1.0);

    return {
      predictedRIR: Math.round(predictedRIR),
      confidence
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
    if (realtimeStrain.currentStrain > 15) {
      multiplier *= 1.3;
      reason = 'High strain detected - extended rest';
    } else if (realtimeStrain.currentStrain < 8) {
      multiplier *= 0.8;
      reason = 'Low strain - reduced rest period';
    }

    // Adjust based on HRV deviation
    if (realtimeStrain.hrvDeviation > 20) {
      multiplier *= 1.2;
      reason += ', HRV elevated';
    }

    // Adjust based on perceived exertion
    if (realtimeStrain.perceivedExertion > 8) {
      multiplier *= 1.4;
      reason += ', high perceived exertion';
    }

    return {
      adjustedRestTime: Math.round(baseRestTime * multiplier),
      reason,
      multiplier
    };
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
}

// Additional type definitions for the implementation
interface RIRModel {
  userId: string;
  exerciseId: string;
  modelVersion: string;
  accuracy: number;
  parameters: {
    baselineRIR: number;
    fatigueRate: number;
    strainSensitivity: number;
    experienceModifier: number;
  };
  lastUpdated: string;
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
}

export interface RestAdjustment {
  adjustedRestTime: number;
  reasoning: string;
}

export interface SafetySignal {
  type: string;
  severity: string;
  message: string;
}

export interface SafetyOverride {
  shouldStop: boolean;
  alerts: string[];
}
