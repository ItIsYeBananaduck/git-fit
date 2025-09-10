import type { ProgressionScheme, AdaptationRecord, Exercise, VolumeMetrics } from '../../../../sharedTypes';

// Shared types for the AI Training Engine and related modules

export interface TrainingProgram {
  id: string;
  userId: string;
  programType: 'ppl' | 'full_body' | 'upper_lower' | 'bro_split';
  currentWeek: number;
  totalWeeks: number;
  deloadWeeks: number[];
  workouts: Workout[];
  progressionScheme: ProgressionScheme;
  adaptationHistory: AdaptationRecord[];
  createdAt: string;
  lastModified: string;
}

export interface Workout {
  id: string;
  name: string;
  dayOfWeek: number;
  exercises: Exercise[];
  estimatedDuration: number;
  targetMuscleGroups: string[];
  intensity: 'light' | 'moderate' | 'high';
  volume: VolumeMetrics;
}

export interface RecoveryData {
  userId: string;
  date: string;
  recoveryScore: number; // 0-100
  hrvScore: number;
  restingHeartRate: number;
  sleepPerformance: number;
  strainYesterday: number;
  baselineDeviation: number;
  trend: 'improving' | 'stable' | 'declining';
}

export interface TrainingSession {
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

export interface TrainingParameters {
  load: number; // percentage of 1RM or RPE scale
  reps: number;
  sets: number;
  restBetweenSets: number; // seconds
  restBetweenExercises: number; // seconds
  intensity: 'light' | 'moderate' | 'high' | 'max';
  isDeloadWeek?: boolean; // indicates if this is deload week parameters
}

export interface TrainingSplit {
  name: string;
  daysPerWeek: number;
  focusAreas: string[];
}
