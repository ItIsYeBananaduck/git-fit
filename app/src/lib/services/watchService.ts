/**
 * Watch Device Detection Service
 * 
 * Purpose: Capacitor-based watch device detection and communication
 * Features:
 * - Platform-agnostic watch detection (Apple Watch, Wear OS, etc.)
 * - Exercise data synchronization
 * - Connection status monitoring
 * - Offline-first architecture with sync queue
 */

import { Capacitor } from '@capacitor/core';
import type { 
  ExerciseState, 
  PendingUpdate 
} from '../../convex/models/watchSync';

/**
 * Type Definitions
 */
export interface WatchDevice {
  id: string;
  name: string;
  type: 'apple_watch' | 'wear_os' | 'galaxy_watch' | 'fitbit' | 'unknown';
  isConnected: boolean;
  batteryLevel?: number;
  capabilities: {
    supportsExerciseTracking: boolean;
    supportsHeartRate: boolean;
    supportsGPS: boolean;
    supportsHapticFeedback: boolean;
  };
  lastSeen: number;
}

export interface ExerciseControlCommand {
  type: 'start_set' | 'complete_set' | 'start_rest' | 'complete_rest' | 'update_weight' | 'update_reps';
  data: {
    exerciseId?: string;
    setNumber?: number;
    reps?: number;
    weight?: number;
    restDuration?: number;
  };
  timestamp: number;
}

export interface WatchServiceOptions {
  maxRetries: number;
  retryDelayMs: number;
  syncIntervalMs: number;
  heartbeatIntervalMs: number;
  enableBackgroundSync: boolean;
}

/**
 * Watch Service Class
 */
export class WatchService {
  private static instance: WatchService | null = null;
  private connectedDevices: Map<string, WatchDevice> = new Map();
  private syncQueue: PendingUpdate[] = [];
  private isInitialized = false;
  private syncInterval: number | null = null;
  private heartbeatInterval: number | null = null;
  private listeners: Map<string, Array<(data: unknown) => void>> = new Map();

  private options: WatchServiceOptions = {
    maxRetries: 3,
    retryDelayMs: 1000,
    syncIntervalMs: 30000, // 30 seconds
    heartbeatIntervalMs: 10000, // 10 seconds
    enableBackgroundSync: true,
  };

  private constructor(options?: Partial<WatchServiceOptions>) {
    if (options) {
      this.options = { ...this.options, ...options };
    }
  }

  /**
   * Singleton instance access
   */
  public static getInstance(options?: Partial<WatchServiceOptions>): WatchService {
    if (!WatchService.instance) {
      WatchService.instance = new WatchService(options);
    }
    return WatchService.instance;
  }

  /**
   * Initialize the watch service
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Check if running on a platform that supports watch integration
      if (!this.isPlatformSupported()) {
        console.warn('Watch integration not supported on this platform');
        this.isInitialized = true;
        return;
      }

      // Initialize Capacitor watch plugin if available
      await this.initializeCapacitorPlugin();

      // Start device discovery
      await this.startDeviceDiscovery();

      // Setup periodic sync and heartbeat
      this.startPeriodicSync();
      this.startHeartbeat();

      this.isInitialized = true;
      this.emit('initialized', { success: true });
    } catch (error) {
      console.error('Failed to initialize watch service:', error);
      this.emit('error', { error, context: 'initialization' });
      throw error;
    }
  }

  /**
   * Check if current platform supports watch integration
   */
  private isPlatformSupported(): boolean {
    const platform = Capacitor.getPlatform();
    return platform === 'ios' || platform === 'android';
  }

