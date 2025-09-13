// File: deviceConnectionManager.ts

/**
 * Device Connection Manager
 * Purpose: Manages device connections, auto-reconnect, and connection health monitoring
 */

import type { DeviceConnection, DeviceType, SyncResult } from './deviceDataSyncService';

export interface ConnectionHealth {
  deviceId: string;
  isHealthy: boolean;
  lastSuccessfulSync: Date;
  consecutiveFailures: number;
  averageResponseTime: number;
  lastError?: string;
}

export interface ConnectionAttempt {
  deviceId: string;
  timestamp: Date;
  success: boolean;
  error?: string;
  responseTime: number;
}

export interface ReconnectConfig {
  maxRetries: number;
  retryDelay: number; // milliseconds
  backoffMultiplier: number;
  maxBackoffDelay: number; // milliseconds
  healthCheckInterval: number; // milliseconds
}

export class DeviceConnectionManager {
  private connections: Map<string, DeviceConnection> = new Map();
  private healthStatus: Map<string, ConnectionHealth> = new Map();
  private reconnectAttempts: Map<string, ConnectionAttempt[]> = new Map();
  private healthCheckTimers: Map<string, NodeJS.Timeout> = new Map();

  private readonly defaultReconnectConfig: ReconnectConfig = {
    maxRetries: 5,
    retryDelay: 30000, // 30 seconds
    backoffMultiplier: 2,
    maxBackoffDelay: 300000, // 5 minutes
    healthCheckInterval: 300000 // 5 minutes
  };

  constructor(
    private syncService: any, // Would be DeviceDataSyncService
    private reconnectConfig: Partial<ReconnectConfig> = {}
  ) {
    this.reconnectConfig = { ...this.defaultReconnectConfig, ...reconnectConfig };
  }

  /**
   * Register a new device connection
   */
  async registerConnection(connection: DeviceConnection): Promise<boolean> {
    try {
      this.connections.set(connection.deviceId, connection);

      // Initialize health status
      this.healthStatus.set(connection.deviceId, {
        deviceId: connection.deviceId,
        isHealthy: true,
        lastSuccessfulSync: connection.lastSync,
        consecutiveFailures: 0,
        averageResponseTime: 0
      });

      // Start health monitoring
      this.startHealthMonitoring(connection.deviceId);

      return true;
    } catch (error) {
      console.error('Failed to register connection:', error);
      return false;
    }
  }

  /**
   * Handle sync result and update connection health
   */
  async handleSyncResult(result: SyncResult): Promise<void> {
    const health = this.healthStatus.get(result.deviceId);
    if (!health) return;

    const attempt: ConnectionAttempt = {
      deviceId: result.deviceId,
      timestamp: new Date(),
      success: result.success,
      error: result.errors.length > 0 ? result.errors[0] : undefined,
      responseTime: 0 // Would be measured in actual implementation
    };

    // Update reconnect attempts history
    const attempts = this.reconnectAttempts.get(result.deviceId) || [];
    attempts.push(attempt);

    // Keep only last 10 attempts
    if (attempts.length > 10) {
      attempts.shift();
    }
    this.reconnectAttempts.set(result.deviceId, attempts);

    if (result.success) {
      // Successful sync
      health.isHealthy = true;
      health.lastSuccessfulSync = result.lastSync;
      health.consecutiveFailures = 0;
      health.lastError = undefined;

      // Update average response time
      health.averageResponseTime = this.calculateAverageResponseTime(result.deviceId);
    } else {
      // Failed sync
      health.consecutiveFailures++;
      health.lastError = result.errors[0];

      // Check if we should attempt reconnection
      if (health.consecutiveFailures >= 3) {
        health.isHealthy = false;
        await this.attemptReconnection(result.deviceId);
      }
    }

    this.healthStatus.set(result.deviceId, health);
  }

