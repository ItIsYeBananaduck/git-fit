/**
 * API Validation Schemas - Web Dashboard UI
 * 
 * Zod schemas for runtime validation of API requests and responses.
 * Provides type-safe validation with detailed error messages.
 * 
 * Generated: December 19, 2024
 * Framework: SvelteKit 2.22+ + Convex 1.27+ + Zod validation
 */

import { z } from 'zod';

// =============================================================================
// AUTHENTICATION VALIDATION SCHEMAS
// =============================================================================

export const BiometricChallengeRequestSchema = z.object({
  userEmail: z.string().email('Invalid email format'),
});

export const BiometricChallengeResponseSchema = z.object({
  challenge: z.string().min(1, 'Challenge cannot be empty'),
  timeout: z.number().positive('Timeout must be positive'),
  allowCredentials: z.array(z.object({
    id: z.string(),
    type: z.literal('public-key'),
    transports: z.array(z.string()).optional(),
  })),
});

export const BiometricVerifyRequestSchema = z.object({
  challenge: z.string().min(1, 'Challenge cannot be empty'),
  credential: z.object({
    signature: z.instanceof(ArrayBuffer),
    authenticatorData: z.instanceof(ArrayBuffer),
    clientDataJSON: z.instanceof(ArrayBuffer),
    userHandle: z.instanceof(ArrayBuffer).nullable(),
  }),
});

export const BiometricVerifyResponseSchema = z.object({
  success: z.boolean(),
  sessionToken: z.string().min(1, 'Session token required'),
  user: z.object({
    id: z.string(),
    email: z.string().email(),
    name: z.string(),
    weight: z.number().positive().optional(),
    fitnessGoal: z.enum(['Fat Loss', 'Muscle Gain', 'Hypertrophy', 'Powerlifting', 'Bodybuilding']).optional(),
    avatar: z.string().url().optional(),
    createdAt: z.string(),
    updatedAt: z.string(),
  }),
});

export const EmailLoginRequestSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const EmailLoginResponseSchema = z.object({
  success: z.boolean(),
  sessionToken: z.string().min(1, 'Session token required'),
  user: z.object({
    id: z.string(),
    email: z.string().email(),
    name: z.string(),
    weight: z.number().positive().optional(),
    fitnessGoal: z.enum(['Fat Loss', 'Muscle Gain', 'Hypertrophy', 'Powerlifting', 'Bodybuilding']).optional(),
    avatar: z.string().url().optional(),
    createdAt: z.string(),
    updatedAt: z.string(),
  }),
  requiresBiometricSetup: z.boolean(),
});

export const SessionValidateResponseSchema = z.object({
  valid: z.boolean(),
  user: z.object({
    id: z.string(),
    email: z.string().email(),
    name: z.string(),
    weight: z.number().positive().optional(),
    fitnessGoal: z.enum(['Fat Loss', 'Muscle Gain', 'Hypertrophy', 'Powerlifting', 'Bodybuilding']).optional(),
    avatar: z.string().url().optional(),
    createdAt: z.string(),
    updatedAt: z.string(),
  }).optional(),
  expiresAt: z.number().optional(),
});

// =============================================================================
// WORKOUT DATA VALIDATION SCHEMAS
// =============================================================================

export const WorkoutSummaryRequestSchema = z.object({
  userId: z.string().min(1, 'User ID required'),
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().max(100, 'Limit cannot exceed 100').optional(),
  dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
  dateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
});

export const WorkoutSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  date: z.string(),
  status: z.enum(['completed', 'planned', 'skipped']),
  completionPercentage: z.number().min(0).max(100),
  exerciseCount: z.number().int().nonnegative(),
  completedExercises: z.number().int().nonnegative(),
  skipReasons: z.array(z.string()),
  duration: z.number().positive().optional(),
  notes: z.string().optional(),
});

