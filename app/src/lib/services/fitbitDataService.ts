import { FitbitAPI } from '$lib/api/fitbit';
import type { 
  FitbitSleepData, 
  FitbitHeartRateData, 
  FitbitActivityData 
} from '$lib/api/fitbit';
import type { TrackerData } from '$lib/types/fitnessTrackers';
import { fitbitState, fitbitData, fitbitActions } from '$lib/stores/fitbit';
import { get } from 'svelte/store';

/**
 * Service for fetching and converting Fitbit data to the standardized TrackerData format
 */
export class FitbitDataService {
  private fitbitAPI: FitbitAPI | null = null;

  constructor() {
    this.initializeAPI();
    
    // Listen to state changes to reinitialize API
    fitbitState.subscribe(state => {
      if (state.accessToken && !this.fitbitAPI) {
        this.fitbitAPI = new FitbitAPI(state.accessToken);
      } else if (!state.accessToken) {
        this.fitbitAPI = null;
      }
    });
  }

  private initializeAPI() {
    const state = get(fitbitState);
    if (state.accessToken) {
      this.fitbitAPI = new FitbitAPI(state.accessToken);
    }
  }

  /**
   * Check if Fitbit is connected and ready
   */
  isConnected(): boolean {
    const state = get(fitbitState);
    return state.isConnected && this.fitbitAPI !== null;
  }

  /**
   * Fetch latest data from Fitbit and convert to TrackerData format
   */
  async fetchLatestData(): Promise<TrackerData | null> {
    if (!this.isConnected() || !this.fitbitAPI) {
      return null;
    }

    try {
      fitbitActions.setLoading(true);
      
      const summary = await this.fitbitAPI.getLatestSummary();
      
      // Update the store with raw data
      fitbitActions.updateData({
        sleep: summary.sleep ? [summary.sleep] : [],
        heartRate: summary.heartRate ? [summary.heartRate] : [],
        activity: summary.activity,
        restingHeartRate: summary.restingHeartRate,
        hrv: summary.hrv
      });

      // Convert to standardized format
      const trackerData = this.convertToTrackerData(
        summary.sleep,
        summary.heartRate,
        summary.activity,
        summary.restingHeartRate,
        summary.hrv
      );

      fitbitActions.setLoading(false);
      return trackerData;
      
    } catch (error) {
      console.error('Error fetching Fitbit data:', error);
      fitbitActions.setError('Failed to fetch data from Fitbit');
      return null;
    }
  }

  /**
   * Fetch historical data for a date range
   */
  async fetchHistoricalData(startDate: string, endDate: string): Promise<TrackerData[]> {
    if (!this.isConnected() || !this.fitbitAPI) {
      return [];
    }

    try {
      fitbitActions.setLoading(true);
      
      const [sleepData, heartRateData] = await Promise.all([
        this.fitbitAPI.getSleepRange(startDate, endDate),
        this.fitbitAPI.getHeartRateRange(startDate, endDate)
      ]);

      // Get activity data for each day in range
      const dateList = this.generateDateRange(startDate, endDate);
      const activityPromises = dateList.map(date => 
        this.fitbitAPI!.getActivity(date).catch(() => null)
      );
      const activityData = await Promise.all(activityPromises);

      // Update store
      fitbitActions.updateData({
        sleep: sleepData.sleep || [],
        heartRate: heartRateData['activities-heart'] || [],
        activity: activityData.find(a => a !== null) || null
      });

      // Convert each day's data to TrackerData format
      const trackerDataArray: TrackerData[] = [];
      
      for (let i = 0; i < dateList.length; i++) {
        const date = dateList[i];
        
        // Find data for this specific date
        const sleepForDate = sleepData.sleep?.find(s => s.dateOfSleep === date);
        const heartRateForDate = heartRateData['activities-heart']?.find(hr => hr.dateTime === date);
        const activityForDate = activityData[i];

        const trackerData = this.convertToTrackerData(
          sleepForDate || null,
          heartRateForDate || null,
          activityForDate,
          heartRateForDate?.value?.restingHeartRate || null,
          null, // HRV would need separate API call
          date
        );

        if (trackerData) {
          trackerDataArray.push(trackerData);
        }
      }

      fitbitActions.setLoading(false);
      return trackerDataArray.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      
    } catch (error) {
      console.error('Error fetching Fitbit historical data:', error);
      fitbitActions.setError('Failed to fetch historical data from Fitbit');
      return [];
    }
  }

  /**
   * Convert Fitbit API data to standardized TrackerData format
   */
  private convertToTrackerData(
    sleep: FitbitSleepData['sleep'][0] | null,
    heartRate: FitbitHeartRateData['activities-heart'][0] | null,
    activity: FitbitActivityData | null,
    restingHeartRate: number | null,
    hrv: number | null,
    dateStr?: string
  ): TrackerData | null {
    // We need at least one data source
    if (!sleep && !heartRate && !activity) {
      return null;
    }

    const timestamp = dateStr 
      ? new Date(dateStr + 'T12:00:00Z') // Noon UTC for daily data
      : new Date();

    const trackerData: TrackerData = {
      timestamp
    };

    // HRV data (if available)
    if (hrv !== null) {
      trackerData.hrv = hrv;
    }

    // Heart rate data
    if (heartRate?.value?.restingHeartRate || restingHeartRate) {
      trackerData.restingHeartRate = heartRate?.value?.restingHeartRate || restingHeartRate || undefined;
    }

    // Sleep data conversion
    if (sleep) {
      const sleepDurationHours = sleep.minutesAsleep / 60;
      const sleepQuality = this.calculateSleepQuality(sleep);
      const sleepEfficiency = sleep.efficiency;

      trackerData.sleep = {
        duration: sleepDurationHours,
        quality: sleepQuality,
        efficiency: sleepEfficiency
      };
    }

    // Activity data
    if (activity) {
      if (activity.summary.steps) {
        trackerData.steps = activity.summary.steps;
      }
      
      if (activity.summary.caloriesOut) {
        trackerData.calories = activity.summary.caloriesOut;
      }
    }

    return trackerData;
  }