  /**
   * Attempt to reconnect a failed device
   */
  private async attemptReconnection(deviceId: string): Promise<void> {
    const connection = this.connections.get(deviceId);
    if (!connection) return;

    const health = this.healthStatus.get(deviceId);
    if (!health) return;

    const attempts = this.reconnectAttempts.get(deviceId) || [];
    const recentAttempts = attempts.filter(
      attempt => attempt.timestamp > new Date(Date.now() - 3600000) // Last hour
    );

    if (recentAttempts.length >= this.reconnectConfig.maxRetries!) {
      console.log(`Max reconnection attempts reached for device ${deviceId}`);
      return;
    }

    // Calculate delay with exponential backoff
    const delay = Math.min(
      this.reconnectConfig.retryDelay! * Math.pow(this.reconnectConfig.backoffMultiplier!, recentAttempts.length),
      this.reconnectConfig.maxBackoffDelay!
    );

    console.log(`Attempting reconnection for device ${deviceId} in ${delay}ms`);

    setTimeout(async () => {
      try {
        // Attempt to refresh token or re-authenticate
        await this.refreshDeviceToken(connection);

        // Test the connection with a sync
        const testResult = await this.syncService.syncDevice(deviceId);

        if (testResult.success) {
          console.log(`Successfully reconnected device ${deviceId}`);
          health.isHealthy = true;
          health.consecutiveFailures = 0;
          this.healthStatus.set(deviceId, health);
        } else {
          console.log(`Reconnection failed for device ${deviceId}: ${testResult.errors[0]}`);
          // Will try again on next health check
        }
      } catch (error) {
        console.error(`Reconnection attempt failed for device ${deviceId}:`, error);
      }
    }, delay);
  }

  /**
   * Refresh device authentication token
   */
  private async refreshDeviceToken(connection: DeviceConnection): Promise<void> {
    // This would implement device-specific token refresh logic
    // For OAuth2 devices, make a refresh token request
    // For API key devices, might need to re-authenticate

    switch (connection.deviceType) {
      case 'apple_watch':
        await this.refreshAppleToken(connection);
        break;
      case 'whoop':
        await this.refreshWhoopToken(connection);
        break;
      case 'garmin':
        await this.refreshGarminToken(connection);
        break;
      case 'fitbit':
        await this.refreshFitbitToken(connection);
        break;
      case 'samsung':
        await this.refreshSamsungToken(connection);
        break;
      default:
        throw new Error(`Unsupported device type for token refresh: ${connection.deviceType}`);
    }
  }