export const WorkoutSummaryResponseSchema = z.object({
  workouts: z.array(WorkoutSummarySchema),
  pagination: z.object({
    currentPage: z.number().int().positive(),
    totalPages: z.number().int().nonnegative(),
    totalCount: z.number().int().nonnegative(),
    hasMore: z.boolean(),
  }),
});

export const WorkoutDetailRequestSchema = z.object({
  workoutId: z.string().min(1, 'Workout ID required'),
  userId: z.string().min(1, 'User ID required'),
});

export const ExerciseDetailSchema = z.object({
  id: z.string(),
  name: z.string(),
  sets: z.object({
    planned: z.number().int().nonnegative(),
    completed: z.number().int().nonnegative(),
    weights: z.array(z.number().nonnegative()),
    reps: z.array(z.number().int().nonnegative()),
    skipped: z.boolean(),
    skipReason: z.string().optional(),
  }),
  notes: z.string().optional(),
});

export const WorkoutDetailResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  date: z.string(),
  status: z.enum(['completed', 'planned', 'skipped']),
  exercises: z.array(ExerciseDetailSchema),
  totalDuration: z.number().positive().optional(),
  notes: z.string().optional(),
  performanceMetrics: z.object({
    totalWeight: z.number().nonnegative(),
    totalReps: z.number().int().nonnegative(),
    averageIntensity: z.number().min(0).max(100),
  }),
});

export const WeightUpdateRequestSchema = z.object({
  workoutId: z.string().min(1, 'Workout ID required'),
  exerciseId: z.string().min(1, 'Exercise ID required'),
  setIndex: z.number().int().nonnegative(),
  newWeight: z.number().nonnegative('Weight cannot be negative'),
  userId: z.string().min(1, 'User ID required'),
});

export const WeightUpdateResponseSchema = z.object({
  success: z.boolean(),
  updatedExercise: ExerciseDetailSchema,
});

// =============================================================================
// MACRO CALCULATOR VALIDATION SCHEMAS
// =============================================================================

export const MacroProfileSchema = z.object({
  id: z.string(),
  userId: z.string(),
  dailyCalories: z.number().positive('Daily calories must be positive'),
  proteinGrams: z.number().nonnegative('Protein cannot be negative'),
  carbsGrams: z.number().nonnegative('Carbs cannot be negative'),
  fatGrams: z.number().nonnegative('Fat cannot be negative'),
  fitnessGoal: z.enum(['Fat Loss', 'Muscle Gain', 'Hypertrophy', 'Powerlifting', 'Bodybuilding']),
  activityLevel: z.enum(['sedentary', 'light', 'moderate', 'active', 'very_active']),
  lastUpdated: z.string(),
  isAIAdjusted: z.boolean(),
});

export const MacroProfileResponseSchema = z.object({
  profile: MacroProfileSchema,
  progress: z.object({
    currentCalories: z.number().nonnegative(),
    currentProtein: z.number().nonnegative(),
    currentCarbs: z.number().nonnegative(),
    currentFat: z.number().nonnegative(),
    percentageToGoal: z.number().min(0).max(100),
  }),
});

export const MacroUpdateRequestSchema = z.object({
  userId: z.string().min(1, 'User ID required'),
  dailyCalories: z.number().positive('Daily calories must be positive').optional(),
  proteinGrams: z.number().nonnegative('Protein cannot be negative').optional(),
  carbsGrams: z.number().nonnegative('Carbs cannot be negative').optional(),
  fatGrams: z.number().nonnegative('Fat cannot be negative').optional(),
  fitnessGoal: z.enum(['Fat Loss', 'Muscle Gain', 'Hypertrophy', 'Powerlifting', 'Bodybuilding']).optional(),
  activityLevel: z.enum(['sedentary', 'light', 'moderate', 'active', 'very_active']).optional(),
});

export const MacroUpdateResponseSchema = z.object({
  success: z.boolean(),
  updatedProfile: MacroProfileSchema,
});

