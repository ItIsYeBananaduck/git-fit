/**
 * API Contract Type Definitions - Web Dashboard UI
 * 
 * TypeScript interface definitions for all API contracts used in the web dashboard.
 * These types ensure type safety across frontend-backend communication.
 * 
 * Generated: December 19, 2024
 * Framework: SvelteKit 2.22+ + Convex 1.27+
 */

// =============================================================================
// AUTHENTICATION API CONTRACTS
// =============================================================================

export interface BiometricChallengeRequest {
  userEmail: string;
}

export interface BiometricChallengeResponse {
  challenge: string;
  timeout: number; // seconds
  allowCredentials: PublicKeyCredentialDescriptor[];
}

export interface BiometricVerifyRequest {
  challenge: string;
  credential: AuthenticatorAssertionResponse;
}

export interface BiometricVerifyResponse {
  success: boolean;
  sessionToken: string;
  user: UserProfile;
}

export interface EmailLoginRequest {
  email: string;
  password: string;
}

export interface EmailLoginResponse {
  success: boolean;
  sessionToken: string;
  user: UserProfile;
  requiresBiometricSetup: boolean;
}

export interface SessionValidateResponse {
  valid: boolean;
  user?: UserProfile;
  expiresAt?: number;
}

// =============================================================================
// WORKOUT DATA API CONTRACTS
// =============================================================================

export interface WorkoutSummaryRequest {
  userId: string;
  page?: number;
  limit?: number;
  dateFrom?: string;
  dateTo?: string;
}

export interface WorkoutSummary {
  id: string;
  name: string;
  date: string;
  status: 'completed' | 'planned' | 'skipped';
  completionPercentage: number;
  exerciseCount: number;
  completedExercises: number;
  skipReasons: string[];
  duration?: number; // minutes
  notes?: string;
}

export interface WorkoutSummaryResponse {
  workouts: WorkoutSummary[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasMore: boolean;
  };
}

export interface WorkoutDetailRequest {
  workoutId: string;
  userId: string;
}

export interface ExerciseDetail {
  id: string;
  name: string;
  sets: {
    planned: number;
    completed: number;
    weights: number[];
    reps: number[];
    skipped: boolean;
    skipReason?: string;
  };
  notes?: string;
}

export interface WorkoutDetailResponse {
  id: string;
  name: string;
  date: string;
  status: 'completed' | 'planned' | 'skipped';
  exercises: ExerciseDetail[];
  totalDuration?: number;
  notes?: string;
  performanceMetrics: {
    totalWeight: number;
    totalReps: number;
    averageIntensity: number;
  };
}

export interface WeightUpdateRequest {
  workoutId: string;
  exerciseId: string;
  setIndex: number;
  newWeight: number;
  userId: string;
}

export interface WeightUpdateResponse {
  success: boolean;
  updatedExercise: ExerciseDetail;
}

// =============================================================================
// MACRO CALCULATOR API CONTRACTS
// =============================================================================

export interface MacroProfile {
  id: string;
  userId: string;
  dailyCalories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  fitnessGoal: 'Fat Loss' | 'Muscle Gain' | 'Hypertrophy' | 'Powerlifting' | 'Bodybuilding';
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  lastUpdated: string;
  isAIAdjusted: boolean;
}

export interface MacroProfileResponse {
  profile: MacroProfile;
  progress: {
    currentCalories: number;
    currentProtein: number;
    currentCarbs: number;
    currentFat: number;
    percentageToGoal: number;
  };
}

export interface MacroUpdateRequest {
  userId: string;
  dailyCalories?: number;
  proteinGrams?: number;
  carbsGrams?: number;
  fatGrams?: number;
  fitnessGoal?: 'Fat Loss' | 'Muscle Gain' | 'Hypertrophy' | 'Powerlifting' | 'Bodybuilding';
  activityLevel?: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
}

