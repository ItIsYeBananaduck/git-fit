/**
 * Contract Testing Utilities - Web Dashboard UI
 * 
 * Utilities for testing API contracts and ensuring type safety.
 * Provides mock data generation and contract validation helpers.
 * 
 * Generated: December 19, 2024
 * Framework: SvelteKit 2.22+ + Convex 1.27+ + Vitest
 */

import { vi } from 'vitest';
import type { MockedFunction } from 'vitest';
import { 
  validateSchema, 
  type ValidationResult,
  allSchemas 
} from './api-schemas';
import type {
  UserProfile,
  WorkoutSummary,
  MacroProfile,
  CustomFood,
  DataConflict,
} from '../types/api-contracts';

// =============================================================================
// MOCK DATA GENERATORS
// =============================================================================

export function createMockUserProfile(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    id: 'user_123',
    email: 'user@example.com',
    name: 'Test User',
    weight: 170,
    fitnessGoal: 'Muscle Gain',
    avatar: 'https://example.com/avatar.jpg',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

export function createMockWorkoutSummary(overrides: Partial<WorkoutSummary> = {}): WorkoutSummary {
  return {
    id: 'workout_123',
    name: 'Push Day',
    date: '2024-12-19',
    status: 'completed',
    completionPercentage: 85,
    exerciseCount: 4,
    completedExercises: 3,
    skipReasons: ['tired'],
    duration: 45,
    notes: 'Good workout',
    ...overrides,
  };
}

export function createMockMacroProfile(overrides: Partial<MacroProfile> = {}): MacroProfile {
  return {
    id: 'macro_123',
    userId: 'user_123',
    dailyCalories: 2500,
    proteinGrams: 150,
    carbsGrams: 300,
    fatGrams: 80,
    fitnessGoal: 'Muscle Gain',
    activityLevel: 'moderate',
    lastUpdated: '2024-12-19T00:00:00Z',
    isAIAdjusted: false,
    ...overrides,
  };
}

export function createMockCustomFood(overrides: Partial<CustomFood> = {}): CustomFood {
  return {
    id: 'food_123',
    userId: 'user_123',
    name: 'Chicken Breast',
    caloriesPerUnit: 165,
    proteinPerUnit: 31,
    carbsPerUnit: 0,
    fatPerUnit: 3.6,
    unit: '100g',
    isVerified: true,
    flaggedAsOutlier: false,
    createdAt: '2024-12-19T00:00:00Z',
    updatedAt: '2024-12-19T00:00:00Z',
    ...overrides,
  };
}

export function createMockDataConflict(overrides: Partial<DataConflict> = {}): DataConflict {
  return {
    id: 'conflict_123',
    userId: 'user_123',
    entityType: 'workout',
    entityId: 'workout_123',
    mobileVersion: { name: 'Push Day', status: 'completed' },
    webVersion: { name: 'Push Day Modified', status: 'completed' },
    conflictFields: ['name'],
    resolution: 'pending',
    autoMerged: false,
    createdAt: '2024-12-19T00:00:00Z',
    ...overrides,
  };
}

// =============================================================================
// CONTRACT VALIDATION HELPERS
// =============================================================================

export class ContractValidator {
  private validationErrors: string[] = [];

  /**
   * Validate request data against schema
   */
  validateRequest<T>(schemaName: keyof typeof allSchemas, data: unknown): ValidationResult<T> {
    const schema = allSchemas[schemaName];
    if (!schema) {
      throw new Error(`Schema ${schemaName} not found`);
    }
    
    const result = validateSchema(schema, data);
    if (!result.success) {
      this.validationErrors.push(...result.errors);
    }
    
    return result as ValidationResult<T>;
  }

  /**
   * Validate response data against schema
   */
  validateResponse<T>(schemaName: keyof typeof allSchemas, data: unknown): ValidationResult<T> {
    return this.validateRequest<T>(schemaName, data);
  }

  /**
   * Get all validation errors encountered
   */
  getErrors(): string[] {
    return [...this.validationErrors];
  }

  /**
   * Clear validation errors
   */
  clearErrors(): void {
    this.validationErrors = [];
  }

  /**
   * Check if any validation errors occurred
   */
  hasErrors(): boolean {
    return this.validationErrors.length > 0;
  }
}

// =============================================================================
// MOCK API FUNCTIONS
// =============================================================================

export interface MockApiOptions {
  shouldSucceed?: boolean;
  delay?: number;
  customResponse?: unknown;
  validationError?: boolean;
}

export class MockApiClient {
  private validator = new ContractValidator();

  /**
   * Mock authentication API calls
   */
  async mockBiometricChallenge(
    request: unknown,
    options: MockApiOptions = {}
  ): Promise<unknown> {
    const validation = this.validator.validateRequest('BiometricChallengeRequestSchema', request);
    
    if (!validation.success && !options.validationError) {
      throw new Error(`Request validation failed: ${validation.errors.join(', ')}`);
    }

    if (options.delay) {
      await new Promise(resolve => setTimeout(resolve, options.delay));
    }

    if (options.customResponse) {
      return options.customResponse;
    }

    if (!options.shouldSucceed) {
      throw new Error('Biometric challenge failed');
    }

    return {
      challenge: 'mock_challenge_123',
      timeout: 300,
      allowCredentials: [],
    };
  }

  async mockBiometricVerify(
    request: unknown,
    options: MockApiOptions = {}
  ): Promise<unknown> {
    if (options.delay) {
      await new Promise(resolve => setTimeout(resolve, options.delay));
    }

    if (options.customResponse) {
      return options.customResponse;
    }

    if (!options.shouldSucceed) {
      throw new Error('Biometric verification failed');
    }

    return {
      success: true,
      sessionToken: 'mock_token_123',
      user: createMockUserProfile(),
    };
  }

  async mockEmailLogin(
    request: unknown,
    options: MockApiOptions = {}
  ): Promise<unknown> {
    const validation = this.validator.validateRequest('EmailLoginRequestSchema', request);
    
    if (!validation.success && !options.validationError) {
      throw new Error(`Request validation failed: ${validation.errors.join(', ')}`);
    }

    if (options.delay) {
      await new Promise(resolve => setTimeout(resolve, options.delay));
    }

    if (options.customResponse) {
      return options.customResponse;
    }

    if (!options.shouldSucceed) {
      throw new Error('Email login failed');
    }

    return {
      success: true,
      sessionToken: 'mock_token_123',
      user: createMockUserProfile(),
      requiresBiometricSetup: false,
    };
  }

  /**
   * Mock workout API calls
   */
  async mockWorkoutSummaries(
    request: unknown,
    options: MockApiOptions = {}
  ): Promise<unknown> {
    const validation = this.validator.validateRequest('WorkoutSummaryRequestSchema', request);
    
    if (!validation.success && !options.validationError) {
      throw new Error(`Request validation failed: ${validation.errors.join(', ')}`);
    }

    if (options.delay) {
      await new Promise(resolve => setTimeout(resolve, options.delay));
    }

    if (options.customResponse) {
      return options.customResponse;
    }

    return {
      workouts: [
        createMockWorkoutSummary(),
        createMockWorkoutSummary({ id: 'workout_124', name: 'Pull Day' }),
      ],
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalCount: 2,
        hasMore: false,
      },
    };
  }

  async mockWorkoutDetail(
    request: unknown,
    options: MockApiOptions = {}
  ): Promise<unknown> {
    if (options.delay) {
      await new Promise(resolve => setTimeout(resolve, options.delay));
    }

    if (options.customResponse) {
      return options.customResponse;
    }

    return {
      id: 'workout_123',
      name: 'Push Day',
      date: '2024-12-19',
      status: 'completed',
      exercises: [
        {
          id: 'exercise_1',
          name: 'Bench Press',
          sets: {
            planned: 3,
            completed: 3,
            weights: [135, 155, 175],
            reps: [10, 8, 6],
            skipped: false,
          },
        },
      ],
      performanceMetrics: {
        totalWeight: 465,
        totalReps: 24,
        averageIntensity: 85,
      },
    };
  }

  async mockWeightUpdate(
    request: unknown,
    options: MockApiOptions = {}
  ): Promise<unknown> {
    const validation = this.validator.validateRequest('WeightUpdateRequestSchema', request);
    
    if (!validation.success && !options.validationError) {
      throw new Error(`Request validation failed: ${validation.errors.join(', ')}`);
    }

    if (options.delay) {
      await new Promise(resolve => setTimeout(resolve, options.delay));
    }

    if (options.customResponse) {
      return options.customResponse;
    }

    return {
      success: true,
      updatedExercise: {
        id: 'exercise_1',
        name: 'Bench Press',
        sets: {
          planned: 3,
          completed: 3,
          weights: [135, 155, 175],
          reps: [10, 8, 6],
          skipped: false,
        },
      },
    };
  }

  /**
   * Get validator instance for testing
   */
  getValidator(): ContractValidator {
    return this.validator;
  }
}