  /**
   * Device-specific token refresh implementations
   */
  private async refreshAppleToken(connection: DeviceConnection): Promise<void> {
    // Apple Health API token refresh logic
    const response = await fetch('https://api.apple.com/auth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: connection.refreshToken!,
        client_id: process.env.APPLE_CLIENT_ID!,
        client_secret: process.env.APPLE_CLIENT_SECRET!
      })
    });

    if (!response.ok) {
      throw new Error('Failed to refresh Apple token');
    }

    const data = await response.json();
    connection.accessToken = data.access_token;
    connection.tokenExpiry = new Date(Date.now() + data.expires_in * 1000);
    this.connections.set(connection.deviceId, connection);
  }

  private async refreshWhoopToken(connection: DeviceConnection): Promise<void> {
    // WHOOP API token refresh logic
    const response = await fetch('https://api.whoop.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: connection.refreshToken!,
        client_id: process.env.WHOOP_CLIENT_ID!,
        client_secret: process.env.WHOOP_CLIENT_SECRET!
      })
    });

    if (!response.ok) {
      throw new Error('Failed to refresh WHOOP token');
    }

    const data = await response.json();
    connection.accessToken = data.access_token;
    connection.tokenExpiry = new Date(Date.now() + data.expires_in * 1000);
    this.connections.set(connection.deviceId, connection);
  }

  private async refreshGarminToken(connection: DeviceConnection): Promise<void> {
    // Garmin API token refresh logic
    const response = await fetch('https://apis.garmin.com/oauth-service/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: connection.refreshToken!,
        client_id: process.env.GARMIN_CLIENT_ID!,
        client_secret: process.env.GARMIN_CLIENT_SECRET!
      })
    });

    if (!response.ok) {
      throw new Error('Failed to refresh Garmin token');
    }

    const data = await response.json();
    connection.accessToken = data.access_token;
    connection.tokenExpiry = new Date(Date.now() + data.expires_in * 1000);
    this.connections.set(connection.deviceId, connection);
  }

  private async refreshFitbitToken(connection: DeviceConnection): Promise<void> {
    // Fitbit API token refresh logic
    const response = await fetch('https://api.fitbit.com/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: connection.refreshToken!,
        client_id: process.env.FITBIT_CLIENT_ID!,
        client_secret: process.env.FITBIT_CLIENT_SECRET!
      })
    });

    if (!response.ok) {
      throw new Error('Failed to refresh Fitbit token');
    }

    const data = await response.json();
    connection.accessToken = data.access_token;
    connection.tokenExpiry = new Date(Date.now() + data.expires_in * 1000);
    this.connections.set(connection.deviceId, connection);
  }

  private async refreshSamsungToken(connection: DeviceConnection): Promise<void> {
    // Samsung Health API token refresh logic
    const response = await fetch('https://api.samsung.com/auth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: connection.refreshToken!,
        client_id: process.env.SAMSUNG_CLIENT_ID!,
        client_secret: process.env.SAMSUNG_CLIENT_SECRET!
      })
    });

    if (!response.ok) {
      throw new Error('Failed to refresh Samsung token');
    }

    const data = await response.json();
    connection.accessToken = data.access_token;
    connection.tokenExpiry = new Date(Date.now() + data.expires_in * 1000);
    this.connections.set(connection.deviceId, connection);
  }

  /**
   * Start health monitoring for a device
   */
  private startHealthMonitoring(deviceId: string): void {
    const timer = setInterval(async () => {
      await this.performHealthCheck(deviceId);
    }, this.reconnectConfig.healthCheckInterval!);

    this.healthCheckTimers.set(deviceId, timer);
  }

  /**
   * Perform health check on a device connection
   */
  private async performHealthCheck(deviceId: string): Promise<void> {
    const connection = this.connections.get(deviceId);
    if (!connection || !connection.isActive) {
      return;
    }

    const health = this.healthStatus.get(deviceId);
    if (!health) return;

    try {
      // Perform a lightweight health check (e.g., get latest heart rate)
      const startTime = Date.now();
      // This would be a simplified API call to check connectivity
      const isHealthy = await this.checkDeviceHealth(connection);
      const responseTime = Date.now() - startTime;

      if (isHealthy) {
        health.isHealthy = true;
        health.consecutiveFailures = 0;
        health.averageResponseTime = (health.averageResponseTime + responseTime) / 2;
      } else {
        health.consecutiveFailures++;
        if (health.consecutiveFailures >= 3) {
          health.isHealthy = false;
          await this.attemptReconnection(deviceId);
        }
      }
    } catch (error) {
      health.consecutiveFailures++;
      health.lastError = error instanceof Error ? error.message : 'Health check failed';

      if (health.consecutiveFailures >= 3) {
        health.isHealthy = false;
        await this.attemptReconnection(deviceId);
      }
    }

    this.healthStatus.set(deviceId, health);
  }

  /**
   * Check device health with a lightweight API call
   */
  private async checkDeviceHealth(connection: DeviceConnection): Promise<boolean> {
    // This would make a lightweight API call to verify the connection
    // For example, get the current time from the device API
    try {
      // Simplified health check - in real implementation would make actual API call
      return connection.tokenExpiry > new Date();
    } catch {
      return false;
    }
  }

  /**
   * Calculate average response time for a device
   */
  private calculateAverageResponseTime(deviceId: string): number {
    const attempts = this.reconnectAttempts.get(deviceId) || [];
    const successfulAttempts = attempts.filter(a => a.success && a.responseTime > 0);

    if (successfulAttempts.length === 0) return 0;

    const totalTime = successfulAttempts.reduce((sum, a) => sum + a.responseTime, 0);
    return totalTime / successfulAttempts.length;
  }

  /**
   * Get connection health status
   */
  getConnectionHealth(deviceId: string): ConnectionHealth | undefined {
    return this.healthStatus.get(deviceId);
  }

  /**
   * Get all unhealthy connections
   */
  getUnhealthyConnections(): ConnectionHealth[] {
    return Array.from(this.healthStatus.values())
      .filter(health => !health.isHealthy);
  }

  /**
   * Force reconnection attempt for a device
   */
  async forceReconnect(deviceId: string): Promise<boolean> {
    const connection = this.connections.get(deviceId);
    if (!connection) return false;

    try {
      await this.refreshDeviceToken(connection);
      const result = await this.syncService.syncDevice(deviceId);
      return result.success;
    } catch {
      return false;
    }
  }

  /**
   * Stop health monitoring for a device
   */
  stopHealthMonitoring(deviceId: string): void {
    const timer = this.healthCheckTimers.get(deviceId);
    if (timer) {
      clearInterval(timer);
      this.healthCheckTimers.delete(deviceId);
    }
  }

  /**
   * Cleanup resources when shutting down
   */
  cleanup(): void {
    Array.from(this.healthCheckTimers.entries()).forEach(([deviceId, timer]) => {
      clearInterval(timer);
    });
    this.healthCheckTimers.clear();
  }
}