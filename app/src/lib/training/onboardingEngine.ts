/**
 * Onboarding Engine
 * Purpose: Comprehensive user assessment and initial program generation
 */

import type { TrainingSplit } from '../types/sharedTypes';

export interface OnboardingEngine {
  /**
   * Collect basic user information
   * @param age - Age of the user
   * @param height - Height of the user in cm
   * @param weight - Weight of the user in kg
   * @param sex - Biological sex of the user
   */
  collectUserBasics(age: number, height: number, weight: number, sex: string): Promise<UserProfile>;

  /**
   * Assess user's fitness background
   * @param experience - User's experience level
   * @param activity - Primary activity type
   * @param frequency - Weekly activity frequency
   */
  assessFitnessBackground(experience: string, activity: string, frequency: number): Promise<FitnessAssessment>;

  /**
   * Screen for medical conditions
   * @param conditions - List of medical conditions
   */
  screenMedicalConditions(conditions: MedicalCondition[]): Promise<MedicalScreening>;

  /**
   * Identify user's goals
   * @param primaryGoals - List of primary goals
   * @param timeline - Timeline in weeks
   */
  identifyGoals(primaryGoals: string[], timeline: number): Promise<GoalProfile>;

  /**
   * Assess user's availability
   * @param days - Available days of the week
   * @param duration - Duration available per session in minutes
   * @param constraints - Any constraints or limitations
   */
  assessAvailability(days: number[], duration: number, constraints: string[]): Promise<AvailabilityProfile>;

  /**
   * Recommend a training split
   * @param profile - Complete user profile
   */
  recommendTrainingSplit(profile: CompleteProfile): Promise<TrainingSplitRecommendation[]>;

  /**
   * Collect exercise preferences
   * @param muscleGroups - Preferred muscle groups to train
   */
  collectExercisePreferences(muscleGroups: string[]): Promise<ExercisePreferences>;

  /**
   * Generate an initial training program
   * @param profile - Complete user profile
   * @param split - Recommended training split
   */
  generateInitialProgram(profile: CompleteProfile, split: TrainingSplit): Promise<TrainingProgram>;
}

// Define the types used in the interface
export interface UserProfile {
  age: number;
  height: number;
  weight: number;
  sex: string;
}

export interface FitnessAssessment {
  experience: string;
  activity: string;
  frequency: number;
}

export interface MedicalCondition {
  name: string;
  severity: string;
}

export interface MedicalScreening {
  conditions: MedicalCondition[];
  cleared: boolean;
}

export interface GoalProfile {
  primaryGoals: string[];
  timeline: number;
}

export interface AvailabilityProfile {
  days: number[];
  duration: number;
  constraints: string[];
}

export interface TrainingSplitRecommendation {
  name: string;
  description: string;
}

export interface ExercisePreferences {
  muscleGroups: string[];
}

export interface CompleteProfile {
  userProfile: UserProfile;
  fitnessAssessment: FitnessAssessment;
  medicalScreening: MedicalScreening;
  goalProfile: GoalProfile;
  availabilityProfile: AvailabilityProfile;
  exercisePreferences: ExercisePreferences;
}

export interface TrainingProgram {
  name: string;
  durationWeeks: number;
  sessions: TrainingSession[];
}

export interface TrainingSession {
  day: number;
  exercises: string[];
}