// =============================================================================
// VITEST HELPERS
// =============================================================================

export function createMockFunction<T extends (...args: unknown[]) => unknown>(): MockedFunction<T> {
  return vi.fn() as MockedFunction<T>;
}

export function setupApiMocks() {
  const mockFetch = vi.fn();
  global.fetch = mockFetch;

  const mockApiClient = new MockApiClient();

  return {
    mockFetch,
    mockApiClient,
    resetMocks: () => {
      vi.clearAllMocks();
      mockApiClient.getValidator().clearErrors();
    },
  };
}

// =============================================================================
// WEBAUTHN MOCKS
// =============================================================================

export function mockWebAuthnGlobals() {
  // Mock navigator.credentials
  const mockCredentials = {
    create: vi.fn(),
    get: vi.fn(),
  };

  Object.defineProperty(navigator, 'credentials', {
    value: mockCredentials,
    configurable: true,
  });

  // Mock PublicKeyCredential
  const mockPublicKeyCredential = {
    isUserVerifyingPlatformAuthenticatorAvailable: vi.fn().mockResolvedValue(true),
    isConditionalMediationAvailable: vi.fn().mockResolvedValue(true),
  };

  (global as Record<string, unknown>).PublicKeyCredential = mockPublicKeyCredential;

  return {
    mockCredentials,
    mockPublicKeyCredential,
  };
}

