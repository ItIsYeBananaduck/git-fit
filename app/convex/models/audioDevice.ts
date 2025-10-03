/**
 * AudioDeviceContext Model
 * 
 * Purpose: Track audio device connectivity for wave animation triggers
 * Features:
 * - Multi-device audio support (Bluetooth, wired, built-in)
 * - Device capability detection (audio feedback support)
 * - Connection status monitoring
 * - Primary device management (one active per user)
 */

import { v } from "convex/values";
import { defineTable } from "convex/server";

/**
 * AudioDeviceContext Schema Definition
 * 
 * Data Structure:
 * - userId: Foreign key to users table
 * - deviceType: Type of audio device (bluetooth, wired, builtin)
 * - deviceName: Human-readable device name
 * - isConnected: Current connection status
 * - lastDetected: Timestamp of last detection
 * - supportsAudioFeedback: Whether device can receive Alice's voice
 * - isPrimary: Whether this is the user's primary audio device
 */
export const audioDeviceContextTable = defineTable({
  userId: v.id("users"),
  deviceType: v.union(
    v.literal("bluetooth"),
    v.literal("wired"),
    v.literal("builtin")
  ),
  deviceName: v.string(), // Human-readable device name
  deviceId: v.string(), // System device identifier (unique per user)
  isConnected: v.boolean(), // Current connection status
  lastDetected: v.number(), // Unix timestamp of last detection
  supportsAudioFeedback: v.boolean(), // Whether device can receive Alice's voice
  isPrimary: v.boolean(), // Only one primary device per user
  audioQuality: v.union(
    v.literal("low"),     // Basic audio support
    v.literal("standard"), // Standard quality
    v.literal("high"),    // High quality (e.g., good Bluetooth codecs)
    v.literal("studio")   // Studio quality (wired/high-end)
  ),
  batteryLevel: v.optional(v.number()), // Battery percentage for wireless devices (0-100)
})
  .index("by_user", ["userId"])
  .index("by_user_connected", ["userId", "isConnected"])
  .index("by_user_primary", ["userId", "isPrimary"])
  .index("by_device_id", ["userId", "deviceId"])
  .index("by_last_detected", ["lastDetected"]);

/**
 * Validation Functions
 */

export function validateDeviceType(deviceType: string): boolean {
  const validTypes = ['bluetooth', 'wired', 'builtin'];
  return validTypes.includes(deviceType);
}

export function validateDeviceName(deviceName: string): boolean {
  // Device name should be non-empty and reasonable length
  return typeof deviceName === 'string' && 
         deviceName.trim().length > 0 && 
         deviceName.length <= 100;
}

export function validateDeviceId(deviceId: string): boolean {
  // Device ID should be non-empty, alphanumeric with limited special chars
  return typeof deviceId === 'string' && 
         deviceId.length > 0 && 
         deviceId.length <= 200 &&
         /^[a-zA-Z0-9._:-]+$/.test(deviceId);
}

export function validateTimestamp(timestamp: number): boolean {
  const now = Date.now();
  // Allow timestamps from past to current time
  return timestamp >= 0 && timestamp <= now;
}

export function validateBatteryLevel(batteryLevel: number | undefined): boolean {
  if (batteryLevel === undefined) return true;
  return typeof batteryLevel === 'number' && batteryLevel >= 0 && batteryLevel <= 100;
}

export function validateAudioQuality(quality: string): boolean {
  const validQualities = ['low', 'standard', 'high', 'studio'];
  return validQualities.includes(quality);
}

/**
 * Default Values
 */
export const DEFAULT_AUDIO_DEVICE = {
  isConnected: false,
  supportsAudioFeedback: true,
  isPrimary: false,
  audioQuality: 'standard' as const,
} as const;

/**
 * Business Logic Functions
 */

/**
 * Determine audio quality based on device type and capabilities
 * @param deviceType - Type of audio device
 * @param deviceName - Device name for codec detection
 * @returns Estimated audio quality level
 */
export function estimateAudioQuality(
  deviceType: 'bluetooth' | 'wired' | 'builtin',
  deviceName: string
): 'low' | 'standard' | 'high' | 'studio' {
  const normalizedName = deviceName.toLowerCase();
  
  if (deviceType === 'wired') {
    // High-end wired devices
    if (normalizedName.includes('studio') || 
        normalizedName.includes('professional') ||
        normalizedName.includes('audiophile')) {
      return 'studio';
    }
    return 'high'; // Most wired devices are high quality
  }
  
  if (deviceType === 'builtin') {
    return 'standard'; // Device speakers/basic audio
  }
  
  // Bluetooth device quality detection
  if (normalizedName.includes('airpods pro') || 
      normalizedName.includes('sony wh-1000x') ||
      normalizedName.includes('bose') ||
      normalizedName.includes('sennheiser')) {
    return 'high';
  }
  
  if (normalizedName.includes('airpods') ||
      normalizedName.includes('beats') ||
      normalizedName.includes('jabra')) {
    return 'standard';
  }
  
  return 'low'; // Generic Bluetooth devices
}