  /**
   * Initialize Capacitor watch plugin
   */
  private async initializeCapacitorPlugin(): Promise<void> {
    try {
      // Note: This would use the actual Capacitor Watch plugin when available
      // For now, we'll use a mock implementation
      
      if (Capacitor.isNativePlatform()) {
        // Import the watch plugin dynamically
        // const { CapacitorWatch } = await import('@capacitor-community/watch');
        // await CapacitorWatch.initialize();
        
        console.log('Capacitor watch plugin initialized');
      }
    } catch (error) {
      console.warn('Capacitor watch plugin not available:', error);
      // Continue with mock/web implementation
    }
  }

  /**
   * Start device discovery
   */
  private async startDeviceDiscovery(): Promise<void> {
    try {
      if (Capacitor.isNativePlatform()) {
        await this.discoverNativeDevices();
      } else {
        await this.discoverWebDevices();
      }
    } catch (error) {
      console.error('Device discovery failed:', error);
      this.emit('error', { error, context: 'device_discovery' });
    }
  }

  /**
   * Discover native devices (iOS/Android)
   */
  private async discoverNativeDevices(): Promise<void> {
    // Mock implementation - would use actual Capacitor plugin
    const mockDevices: WatchDevice[] = [
      {
        id: 'apple_watch_series_9',
        name: 'Apple Watch Series 9',
        type: 'apple_watch',
        isConnected: true,
        batteryLevel: 85,
        capabilities: {
          supportsExerciseTracking: true,
          supportsHeartRate: true,
          supportsGPS: true,
          supportsHapticFeedback: true,
        },
        lastSeen: Date.now(),
      },
    ];

    for (const device of mockDevices) {
      this.connectedDevices.set(device.id, device);
      this.emit('device_connected', { device });
    }
  }

  /**
   * Discover web-based devices (fallback)
   */
  private async discoverWebDevices(): Promise<void> {
    // Web implementation might use WebBluetooth or other APIs
    console.log('Web-based watch device discovery not yet implemented');
  }

  /**
   * Send exercise control command to watch
   */
  public async sendExerciseCommand(
    deviceId: string, 
    command: ExerciseControlCommand
  ): Promise<void> {
    const device = this.connectedDevices.get(deviceId);
    if (!device) {
      throw new Error(`Watch device not found: ${deviceId}`);
    }

    if (!device.isConnected) {
      // Queue command for later transmission
      this.queueCommand(deviceId, command);
      return;
    }

    try {
      if (Capacitor.isNativePlatform()) {
        await this.sendNativeCommand(deviceId, command);
      } else {
        await this.sendWebCommand(deviceId, command);
      }

      this.emit('command_sent', { deviceId, command });
    } catch (error) {
      console.error(`Failed to send command to ${deviceId}:`, error);
      
      // Queue for retry
      this.queueCommand(deviceId, command);
      this.emit('command_failed', { deviceId, command, error });
    }
  }