export interface MacroUpdateResponse {
  success: boolean;
  updatedProfile: MacroProfile;
}

export interface AIAdjustmentRequest {
  userId: string;
  weightChange?: number;
  energyLevel: 'low' | 'moderate' | 'high';
  hungerLevel: 'low' | 'moderate' | 'high';
  sleepQuality: 'poor' | 'fair' | 'good' | 'excellent';
  stressLevel: 'low' | 'moderate' | 'high';
}

export interface AIAdjustmentResponse {
  success: boolean;
  adjustments: {
    calorieChange: number;
    proteinChange: number;
    carbsChange: number;
    fatChange: number;
    reasoning: string;
  };
  updatedProfile: MacroProfile;
}

export interface WeeklyRecommendationResponse {
  recommendations: {
    type: 'increase_calories' | 'decrease_calories' | 'adjust_macros' | 'maintain';
    message: string;
    suggestedChanges: {
      calories?: number;
      protein?: number;
      carbs?: number;
      fat?: number;
    };
  }[];
  surveyRequired: boolean;
  nextSurveyDate: string;
}

// =============================================================================
// TRAINER ACCESS API CONTRACTS
// =============================================================================

export interface QRGenerationRequest {
  userId: string;
  permissions: string[];
}

export interface QRGenerationResponse {
  qrCodeData: string;
  connectionToken: string;
  expirationTime: string; // 24 hours from generation
  permissions: string[];
}

export interface ClientLinkingRequest {
  trainerId: string;
  connectionToken: string;
  clientConfirmation: boolean;
}

export interface ClientLinkingResponse {
  success: boolean;
  relationshipId: string;
  clientProfile: {
    id: string;
    name: string;
    fitnessGoal: string;
    linkedDate: string;
  };
}

export interface AccessRevocationRequest {
  relationshipId: string;
  revokedBy: 'trainer' | 'client';
  reason?: string;
}

export interface AccessRevocationResponse {
  success: boolean;
  revokedAt: string;
}

export interface TrainerClientListResponse {
  clients: {
    id: string;
    name: string;
    fitnessGoal: string;
    linkedDate: string;
    lastWorkout: string;
    totalWorkouts: number;
    relationshipId: string;
  }[];
}

export interface ClientDataRequest {
  relationshipId: string;
  trainerId: string;
  dataType: 'workouts' | 'macros' | 'progress' | 'all';
  dateFrom?: string;
  dateTo?: string;
}

export interface ClientDataResponse {
  clientId: string;
  clientName: string;
  dataType: string;
  workouts?: WorkoutSummary[];
  macros?: MacroProfile;
  accessTimestamp: string;
  auditLogId: string;
}

export interface CSVExportRequest {
  relationshipId: string;
  trainerId: string;
  dataTypes: ('workouts' | 'macros' | 'progress')[];
  dateFrom?: string;
  dateTo?: string;
}

export interface CSVExportResponse {
  downloadUrl: string;
  fileName: string;
  expiresAt: string;
  fileSize: number;
}

// =============================================================================
// FOOD DATABASE API CONTRACTS
// =============================================================================

