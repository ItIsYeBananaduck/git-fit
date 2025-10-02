# API Contracts: Web Dashboard UI

**Generated**: September 30, 2025  
**Format**: OpenAPI 3.0 Schema for Convex Functions

## Authentication API

### Biometric Authentication
```typescript
// POST /auth/biometric-challenge
interface BiometricChallengeRequest {
  userEmail: string;
}

interface BiometricChallengeResponse {
  challenge: string;
  timeout: number; // seconds
  allowCredentials: PublicKeyCredentialDescriptor[];
}

// POST /auth/biometric-verify  
interface BiometricVerifyRequest {
  challenge: string;
  credential: AuthenticatorAssertionResponse;
}

interface BiometricVerifyResponse {
  success: boolean;
  sessionToken: string;
  user: UserProfile;
}
```

### Email Authentication
```typescript
// POST /auth/email-login
interface EmailLoginRequest {
  email: string;
  password: string;
}

interface EmailLoginResponse {
  success: boolean;
  sessionToken: string;
  user: UserProfile;
  requiresBiometricSetup: boolean;
}

// GET /auth/session
interface SessionValidateResponse {
  valid: boolean;
  user: UserProfile;
  expiresAt: number;
}
```

## Workout Data API

### Workout Summaries
```typescript
// GET /workouts/summaries
interface WorkoutSummariesRequest {
  limit?: number; // default 10
  offset?: number; // default 0
  status?: 'completed' | 'planned' | 'all'; // default 'all'
}

interface WorkoutSummary {
  id: string;
  name: string;
  date: string;
  status: 'completed' | 'planned' | 'skipped';
  exercises: {
    name: string;
    completedSets: number;
    targetSets: number;
    completionRate: number;
  }[];
  totalVolume: number;
  duration?: number; // minutes
}

interface WorkoutSummariesResponse {
  workouts: WorkoutSummary[];
  totalCount: number;
  hasMore: boolean;
}
```

### Workout Details
```typescript
// GET /workouts/{id}
interface WorkoutDetailsResponse {
  id: string;
  name: string;
  date: string;
  status: 'completed' | 'planned' | 'skipped';
  exercises: {
    name: string;
    targetSets: number;
    completedSets: number;
    targetReps: number[];
    completedReps: number[];
    weights: number[];
    skipReason?: string;
    rpe?: number;
  }[];
  notes?: string;
  analytics: {
    totalVolume: number;
    completionRate: number;
    averageRPE?: number;
  };
}

// PUT /workouts/{id}/weights
interface UpdateWorkoutWeightsRequest {
  exercises: {
    name: string;
    weights: number[];
  }[];
}

interface UpdateWorkoutWeightsResponse {
  success: boolean;
  updatedExercises: string[];
}
```

### Data Conflict Resolution
```typescript
// POST /workouts/sync-conflict
interface SyncConflictRequest {
  conflictId: string;
  resolution: 'mobile' | 'web' | 'field_by_field';
  fieldSelections?: {
    [fieldName: string]: 'mobile' | 'web';
  };
}

interface SyncConflictResponse {
  success: boolean;
  resolvedData: any;
  autoMergedFields: string[];
}
```

## Macro Calculator API

### Macro Profile Management
```typescript
// GET /macros/profile
interface MacroProfileResponse {
  id: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  proteinRatio: number; // g/lb
  carbsPercentage: number;
  fatPercentage: number;
  calculationMethod: 'AI_adjusted' | 'manual' | 'goal_based';
  lastAIAdjustment?: number; // timestamp
  warnings: {
    lowProtein: boolean;
    message?: string;
  };
}

// PUT /macros/profile
interface UpdateMacroProfileRequest {
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  proteinRatio?: number;
  carbsPercentage?: number;
  fatPercentage?: number;
}

interface UpdateMacroProfileResponse {
  success: boolean;
  profile: MacroProfileResponse;
  warnings: string[];
}
```

### AI Macro Adjustments
```typescript
// POST /macros/ai-adjust
interface AIAdjustMacrosRequest {
  workoutPerformanceData: {
    lastWeekVolume: number;
    completionRate: number;
    averageRPE: number;
  };
  energyLevel: number; // 1-10 scale
  sleepQuality: number; // 1-10 scale
}

interface AIAdjustMacrosResponse {
  success: boolean;
  adjustments: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    reasoning: string;
  };
  confidence: number; // 0-1 scale
  needsUserApproval: boolean;
}
```

## Trainer Access API