/**
 * Check if device supports voice feedback based on type and capabilities
 * @param deviceType - Type of audio device
 * @param deviceName - Device name for capability detection
 * @returns Whether device supports voice feedback
 */
export function supportsVoiceFeedback(
  deviceType: 'bluetooth' | 'wired' | 'builtin',
  deviceName: string
): boolean {
  // All device types generally support voice feedback
  // Exclude devices that are output-only (like some speakers)
  const normalizedName = deviceName.toLowerCase();
  
  // Exclude output-only devices
  if (normalizedName.includes('speaker') && 
      !normalizedName.includes('headphone') && 
      !normalizedName.includes('headset')) {
    return false;
  }
  
  return true; // Most audio devices support voice output
}

/**
 * Generate device identifier from system information
 * @param systemDeviceInfo - System-provided device information
 * @returns Normalized device identifier
 */
export function generateDeviceId(systemDeviceInfo: {
  name: string;
  id?: string;
  macAddress?: string;
  serialNumber?: string;
}): string {
  // Use MAC address or serial if available, otherwise use name + timestamp
  if (systemDeviceInfo.macAddress) {
    return `mac_${systemDeviceInfo.macAddress.replace(/[^a-zA-Z0-9]/g, '')}`;
  }
  
  if (systemDeviceInfo.id) {
    return `sys_${systemDeviceInfo.id.replace(/[^a-zA-Z0-9._:-]/g, '')}`;
  }
  
  // Fallback: normalized name + current timestamp
  const normalizedName = systemDeviceInfo.name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  const timestamp = Date.now();
  return `dev_${normalizedName}_${timestamp}`;
}

/**
 * Check if device connection is recent enough to be considered active
 * @param lastDetected - Last detection timestamp
 * @param maxAgeMs - Maximum age for active connection (default 5 minutes)
 * @returns Whether device is recently active
 */
export function isRecentlyActive(
  lastDetected: number,
  maxAgeMs: number = 5 * 60 * 1000
): boolean {
  const now = Date.now();
  return (now - lastDetected) <= maxAgeMs;
}

/**
 * Determine if device should trigger wave animations
 * @param deviceContext - Audio device context
 * @returns Whether device should trigger animations
 */
export function shouldTriggerAnimations(deviceContext: {
  isConnected: boolean;
  supportsAudioFeedback: boolean;
  isPrimary: boolean;
  audioQuality: string;
}): boolean {
  return deviceContext.isConnected && 
         deviceContext.supportsAudioFeedback && 
         deviceContext.isPrimary &&
         deviceContext.audioQuality !== 'low';
}

/**
 * Calculate device priority for primary selection
 * @param deviceType - Type of device
 * @param audioQuality - Audio quality level
 * @param isConnected - Current connection status
 * @returns Priority score (higher = better)
 */
export function calculateDevicePriority(
  deviceType: 'bluetooth' | 'wired' | 'builtin',
  audioQuality: 'low' | 'standard' | 'high' | 'studio',
  isConnected: boolean
): number {
  let score = 0;
  
  // Connection status (most important)
  if (isConnected) score += 100;
  
  // Audio quality
  switch (audioQuality) {
    case 'studio': score += 40; break;
    case 'high': score += 30; break;
    case 'standard': score += 20; break;
    case 'low': score += 10; break;
  }
  
  // Device type preference (wired > bluetooth > builtin)
  switch (deviceType) {
    case 'wired': score += 15; break;
    case 'bluetooth': score += 10; break;
    case 'builtin': score += 5; break;
  }
  
  return score;
}

/**
 * Type Definitions for Client Use
 */
export type AudioDeviceContext = {
  _id: string;
  userId: string;
  deviceType: 'bluetooth' | 'wired' | 'builtin';
  deviceName: string;
  deviceId: string;
  isConnected: boolean;
  lastDetected: number;
  supportsAudioFeedback: boolean;
  isPrimary: boolean;
  audioQuality: 'low' | 'standard' | 'high' | 'studio';
  batteryLevel?: number;
  _creationTime: number;
};

export type CreateAudioDeviceInput = {
  userId: string;
  deviceType: 'bluetooth' | 'wired' | 'builtin';
  deviceName: string;
  deviceId?: string; // Auto-generated if not provided
  supportsAudioFeedback?: boolean;
  audioQuality?: 'low' | 'standard' | 'high' | 'studio';
  batteryLevel?: number;
};