  /**
   * Send command via native platform
   */
  private async sendNativeCommand(
    deviceId: string, 
    command: ExerciseControlCommand
  ): Promise<void> {
    // Mock implementation - would use actual Capacitor plugin
    console.log(`Sending native command to ${deviceId}:`, command);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  /**
   * Send command via web platform
   */
  private async sendWebCommand(
    deviceId: string, 
    command: ExerciseControlCommand
  ): Promise<void> {
    // Web implementation might use Service Workers or WebRTC
    console.log(`Sending web command to ${deviceId}:`, command);
  }

  /**
   * Queue command for offline/retry transmission
   */
  private queueCommand(deviceId: string, command: ExerciseControlCommand): void {
    const pendingUpdate: PendingUpdate = {
      type: this.mapCommandToPendingType(command.type),
      data: command.data,
      timestamp: command.timestamp,
      id: `cmd_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
    };

    this.syncQueue.push(pendingUpdate);
    this.emit('command_queued', { deviceId, command, pendingUpdate });
  }

  /**
   * Map exercise command to pending update type
   */
  private mapCommandToPendingType(
    commandType: ExerciseControlCommand['type']
  ): PendingUpdate['type'] {
    switch (commandType) {
      case 'complete_set': return 'set_complete';
      case 'start_rest': return 'rest_start';
      case 'complete_rest': return 'rest_complete';
      case 'update_weight': return 'weight_change';
      case 'update_reps': return 'reps_change';
      default: return 'exercise_complete';
    }
  }

  /**
   * Get current exercise state from watch
   */
  public async getExerciseState(deviceId: string): Promise<ExerciseState | null> {
    const device = this.connectedDevices.get(deviceId);
    if (!device || !device.isConnected) {
      return null;
    }

    try {
      if (Capacitor.isNativePlatform()) {
        return await this.getNativeExerciseState(deviceId);
      } else {
        return await this.getWebExerciseState(deviceId);
      }
    } catch (error) {
      console.error(`Failed to get exercise state from ${deviceId}:`, error);
      this.emit('error', { error, context: 'get_exercise_state', deviceId });
      return null;
    }
  }

  /**
   * Get exercise state via native platform
   */
  private async getNativeExerciseState(_deviceId: string): Promise<ExerciseState> {
    // Mock implementation - would use actual Capacitor plugin
    return {
      exerciseId: 'bench_press',
      exerciseName: 'Bench Press',
      currentSet: 2,
      totalSets: 3,
      currentReps: 8,
      targetReps: 10,
      weight: 135,
      restTimeRemaining: 45,
      isResting: true,
      workoutStartTime: Date.now() - 15 * 60 * 1000, // 15 minutes ago
      setStartTime: Date.now() - 2 * 60 * 1000, // 2 minutes ago
    };
  }

  /**
   * Get exercise state via web platform
   */
  private async getWebExerciseState(_deviceId: string): Promise<ExerciseState> {
    // Web implementation fallback
    return {};
  }

  /**
   * Get list of connected devices
   */
  public getConnectedDevices(): WatchDevice[] {
    return Array.from(this.connectedDevices.values()).filter(device => device.isConnected);
  }

  /**
   * Get all known devices (connected and disconnected)
   */
  public getAllDevices(): WatchDevice[] {
    return Array.from(this.connectedDevices.values());
  }

  /**
   * Check device connection status
   */
  public async checkDeviceConnection(deviceId: string): Promise<boolean> {
    const device = this.connectedDevices.get(deviceId);
    if (!device) {
      return false;
    }

    try {
      // Ping the device to verify connection
      if (Capacitor.isNativePlatform()) {
        return await this.pingNativeDevice(deviceId);
      } else {
        return await this.pingWebDevice(deviceId);
      }
    } catch (error) {
      console.error(`Connection check failed for ${deviceId}:`, error);
      this.updateDeviceConnectionStatus(deviceId, false);
      return false;
    }
  }

  /**
   * Ping native device
   */
  private async pingNativeDevice(_deviceId: string): Promise<boolean> {
    // Mock implementation - would use actual Capacitor plugin
    return true;
  }

  /**
   * Ping web device
   */
  private async pingWebDevice(_deviceId: string): Promise<boolean> {
    // Web implementation
    return false; // Web devices typically don't support direct pinging
  }

  /**
   * Update device connection status
   */
  private updateDeviceConnectionStatus(deviceId: string, isConnected: boolean): void {
    const device = this.connectedDevices.get(deviceId);
    if (device) {
      device.isConnected = isConnected;
      device.lastSeen = Date.now();
      
      const event = isConnected ? 'device_connected' : 'device_disconnected';
      this.emit(event, { device });
    }
  }

  /**
   * Start periodic sync for queued commands
   */
  private startPeriodicSync(): void {
    if (!this.options.enableBackgroundSync) {
      return;
    }

    this.syncInterval = window.setInterval(async () => {
      await this.processSyncQueue();
    }, this.options.syncIntervalMs);
  }

  /**
   * Start heartbeat to check device connections
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = window.setInterval(async () => {
      for (const deviceId of this.connectedDevices.keys()) {
        await this.checkDeviceConnection(deviceId);
      }
    }, this.options.heartbeatIntervalMs);
  }

  /**
   * Process queued commands
   */
  private async processSyncQueue(): Promise<void> {
    if (this.syncQueue.length === 0) {
      return;
    }

    const commandsToProcess = [...this.syncQueue];
    this.syncQueue = [];

    for (const pendingUpdate of commandsToProcess) {
      try {
        // Convert pending update back to command format
        const command: ExerciseControlCommand = {
          type: this.mapPendingTypeToCommand(pendingUpdate.type),
          data: pendingUpdate.data,
          timestamp: pendingUpdate.timestamp,
        };

        // Try to send to all connected devices
        const connectedDevices = this.getConnectedDevices();
        for (const device of connectedDevices) {
          await this.sendExerciseCommand(device.id, command);
        }

        this.emit('sync_command_processed', { pendingUpdate });
      } catch (error) {
        console.error('Failed to process queued command:', error);
        // Re-queue the command for retry
        this.syncQueue.push(pendingUpdate);
      }
    }
  }

  /**
   * Map pending update type to command type
   */
  private mapPendingTypeToCommand(
    pendingType: PendingUpdate['type']
  ): ExerciseControlCommand['type'] {
    switch (pendingType) {
      case 'set_complete': return 'complete_set';
      case 'rest_start': return 'start_rest';
      case 'rest_complete': return 'complete_rest';
      case 'weight_change': return 'update_weight';
      case 'reps_change': return 'update_reps';
      default: return 'start_set';
    }
  }

  /**
   * Event system
   */
  public on(event: string, callback: (data: unknown) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  public off(event: string, callback: (data: unknown) => void): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: unknown): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in watch service event callback for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Cleanup and shutdown
   */
  public async shutdown(): Promise<void> {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }

    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    this.connectedDevices.clear();
    this.syncQueue = [];
    this.listeners.clear();
    this.isInitialized = false;

    this.emit('shutdown', { timestamp: Date.now() });
  }

  /**
   * Get service status
   */
  public getStatus(): {
    isInitialized: boolean;
    connectedDeviceCount: number;
    queuedCommandCount: number;
    lastSyncTime: number;
  } {
    return {
      isInitialized: this.isInitialized,
      connectedDeviceCount: this.getConnectedDevices().length,
      queuedCommandCount: this.syncQueue.length,
      lastSyncTime: Date.now(), // Would track actual last sync time
    };
  }
}

/**
 * Default service instance
 */
export const watchService = WatchService.getInstance();

/**
 * Utility functions
 */

/**
 * Create mock watch device for testing
 */
export function createMockWatchDevice(overrides?: Partial<WatchDevice>): WatchDevice {
  return {
    id: 'mock_watch_' + Math.random().toString(36).substring(2, 15),
    name: 'Mock Watch Device',
    type: 'unknown',
    isConnected: true,
    batteryLevel: 75,
    capabilities: {
      supportsExerciseTracking: true,
      supportsHeartRate: false,
      supportsGPS: false,
      supportsHapticFeedback: true,
    },
    lastSeen: Date.now(),
    ...overrides,
  };
}

/**
 * Format device name for display
 */
export function formatWatchDeviceName(device: WatchDevice): string {
  return `${device.name}${device.batteryLevel ? ` (${device.batteryLevel}%)` : ''}`;
}

/**
 * Check if device supports exercise tracking
 */
export function deviceSupportsExerciseTracking(device: WatchDevice): boolean {
  return device.capabilities.supportsExerciseTracking && device.isConnected;
}

/**
 * Get recommended sync interval based on device capabilities
 */
export function getRecommendedSyncInterval(device: WatchDevice): number {
  if (device.capabilities.supportsExerciseTracking) {
    return 5000; // 5 seconds for exercise-capable devices
  }
  return 30000; // 30 seconds for basic devices
}