export interface TrackerCapabilities {
  hasHeartRate: boolean;
  hasHRV: boolean;
  hasRecovery: boolean;
  hasStrain: boolean;
  hasSleep: boolean;
  hasSteps: boolean;
  hasCalories: boolean;
  hasWorkoutDetection: boolean;
  realTimeData: boolean;
  strainTracking: boolean;
  recoveryScoring: boolean;
}

export interface FitnessTracker {
  id: string;
  name: string;
  type: TrackerType;
  capabilities: TrackerCapabilities;
  isConnected: boolean;
  lastSync?: Date;
}

export type TrackerType = 
  | 'whoop' 
  | 'fitbit' 
  | 'garmin' 
  | 'apple_watch' 
  | 'polar' 
  | 'oura' 
  | 'samsung_health' 
  | 'google_fit';

export interface TrackerData {
  recovery?: number; // 0-100 scale
  strain?: number; // 0-21 scale (WHOOP style) or converted
  hrv?: number; // milliseconds
  heartRate?: number; // current BPM
  restingHeartRate?: number; // daily RHR
  sleep?: {
    duration: number; // hours
    quality: number; // 0-100 scale
    efficiency: number; // 0-100 scale
  };
  steps?: number;
  calories?: number;
  timestamp: Date;
}

export interface SafetySettings {
  enableHardStop: boolean; // true = stop workout, false = warning only
  hardStopOnlyDuringDeload: boolean; // only allow hard stop during deload weeks
  strainWarningThreshold: number; // 0-1 scale (0.9 = 90% of target)
  recoveryMinimum: number; // minimum recovery to train (0-100)
  autoDeloadTrigger: boolean; // automatically suggest deload weeks
  injuryRiskTolerance: 'conservative' | 'moderate' | 'aggressive';
}

export const TRACKER_DEFINITIONS: Record<TrackerType, Omit<FitnessTracker, 'id' | 'isConnected' | 'lastSync'>> = {
  whoop: {
    name: 'WHOOP',
    type: 'whoop',
    capabilities: {
      hasHeartRate: true,
      hasHRV: true,
      hasRecovery: true,
      hasStrain: true,
      hasSleep: true,
      hasSteps: false,
      hasCalories: true,
      hasWorkoutDetection: true,
      realTimeData: true,
      strainTracking: true,
      recoveryScoring: true
    }
  },
  fitbit: {
    name: 'Fitbit',
    type: 'fitbit',
    capabilities: {
      hasHeartRate: true,
      hasHRV: true,
      hasRecovery: false,
      hasStrain: false,
      hasSleep: true,
      hasSteps: true,
      hasCalories: true,
      hasWorkoutDetection: true,
      realTimeData: false,
      strainTracking: false,
      recoveryScoring: false
    }
  },
  garmin: {
    name: 'Garmin',
    type: 'garmin',
    capabilities: {
      hasHeartRate: true,
      hasHRV: true,
      hasRecovery: true,
      hasStrain: false,
      hasSleep: true,
      hasSteps: true,
      hasCalories: true,
      hasWorkoutDetection: true,
      realTimeData: true,
      strainTracking: false,
      recoveryScoring: true
    }
  },
  apple_watch: {
    name: 'Apple Watch',
    type: 'apple_watch',
    capabilities: {
      hasHeartRate: true,
      hasHRV: true,
      hasRecovery: false,
      hasStrain: false,
      hasSleep: true,
      hasSteps: true,
      hasCalories: true,
      hasWorkoutDetection: true,
      realTimeData: true,
      strainTracking: false,
      recoveryScoring: false
    }
  },
  polar: {
    name: 'Polar',
    type: 'polar',
    capabilities: {
      hasHeartRate: true,
      hasHRV: true,
      hasRecovery: true,
      hasStrain: false,
      hasSleep: true,
      hasSteps: true,
      hasCalories: true,
      hasWorkoutDetection: true,
      realTimeData: true,
      strainTracking: false,
      recoveryScoring: true
    }
  },
  oura: {
    name: 'Oura Ring',
    type: 'oura',
    capabilities: {
      hasHeartRate: true,
      hasHRV: true,
      hasRecovery: true,
      hasStrain: false,
      hasSleep: true,
      hasSteps: true,
      hasCalories: true,
      hasWorkoutDetection: false,
      realTimeData: false,
      strainTracking: false,
      recoveryScoring: true
    }
  },
  samsung_health: {
    name: 'Samsung Health',
    type: 'samsung_health',
    capabilities: {
      hasHeartRate: true,
      hasHRV: false,
      hasRecovery: false,
      hasStrain: false,
      hasSleep: true,
      hasSteps: true,
      hasCalories: true,
      hasWorkoutDetection: true,
      realTimeData: false,
      strainTracking: false,
      recoveryScoring: false
    }
  },
  google_fit: {
    name: 'Google Fit',
    type: 'google_fit',
    capabilities: {
      hasHeartRate: true,
      hasHRV: false,
      hasRecovery: false,
      hasStrain: false,
      hasSleep: false,
      hasSteps: true,
      hasCalories: true,
      hasWorkoutDetection: true,
      realTimeData: false,
      strainTracking: false,
      recoveryScoring: false
    }
  }
};

export const DEFAULT_SAFETY_SETTINGS: SafetySettings = {
  enableHardStop: true,
  hardStopOnlyDuringDeload: true,
  strainWarningThreshold: 0.9,
  recoveryMinimum: 30,
  autoDeloadTrigger: true,
  injuryRiskTolerance: 'moderate'
};