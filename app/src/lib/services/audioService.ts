/**
 * Audio Device Detection Service
 * 
 * Purpose: Web Audio API and Capacitor-based audio device detection
 * Features:
 * - Cross-platform audio device enumeration
 * - Device capability detection (Bluetooth, wired, built-in)
 * - Connection status monitoring
 * - Audio quality assessment
 * - Wave animation triggering
 */

import { Capacitor } from '@capacitor/core';
import type { AudioDeviceContext } from '../../convex/models/audioDevice';

/**
 * Type Definitions
 */
export interface AudioDeviceInfo {
  deviceId: string;
  label: string;
  kind: 'audioinput' | 'audiooutput';
  groupId?: string;
}

export interface DeviceCapabilities {
  supportsVoice: boolean;
  estimatedQuality: 'low' | 'standard' | 'high' | 'studio';
  isWireless: boolean;
  supportsBattery: boolean;
  supportsVolumeControl: boolean;
}

export interface AudioDeviceEvent {
  type: 'device_connected' | 'device_disconnected' | 'device_changed' | 'quality_changed';
  device: AudioDeviceContext;
  timestamp: number;
}

export interface AudioServiceOptions {
  enableDeviceMonitoring: boolean;
  pollIntervalMs: number;
  enableBatteryMonitoring: boolean;
  enableQualityDetection: boolean;
  enableWebAudio: boolean;
}

/**
 * Audio Service Class
 */
export class AudioService {
  private static instance: AudioService | null = null;
  private detectedDevices: Map<string, AudioDeviceContext> = new Map();
  private primaryDeviceId: string | null = null;
  private isInitialized = false;
  private pollInterval: number | null = null;
  private listeners: Map<string, Array<(data: unknown) => void>> = new Map();
  private mediaDevices: MediaDevices | null = null;

  private options: AudioServiceOptions = {
    enableDeviceMonitoring: true,
    pollIntervalMs: 5000, // 5 seconds
    enableBatteryMonitoring: true,
    enableQualityDetection: true,
    enableWebAudio: true,
  };

  private constructor(options?: Partial<AudioServiceOptions>) {
    if (options) {
      this.options = { ...this.options, ...options };
    }
  }

  /**
   * Singleton instance access
   */
  public static getInstance(options?: Partial<AudioServiceOptions>): AudioService {
    if (!AudioService.instance) {
      AudioService.instance = new AudioService(options);
    }
    return AudioService.instance;
  }

  /**
   * Initialize the audio service
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Initialize MediaDevices API if available
      if (this.options.enableWebAudio && typeof navigator !== 'undefined' && navigator.mediaDevices) {
        this.mediaDevices = navigator.mediaDevices;
        
        // Request permission for device enumeration
        await this.requestAudioPermissions();
        
        // Setup device change listener
        this.setupDeviceChangeListener();
      }

      // Initial device scan
      await this.scanAudioDevices();

      // Start periodic monitoring
      if (this.options.enableDeviceMonitoring) {
        this.startDeviceMonitoring();
      }

      this.isInitialized = true;
      this.emit('initialized', { success: true, deviceCount: this.detectedDevices.size });
    } catch (error) {
      console.error('Failed to initialize audio service:', error);
      this.emit('error', { error, context: 'initialization' });
      throw error;
    }
  }

  /**
   * Request audio permissions for device enumeration
   */
  private async requestAudioPermissions(): Promise<void> {
    try {
      if (!this.mediaDevices) return;

      // Request microphone permission to enable device labels
      const stream = await this.mediaDevices.getUserMedia({ audio: true });
      
      // Stop the stream immediately - we just needed permission
      stream.getTracks().forEach(track => track.stop());
    } catch (error) {
      console.warn('Audio permission denied - device labels may not be available:', error);
    }
  }

