// TODO: Implement proper health data service for intensity scoring feature (T029)
// This is a placeholder implementation to maintain build compatibility

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
  sleepScore?: number;
  collectedAt: string;
}

export interface HealthDataPoint {
  value: number;
  date: Date;
  source?: string;
}

/**
 * Placeholder health data service - will be properly implemented in T029
 */
class HealthDataService {
  async initialize(): Promise<boolean> {
    console.log('TODO: Implement health data service in T029');
    return true;
  }

  async requestPermissions(): Promise<boolean> {
    console.log('TODO: Implement permissions in T029');
    return false;
  }

  async collectHealthMetrics(): Promise<HealthMetrics | null> {
    console.log('TODO: Implement health metrics collection in T029');
    return null;
  }

  canCollectHealthData(): boolean {
    return false;
  }

  getMockHealthData(): HealthMetrics {
    return {
      heartRate: {
        avgHR: 75,
        maxHR: 140,
        variance: 10,
      },
      spo2: {
        avgSpO2: 98.0,
        drift: 1.0,
      },
      sleepScore: 12,
      collectedAt: new Date().toISOString(),
    };
  }
}

export const healthDataService = new HealthDataService();

export async function collectHealthDataForWorkout(): Promise<HealthMetrics | null> {
  return healthDataService.getMockHealthData();
}

export async function getTodaysSleepData(): Promise<number | null> {
  return 8;
}