// File: deviceDataCollector.ts

/**
 * Device Data Collector
 * Purpose: Integrate and process data from multiple wearable devices
 */

import type { RecoveryData } from '../types/sharedTypes';

export interface DeviceDataCollector {
  /**
   * Connect to a wearable device
   * @param deviceType - Type of the device (e.g., whoop, apple_watch, garmin, fitbit)
   */
  connectDevice(deviceType: 'whoop' | 'apple_watch' | 'garmin' | 'fitbit'): Promise<DeviceConnection>;

  /**
   * Collect real-time data from a connected device
   * @param deviceId - ID of the connected device
   */
  collectRealtimeData(deviceId: string): Promise<RealtimeMetrics>;

  /**
   * Retrieve recovery metrics for a user over a date range
   * @param userId - ID of the user
   * @param dateRange - Date range for the recovery metrics
   */
  getRecoveryMetrics(userId: string, dateRange: DateRange): Promise<RecoveryData[]>;

  /**
   * Retrieve strain data for a specific workout
   * @param userId - ID of the user
   * @param workoutId - ID of the workout
   */
  getStrainData(userId: string, workoutId: string): Promise<StrainMetrics>;

  /**
   * Retrieve sleep data for a specific date
   * @param userId - ID of the user
   * @param date - Date for the sleep data
   */
  getSleepData(userId: string, date: string): Promise<SleepMetrics>;

  /**
   * Retrieve HRV baseline for a user
   * @param userId - ID of the user
   */
  getHRVBaseline(userId: string): Promise<HRVBaseline>;

  /**
   * Validate the quality of device data
   * @param data - Device data to validate
   */
  validateDataQuality(data: DeviceData): DataQualityScore;

  /**
   * Handle device disconnection
   * @param deviceId - ID of the disconnected device
   */
  handleDeviceDisconnection(deviceId: string): Promise<void>;
}

// Define the types used in the interface
export interface DeviceConnection {
  deviceId: string;
  deviceType: string;
  status: 'connected' | 'disconnected';
}

export interface RealtimeMetrics {
  heartRate: number;
  steps: number;
  calories: number;
  timestamp: string;
}

export interface DateRange {
  startDate: string;
  endDate: string;
}

export interface StrainMetrics {
  workoutId: string;
  strain: number;
  duration: number;
}

export interface SleepMetrics {
  date: string;
  duration: number;
  quality: string;
}

export interface HRVBaseline {
  averageHRV: number;
  trend: 'improving' | 'stable' | 'declining';
}

export interface DeviceData {
  deviceId: string;
  metrics: {
    heartRate?: number;
    hrv?: number;
    strain?: number;
    recovery?: number;
    sleepScore?: number;
    restingHeartRate?: number;
    calories?: number;
    steps?: number;
  };
  timestamp: string;
}

export type DataQualityScore = 'high' | 'medium' | 'low';