  /**
   * Setup device change listener
   */
  private setupDeviceChangeListener(): void {
    if (!this.mediaDevices) return;

    this.mediaDevices.addEventListener('devicechange', () => {
      // Debounce device changes
      setTimeout(() => {
        this.scanAudioDevices().catch(error => {
          console.error('Error during device change scan:', error);
        });
      }, 1000);
    });
  }

  /**
   * Scan for audio devices
   */
  public async scanAudioDevices(): Promise<AudioDeviceContext[]> {
    const devices: AudioDeviceContext[] = [];

    try {
      // Web Audio API devices
      if (this.mediaDevices) {
        const webDevices = await this.scanWebAudioDevices();
        devices.push(...webDevices);
      }

      // Capacitor native devices
      if (Capacitor.isNativePlatform()) {
        const nativeDevices = await this.scanNativeAudioDevices();
        devices.push(...nativeDevices);
      }

      // Update internal device map
      this.updateDeviceMap(devices);

      // Update primary device selection
      this.updatePrimaryDevice();

      this.emit('devices_scanned', { devices, count: devices.length });
      return devices;
    } catch (error) {
      console.error('Audio device scan failed:', error);
      this.emit('error', { error, context: 'device_scan' });
      return [];
    }
  }

  /**
   * Scan Web Audio API devices
   */
  private async scanWebAudioDevices(): Promise<AudioDeviceContext[]> {
    if (!this.mediaDevices) return [];

    try {
      const mediaDeviceInfos = await this.mediaDevices.enumerateDevices();
      const audioOutputs = mediaDeviceInfos.filter(device => device.kind === 'audiooutput');

      return audioOutputs.map(device => this.createAudioDeviceContext(device));
    } catch (error) {
      console.error('Web audio device scan failed:', error);
      return [];
    }
  }

  /**
   * Scan native audio devices (iOS/Android)
   */
  private async scanNativeAudioDevices(): Promise<AudioDeviceContext[]> {
    // Mock implementation - would use actual Capacitor audio plugin
    const mockDevices: AudioDeviceContext[] = [
      {
        _id: 'airpods_pro_12345',
        userId: 'current_user',
        deviceType: 'bluetooth',
        deviceName: 'AirPods Pro',
        deviceId: 'airpods_pro_12345',
        isConnected: true,
        lastDetected: Date.now(),
        supportsAudioFeedback: true,
        isPrimary: true,
        audioQuality: 'high',
        batteryLevel: 85,
        _creationTime: Date.now(),
      },
    ];

    return mockDevices;
  }

  /**
   * Create AudioDeviceContext from MediaDeviceInfo
   */
  private createAudioDeviceContext(deviceInfo: MediaDeviceInfo): AudioDeviceContext {
    const deviceType = this.determineDeviceType(deviceInfo.label);
    const capabilities = this.analyzeDeviceCapabilities(deviceInfo.label, deviceType);
    
    return {
      _id: `web_${deviceInfo.deviceId}`,
      userId: 'current_user', // Would be set from auth context
      deviceType,
      deviceName: deviceInfo.label || 'Unknown Audio Device',
      deviceId: deviceInfo.deviceId,
      isConnected: true, // Web devices are connected if enumerated
      lastDetected: Date.now(),
      supportsAudioFeedback: capabilities.supportsVoice,
      isPrimary: false, // Will be determined later
      audioQuality: capabilities.estimatedQuality,
      batteryLevel: capabilities.supportsBattery ? undefined : undefined,
      _creationTime: Date.now(),
    };
  }

  /**
   * Determine device type from device label
   */
  private determineDeviceType(label: string): 'bluetooth' | 'wired' | 'builtin' {
    const normalizedLabel = label.toLowerCase();
    
    // Bluetooth indicators
    if (normalizedLabel.includes('bluetooth') ||
        normalizedLabel.includes('airpods') ||
        normalizedLabel.includes('beats') ||
        normalizedLabel.includes('bose') ||
        normalizedLabel.includes('sony wh') ||
        normalizedLabel.includes('jabra') ||
        normalizedLabel.includes('sennheiser bt')) {
      return 'bluetooth';
    }
    
    // Built-in indicators
    if (normalizedLabel.includes('built-in') ||
        normalizedLabel.includes('internal') ||
        normalizedLabel.includes('speakers') ||
        normalizedLabel.includes('macbook') ||
        normalizedLabel.includes('imac') ||
        normalizedLabel.includes('default')) {
      return 'builtin';
    }
    
    // Everything else is likely wired
    return 'wired';
  }

