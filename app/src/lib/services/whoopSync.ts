import { WHOOPClient, getWHOOPTokens, storeWHOOPTokens, isTokenExpired } from '$lib/api/whoop';
import { whoopActions } from '$lib/stores/whoop';
import type { WHOOPTokens } from '$lib/api/whoop';

export class WHOOPSyncService {
  private client: WHOOPClient;
  private userId: string;

  constructor(userId: string, clientId: string, clientSecret: string, redirectUri: string) {
    this.client = new WHOOPClient(clientId, clientSecret, redirectUri);
    this.userId = userId;
  }

  /**
   * Sync WHOOP data for the user
   */
  async syncUserData(): Promise<void> {
    try {
      whoopActions.setLoading(true);

      const tokens = getWHOOPTokens(this.userId);
      if (!tokens) {
        throw new Error('No WHOOP tokens found. Please reconnect your device.');
      }

      // Check if token needs refresh
      const storedTime = parseInt(localStorage.getItem(`whoop_token_time_${this.userId}`) || '0');
      let accessToken = tokens.access_token;

      if (isTokenExpired(tokens, storedTime)) {
        const newTokens = await this.client.refreshAccessToken(tokens.refresh_token);
        storeWHOOPTokens(this.userId, newTokens);
        localStorage.setItem(`whoop_token_time_${this.userId}`, Date.now().toString());
        accessToken = newTokens.access_token;
        whoopActions.updateTokens(newTokens);
      }

      // Get date range (last 30 days)
      const endDate = new Date().toISOString();
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

      // Sync recovery data
      const recoveryData = await this.client.getRecoveryData(accessToken, startDate, endDate);
      
      // Sync strain data
      const strainData = await this.client.getCycleData(accessToken, startDate, endDate);
      
      // Sync sleep data
      const sleepData = await this.client.getSleepData(accessToken, startDate, endDate);

      // Update stores
      whoopActions.updateData({
        recovery: recoveryData,
        strain: strainData,
        sleep: sleepData
      });

      // Store data points in Convex database
      await this.storeDataInDatabase(recoveryData, strainData, sleepData);

    } catch (error) {
      console.error('WHOOP sync failed:', error);
      whoopActions.setError(error instanceof Error ? error.message : 'Sync failed');
    }
  }

  /**
   * Store WHOOP data in the database
   */
  private async storeDataInDatabase(recovery: any[], strain: any[], sleep: any[]): Promise<void> {
    const dataPoints = [];

    // Process recovery data
    for (const item of recovery) {
      if (item.score_state === 'SCORED') {
        dataPoints.push({
          dataType: 'recovery' as const,
          value: item.score.recovery_score,
          unit: 'percentage',
          timestamp: item.created_at,
          rawData: JSON.stringify(item)
        });

        dataPoints.push({
          dataType: 'hrv' as const,
          value: item.score.hrv_rmssd_milli,
          unit: 'ms',
          timestamp: item.created_at,
          rawData: JSON.stringify(item)
        });

        dataPoints.push({
          dataType: 'heartRate' as const,
          value: item.score.resting_heart_rate,
          unit: 'bpm',
          timestamp: item.created_at,
          rawData: JSON.stringify(item)
        });
      }
    }

    // Process strain data
    for (const item of strain) {
      if (item.score_state === 'SCORED') {
        dataPoints.push({
          dataType: 'strain' as const,
          value: item.score.strain,
          unit: 'score',
          timestamp: item.created_at,
          rawData: JSON.stringify(item)
        });

        if (item.score.kilojoule > 0) {
          // Convert kilojoules to calories (1 kJ = 0.239 cal)
          dataPoints.push({
            dataType: 'calories' as const,
            value: Math.round(item.score.kilojoule * 0.239),
            unit: 'kcal',
            timestamp: item.created_at,
            rawData: JSON.stringify(item)
          });
        }
      }
    }

    // Process sleep data
    for (const item of sleep) {
      if (item.score_state === 'SCORED') {
        const sleepHours = item.score.stage_summary.total_in_bed_time_milli / (1000 * 60 * 60);
        dataPoints.push({
          dataType: 'sleep' as const,
          value: sleepHours,
          unit: 'hours',
          timestamp: item.created_at,
          rawData: JSON.stringify(item)
        });
      }
    }

    // Store in database via your Convex API
    if (dataPoints.length > 0) {
      try {
        // This would call your Convex mutation
        console.log(`Storing ${dataPoints.length} WHOOP data points`, dataPoints);
        // await api.mutations.whoop.storeWHOOPData({ userId: this.userId, dataPoints });
      } catch (error) {
        console.error('Failed to store WHOOP data in database:', error);
      }
    }
  }

  /**
   * Set up automatic syncing
   */
  setupAutoSync(intervalMinutes: number = 60): void {
    // Sync immediately
    this.syncUserData();

    // Set up periodic sync
    const interval = setInterval(() => {
      this.syncUserData();
    }, intervalMinutes * 60 * 1000);

    // Store interval ID for cleanup
    localStorage.setItem(`whoop_sync_interval_${this.userId}`, interval.toString());
  }

  /**
   * Stop automatic syncing
   */
  stopAutoSync(): void {
    const intervalId = localStorage.getItem(`whoop_sync_interval_${this.userId}`);
    if (intervalId) {
      clearInterval(parseInt(intervalId));
      localStorage.removeItem(`whoop_sync_interval_${this.userId}`);
    }
  }
}