// =============================================================================
// ERROR SIMULATION HELPERS
// =============================================================================

export class ErrorSimulator {
  static networkError(): Error {
    return new Error('Network error');
  }

  static timeoutError(): Error {
    return new Error('Request timeout');
  }

  static authenticationError(): Error {
    return new Error('Authentication failed');
  }

  static validationError(field: string, message: string): Error {
    return new Error(`Validation error: ${field} - ${message}`);
  }

  static serverError(): Error {
    return new Error('Internal server error');
  }

  static rateLimitError(): Error {
    return new Error('Rate limit exceeded');
  }
}

// =============================================================================
// RESPONSE ASSERTION HELPERS
// =============================================================================

export function assertValidResponse<T>(
  response: unknown,
  schemaName: keyof typeof allSchemas
): asserts response is T {
  const validator = new ContractValidator();
  const result = validator.validateResponse(schemaName, response);
  
  if (!result.success) {
    throw new Error(`Response validation failed: ${result.errors.join(', ')}`);
  }
}

export function assertValidRequest<T>(
  request: unknown,
  schemaName: keyof typeof allSchemas
): asserts request is T {
  const validator = new ContractValidator();
  const result = validator.validateRequest(schemaName, request);
  
  if (!result.success) {
    throw new Error(`Request validation failed: ${result.errors.join(', ')}`);
  }
}

// =============================================================================
// TEST DATA FACTORIES
// =============================================================================

export const TestDataFactory = {
  createValidBiometricChallengeRequest: () => ({
    userEmail: 'test@example.com',
  }),

  createValidEmailLoginRequest: () => ({
    email: 'test@example.com',
    password: 'password123',
  }),

  createValidWorkoutSummaryRequest: () => ({
    userId: 'user_123',
    page: 1,
    limit: 10,
  }),

  createValidMacroUpdateRequest: () => ({
    userId: 'user_123',
    dailyCalories: 2500,
    proteinGrams: 150,
    fitnessGoal: 'Muscle Gain' as const,
  }),

  createValidCustomFoodRequest: () => ({
    userId: 'user_123',
    name: 'Test Food',
    caloriesPerUnit: 100,
    proteinPerUnit: 20,
    carbsPerUnit: 5,
    fatPerUnit: 2,
    unit: '100g',
  }),

  createInvalidRequest: (missingField: string) => {
    const validRequest = TestDataFactory.createValidEmailLoginRequest();
    delete (validRequest as Record<string, unknown>)[missingField];
    return validRequest;
  },
} as const;