  /**
   * Calculate sleep quality score from Fitbit sleep data (0-100 scale)
   */
  private calculateSleepQuality(sleep: FitbitSleepData['sleep'][0]): number {
    // Base score on sleep efficiency
    let qualityScore = sleep.efficiency;

    // Adjust based on sleep stages if available
    if (sleep.levels?.summary) {
      const stages = sleep.levels.summary;
      const totalMinutes = sleep.minutesAsleep;
      
      // Ideal sleep stage percentages
      const deepPercentage = (stages.deep.minutes / totalMinutes) * 100;
      const remPercentage = (stages.rem.minutes / totalMinutes) * 100;
      
      // Good deep sleep is 15-20% of total sleep
      if (deepPercentage >= 15 && deepPercentage <= 25) {
        qualityScore += 5;
      } else if (deepPercentage < 10) {
        qualityScore -= 10;
      }
      
      // Good REM sleep is 20-25% of total sleep
      if (remPercentage >= 20 && remPercentage <= 30) {
        qualityScore += 5;
      } else if (remPercentage < 15) {
        qualityScore -= 10;
      }
    }

    // Adjust for time to fall asleep
    if (sleep.minutesToFallAsleep > 30) {
      qualityScore -= 5;
    } else if (sleep.minutesToFallAsleep <= 10) {
      qualityScore += 5;
    }

    // Ensure score is within 0-100 range
    return Math.max(0, Math.min(100, qualityScore));
  }

  /**
   * Generate array of date strings between start and end dates
   */
  private generateDateRange(startDate: string, endDate: string): string[] {
    const dates: string[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      dates.push(d.toISOString().split('T')[0]);
    }
    
    return dates;
  }

  /**
   * Get Fitbit-specific metrics for detailed analysis
   */
  getFitbitSpecificMetrics(): {
    heartRateZones?: any;
    sleepStages?: any;
    activeMinutes?: any;
  } | null {
    const data = get(fitbitData);
    
    if (!data.heartRate.length && !data.sleep.length && !data.activity) {
      return null;
    }

    const latest = {
      heartRateZones: data.heartRate.length > 0 ? data.heartRate[data.heartRate.length - 1].value.heartRateZones : undefined,
      sleepStages: data.sleep.length > 0 && data.sleep[data.sleep.length - 1].levels ? {
        deep: data.sleep[data.sleep.length - 1].levels!.summary.deep.minutes,
        light: data.sleep[data.sleep.length - 1].levels!.summary.light.minutes,
        rem: data.sleep[data.sleep.length - 1].levels!.summary.rem.minutes,
        wake: data.sleep[data.sleep.length - 1].levels!.summary.wake.minutes
      } : undefined,
      activeMinutes: data.activity ? {
        veryActive: data.activity.summary.veryActiveMinutes,
        fairlyActive: data.activity.summary.fairlyActiveMinutes,
        lightlyActive: data.activity.summary.lightlyActiveMinutes
      } : undefined
    };

    return latest;
  }

  /**
   * Refresh token if needed
   */
  async refreshTokenIfNeeded(): Promise<boolean> {
    const state = get(fitbitState);
    
    if (!fitbitActions.needsRefresh(state)) {
      return true;
    }

    if (!state.refreshToken) {
      fitbitActions.setError('No refresh token available');
      return false;
    }

    try {
      // This would need to be implemented with proper token refresh logic
      // For now, we'll just flag that a refresh is needed
      console.warn('Fitbit token refresh needed - user should reconnect');
      fitbitActions.setError('Connection expired - please reconnect your Fitbit');
      return false;
    } catch (error) {
      console.error('Error refreshing Fitbit token:', error);
      fitbitActions.setError('Failed to refresh connection');
      return false;
    }
  }

  /**
   * Sync data with error handling and retry logic
   */
  async syncWithRetry(retries: number = 3): Promise<TrackerData | null> {
    for (let i = 0; i < retries; i++) {
      try {
        // Check if token needs refresh first
        const refreshed = await this.refreshTokenIfNeeded();
        if (!refreshed) {
          break;
        }

        const data = await this.fetchLatestData();
        if (data) {
          return data;
        }
      } catch (error) {
        console.error(`Fitbit sync attempt ${i + 1} failed:`, error);
        if (i === retries - 1) {
          fitbitActions.setError('Failed to sync data after multiple attempts');
        }
        
        // Handle rate limiting
        if (error instanceof Error && error.message.includes('Rate limit')) {
          fitbitActions.setError('Rate limit exceeded. Please wait before syncing again.');
          break;
        }
      }
    }

    return null;
  }
}

// Export singleton instance
export const fitbitDataService = new FitbitDataService();