  /**
   * Analyze device capabilities from name and type
   */
  private analyzeDeviceCapabilities(label: string, deviceType: 'bluetooth' | 'wired' | 'builtin'): DeviceCapabilities {
    const normalizedLabel = label.toLowerCase();
    
    // Determine audio quality
    let estimatedQuality: 'low' | 'standard' | 'high' | 'studio' = 'standard';
    
    if (deviceType === 'wired') {
      if (normalizedLabel.includes('studio') || 
          normalizedLabel.includes('professional') ||
          normalizedLabel.includes('audiophile')) {
        estimatedQuality = 'studio';
      } else {
        estimatedQuality = 'high';
      }
    } else if (deviceType === 'bluetooth') {
      if (normalizedLabel.includes('airpods pro') ||
          normalizedLabel.includes('sony wh-1000x') ||
          normalizedLabel.includes('bose qc') ||
          normalizedLabel.includes('sennheiser momentum')) {
        estimatedQuality = 'high';
      } else if (normalizedLabel.includes('airpods') ||
                 normalizedLabel.includes('beats') ||
                 normalizedLabel.includes('jabra elite')) {
        estimatedQuality = 'standard';
      } else {
        estimatedQuality = 'low';
      }
    }
    
    return {
      supportsVoice: !normalizedLabel.includes('speaker') || normalizedLabel.includes('headphone'),
      estimatedQuality,
      isWireless: deviceType === 'bluetooth',
      supportsBattery: deviceType === 'bluetooth',
      supportsVolumeControl: true,
    };
  }

  /**
   * Update internal device map
   */
  private updateDeviceMap(devices: AudioDeviceContext[]): void {
    // Mark existing devices as disconnected
    for (const existingDevice of this.detectedDevices.values()) {
      existingDevice.isConnected = false;
    }

    // Update with current devices
    for (const device of devices) {
      const existingDevice = this.detectedDevices.get(device.deviceId);
      
      if (existingDevice) {
        // Update existing device
        Object.assign(existingDevice, device);
        this.emit('device_updated', { device: existingDevice });
      } else {
        // New device
        this.detectedDevices.set(device.deviceId, device);
        this.emit('device_connected', { device });
      }
    }

    // Remove devices that are no longer present
    for (const [deviceId, device] of this.detectedDevices.entries()) {
      if (!device.isConnected) {
        this.detectedDevices.delete(deviceId);
        this.emit('device_disconnected', { device });
      }
    }
  }

  /**
   * Update primary device selection
   */
  private updatePrimaryDevice(): void {
    const connectedDevices = this.getConnectedDevices();
    
    if (connectedDevices.length === 0) {
      this.primaryDeviceId = null;
      return;
    }

    // Calculate device priorities
    const devicePriorities = connectedDevices.map(device => ({
      device,
      priority: this.calculateDevicePriority(device),
    }));

    // Sort by priority (highest first)
    devicePriorities.sort((a, b) => b.priority - a.priority);

    // Update primary device
    const newPrimaryDevice = devicePriorities[0].device;
    const previousPrimaryId = this.primaryDeviceId;
    
    // Clear previous primary status
    if (previousPrimaryId && previousPrimaryId !== newPrimaryDevice.deviceId) {
      const previousPrimary = this.detectedDevices.get(previousPrimaryId);
      if (previousPrimary) {
        previousPrimary.isPrimary = false;
      }
    }

    // Set new primary
    newPrimaryDevice.isPrimary = true;
    this.primaryDeviceId = newPrimaryDevice.deviceId;

    if (previousPrimaryId !== newPrimaryDevice.deviceId) {
      this.emit('primary_device_changed', { 
        device: newPrimaryDevice,
        previousDeviceId: previousPrimaryId,
      });
    }
  }

