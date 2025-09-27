/**
 * TypeScript interfaces for the Intensity Score Live feature
 * Based on the data model specification and Convex schema
 */

import type { Doc, Id } from '../../convex/_generated/dataModel';

// Core intensity score interface matching Convex schema
export interface IntensityScore {
  _id: Id<"intensityScores">;
  userId: Id<"users">;
  sessionId: string;
  timestamp: number;
  heartRate: number;
  spo2: number;
  strain: number;
  recovery: number;
  intensityScore: number;
  adaptationSuggestion: string;
  createdAt: number;
  updatedAt: number;
}

// Health metrics from devices (heart rate, SpO2, sleep)
export interface HealthMetrics {
  heartRate?: {
    avgHR: number;
    maxHR: number;
    variance: number;
  };
  spo2?: {
    avgSpO2: number;
    drift: number;
  };
  sleepScore?: number;
  collectedAt: string;
}

// Real-time health data for live intensity calculation
export interface LiveHealthData {
  heartRate: number;
  spo2: number;
  timestamp: number;
  deviceSource?: string;
}

// Supplement stack interface matching Convex schema
export interface SupplementStack {
  _id: Id<"supplementStacks">;
  name: string;
  description: string;
  supplements: Id<"supplementItems">[];
  targetGoals: string[];
  recommendedTiming: 'pre-workout' | 'post-workout' | 'daily' | 'recovery';
  priceRange: string;
  effectivenessRating: number;
  userRatings: number[];
  createdAt: number;
  updatedAt: number;
}

// Individual supplement item interface matching Convex schema
export interface SupplementItem {
  _id: Id<"supplementItems">;
  name: string;
  brand?: string;
  dosage: string;
  benefits: string[];
  category: 'protein' | 'creatine' | 'pre-workout' | 'recovery' | 'vitamins' | 'other';
  price?: number;
  affiliateLink?: string;
  warnings?: string[];
  createdAt: number;
  updatedAt: number;
}

// AI coaching context interface matching Convex schema
export interface CoachingContext {
  _id: Id<"aiCoachingContext">;
  userId: Id<"users">;
  sessionId: string;
  workoutData: {
    exercises: string[];
    duration: number;
    intensity: number;
  };
  healthMetrics: {
    avgHeartRate: number;
    maxHeartRate: number;
    avgSpO2: number;
    recoveryScore: number;
  };
  previousAdaptations: string[];
  preferences: {
    focusAreas: string[];
    avoidanceList: string[];
    experienceLevel: 'beginner' | 'intermediate' | 'advanced';
  };
  contextTimestamp: number;
  createdAt: number;
  updatedAt: number;
}

// Social sharing interface matching Convex schema
export interface SocialShare {
  _id: Id<"socialShares">;
  userId: Id<"users">;
  shareType: 'workout-result' | 'intensity-score' | 'achievement' | 'program-completion';
  content: {
    title: string;
    description: string;
    metrics?: {
      intensityScore?: number;
      duration?: number;
      exercises?: string[];
    };
    imageUrl?: string;
  };
  platform: 'internal' | 'social-media' | 'export';
  privacy: 'public' | 'friends' | 'private';
  likes: number;
  comments: string[];
  createdAt: number;
  updatedAt: number;
}

// Intensity calculation parameters
export interface IntensityCalculationParams {
  heartRate: number;
  spo2: number;
  restingHeartRate: number;
  maxHeartRate: number;
  age: number;
  fitnessLevel: 'beginner' | 'intermediate' | 'advanced';
}

// Adaptation suggestion types
export interface AdaptationSuggestion {
  type: 'increase-intensity' | 'decrease-intensity' | 'maintain' | 'recovery-focus';
  reasoning: string;
  specificActions: string[];
  supplementRecommendations?: Id<"supplementStacks">[];
  confidenceScore: number;
}

// Weekly intensity trends
export interface IntensityTrends {
  weeklyAverage: number;
  dailyScores: number[];
  trend: 'increasing' | 'decreasing' | 'stable';
  recommendations: string[];
}

// Live session state for real-time updates
export interface LiveSessionState {
  sessionId: string;
  userId: Id<"users">;
  startTime: number;
  currentIntensity: number;
  targetIntensity: number;
  isActive: boolean;
  alerts: {
    type: 'high-intensity' | 'low-intensity' | 'recovery-needed';
    message: string;
    timestamp: number;
  }[];
}

// Export all types for easy importing
export type {
  Doc,
  Id
};