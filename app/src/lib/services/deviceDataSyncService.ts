// File: deviceDataSyncService.ts

/**
 * Device Data Synchronization Service
 * Purpose: Unified API for syncing wearable device data
 */

import type { RecoveryData, TrainingSession } from '../types/sharedTypes';

export interface DeviceConnection {
  deviceId: string;
  deviceType: DeviceType;
  userId: string;
  accessToken: string;
  refreshToken?: string;
  tokenExpiry: Date;
  lastSync: Date;
  syncFrequency: number; // minutes
  isActive: boolean;
}

export type DeviceType = 'apple_watch' | 'whoop' | 'garmin' | 'fitbit' | 'samsung' | 'oura' | 'polar';

export interface DeviceData {
  deviceId: string;
  deviceType: DeviceType;
  userId: string;
  timestamp: Date;
  heartRate?: HeartRateData[];
  hrv?: HRVData[];
  sleep?: SleepData;
  activity?: ActivityData;
  recovery?: RecoveryData;
  rawData?: any;
}

export interface HeartRateData {
  timestamp: Date;
  bpm: number;
  zone?: 'fat_burn' | 'cardio' | 'peak';
}

export interface HRVData {
  timestamp: Date;
  hrv: number;
  rmssd?: number;
  sdnn?: number;
}

export interface SleepData {
  startTime: Date;
  endTime: Date;
  duration: number; // minutes
  stages: SleepStage[];
  quality: number; // 0-100
  efficiency: number; // percentage
}

export interface SleepStage {
  stage: 'awake' | 'light' | 'deep' | 'rem';
  duration: number; // minutes
  startTime: Date;
}

export interface ActivityData {
  date: Date;
  steps: number;
  distance: number; // km
  calories: number;
  activeMinutes: number;
  workouts?: WorkoutData[];
}

export interface WorkoutData {
  type: string;
  startTime: Date;
  endTime: Date;
  duration: number; // minutes
  calories: number;
  averageHR: number;
  maxHR: number;
  zones?: HeartRateZone[];
}

export interface HeartRateZone {
  zone: 'fat_burn' | 'cardio' | 'peak';
  duration: number; // minutes
  minHR: number;
  maxHR: number;
}

export interface SyncResult {
  success: boolean;
  deviceId: string;
  dataPoints: number;
  errors: string[];
  lastSync: Date;
  nextSync: Date;
}

export interface DeviceAPIConfig {
  baseUrl: string;
  authType: 'oauth2' | 'api_key' | 'bearer';
  rateLimit: {
    requests: number;
    period: number; // seconds
  };
  endpoints: {
    heartRate: string;
    hrv: string;
    sleep: string;
    activity: string;
    recovery: string;
  };
}

/**
 * Main Device Data Synchronization Service
 */
export class DeviceDataSyncService {
  private connections: Map<string, DeviceConnection> = new Map();
  private apiConfigs: Map<DeviceType, DeviceAPIConfig> = new Map();
  private syncQueue: DeviceConnection[] = [];
  private isProcessing = false;

  constructor() {
    this.initializeAPIConfigs();
  }

  /**
   * Initialize API configurations for all supported devices
   */
  private initializeAPIConfigs(): void {
    // Apple Health API
    this.apiConfigs.set('apple_watch', {
      baseUrl: 'https://api.apple.com/health',
      authType: 'oauth2',
      rateLimit: { requests: 100, period: 3600 },
      endpoints: {
        heartRate: '/v1/me/heart-rate',
        hrv: '/v1/me/hrv',
        sleep: '/v1/me/sleep',
        activity: '/v1/me/activity',
        recovery: '/v1/me/recovery'
      }
    });

    // WHOOP API
    this.apiConfigs.set('whoop', {
      baseUrl: 'https://api.whoop.com',
      authType: 'oauth2',
      rateLimit: { requests: 100, period: 3600 },
      endpoints: {
        heartRate: '/v1/heart-rate',
        hrv: '/v1/hrv',
        sleep: '/v1/sleep',
        activity: '/v1/activity',
        recovery: '/v1/recovery'
      }
    });

    // Garmin API
    this.apiConfigs.set('garmin', {
      baseUrl: 'https://apis.garmin.com',
      authType: 'oauth2',
      rateLimit: { requests: 100, period: 3600 },
      endpoints: {
        heartRate: '/wellness-api/rest/heartRate',
        hrv: '/wellness-api/rest/hrv',
        sleep: '/wellness-api/rest/sleep',
        activity: '/wellness-api/rest/activities',
        recovery: '/wellness-api/rest/recovery'
      }
    });

    // Fitbit API
    this.apiConfigs.set('fitbit', {
      baseUrl: 'https://api.fitbit.com',
      authType: 'oauth2',
      rateLimit: { requests: 100, period: 3600 },
      endpoints: {
        heartRate: '/1/user/-/activities/heart/date/today/1d.json',
        hrv: '/1/user/-/hrv/date/today/all.json',
        sleep: '/1.2/user/-/sleep/date/today.json',
        activity: '/1/user/-/activities/date/today.json',
        recovery: '/1/user/-/recovery/date/today.json'
      }
    });

    // Samsung Health API
    this.apiConfigs.set('samsung', {
      baseUrl: 'https://api.samsung.com/health',
      authType: 'oauth2',
      rateLimit: { requests: 50, period: 3600 },
      endpoints: {
        heartRate: '/v1/me/heart-rate',
        hrv: '/v1/me/hrv',
        sleep: '/v1/me/sleep',
        activity: '/v1/me/activity',
        recovery: '/v1/me/recovery'
      }
    });
  }