export const AIAdjustmentRequestSchema = z.object({
  userId: z.string().min(1, 'User ID required'),
  weightChange: z.number().optional(),
  energyLevel: z.enum(['low', 'moderate', 'high']),
  hungerLevel: z.enum(['low', 'moderate', 'high']),
  sleepQuality: z.enum(['poor', 'fair', 'good', 'excellent']),
  stressLevel: z.enum(['low', 'moderate', 'high']),
});

export const AIAdjustmentResponseSchema = z.object({
  success: z.boolean(),
  adjustments: z.object({
    calorieChange: z.number(),
    proteinChange: z.number(),
    carbsChange: z.number(),
    fatChange: z.number(),
    reasoning: z.string(),
  }),
  updatedProfile: MacroProfileSchema,
});

export const WeeklyRecommendationResponseSchema = z.object({
  recommendations: z.array(z.object({
    type: z.enum(['increase_calories', 'decrease_calories', 'adjust_macros', 'maintain']),
    message: z.string(),
    suggestedChanges: z.object({
      calories: z.number().optional(),
      protein: z.number().optional(),
      carbs: z.number().optional(),
      fat: z.number().optional(),
    }),
  })),
  surveyRequired: z.boolean(),
  nextSurveyDate: z.string(),
});

// =============================================================================
// TRAINER ACCESS VALIDATION SCHEMAS
// =============================================================================

export const QRGenerationRequestSchema = z.object({
  userId: z.string().min(1, 'User ID required'),
  permissions: z.array(z.string()).min(1, 'At least one permission required'),
});

export const QRGenerationResponseSchema = z.object({
  qrCodeData: z.string().min(1, 'QR code data required'),
  connectionToken: z.string().min(1, 'Connection token required'),
  expirationTime: z.string(),
  permissions: z.array(z.string()),
});

export const ClientLinkingRequestSchema = z.object({
  trainerId: z.string().min(1, 'Trainer ID required'),
  connectionToken: z.string().min(1, 'Connection token required'),
  clientConfirmation: z.boolean(),
});

export const ClientLinkingResponseSchema = z.object({
  success: z.boolean(),
  relationshipId: z.string(),
  clientProfile: z.object({
    id: z.string(),
    name: z.string(),
    fitnessGoal: z.string(),
    linkedDate: z.string(),
  }),
});

export const AccessRevocationRequestSchema = z.object({
  relationshipId: z.string().min(1, 'Relationship ID required'),
  revokedBy: z.enum(['trainer', 'client']),
  reason: z.string().optional(),
});

export const AccessRevocationResponseSchema = z.object({
  success: z.boolean(),
  revokedAt: z.string(),
});

export const TrainerClientListResponseSchema = z.object({
  clients: z.array(z.object({
    id: z.string(),
    name: z.string(),
    fitnessGoal: z.string(),
    linkedDate: z.string(),
    lastWorkout: z.string(),
    totalWorkouts: z.number().int().nonnegative(),
    relationshipId: z.string(),
  })),
});

export const ClientDataRequestSchema = z.object({
  relationshipId: z.string().min(1, 'Relationship ID required'),
  trainerId: z.string().min(1, 'Trainer ID required'),
  dataType: z.enum(['workouts', 'macros', 'progress', 'all']),
  dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
  dateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
});

export const ClientDataResponseSchema = z.object({
  clientId: z.string(),
  clientName: z.string(),
  dataType: z.string(),
  workouts: z.array(WorkoutSummarySchema).optional(),
  macros: MacroProfileSchema.optional(),
  accessTimestamp: z.string(),
  auditLogId: z.string(),
});

export const CSVExportRequestSchema = z.object({
  relationshipId: z.string().min(1, 'Relationship ID required'),
  trainerId: z.string().min(1, 'Trainer ID required'),
  dataTypes: z.array(z.enum(['workouts', 'macros', 'progress'])).min(1, 'At least one data type required'),
  dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
  dateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
});

