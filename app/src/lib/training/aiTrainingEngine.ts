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