  /**
   * Register a new device connection
   */
  async registerDevice(connection: Omit<DeviceConnection, 'lastSync'>): Promise<boolean> {
    try {
      const fullConnection: DeviceConnection = {
        ...connection,
        lastSync: new Date(0) // Never synced
      };

      this.connections.set(connection.deviceId, fullConnection);
      this.scheduleSync(fullConnection);

      return true;
    } catch (error) {
      console.error('Failed to register device:', error);
      return false;
    }
  }

  /**
   * Sync data from a specific device
   */
  async syncDevice(deviceId: string): Promise<SyncResult> {
    const connection = this.connections.get(deviceId);
    if (!connection || !connection.isActive) {
      return {
        success: false,
        deviceId,
        dataPoints: 0,
        errors: ['Device not found or inactive'],
        lastSync: new Date(),
        nextSync: new Date()
      };
    }

    try {
      // Refresh token if needed
      await this.refreshTokenIfNeeded(connection);

      // Fetch data from device API
      const deviceData = await this.fetchDeviceData(connection);

      // Process and store the data
      const processedData = await this.processDeviceData(deviceData);

      // Update last sync time
      connection.lastSync = new Date();
      this.connections.set(deviceId, connection);

      return {
        success: true,
        deviceId,
        dataPoints: processedData.length,
        errors: [],
        lastSync: connection.lastSync,
        nextSync: new Date(connection.lastSync.getTime() + connection.syncFrequency * 60000)
      };
    } catch (error) {
      console.error(`Failed to sync device ${deviceId}:`, error);
      return {
        success: false,
        deviceId,
        dataPoints: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        lastSync: new Date(),
        nextSync: new Date(Date.now() + 5 * 60 * 1000) // Retry in 5 minutes
      };
    }
  }

  /**
   * Sync all active devices
   */
  async syncAllDevices(): Promise<SyncResult[]> {
    const activeConnections = Array.from(this.connections.values())
      .filter(conn => conn.isActive);

    const results: SyncResult[] = [];

    for (const connection of activeConnections) {
      const result = await this.syncDevice(connection.deviceId);
      results.push(result);

      // Small delay between syncs to respect rate limits
      await this.delay(1000);
    }

    return results;
  }

  /**
   * Fetch data from device-specific API
   */
  private async fetchDeviceData(connection: DeviceConnection): Promise<DeviceData> {
    const config = this.apiConfigs.get(connection.deviceType);
    if (!config) {
      throw new Error(`Unsupported device type: ${connection.deviceType}`);
    }

    const headers = await this.getAuthHeaders(connection, config);

    // Fetch different data types
    const [heartRate, hrv, sleep, activity, recovery] = await Promise.allSettled([
      this.fetchDataType(config, 'heartRate', headers, connection),
      this.fetchDataType(config, 'hrv', headers, connection),
      this.fetchDataType(config, 'sleep', headers, connection),
      this.fetchDataType(config, 'activity', headers, connection),
      this.fetchDataType(config, 'recovery', headers, connection)
    ]);

    return {
      deviceId: connection.deviceId,
      deviceType: connection.deviceType,
      userId: connection.userId,
      timestamp: new Date(),
      heartRate: heartRate.status === 'fulfilled' ? heartRate.value : undefined,
      hrv: hrv.status === 'fulfilled' ? hrv.value : undefined,
      sleep: sleep.status === 'fulfilled' ? sleep.value : undefined,
      activity: activity.status === 'fulfilled' ? activity.value : undefined,
      recovery: recovery.status === 'fulfilled' ? recovery.value : undefined
    };
  }