  /**
   * Calculate device priority for primary selection
   */
  private calculateDevicePriority(device: AudioDeviceContext): number {
    let score = 0;
    
    // Audio quality score
    switch (device.audioQuality) {
      case 'studio': score += 40; break;
      case 'high': score += 30; break;
      case 'standard': score += 20; break;
      case 'low': score += 10; break;
    }
    
    // Device type preference
    switch (device.deviceType) {
      case 'wired': score += 15; break;
      case 'bluetooth': score += 10; break;
      case 'builtin': score += 5; break;
    }
    
    // Voice support bonus
    if (device.supportsAudioFeedback) {
      score += 10;
    }
    
    // Battery level consideration for wireless devices
    if (device.deviceType === 'bluetooth' && device.batteryLevel !== undefined) {
      if (device.batteryLevel > 50) score += 5;
      else if (device.batteryLevel < 20) score -= 10;
    }
    
    return score;
  }

  /**
   * Get connected devices
   */
  public getConnectedDevices(): AudioDeviceContext[] {
    return Array.from(this.detectedDevices.values()).filter(device => device.isConnected);
  }

  /**
   * Get primary audio device
   */
  public getPrimaryDevice(): AudioDeviceContext | null {
    if (!this.primaryDeviceId) return null;
    return this.detectedDevices.get(this.primaryDeviceId) || null;
  }

  /**
   * Set primary device manually
   */
  public async setPrimaryDevice(deviceId: string): Promise<void> {
    const device = this.detectedDevices.get(deviceId);
    if (!device || !device.isConnected) {
      throw new Error(`Device not found or not connected: ${deviceId}`);
    }

    // Clear previous primary
    if (this.primaryDeviceId) {
      const previousPrimary = this.detectedDevices.get(this.primaryDeviceId);
      if (previousPrimary) {
        previousPrimary.isPrimary = false;
      }
    }

    // Set new primary
    device.isPrimary = true;
    this.primaryDeviceId = deviceId;

    this.emit('primary_device_changed', { device, manualSelection: true });
  }

  /**
   * Check if device should trigger wave animations
   */
  public shouldTriggerAnimations(deviceId?: string): boolean {
    const device = deviceId 
      ? this.detectedDevices.get(deviceId)
      : this.getPrimaryDevice();
    
    if (!device) return false;
    
    return device.isConnected &&
           device.supportsAudioFeedback &&
           device.isPrimary &&
           device.audioQuality !== 'low';
  }

  /**
   * Get animation settings for device
   */
  public getAnimationSettings(deviceId?: string): {
    enableWaveAnimation: boolean;
    animationIntensity: 'low' | 'medium' | 'high';
    syncToAudio: boolean;
  } {
    const device = deviceId 
      ? this.detectedDevices.get(deviceId)
      : this.getPrimaryDevice();
    
    if (!device) {
      return {
        enableWaveAnimation: false,
        animationIntensity: 'low',
        syncToAudio: false,
      };
    }
    
    const enableWaveAnimation = this.shouldTriggerAnimations();
    
    let animationIntensity: 'low' | 'medium' | 'high' = 'medium';
    if (device.audioQuality === 'studio' || device.audioQuality === 'high') {
      animationIntensity = 'high';
    } else if (device.audioQuality === 'low') {
      animationIntensity = 'low';
    }
    
    const syncToAudio = device.supportsAudioFeedback && device.audioQuality !== 'low';
    
    return {
      enableWaveAnimation,
      animationIntensity,
      syncToAudio,
    };
  }

