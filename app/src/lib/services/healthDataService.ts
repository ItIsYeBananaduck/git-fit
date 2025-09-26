import { HealthData, HealthDataType, HealthDataPermissions } from '@felix-health/capacitor-health-data';
import { Capacitor } from '@capacitor/core';
import { writable, get } from 'svelte/store';

// Health data types we need for Monday workout analysis
export interface HealthMetrics {
  heartRate?: {
    avgHR: number;
    maxHR: number;
    variance: number;
  };
  spo2?: {
    avgSpO2: number;
    drift: number;
  };
  sleepScore?: number; // 0-20 range normalized
  collectedAt: string;
}

export interface HealthDataPoint {
  value: number;
  date: Date;
  source?: string;
}

// Store for current health metrics
export const currentHealthMetrics = writable<HealthMetrics | null>(null);

// Store for health permission status
export const healthPermissions = writable({
  granted: false,
  requested: false,
  available: false,
});

class HealthDataService {
  private readonly REQUIRED_PERMISSIONS: HealthDataPermissions = {
    read: [
      HealthDataType.HeartRate,
      HealthDataType.OxygenSaturation,
      HealthDataType.SleepData,
      HealthDataType.ActiveEnergyBurned,
      HealthDataType.Steps,
    ],
    write: [], // We only need to read data for now
  };

  private isNative = false;

  constructor() {
    this.isNative = Capacitor.isNativePlatform();
    this.checkAvailability();
  }

  /**
   * Check if health data is available on this platform
   */
  async checkAvailability(): Promise<boolean> {
    if (!this.isNative) {
      console.log('Health data not available on web platform');
      healthPermissions.update(state => ({ ...state, available: false }));
      return false;
    }

    try {
      const available = await HealthData.isAvailable();
      healthPermissions.update(state => ({ ...state, available: available.result }));
      return available.result;
    } catch (error) {
      console.error('Failed to check health data availability:', error);
      healthPermissions.update(state => ({ ...state, available: false }));
      return false;
    }
  }

  /**
   * Request health data permissions
   */
  async requestPermissions(): Promise<boolean> {
    if (!this.isNative) {
      console.log('Health permissions not needed on web platform');
      return false;
    }

    const currentState = get(healthPermissions);
    if (!currentState.available) {
      console.log('Health data not available, cannot request permissions');
      return false;
    }

    try {
      healthPermissions.update(state => ({ ...state, requested: true }));

      const result = await HealthData.requestPermissions({
        permissions: this.REQUIRED_PERMISSIONS,
      });

      const granted = result.granted;
      healthPermissions.update(state => ({ 
        ...state, 
        granted,
        requested: true,
      }));

      if (granted) {
        console.log('Health data permissions granted');
      } else {
        console.log('Health data permissions denied');
      }

      return granted;
    } catch (error) {
      console.error('Failed to request health permissions:', error);
      healthPermissions.update(state => ({ 
        ...state, 
        granted: false,
        requested: true,
      }));
      return false;
    }
  }

  /**
   * Collect health metrics for a specific time range
   */
  async collectHealthMetrics(
    startDate: Date, 
    endDate: Date = new Date()
  ): Promise<HealthMetrics | null> {
    const currentState = get(healthPermissions);
    if (!currentState.granted) {
      console.log('Health permissions not granted, cannot collect data');
      return null;
    }

    try {
      // Collect heart rate data
      const heartRateData = await this.getHeartRateMetrics(startDate, endDate);
      
      // Collect SpO2 data
      const spo2Data = await this.getSpO2Metrics(startDate, endDate);
      
      // Collect sleep data
      const sleepData = await this.getSleepMetrics(startDate, endDate);

      const metrics: HealthMetrics = {
        heartRate: heartRateData,
        spo2: spo2Data,
        sleepScore: sleepData,
        collectedAt: new Date().toISOString(),
      };

      // Update store
      currentHealthMetrics.set(metrics);

      return metrics;
    } catch (error) {
      console.error('Failed to collect health metrics:', error);
      return null;
    }
  }

  /**
   * Get heart rate metrics with variance calculation
   */
  private async getHeartRateMetrics(
    startDate: Date,
    endDate: Date
  ): Promise<HealthMetrics['heartRate'] | undefined> {
    try {
      const heartRateData = await HealthData.queryData({
        dataType: HealthDataType.HeartRate,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        limit: 1000, // Get enough data points for variance calculation
      });

      if (!heartRateData.data || heartRateData.data.length === 0) {
        console.log('No heart rate data available for the specified period');
        return undefined;
      }

      const hrValues = heartRateData.data.map(d => d.value);
      const avgHR = hrValues.reduce((sum, val) => sum + val, 0) / hrValues.length;
      const maxHR = Math.max(...hrValues);
      
      // Calculate heart rate variance for intensity analysis
      const variance = this.calculateVariance(hrValues, avgHR);

      return {
        avgHR: Math.round(avgHR),
        maxHR: Math.round(maxHR),
        variance: Math.round(variance),
      };
    } catch (error) {
      console.error('Failed to get heart rate metrics:', error);
      return undefined;
    }
  }

