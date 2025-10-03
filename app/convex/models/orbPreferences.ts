/**
 * AliceOrbPreferences Model
 * 
 * Purpose: Store user's visual customization settings for Alice's orb
 * Features:
 * - HSL color validation (0-360° hue range)
 * - Version-based conflict resolution for offline sync
 * - One preference set per user constraint
 * - Real-time updates with <250ms latency target
 */

import { v } from "convex/values";
import { defineTable } from "convex/server";

/**
 * AliceOrbPreferences Schema Definition
 * 
 * Data Structure:
 * - userId: Foreign key to users table (unique constraint)
 * - baseColorHue: User-selected hue value (0-360°, default 195 for #00BFFF)
 * - customColorEnabled: Whether custom color override is active
 * - lastModified: Timestamp for sync conflict resolution
 * - syncVersion: Incrementing version counter for offline conflicts
 */
export const aliceOrbPreferencesTable = defineTable({
  userId: v.id("users"),
  baseColorHue: v.number(), // 0-360 degrees, validated in mutation
  customColorEnabled: v.boolean(),
  lastModified: v.number(), // Unix timestamp
  syncVersion: v.number(), // Increments on each change
})
  .index("by_user", ["userId"]); // Primary lookup by user

/**
 * Validation Functions
 */

export function validateHueValue(hue: number): boolean {
  return typeof hue === 'number' && hue >= 0 && hue <= 360;
}

export function validateTimestamp(timestamp: number): boolean {
  const now = Date.now();
  // Allow timestamps from past 24 hours to 5 minutes in future (clock skew tolerance)
  return timestamp >= (now - 24 * 60 * 60 * 1000) && timestamp <= (now + 5 * 60 * 1000);
}

export function validateSyncVersion(version: number): boolean {
  return typeof version === 'number' && version >= 0 && Number.isInteger(version);
}

/**
 * Default Values
 */
export const DEFAULT_ORB_PREFERENCES = {
  baseColorHue: 195, // #00BFFF (DeepSkyBlue) default
  customColorEnabled: false,
  syncVersion: 1,
} as const;

/**
 * Business Logic Functions
 */

/**
 * Calculate adjusted orb color based on workout strain
 * @param baseHue - User's preferred hue (0-360)
 * @param currentStrain - Current workout intensity (0-120)
 * @returns HSL color values [hue, saturation, lightness]
 */
export function calculateAdjustedOrbColor(
  baseHue: number,
  currentStrain: number
): [number, number, number] {
  if (!validateHueValue(baseHue)) {
    throw new Error(`Invalid hue value: ${baseHue}. Must be 0-360.`);
  }
  
  if (currentStrain < 0 || currentStrain > 120) {
    throw new Error(`Invalid strain value: ${currentStrain}. Must be 0-120.`);
  }

  const baseSaturation = 100;
  const baseLightness = 50;

  // Strain-based lightness adjustment
  if (currentStrain < 90) {
    // Low strain: Lighten by 20%
    return [baseHue, baseSaturation, Math.min(baseLightness + 20, 100)];
  } else if (currentStrain >= 90 && currentStrain <= 100) {
    // Target strain: Use exact base color
    return [baseHue, baseSaturation, baseLightness];
  } else {
    // High strain: Darken by 20%
    return [baseHue, baseSaturation, Math.max(baseLightness - 20, 0)];
  }
}

/**
 * Resolve sync conflicts using timestamp and version comparison
 * @param localPrefs - Local device preferences
 * @param remotePrefs - Server/remote preferences
 * @returns Authoritative preference set
 */
export function resolveSyncConflict(
  localPrefs: {
    baseColorHue: number;
    customColorEnabled: boolean;
    lastModified: number;
    syncVersion: number;
  },
  remotePrefs: {
    baseColorHue: number;
    customColorEnabled: boolean;
    lastModified: number;
    syncVersion: number;
  }
): typeof localPrefs {
  // Most recent modification wins
  if (localPrefs.lastModified > remotePrefs.lastModified) {
    return localPrefs;
  } else if (remotePrefs.lastModified > localPrefs.lastModified) {
    return remotePrefs;
  } else {
    // Same timestamp: Higher version wins
    return localPrefs.syncVersion > remotePrefs.syncVersion ? localPrefs : remotePrefs;
  }
}

/**
 * Type Definitions for Client Use
 */
export type AliceOrbPreferences = {
  _id: string;
  userId: string;
  baseColorHue: number;
  customColorEnabled: boolean;
  lastModified: number;
  syncVersion: number;
  _creationTime: number;
};

export type CreateOrbPreferencesInput = {
  userId: string;
  baseColorHue?: number;
  customColorEnabled?: boolean;
};

export type UpdateOrbPreferencesInput = {
  baseColorHue?: number;
  customColorEnabled?: boolean;
};

/**
 * Error Types
 */
export class OrbPreferencesValidationError extends Error {
  constructor(field: string, value: any, reason: string) {
    super(`Invalid ${field}: ${value}. ${reason}`);
    this.name = 'OrbPreferencesValidationError';
  }
}

/**
 * Utility Functions
 */

/**
 * Convert HSL to hex color string
 * @param hsl - [hue, saturation, lightness] values
 * @returns Hex color string (e.g., "#00BFFF")
 */
export function hslToHex([h, s, l]: [number, number, number]): string {
  const hNorm = h / 360;
  const sNorm = s / 100;
  const lNorm = l / 100;

  const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm;
  const x = c * (1 - Math.abs(((hNorm * 6) % 2) - 1));
  const m = lNorm - c / 2;

  let r = 0, g = 0, b = 0;

  if (hNorm * 6 >= 0 && hNorm * 6 < 1) {
    r = c; g = x; b = 0;
  } else if (hNorm * 6 >= 1 && hNorm * 6 < 2) {
    r = x; g = c; b = 0;
  } else if (hNorm * 6 >= 2 && hNorm * 6 < 3) {
    r = 0; g = c; b = x;
  } else if (hNorm * 6 >= 3 && hNorm * 6 < 4) {
    r = 0; g = x; b = c;
  } else if (hNorm * 6 >= 4 && hNorm * 6 < 5) {
    r = x; g = 0; b = c;
  } else if (hNorm * 6 >= 5 && hNorm * 6 < 6) {
    r = c; g = 0; b = x;
  }

  const rHex = Math.round((r + m) * 255).toString(16).padStart(2, '0');
  const gHex = Math.round((g + m) * 255).toString(16).padStart(2, '0');
  const bHex = Math.round((b + m) * 255).toString(16).padStart(2, '0');

  return `#${rHex}${gHex}${bHex}`.toUpperCase();
}