  /**
   * Fetch specific data type from device API
   */
  private async fetchDataType(
    config: DeviceAPIConfig,
    dataType: keyof DeviceAPIConfig['endpoints'],
    headers: Record<string, string>,
    connection: DeviceConnection
  ): Promise<any> {
    const endpoint = config.endpoints[dataType];
    const url = `${config.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      method: 'GET',
      headers,
      // Add date range parameters based on last sync
      // This would be customized per device API
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch ${dataType}: ${response.statusText}`);
    }

    const rawData = await response.json();

    // Transform raw data to our standardized format
    return this.transformDeviceData(rawData, dataType, connection.deviceType);
  }

  /**
   * Transform device-specific data to our standardized format
   */
  private transformDeviceData(rawData: any, dataType: string, deviceType: DeviceType): any {
    switch (dataType) {
      case 'heartRate':
        return this.transformHeartRateData(rawData, deviceType);
      case 'hrv':
        return this.transformHRVData(rawData, deviceType);
      case 'sleep':
        return this.transformSleepData(rawData, deviceType);
      case 'activity':
        return this.transformActivityData(rawData, deviceType);
      case 'recovery':
        return this.transformRecoveryData(rawData, deviceType);
      default:
        return rawData;
    }
  }

  /**
   * Transform heart rate data from device format to our format
   */
  private transformHeartRateData(rawData: any, deviceType: DeviceType): HeartRateData[] {
    // This would contain device-specific transformation logic
    // For example, different date formats, field names, etc.
    switch (deviceType) {
      case 'fitbit':
        return rawData['activities-heart-intraday']?.dataset?.map((point: any) => ({
          timestamp: new Date(point.time),
          bpm: point.value
        })) || [];

      case 'garmin':
        return rawData.map((point: any) => ({
          timestamp: new Date(point.timestamp),
          bpm: point.heartRate
        })) || [];

      default:
        // Generic transformation
        return rawData.map((point: any) => ({
          timestamp: new Date(point.timestamp || point.time),
          bpm: point.bpm || point.value || point.heartRate
        })) || [];
    }
  }

  /**
   * Transform HRV data from device format to our format
   */
  private transformHRVData(rawData: any, deviceType: DeviceType): HRVData[] {
    switch (deviceType) {
      case 'whoop':
        return rawData.map((point: any) => ({
          timestamp: new Date(point.timestamp),
          hrv: point.hrv,
          rmssd: point.rmssd
        })) || [];

      case 'oura':
        return rawData.map((point: any) => ({
          timestamp: new Date(point.timestamp),
          hrv: point.hrv,
          rmssd: point.rmssd
        })) || [];

      default:
        return rawData.map((point: any) => ({
          timestamp: new Date(point.timestamp),
          hrv: point.hrv || point.value
        })) || [];
    }
  }

  /**
   * Transform sleep data from device format to our format
   */
  private transformSleepData(rawData: any, deviceType: DeviceType): SleepData {
    switch (deviceType) {
      case 'fitbit':
        const fitbitSleep = rawData.sleep[0];
        return {
          startTime: new Date(fitbitSleep.startTime),
          endTime: new Date(fitbitSleep.endTime),
          duration: fitbitSleep.duration / 60000, // Convert to minutes
          stages: fitbitSleep.levels?.data?.map((stage: any) => ({
            stage: stage.level.toLowerCase(),
            duration: stage.seconds / 60,
            startTime: new Date(stage.dateTime)
          })) || [],
          quality: fitbitSleep.efficiency || 0,
          efficiency: fitbitSleep.efficiency || 0
        };

      case 'whoop':
        return {
          startTime: new Date(rawData.start),
          endTime: new Date(rawData.end),
          duration: rawData.duration,
          stages: rawData.stages?.map((stage: any) => ({
            stage: stage.type,
            duration: stage.duration,
            startTime: new Date(stage.start)
          })) || [],
          quality: rawData.quality || 0,
          efficiency: rawData.efficiency || 0
        };

      default:
        return {
          startTime: new Date(rawData.startTime),
          endTime: new Date(rawData.endTime),
          duration: rawData.duration,
          stages: rawData.stages || [],
          quality: rawData.quality || 0,
          efficiency: rawData.efficiency || 0
        };
    }
  }

  /**
   * Transform activity data from device format to our format
   */
  private transformActivityData(rawData: any, deviceType: DeviceType): ActivityData {
    switch (deviceType) {
      case 'fitbit':
        return {
          date: new Date(rawData.activities[0]?.date || new Date()),
          steps: rawData.activities[0]?.steps || 0,
          distance: rawData.activities[0]?.distance || 0,
          calories: rawData.activities[0]?.calories || 0,
          activeMinutes: rawData.activities[0]?.activeMinutes || 0
        };

      case 'garmin':
        return {
          date: new Date(rawData.date),
          steps: rawData.steps || 0,
          distance: rawData.distance || 0,
          calories: rawData.calories || 0,
          activeMinutes: rawData.activeMinutes || 0
        };

      default:
        return {
          date: new Date(),
          steps: rawData.steps || 0,
          distance: rawData.distance || 0,
          calories: rawData.calories || 0,
          activeMinutes: rawData.activeMinutes || 0
        };
    }
  }

  /**
   * Transform recovery data from device format to our format
   */
  private transformRecoveryData(rawData: any, deviceType: DeviceType): RecoveryData {
    switch (deviceType) {
      case 'whoop':
        return {
          userId: '', // Would be set from connection
          date: new Date().toISOString().split('T')[0],
          recoveryScore: rawData.recovery || 0,
          hrvScore: rawData.hrv || 0,
          restingHeartRate: rawData.rhr || 0,
          sleepPerformance: rawData.sleepPerformance || 0,
          strainYesterday: rawData.strain || 0,
          baselineDeviation: rawData.baselineDeviation || 0,
          trend: rawData.trend || 'stable'
        };

      case 'oura':
        return {
          userId: '',
          date: new Date().toISOString().split('T')[0],
          recoveryScore: rawData.readiness || 0,
          hrvScore: rawData.hrv || 0,
          restingHeartRate: rawData.rhr || 0,
          sleepPerformance: rawData.sleepScore || 0,
          strainYesterday: rawData.activityStrain || 0,
          baselineDeviation: 0,
          trend: 'stable'
        };

      default:
        return {
          userId: '',
          date: new Date().toISOString().split('T')[0],
          recoveryScore: rawData.recoveryScore || 0,
          hrvScore: rawData.hrv || 0,
          restingHeartRate: rawData.rhr || 0,
          sleepPerformance: rawData.sleepPerformance || 0,
          strainYesterday: rawData.strain || 0,
          baselineDeviation: 0,
          trend: 'stable'
        };
    }
  }

  /**
   * Process and store device data
   */
  private async processDeviceData(deviceData: DeviceData): Promise<any[]> {
    // This would process and store the data in the database
    // For now, just return the processed data points
    const dataPoints: any[] = [];

    if (deviceData.heartRate) dataPoints.push(...deviceData.heartRate);
    if (deviceData.hrv) dataPoints.push(...deviceData.hrv);
    if (deviceData.sleep) dataPoints.push(deviceData.sleep);
    if (deviceData.activity) dataPoints.push(deviceData.activity);
    if (deviceData.recovery) dataPoints.push(deviceData.recovery);

    return dataPoints;
  }

  /**
   * Get authentication headers for device API
   */
  private async getAuthHeaders(connection: DeviceConnection, config: DeviceAPIConfig): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    switch (config.authType) {
      case 'oauth2':
        headers['Authorization'] = `Bearer ${connection.accessToken}`;
        break;
      case 'bearer':
        headers['Authorization'] = `Bearer ${connection.accessToken}`;
        break;
      case 'api_key':
        headers['X-API-Key'] = connection.accessToken;
        break;
    }

    return headers;
  }

  /**
   * Refresh OAuth token if needed
   */
  private async refreshTokenIfNeeded(connection: DeviceConnection): Promise<void> {
    if (connection.tokenExpiry > new Date()) {
      return; // Token still valid
    }

    if (!connection.refreshToken) {
      throw new Error('No refresh token available');
    }

    // This would make a request to refresh the token
    // Implementation depends on the specific OAuth provider
    console.log(`Refreshing token for device ${connection.deviceId}`);
  }

  /**
   * Schedule sync for a device
   */
  private scheduleSync(connection: DeviceConnection): void {
    // In a real implementation, this would use a job scheduler
    // For now, just add to queue
    this.syncQueue.push(connection);
  }

  /**
   * Small delay utility
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get device connection by ID
   */
  getDeviceConnection(deviceId: string): DeviceConnection | undefined {
    return this.connections.get(deviceId);
  }

  /**
   * Get all active device connections for a user
   */
  getUserDevices(userId: string): DeviceConnection[] {
    return Array.from(this.connections.values())
      .filter(conn => conn.userId === userId && conn.isActive);
  }

  /**
   * Remove a device connection
   */
  async removeDevice(deviceId: string): Promise<boolean> {
    const connection = this.connections.get(deviceId);
    if (!connection) {
      return false;
    }

    // Deactivate the connection
    connection.isActive = false;
    this.connections.set(deviceId, connection);

    // In a real implementation, you might want to revoke tokens
    return true;
  }
}