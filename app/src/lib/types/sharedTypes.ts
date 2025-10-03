import type { ProgressionScheme, AdaptationRecord, Exercise, VolumeMetrics } from '../../../../sharedTypes.js';

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

// Consolidated RecoveryData interface
export interface RecoveryData {
  userId?: string; // Optional for device data
  date: string;
  recoveryScore: number; // 0-100
  hrv: number; // Heart Rate Variability
  restingHR: number; // Resting Heart Rate
  sleepQuality: number; // Sleep quality score (1-5)
  hrvScore?: number; // Alias for Heart Rate Variability
  restingHeartRate?: number; // Alias for Resting Heart Rate
  sleepPerformance?: number; // Alias for Sleep Performance
  strainYesterday: number; // Strain score from the previous day
  baselineDeviation: number; // Deviation from baseline metrics
  trend: 'improving' | 'declining' | 'stable'; // Recovery trend
}

export interface TrainingSession {
  id: string;
  userId: string;
  date: string;
  strain: number; // Training strain score
  exercises: string[]; // List of exercises in the session
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

export interface NotificationPreferences {
  allowHighPriority: boolean;
  allowMediumPriority: boolean;
  allowLowPriority: boolean;
  highPriority: boolean;
  mediumPriority: boolean;
  lowPriority: boolean;
  warnings: boolean;
  info: boolean;
  fatigueAlerts: boolean;
  recoveryReminders: boolean;
}

export interface FatigueNotification {
  id: string;
  type: 'info' | 'warning' | 'error';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  actions: Array<{ label: string; action: string; value: unknown }>;
  timestamp: string;
  expiresAt: string;
}

// Alice Orb Customization Types
export interface OrbPreferences {
  _id?: string;
  userId: string;
  baseColor: {
    h: number; // Hue (0-360)
    s: number; // Saturation (0-100)
    l: number; // Lightness (0-100)
  };
  enableStrainAdjustment: boolean;
  strainAdjustmentAmount: number; // Percentage (0-100)
  customName?: string;
  lastUpdated: number;
}

// Strain Data Types
export interface StrainData {
  _id?: string;
  userId: string;
  currentStrain: number; // 0-150+ scale
  optimalRange: {
    min: number; // Usually around 90
    max: number; // Usually around 100
  };
  workoutActive: boolean;
  exerciseName?: string;
  setNumber?: number;
  lastUpdated: number;
}

// Watch Interface Types
export interface WatchInterfaceState {
  _id?: string;
  userId: string;
  isConnected: boolean;
  deviceName: string;
  currentExercise?: {
    name: string;
    reps: number;
    weight: number;
    targetReps: number;
    targetWeight: number;
    setNumber: number;
    totalSets: number;
  };
  workoutState: 'idle' | 'active' | 'resting' | 'completed';
  restTimer?: {
    duration: number; // seconds
    remaining: number; // seconds
    active: boolean;
  };
  lastSync: number;
}

// Audio Device Types
export interface AudioDeviceInfo {
  _id?: string;
  userId: string;
  deviceId: string;
  deviceName: string;
  deviceType: 'headphones' | 'earbuds' | 'speaker' | 'watch' | 'phone';
  isConnected: boolean;
  isPreferred: boolean;
  batteryLevel?: number; // 0-100
  lastConnected: number;
}

// Watch Sync Types
export interface WatchSyncData {
  _id?: string;
  userId: string;
  pendingChanges: Array<{
    id: string;
    type: 'exercise_param' | 'set_complete' | 'workout_start' | 'workout_end';
    data: Record<string, unknown>;
    timestamp: number;
    synced: boolean;
  }>;
  lastSyncTimestamp: number;
  offlineChangesCount: number;
  syncStatus: 'online' | 'offline' | 'syncing' | 'error';
  maxOfflineChanges: number; // Default 50
}