export const CSVExportResponseSchema = z.object({
  downloadUrl: z.string().url(),
  fileName: z.string(),
  expiresAt: z.string(),
  fileSize: z.number().positive(),
});

// =============================================================================
// FOOD DATABASE VALIDATION SCHEMAS
// =============================================================================

export const CustomFoodSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string().min(1, 'Food name required'),
  caloriesPerUnit: z.number().nonnegative('Calories cannot be negative'),
  proteinPerUnit: z.number().nonnegative('Protein cannot be negative'),
  carbsPerUnit: z.number().nonnegative('Carbs cannot be negative'),
  fatPerUnit: z.number().nonnegative('Fat cannot be negative'),
  unit: z.string().min(1, 'Unit required'),
  isVerified: z.boolean(),
  flaggedAsOutlier: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const CustomFoodCreateRequestSchema = z.object({
  userId: z.string().min(1, 'User ID required'),
  name: z.string().min(1, 'Food name required'),
  caloriesPerUnit: z.number().nonnegative('Calories cannot be negative'),
  proteinPerUnit: z.number().nonnegative('Protein cannot be negative'),
  carbsPerUnit: z.number().nonnegative('Carbs cannot be negative'),
  fatPerUnit: z.number().nonnegative('Fat cannot be negative'),
  unit: z.string().min(1, 'Unit required'),
});

export const CustomFoodCreateResponseSchema = z.object({
  success: z.boolean(),
  food: CustomFoodSchema,
  validationFlags: z.object({
    isOutlier: z.boolean(),
    outlierReasons: z.array(z.string()),
    confidenceScore: z.number().min(0).max(1),
  }),
});

export const CustomFoodListResponseSchema = z.object({
  foods: z.array(CustomFoodSchema),
  pagination: z.object({
    currentPage: z.number().int().positive(),
    totalPages: z.number().int().nonnegative(),
    totalCount: z.number().int().nonnegative(),
  }),
});

export const ValidationRequestSchema = z.object({
  foodData: z.object({
    name: z.string().min(1, 'Food name required'),
    caloriesPerUnit: z.number().nonnegative('Calories cannot be negative'),
    proteinPerUnit: z.number().nonnegative('Protein cannot be negative'),
    carbsPerUnit: z.number().nonnegative('Carbs cannot be negative'),
    fatPerUnit: z.number().nonnegative('Fat cannot be negative'),
    unit: z.string().min(1, 'Unit required'),
  }),
});

export const ValidationResponseSchema = z.object({
  isValid: z.boolean(),
  isOutlier: z.boolean(),
  confidenceScore: z.number().min(0).max(1),
  outlierReasons: z.array(z.string()),
  suggestions: z.array(z.object({
    field: z.string(),
    suggestedValue: z.number(),
    reason: z.string(),
  })),
});

export const VerificationRequestSchema = z.object({
  foodId: z.string().min(1, 'Food ID required'),
  userId: z.string().min(1, 'User ID required'),
  userConfirmed: z.boolean(),
  correctedValues: z.object({
    caloriesPerUnit: z.number().nonnegative().optional(),
    proteinPerUnit: z.number().nonnegative().optional(),
    carbsPerUnit: z.number().nonnegative().optional(),
    fatPerUnit: z.number().nonnegative().optional(),
  }).optional(),
});

export const VerificationResponseSchema = z.object({
  success: z.boolean(),
  updatedFood: CustomFoodSchema,
});

// =============================================================================
// CONFLICT RESOLUTION VALIDATION SCHEMAS
// =============================================================================

export const DataConflictSchema = z.object({
  id: z.string(),
  userId: z.string(),
  entityType: z.enum(['workout', 'macro', 'food', 'profile']),
  entityId: z.string(),
  mobileVersion: z.record(z.unknown()),
  webVersion: z.record(z.unknown()),
  conflictFields: z.array(z.string()),
  resolution: z.enum(['pending', 'mobile_chosen', 'web_chosen', 'field_by_field']),
  resolvedBy: z.string().optional(),
  autoMerged: z.boolean(),
  createdAt: z.string(),
  resolvedAt: z.string().optional(),
});