  /**
   * Get SpO2 metrics with drift calculation
   */
  private async getSpO2Metrics(
    startDate: Date,
    endDate: Date
  ): Promise<HealthMetrics['spo2'] | undefined> {
    try {
      const spo2Data = await HealthData.queryData({
        dataType: HealthDataType.OxygenSaturation,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        limit: 1000,
      });

      if (!spo2Data.data || spo2Data.data.length === 0) {
        console.log('No SpO2 data available for the specified period');
        return undefined;
      }

      const spo2Values = spo2Data.data.map(d => d.value);
      const avgSpO2 = spo2Values.reduce((sum, val) => sum + val, 0) / spo2Values.length;
      
      // Calculate SpO2 drift (instability) for intensity analysis
      const drift = this.calculateSpO2Drift(spo2Values);

      return {
        avgSpO2: Math.round(avgSpO2 * 100) / 100, // Keep 2 decimal places
        drift: Math.round(drift * 100) / 100,
      };
    } catch (error) {
      console.error('Failed to get SpO2 metrics:', error);
      return undefined;
    }
  }

  /**
   * Get sleep metrics normalized to 0-20 range
   */
  private async getSleepMetrics(
    startDate: Date,
    endDate: Date
  ): Promise<number | undefined> {
    try {
      const sleepData = await HealthData.queryData({
        dataType: HealthDataType.SleepData,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        limit: 50,
      });

      if (!sleepData.data || sleepData.data.length === 0) {
        console.log('No sleep data available for the specified period');
        return undefined;
      }

      // Calculate total sleep duration in hours
      const totalSleepMinutes = sleepData.data.reduce((sum, sleep) => {
        return sum + (sleep.value || 0);
      }, 0);
      const totalSleepHours = totalSleepMinutes / 60;

      // Normalize to 0-20 range (0 = 0 hours, 20 = 10+ hours)
      // Ideal sleep is around 8 hours = 16 points
      const normalizedScore = Math.min(20, Math.max(0, (totalSleepHours / 10) * 20));

      return Math.round(normalizedScore);
    } catch (error) {
      console.error('Failed to get sleep metrics:', error);
      return undefined;
    }
  }

  /**
   * Calculate variance for heart rate analysis
   */
  private calculateVariance(values: number[], mean: number): number {
    if (values.length < 2) return 0;
    
    const squaredDiffs = values.map(value => Math.pow(value - mean, 2));
    const variance = squaredDiffs.reduce((sum, diff) => sum + diff, 0) / values.length;
    
    return Math.sqrt(variance); // Return standard deviation
  }

  /**
   * Calculate SpO2 drift (instability measure)
   */
  private calculateSpO2Drift(values: number[]): number {
    if (values.length < 2) return 0;

    let totalDrift = 0;
    for (let i = 1; i < values.length; i++) {
      totalDrift += Math.abs(values[i] - values[i - 1]);
    }

    return totalDrift / (values.length - 1);
  }

  /**
   * Collect health data for last workout session (for Monday processing)
   */
  async collectLastWorkoutMetrics(workoutDurationMinutes: number = 60): Promise<HealthMetrics | null> {
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - (workoutDurationMinutes * 60 * 1000));
    
    return this.collectHealthMetrics(startTime, endTime);
  }

  /**
   * Get daily health summary (for sleep data primarily)
   */
  async getDailyHealthSummary(date: Date = new Date()): Promise<HealthMetrics | null> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return this.collectHealthMetrics(startOfDay, endOfDay);
  }

  /**
   * Check if health data collection is possible
   */
  canCollectHealthData(): boolean {
    const state = get(healthPermissions);
    return state.available && state.granted;
  }

  /**
   * Get mock health data for development/testing
   */
  getMockHealthData(): HealthMetrics {
    return {
      heartRate: {
        avgHR: 75 + Math.round(Math.random() * 20), // 75-95 BPM
        maxHR: 140 + Math.round(Math.random() * 40), // 140-180 BPM
        variance: Math.round(Math.random() * 20), // 0-20 variance
      },
      spo2: {
        avgSpO2: 96 + Math.random() * 3, // 96-99%
        drift: Math.random() * 5, // 0-5% drift
      },
      sleepScore: 8 + Math.round(Math.random() * 8), // 8-16 (4-8 hours normalized)
      collectedAt: new Date().toISOString(),
    };
  }
}

// Create singleton instance
export const healthDataService = new HealthDataService();

// Helper function to integrate with Monday workout system
export async function collectHealthDataForWorkout(
  workoutDurationMinutes: number = 60
): Promise<HealthMetrics | null> {
  if (healthDataService.canCollectHealthData()) {
    return await healthDataService.collectLastWorkoutMetrics(workoutDurationMinutes);
  } else {
    // Return mock data for development
    console.log('Using mock health data for development');
    return healthDataService.getMockHealthData();
  }
}

// Helper function to get today's sleep data
export async function getTodaysSleepData(): Promise<number | null> {
  try {
    const todayMetrics = await healthDataService.getDailyHealthSummary();
    return todayMetrics?.sleepScore || null;
  } catch (error) {
    console.error('Failed to get today\'s sleep data:', error);
    return null;
  }
}