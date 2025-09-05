import { OuraAPI } from '$lib/api/oura';
import type { OuraSleepData, OuraReadinessData, OuraActivityData } from '$lib/api/oura';
import type { TrackerData } from '$lib/types/fitnessTrackers';
import { ouraState, ouraData, ouraActions } from '$lib/stores/oura';
import { get } from 'svelte/store';

/**
 * Service for fetching and converting Oura data to the standardized TrackerData format
 */
export class OuraDataService {
  private ouraAPI: OuraAPI | null = null;

  constructor() {
    this.initializeAPI();
    
    // Listen to state changes to reinitialize API
    ouraState.subscribe(state => {
      if (state.accessToken && !this.ouraAPI) {
        this.ouraAPI = new OuraAPI(state.accessToken);
      } else if (!state.accessToken) {
        this.ouraAPI = null;
      }
    });
  }

  private initializeAPI() {
    const state = get(ouraState);
    if (state.accessToken) {
      this.ouraAPI = new OuraAPI(state.accessToken);
    }
  }

  /**
   * Check if Oura is connected and ready
   */
  isConnected(): boolean {
    const state = get(ouraState);
    return state.isConnected && this.ouraAPI !== null;
  }

  /**
   * Fetch latest data from Oura and convert to TrackerData format
   */
  async fetchLatestData(): Promise<TrackerData | null> {
    if (!this.isConnected() || !this.ouraAPI) {
      return null;
    }

    try {
      ouraActions.setLoading(true);
      
      const summary = await this.ouraAPI.getLatestSummary();
      
      // Update the store with raw data
      ouraActions.updateData({
        sleep: summary.sleep ? [summary.sleep] : [],
        readiness: summary.readiness ? [summary.readiness] : [],
        activity: summary.activity ? [summary.activity] : [],
        averageHRV: summary.averageHRV
      });

      // Convert to standardized format
      const trackerData = this.convertToTrackerData(
        summary.sleep,
        summary.readiness,
        summary.activity,
        summary.averageHRV
      );

      ouraActions.setLoading(false);
      return trackerData;
      
    } catch (error) {
      console.error('Error fetching Oura data:', error);
      ouraActions.setError('Failed to fetch data from Oura Ring');
      return null;
    }
  }

  /**
   * Fetch historical data for a date range
   */
  async fetchHistoricalData(startDate: string, endDate: string): Promise<TrackerData[]> {
    if (!this.isConnected() || !this.ouraAPI) {
      return [];
    }

    try {
      ouraActions.setLoading(true);
      
      const [sleepData, readinessData, activityData] = await Promise.all([
        this.ouraAPI.getSleep(startDate, endDate),
        this.ouraAPI.getReadiness(startDate, endDate),
        this.ouraAPI.getActivity(startDate, endDate)
      ]);

      // Calculate average HRV for the period
      const recentSleepWithHRV = sleepData.filter(s => s.average_hrv > 0);
      const averageHRV = recentSleepWithHRV.length > 0 
        ? recentSleepWithHRV.reduce((sum, s) => sum + s.average_hrv, 0) / recentSleepWithHRV.length
        : null;

      // Update store
      ouraActions.updateData({
        sleep: sleepData,
        readiness: readinessData,
        activity: activityData,
        averageHRV
      });

      // Convert each day's data to TrackerData format
      const trackerDataArray: TrackerData[] = [];
      const dateSet = new Set([
        ...sleepData.map(s => s.day),
        ...readinessData.map(r => r.day),
        ...activityData.map(a => a.day)
      ]);

      for (const date of dateSet) {
        const sleepForDate = sleepData.find(s => s.day === date);
        const readinessForDate = readinessData.find(r => r.day === date);
        const activityForDate = activityData.find(a => a.day === date);

        const trackerData = this.convertToTrackerData(
          sleepForDate || null,
          readinessForDate || null,
          activityForDate || null,
          sleepForDate?.average_hrv || null,
          date
        );

        if (trackerData) {
          trackerDataArray.push(trackerData);
        }
      }

      ouraActions.setLoading(false);
      return trackerDataArray.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      
    } catch (error) {
      console.error('Error fetching Oura historical data:', error);
      ouraActions.setError('Failed to fetch historical data from Oura Ring');
      return [];
    }
  }

