/**
 * WorkoutStrainData Model
 * 
 * Purpose: Real-time workout intensity data for orb color adjustments
 * Features:
 * - Strain percentage tracking (0-120% range)
 * - Real-time session management
 * - Active workout constraint (one per user)
 * - Temporal validation for strain updates
 */

import { v } from "convex/values";
import { defineTable } from "convex/server";

/**
 * WorkoutStrainData Schema Definition
 * 
 * Data Structure:
 * - userId: Foreign key to users table
 * - sessionId: Current workout session identifier (unique per session)
 * - currentStrain: Current intensity percentage (0-120%)
 * - timestamp: When strain measurement was recorded
 * - isActive: Whether workout is currently in progress (only one active per user)
 */
export const workoutStrainDataTable = defineTable({
  userId: v.id("users"),
  sessionId: v.string(), // Unique workout session identifier
  currentStrain: v.number(), // 0-120 percentage, validated in mutation
  timestamp: v.number(), // Unix timestamp when recorded
  isActive: v.boolean(), // Only one active session per user allowed
})
  .index("by_user", ["userId"])
  .index("by_user_active", ["userId", "isActive"])
  .index("by_session", ["sessionId"])
  .index("by_timestamp", ["timestamp"]);

/**
 * Validation Functions
 */

export function validateStrainValue(strain: number): boolean {
  return typeof strain === 'number' && strain >= 0 && strain <= 120;
}

export function validateTimestamp(timestamp: number): boolean {
  const now = Date.now();
  // Allow timestamps from past 24 hours to 5 minutes in future (clock skew tolerance)
  return timestamp >= (now - 24 * 60 * 60 * 1000) && timestamp <= (now + 5 * 60 * 1000);
}

export function validateSessionId(sessionId: string): boolean {
  // Session ID should be non-empty string, typically UUID format
  return typeof sessionId === 'string' && sessionId.length > 0 && sessionId.length <= 100;
}

export function validateStrainUpdateInterval(lastTimestamp: number, newTimestamp: number): boolean {
  const timeDiff = newTimestamp - lastTimestamp;
  // Strain updates should not have gaps larger than 5 minutes (300 seconds)
  return timeDiff >= 0 && timeDiff <= 5 * 60 * 1000;
}

/**
 * Default Values
 */
export const DEFAULT_STRAIN_DATA = {
  currentStrain: 0,
  isActive: false,
} as const;

/**
 * Business Logic Functions
 */

/**
 * Calculate strain category based on percentage
 * @param strain - Current strain percentage (0-120)
 * @returns Strain category for UI color coding
 */
export function getStrainCategory(strain: number): 'low' | 'moderate' | 'target' | 'high' | 'extreme' {
  if (!validateStrainValue(strain)) {
    throw new Error(`Invalid strain value: ${strain}. Must be 0-120.`);
  }

  if (strain < 60) {
    return 'low';       // Below moderate intensity
  } else if (strain < 85) {
    return 'moderate';  // Moderate intensity
  } else if (strain <= 100) {
    return 'target';    // Target intensity zone
  } else if (strain <= 110) {
    return 'high';      // High intensity
  } else {
    return 'extreme';   // Extreme intensity (>110%)
  }
}

/**
 * Determine if strain reading indicates active workout
 * @param strain - Current strain percentage
 * @param previousStrain - Previous strain reading
 * @param timeDiff - Time difference between readings (ms)
 * @returns Whether this indicates an active workout
 */
export function isActiveWorkoutStrain(
  strain: number,
  previousStrain: number,
  timeDiff: number
): boolean {
  // Consider workout active if:
  // 1. Current strain is above resting (>40%)
  // 2. OR strain has increased significantly (>15% jump)
  // 3. AND time gap is reasonable (<5 minutes)
  
  const significantIncrease = strain - previousStrain > 15;
  const aboveResting = strain > 40;
  const reasonableTimeGap = timeDiff <= 5 * 60 * 1000;
  
  return reasonableTimeGap && (aboveResting || significantIncrease);
}

/**
 * Calculate smoothed strain value to reduce noise
 * @param currentStrain - Latest strain reading
 * @param historicalStrains - Previous strain readings (up to 5)
 * @returns Smoothed strain value
 */
export function calculateSmoothedStrain(
  currentStrain: number,
  historicalStrains: number[]
): number {
  if (!validateStrainValue(currentStrain)) {
    throw new Error(`Invalid current strain: ${currentStrain}`);
  }

  if (historicalStrains.length === 0) {
    return currentStrain;
  }

  // Weighted average: 50% current, 50% recent history
  const historicalAverage = historicalStrains.reduce((sum, strain) => sum + strain, 0) / historicalStrains.length;
  return Math.round((currentStrain * 0.5) + (historicalAverage * 0.5));
}

/**
 * Generate new session ID
 * @returns Unique session identifier
 */
export function generateSessionId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `session_${timestamp}_${random}`;
}

/**
 * Type Definitions for Client Use
 */
export type WorkoutStrainData = {
  _id: string;
  userId: string;
  sessionId: string;
  currentStrain: number;
  timestamp: number;
  isActive: boolean;
  _creationTime: number;
};

export type CreateStrainDataInput = {
  userId: string;
  sessionId?: string; // Auto-generated if not provided
  currentStrain: number;
  isActive?: boolean;
};

export type UpdateStrainDataInput = {
  currentStrain?: number;
  isActive?: boolean;
  timestamp?: number;
};

export type StrainHistoryEntry = {
  strain: number;
  timestamp: number;
  category: ReturnType<typeof getStrainCategory>;
};

/**
 * Error Types
 */
export class StrainDataValidationError extends Error {
  constructor(field: string, value: any, reason: string) {
    super(`Invalid ${field}: ${value}. ${reason}`);
    this.name = 'StrainDataValidationError';
  }
}

export class ActiveSessionError extends Error {
  constructor(userId: string, currentSessionId: string) {
    super(`User ${userId} already has an active workout session: ${currentSessionId}`);
    this.name = 'ActiveSessionError';
  }
}

export class SessionNotFoundError extends Error {
  constructor(sessionId: string) {
    super(`Workout session not found: ${sessionId}`);
    this.name = 'SessionNotFoundError';
  }
}

/**
 * Constants
 */
export const STRAIN_THRESHOLDS = {
  LOW: 60,
  MODERATE: 85,
  TARGET: 100,
  HIGH: 110,
  EXTREME: 120,
} as const;

export const MAX_STRAIN_UPDATE_GAP_MS = 5 * 60 * 1000; // 5 minutes
export const STRAIN_SMOOTHING_WINDOW = 5; // Number of previous readings to consider

/**
 * Utility Functions
 */

/**
 * Format strain value for display
 * @param strain - Strain percentage
 * @returns Formatted string with category
 */
export function formatStrainDisplay(strain: number): string {
  const category = getStrainCategory(strain);
  return `${strain.toFixed(1)}% (${category})`;
}

/**
 * Get color RGB values for strain visualization
 * @param strain - Current strain percentage
 * @returns RGB color values [r, g, b] (0-255)
 */
export function getStrainColorRGB(strain: number): [number, number, number] {
  const category = getStrainCategory(strain);
  
  switch (category) {
    case 'low':
      return [100, 200, 255]; // Light blue
    case 'moderate':
      return [50, 150, 255];  // Blue
    case 'target':
      return [0, 255, 100];   // Green
    case 'high':
      return [255, 150, 0];   // Orange
    case 'extreme':
      return [255, 50, 50];   // Red
    default:
      return [128, 128, 128]; // Gray fallback
  }
}