export const ConflictDetectionResponseSchema = z.object({
  conflicts: z.array(DataConflictSchema),
  hasUnresolved: z.boolean(),
  autoMergedCount: z.number().int().nonnegative(),
});

export const ConflictResolutionRequestSchema = z.object({
  conflictId: z.string().min(1, 'Conflict ID required'),
  userId: z.string().min(1, 'User ID required'),
  resolution: z.enum(['mobile_chosen', 'web_chosen', 'field_by_field']),
  fieldResolutions: z.record(z.enum(['mobile', 'web'])).optional(),
});

export const ConflictResolutionResponseSchema = z.object({
  success: z.boolean(),
  resolvedConflict: DataConflictSchema,
  mergedEntity: z.record(z.unknown()),
});

// =============================================================================
// COMMON VALIDATION SCHEMAS
// =============================================================================

export const PaginationParamsSchema = z.object({
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().max(100).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export const ErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.record(z.unknown()).optional(),
    timestamp: z.string(),
  }),
});

export const SuccessResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) => z.object({
  success: z.literal(true),
  data: dataSchema,
  timestamp: z.string(),
});

// =============================================================================
// UTILITY FUNCTIONS FOR VALIDATION
// =============================================================================

export type ValidationResult<T> = {
  success: true;
  data: T;
} | {
  success: false;
  errors: string[];
};

export function validateSchema<T>(schema: z.ZodType<T>, data: unknown): ValidationResult<T> {
  try {
    const result = schema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
      return { success: false, errors };
    }
    return { success: false, errors: ['Validation failed'] };
  }
}

export function createApiResponseValidator<T>(dataSchema: z.ZodType<T>) {
  return z.union([
    SuccessResponseSchema(dataSchema),
    ErrorResponseSchema,
  ]);
}

// =============================================================================
// SCHEMA EXPORTS FOR TESTING
// =============================================================================

export const allSchemas = {
  // Authentication
  BiometricChallengeRequestSchema,
  BiometricChallengeResponseSchema,
  BiometricVerifyRequestSchema,
  BiometricVerifyResponseSchema,
  EmailLoginRequestSchema,
  EmailLoginResponseSchema,
  SessionValidateResponseSchema,
  
  // Workouts
  WorkoutSummaryRequestSchema,
  WorkoutSummaryResponseSchema,
  WorkoutDetailRequestSchema,
  WorkoutDetailResponseSchema,
  WeightUpdateRequestSchema,
  WeightUpdateResponseSchema,
  
  // Macros
  MacroProfileResponseSchema,
  MacroUpdateRequestSchema,
  MacroUpdateResponseSchema,
  AIAdjustmentRequestSchema,
  AIAdjustmentResponseSchema,
  WeeklyRecommendationResponseSchema,
  
  // Trainer Access
  QRGenerationRequestSchema,
  QRGenerationResponseSchema,
  ClientLinkingRequestSchema,
  ClientLinkingResponseSchema,
  AccessRevocationRequestSchema,
  AccessRevocationResponseSchema,
  TrainerClientListResponseSchema,
  ClientDataRequestSchema,
  ClientDataResponseSchema,
  CSVExportRequestSchema,
  CSVExportResponseSchema,
  
  // Food Database
  CustomFoodCreateRequestSchema,
  CustomFoodCreateResponseSchema,
  CustomFoodListResponseSchema,
  ValidationRequestSchema,
  ValidationResponseSchema,
  VerificationRequestSchema,
  VerificationResponseSchema,
  
  // Conflict Resolution
  ConflictDetectionResponseSchema,
  ConflictResolutionRequestSchema,
  ConflictResolutionResponseSchema,
  
  // Common
  PaginationParamsSchema,
  ErrorResponseSchema,
} as const;