export interface CustomFood {
  id: string;
  userId: string;
  name: string;
  caloriesPerUnit: number;
  proteinPerUnit: number;
  carbsPerUnit: number;
  fatPerUnit: number;
  unit: string;
  isVerified: boolean;
  flaggedAsOutlier: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CustomFoodCreateRequest {
  userId: string;
  name: string;
  caloriesPerUnit: number;
  proteinPerUnit: number;
  carbsPerUnit: number;
  fatPerUnit: number;
  unit: string;
}

export interface CustomFoodCreateResponse {
  success: boolean;
  food: CustomFood;
  validationFlags: {
    isOutlier: boolean;
    outlierReasons: string[];
    confidenceScore: number;
  };
}

export interface CustomFoodListResponse {
  foods: CustomFood[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
  };
}

export interface ValidationRequest {
  foodData: {
    name: string;
    caloriesPerUnit: number;
    proteinPerUnit: number;
    carbsPerUnit: number;
    fatPerUnit: number;
    unit: string;
  };
}

export interface ValidationResponse {
  isValid: boolean;
  isOutlier: boolean;
  confidenceScore: number;
  outlierReasons: string[];
  suggestions: {
    field: string;
    suggestedValue: number;
    reason: string;
  }[];
}

export interface VerificationRequest {
  foodId: string;
  userId: string;
  userConfirmed: boolean;
  correctedValues?: {
    caloriesPerUnit?: number;
    proteinPerUnit?: number;
    carbsPerUnit?: number;
    fatPerUnit?: number;
  };
}

export interface VerificationResponse {
  success: boolean;
  updatedFood: CustomFood;
}

// =============================================================================
// CONFLICT RESOLUTION API CONTRACTS
// =============================================================================

export interface DataConflict {
  id: string;
  userId: string;
  entityType: 'workout' | 'macro' | 'food' | 'profile';
  entityId: string;
  mobileVersion: Record<string, unknown>;
  webVersion: Record<string, unknown>;
  conflictFields: string[];
  resolution: 'pending' | 'mobile_chosen' | 'web_chosen' | 'field_by_field';
  resolvedBy?: string;
  autoMerged: boolean;
  createdAt: string;
  resolvedAt?: string;
}

export interface ConflictDetectionResponse {
  conflicts: DataConflict[];
  hasUnresolved: boolean;
  autoMergedCount: number;
}

export interface ConflictResolutionRequest {
  conflictId: string;
  userId: string;
  resolution: 'mobile_chosen' | 'web_chosen' | 'field_by_field';
  fieldResolutions?: Record<string, 'mobile' | 'web'>;
}

export interface ConflictResolutionResponse {
  success: boolean;
  resolvedConflict: DataConflict;
  mergedEntity: Record<string, unknown>;
}

// =============================================================================
// COMMON TYPES
// =============================================================================

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  weight?: number;
  fitnessGoal?: 'Fat Loss' | 'Muscle Gain' | 'Hypertrophy' | 'Powerlifting' | 'Bodybuilding';
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
    timestamp: string;
  };
}

export interface SuccessResponse<T = unknown> {
  success: true;
  data: T;
  timestamp: string;
}

// =============================================================================
// API RESPONSE WRAPPERS
// =============================================================================

export type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;

// Union types for all request/response interfaces
export type AuthRequest = BiometricChallengeRequest | BiometricVerifyRequest | EmailLoginRequest;
export type AuthResponse = BiometricChallengeResponse | BiometricVerifyResponse | EmailLoginResponse | SessionValidateResponse;

export type WorkoutRequest = WorkoutSummaryRequest | WorkoutDetailRequest | WeightUpdateRequest;
export type WorkoutResponse = WorkoutSummaryResponse | WorkoutDetailResponse | WeightUpdateResponse;

export type MacroRequest = MacroUpdateRequest | AIAdjustmentRequest;
export type MacroResponse = MacroProfileResponse | MacroUpdateResponse | AIAdjustmentResponse | WeeklyRecommendationResponse;

export type TrainerRequest = QRGenerationRequest | ClientLinkingRequest | AccessRevocationRequest | ClientDataRequest | CSVExportRequest;
export type TrainerResponse = QRGenerationResponse | ClientLinkingResponse | AccessRevocationResponse | TrainerClientListResponse | ClientDataResponse | CSVExportResponse;

export type FoodRequest = CustomFoodCreateRequest | ValidationRequest | VerificationRequest;
export type FoodResponse = CustomFoodCreateResponse | CustomFoodListResponse | ValidationResponse | VerificationResponse;

export type ConflictRequest = ConflictResolutionRequest;
export type ConflictResponse = ConflictDetectionResponse | ConflictResolutionResponse;