  /**
   * Convert Oura API data to standardized TrackerData format
   */
  private convertToTrackerData(
    sleep: OuraSleepData | null,
    readiness: OuraReadinessData | null,
    activity: OuraActivityData | null,
    hrv: number | null,
    dateStr?: string
  ): TrackerData | null {
    // We need at least one data source
    if (!sleep && !readiness && !activity) {
      return null;
    }

    const timestamp = dateStr 
      ? new Date(dateStr + 'T12:00:00Z') // Noon UTC for daily data
      : new Date();

    const trackerData: TrackerData = {
      timestamp
    };

    // Recovery score from readiness
    if (readiness?.score !== null && readiness?.score !== undefined) {
      trackerData.recovery = readiness.score;
    }

    // HRV data (prioritize sleep average_hrv, fallback to provided hrv)
    if (sleep?.average_hrv) {
      trackerData.hrv = sleep.average_hrv;
    } else if (hrv) {
      trackerData.hrv = hrv;
    }

    // Heart rate from sleep data
    if (sleep?.average_heart_rate) {
      trackerData.heartRate = sleep.average_heart_rate;
    }
    
    if (sleep?.lowest_heart_rate) {
      trackerData.restingHeartRate = sleep.lowest_heart_rate;
    }

    // Sleep data conversion
    if (sleep) {
      const sleepDurationHours = sleep.total_sleep_duration ? sleep.total_sleep_duration / 3600 : 0;
      const sleepQuality = sleep.score || 0;
      const sleepEfficiency = sleep.sleep_efficiency || 0;

      trackerData.sleep = {
        duration: sleepDurationHours,
        quality: sleepQuality,
        efficiency: sleepEfficiency
      };
    }

    // Activity data
    if (activity) {
      if (activity.steps) {
        trackerData.steps = activity.steps;
      }
      
      if (activity.total_calories) {
        trackerData.calories = activity.total_calories;
      }
    }

    return trackerData;
  }

  /**
   * Get Oura-specific metrics for detailed analysis
   */
  getOuraSpecificMetrics(): {
    readinessContributors?: any;
    sleepStages?: any;
    activityContributors?: any;
  } | null {
    const data = get(ouraData);
    
    if (!data.readiness.length && !data.sleep.length && !data.activity.length) {
      return null;
    }

    const latest = {
      readinessContributors: data.readiness.length > 0 ? data.readiness[data.readiness.length - 1].contributors : undefined,
      sleepStages: data.sleep.length > 0 ? {
        deep: data.sleep[data.sleep.length - 1].deep_sleep_duration,
        light: data.sleep[data.sleep.length - 1].light_sleep_duration,
        rem: data.sleep[data.sleep.length - 1].rem_sleep_duration,
        awake: data.sleep[data.sleep.length - 1].awake_time
      } : undefined,
      activityContributors: data.activity.length > 0 ? data.activity[data.activity.length - 1].contributors : undefined
    };

    return latest;
  }

  /**
   * Refresh token if needed
   */
  async refreshTokenIfNeeded(): Promise<boolean> {
    const state = get(ouraState);
    
    if (!ouraActions.needsRefresh(state)) {
      return true;
    }

    if (!state.refreshToken) {
      ouraActions.setError('No refresh token available');
      return false;
    }

    try {
      // This would need to be implemented with proper token refresh logic
      // For now, we'll just flag that a refresh is needed
      console.warn('Oura token refresh needed - user should reconnect');
      ouraActions.setError('Connection expired - please reconnect your Oura Ring');
      return false;
    } catch (error) {
      console.error('Error refreshing Oura token:', error);
      ouraActions.setError('Failed to refresh connection');
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
        console.error(`Oura sync attempt ${i + 1} failed:`, error);
        if (i === retries - 1) {
          ouraActions.setError('Failed to sync data after multiple attempts');
        }
      }
    }

    return null;
  }
}

// Export singleton instance
export const ouraDataService = new OuraDataService();