  /**
   * Start device monitoring
   */
  private startDeviceMonitoring(): void {
    this.pollInterval = window.setInterval(async () => {
      try {
        await this.scanAudioDevices();
        
        // Update battery levels for Bluetooth devices if supported
        if (this.options.enableBatteryMonitoring) {
          await this.updateBatteryLevels();
        }
      } catch (error) {
        console.error('Device monitoring error:', error);
      }
    }, this.options.pollIntervalMs);
  }

  /**
   * Update battery levels for wireless devices
   */
  private async updateBatteryLevels(): Promise<void> {
    const bluetoothDevices = this.getConnectedDevices().filter(
      device => device.deviceType === 'bluetooth'
    );

    for (const device of bluetoothDevices) {
      try {
        // Mock implementation - would use actual battery API
        if (Capacitor.isNativePlatform()) {
          const batteryLevel = await this.getNativeBatteryLevel(device.deviceId);
          if (batteryLevel !== device.batteryLevel) {
            device.batteryLevel = batteryLevel;
            device.lastDetected = Date.now();
            this.emit('battery_updated', { device, batteryLevel });
          }
        }
      } catch (error) {
        console.warn(`Failed to update battery for ${device.deviceId}:`, error);
      }
    }
  }

  /**
   * Get native battery level
   */
  private async getNativeBatteryLevel(_deviceId: string): Promise<number | undefined> {
    // Mock implementation - would use actual Capacitor plugin
    return Math.floor(Math.random() * 100);
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
          console.error(`Error in audio service event callback for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Cleanup and shutdown
   */
  public async shutdown(): Promise<void> {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }

    this.detectedDevices.clear();
    this.primaryDeviceId = null;
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
    primaryDeviceId: string | null;
    lastScanTime: number;
  } {
    return {
      isInitialized: this.isInitialized,
      connectedDeviceCount: this.getConnectedDevices().length,
      primaryDeviceId: this.primaryDeviceId,
      lastScanTime: Date.now(), // Would track actual last scan time
    };
  }
}

/**
 * Default service instance
 */
export const audioService = AudioService.getInstance();

/**
 * Utility functions
 */

/**
 * Create mock audio device for testing
 */
export function createMockAudioDevice(overrides?: Partial<AudioDeviceContext>): AudioDeviceContext {
  return {
    _id: 'mock_audio_' + Math.random().toString(36).substring(2, 15),
    userId: 'test_user',
    deviceType: 'bluetooth',
    deviceName: 'Mock Audio Device',
    deviceId: 'mock_device_' + Math.random().toString(36).substring(2, 15),
    isConnected: true,
    lastDetected: Date.now(),
    supportsAudioFeedback: true,
    isPrimary: false,
    audioQuality: 'standard',
    batteryLevel: 75,
    _creationTime: Date.now(),
    ...overrides,
  };
}

/**
 * Format device name for display
 */
export function formatAudioDeviceName(device: AudioDeviceContext): string {
  let name = device.deviceName;
  
  if (device.deviceType === 'bluetooth' && device.batteryLevel !== undefined) {
    name += ` (${device.batteryLevel}%)`;
  }
  
  return name;
}

/**
 * Get device type icon/emoji
 */
export function getDeviceTypeIcon(deviceType: 'bluetooth' | 'wired' | 'builtin'): string {
  switch (deviceType) {
    case 'bluetooth': return '🎧';
    case 'wired': return '🎵';
    case 'builtin': return '🔊';
    default: return '🎵';
  }
}

/**
 * Check if device is wireless
 */
export function isWirelessDevice(device: AudioDeviceContext): boolean {
  return device.deviceType === 'bluetooth';
}

/**
 * Get quality color for UI
 */
export function getQualityColor(quality: 'low' | 'standard' | 'high' | 'studio'): string {
  switch (quality) {
    case 'studio': return '#10B981'; // Green
    case 'high': return '#3B82F6';   // Blue
    case 'standard': return '#F59E0B'; // Amber
    case 'low': return '#EF4444';    // Red
    default: return '#6B7280';       // Gray
  }
}