export type UpdateAudioDeviceInput = {
  isConnected?: boolean;
  lastDetected?: number;
  supportsAudioFeedback?: boolean;
  isPrimary?: boolean;
  audioQuality?: 'low' | 'standard' | 'high' | 'studio';
  batteryLevel?: number;
};

export type AudioDeviceInfo = {
  deviceId: string;
  name: string;
  type: 'bluetooth' | 'wired' | 'builtin';
  isConnected: boolean;
  batteryLevel?: number;
  capabilities: {
    supportsVoice: boolean;
    estimatedQuality: 'low' | 'standard' | 'high' | 'studio';
  };
};

/**
 * Error Types
 */
export class AudioDeviceValidationError extends Error {
  constructor(field: string, value: any, reason: string) {
    super(`Invalid ${field}: ${value}. ${reason}`);
    this.name = 'AudioDeviceValidationError';
  }
}

export class PrimaryDeviceConflictError extends Error {
  constructor(userId: string, existingDeviceId: string) {
    super(`User ${userId} already has a primary device: ${existingDeviceId}`);
    this.name = 'PrimaryDeviceConflictError';
  }
}

export class DeviceNotFoundError extends Error {
  constructor(deviceId: string) {
    super(`Audio device not found: ${deviceId}`);
    this.name = 'DeviceNotFoundError';
  }
}

/**
 * Constants
 */
export const DEVICE_DETECTION_INTERVALS = {
  ACTIVE_SCAN: 5 * 1000,    // 5 seconds during active use
  BACKGROUND: 30 * 1000,    // 30 seconds in background
  IDLE: 60 * 1000,          // 1 minute when idle
} as const;

export const BATTERY_THRESHOLDS = {
  CRITICAL: 10,  // 10% - warn user
  LOW: 20,       // 20% - show battery indicator
  GOOD: 50,      // 50% - normal operation
} as const;

export const CONNECTION_TIMEOUT_MS = 10 * 1000; // 10 seconds
export const DEVICE_CLEANUP_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Utility Functions
 */

/**
 * Format device name for display
 * @param deviceName - Raw device name
 * @param deviceType - Device type
 * @returns Formatted display name
 */
export function formatDeviceDisplayName(deviceName: string, deviceType: string): string {
  // Clean up common device name patterns
  let displayName = deviceName;
  
  // Remove redundant type information
  displayName = displayName.replace(/\s*(headphones?|earbuds?|speakers?)\s*/gi, '');
  
  // Add type prefix for clarity if not obvious
  if (deviceType === 'builtin' && !displayName.toLowerCase().includes('built')) {
    displayName = `Built-in ${displayName}`;
  }
  
  return displayName.trim() || 'Unknown Device';
}

/**
 * Get battery status display
 * @param batteryLevel - Battery percentage (0-100)
 * @returns Battery status text
 */
export function getBatteryStatusDisplay(batteryLevel: number | undefined): string {
  if (batteryLevel === undefined) return 'N/A';
  
  if (batteryLevel <= BATTERY_THRESHOLDS.CRITICAL) return `${batteryLevel}% (Critical)`;
  if (batteryLevel <= BATTERY_THRESHOLDS.LOW) return `${batteryLevel}% (Low)`;
  return `${batteryLevel}%`;
}

/**
 * Get audio quality display text
 * @param quality - Audio quality level
 * @returns Human-readable quality text
 */
export function getAudioQualityDisplay(quality: string): string {
  switch (quality) {
    case 'studio': return 'Studio Quality';
    case 'high': return 'High Quality';
    case 'standard': return 'Standard';
    case 'low': return 'Basic';
    default: return 'Unknown';
  }
}

/**
 * Check if device is wireless
 * @param deviceType - Device type
 * @returns Whether device is wireless
 */
export function isWirelessDevice(deviceType: string): boolean {
  return deviceType === 'bluetooth';
}

/**
 * Get recommended animation settings for device
 * @param audioContext - Audio device context
 * @returns Animation configuration
 */
export function getAnimationSettings(audioContext: AudioDeviceContext): {
  enableWaveAnimation: boolean;
  animationIntensity: 'low' | 'medium' | 'high';
  syncToAudio: boolean;
} {
  const enableWaveAnimation = shouldTriggerAnimations(audioContext);
  
  let animationIntensity: 'low' | 'medium' | 'high' = 'medium';
  if (audioContext.audioQuality === 'studio' || audioContext.audioQuality === 'high') {
    animationIntensity = 'high';
  } else if (audioContext.audioQuality === 'low') {
    animationIntensity = 'low';
  }
  
  const syncToAudio = audioContext.supportsAudioFeedback && 
                     audioContext.audioQuality !== 'low';
  
  return {
    enableWaveAnimation,
    animationIntensity,
    syncToAudio,
  };
}