### QR Code Generation
```typescript
// POST /trainer/generate-qr
interface GenerateQRRequest {
  permissions: string[]; // ['workout_summary', 'csv_export']
}

interface GenerateQRResponse {
  qrCodeData: string; // encrypted token
  expiresAt: number; // timestamp
  fallbackPIN: string; // 6-digit backup code
}
```

### Trainer-Client Linking
```typescript
// POST /trainer/link-client
interface LinkClientRequest {
  qrToken: string;
  trainerId: string;
}

interface LinkClientResponse {
  success: boolean;
  relationship: {
    id: string;
    trainerId: string;
    clientId: string;
    status: 'active';
    permissions: string[];
    createdAt: number;
  };
}

// DELETE /trainer/revoke-access
interface RevokeAccessRequest {
  relationshipId: string;
  revokedBy: 'trainer' | 'client';
  reason?: string;
}

interface RevokeAccessResponse {
  success: boolean;
  revokedAt: number;
}
```

### Trainer Data Access
```typescript
// GET /trainer/clients
interface TrainerClientsResponse {
  clients: {
    id: string;
    name: string;
    linkedAt: number;
    lastWorkout: string; // date
    recentActivity: {
      workoutSummary: string; // e.g., "Leg Day: 2/3 sets done, skipped 1: tired"
      completionRate: number;
    };
  }[];
}

// GET /trainer/client/{id}/data
interface ClientDataRequest {
  startDate?: string;
  endDate?: string;
  includeNotes?: boolean;
}

interface ClientDataResponse {
  client: {
    id: string;
    name: string;
  };
  workouts: WorkoutSummary[];
  analytics: {
    averageCompletionRate: number;
    totalVolume: number;
    skipPatterns: string[];
  };
  accessLogId: string; // for audit trail
}

// POST /trainer/export-csv
interface ExportCSVRequest {
  clientId: string;
  startDate: string;
  endDate: string;
  includeNotes: boolean;
}

interface ExportCSVResponse {
  downloadUrl: string;
  expiresAt: number;
  fileName: string;
}
```

## Food Database API

### Custom Food Management
```typescript
// POST /foods/custom
interface CreateCustomFoodRequest {
  name: string;
  caloriesPerUnit: number;
  proteinPerUnit: number;
  carbsPerUnit: number;
  fatPerUnit: number;
  unit: string; // serving size description
}

interface CreateCustomFoodResponse {
  success: boolean;
  food: {
    id: string;
    name: string;
    caloriesPerUnit: number;
    proteinPerUnit: number;
    carbsPerUnit: number;
    fatPerUnit: number;
    unit: string;
    isVerified: boolean;
    flaggedAsOutlier: boolean;
    warnings: string[];
  };
}

// GET /foods/custom
interface CustomFoodsResponse {
  foods: {
    id: string;
    name: string;
    caloriesPerUnit: number;
    proteinPerUnit: number;
    carbsPerUnit: number;
    fatPerUnit: number;
    unit: string;
    isVerified: boolean;
    flaggedAsOutlier: boolean;
  }[];
}
```

### Food Validation
```typescript
// POST /foods/validate
interface ValidateFoodRequest {
  name: string;
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  unit: string;
}

interface ValidateFoodResponse {
  isValid: boolean;
  warnings: {
    type: 'outlier' | 'impossible' | 'unusual';
    message: string;
    suggestion?: string;
  }[];
  confidence: number; // 0-1 scale
}

// PUT /foods/{id}/verify
interface VerifyFoodRequest {
  confirmed: boolean;
  userNote?: string;
}

interface VerifyFoodResponse {
  success: boolean;
  verified: boolean;
}
```

## Common Types

### User Profile
```typescript
interface UserProfile {
  id: string;
  email: string;
  name: string;
  weight: number; // pounds
  fitnessGoal: 'Fat Loss' | 'Muscle Gain' | 'Hypertrophy' | 'Powerlifting' | 'Bodybuilding';
  avatar?: string;
  preferences: {
    dataRetention: '30_days' | '6_months' | '1_year' | 'indefinite';
    notifications: boolean;
  };
}
```

### Error Response
```typescript
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: number;
}
```

### Pagination
```typescript
interface PaginationRequest {
  limit?: number; // default 10, max 100
  offset?: number; // default 0
}

interface PaginationResponse {
  totalCount: number;
  hasMore: boolean;
  nextOffset?: number;
}
```

---

**Contract Status**: ✅ Complete  
**Next Step**: Generate contract tests and quickstart guide