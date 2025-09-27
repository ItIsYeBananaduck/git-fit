# Convex Contracts: Intensity Score (Live)

## Overview
Convex functions for real-time workout intensity scoring with strain monitoring, AI coaching, and social features. All operations use Convex's type-safe database with real-time subscriptions.

## Convex Mutations

### `intensity:calculateScore`
Calculate and store intensity score for a workout set.

**Request Body:**
```typescript
{
  workoutSessionId: string;
  setId: string;
  tempoScore: number;        // 0-100
  motionSmoothnessScore: number;  // 0-100
  repConsistencyScore: number;    // 0-100
  userFeedbackScore: number;      // -15 to +20
  strainModifier: number;         // 0.85, 0.95, or 1.0
  isEstimated: boolean;          // true if no wearable data
}
```

**Response:**
```typescript
{
  id: string;
  totalScore: number;        // Calculated final score
  createdAt: string;         // ISO date
  isCapped: boolean;         // True if score was capped at 100%
}
```

**Status Codes:**
- 201: Score created successfully
- 400: Invalid input data (component scores out of range)
- 404: Workout session or set not found
- 429: Rate limit exceeded (max 1 request per second)

### GET /api/intensity/history/:userId
Retrieve intensity score history for analysis and coaching.

**Query Parameters:**
- `limit`: number (default: 50, max: 200)
- `offset`: number (default: 0)  
- `exerciseId`: string (optional filter)
- `dateFrom`: string (ISO date, optional)
- `dateTo`: string (ISO date, optional)

**Response:**
```typescript
{
  scores: IntensityScore[];
  totalCount: number;
  hasMore: boolean;
  avgScore: number;         // Average for the period
  trendDirection: 'up' | 'down' | 'stable';
}
```

**Status Codes:**
- 200: History retrieved successfully  
- 403: Access denied (can only view own history)
- 422: Invalid date range or parameters

### POST /api/coaching/context
Update AI coaching context with latest strain and performance data.

**Request Body:**
```typescript
{
  currentStrainStatus: 'green' | 'yellow' | 'red';
  intensityScoreId?: string;    // Optional, if available
  voiceEnabled: boolean;
  hasEarbuds: boolean;
  voiceIntensity: number;       // 0-100
  isZenMode: boolean;
  workoutPhase: 'warmup' | 'working_sets' | 'cooldown';
}
```

**Response:**
```typescript
{
  coachingMessage: string;      // Personalized coaching response
  voiceMessage?: string;        // Audio message if voice enabled
  intensityAdjustment?: {
    suggestedRestExtension: number;  // Additional seconds
    shouldReduceIntensity: boolean;
    reasonCode: string;
  };
  updatedAt: string;           // ISO timestamp
}
```

**Status Codes:**
- 200: Context updated, coaching response generated
- 400: Invalid strain status or voice settings
- 503: AI coaching service temporarily unavailable

### GET /api/coaching/voice-status/:userId
Check voice coaching availability and settings.

**Response:**
```typescript
{
  voiceEnabled: boolean;
  hasEarbuds: boolean;
  coachPersonality: 'alice' | 'aiden';
  voiceIntensity: number;
  isZenMode: boolean;
  lastVoiceMessage?: string;
  estimatedBatteryImpact: number;  // Percentage per hour
}
```

### POST /api/supplements/scan
Process barcode scan and retrieve supplement information.

**Request Body:**
```typescript
{
  barcode: string;
  dosage?: string;            // User-specified dosage
  timing?: string;            // When supplement is taken
}
```

**Response:**
```typescript
{
  item: {
    barcode: string;
    name: string;             // From OpenFoodFacts
    categoryType: string;
    isRxCompound: boolean;    // Auto-detected from name/ingredients
    publicHash?: string;      // Only if not Rx compound
  };
  nutritionFacts?: object;    // Full nutrition data
  warningFlags: string[];     // Potential interaction warnings
}
```

**Status Codes:**
- 201: Supplement scanned and processed
- 400: Invalid barcode format
- 404: Product not found in OpenFoodFacts database
- 422: Unable to determine if Rx compound

### POST /api/supplements/stack
Create or update user's supplement stack.

**Request Body:**
```typescript
{
  supplements: SupplementItem[];
  performanceBaseline?: object;  // Current performance metrics
  replaceExisting: boolean;      // True to replace entire stack
}
```

**Response:**
```typescript
{
  stackId: string;
  scanDate: string;             // ISO date
  lockUntilDate: string;        // 28 days from scan
  isLocked: boolean;
  supplementCount: number;
  rxCompoundCount: number;      // Not shared publicly
  autoWipeDate: string;         // 52 weeks from scan
}
```

**Status Codes:**
- 201: Stack created successfully
- 400: Stack is currently locked for modifications
- 413: Too many supplements (max 50 per stack)

### GET /api/supplements/stack/:userId
Retrieve user's current supplement stack.

**Query Parameters:**
- `includeRx`: boolean (default: false, only owner can set true)
- `format`: 'full' | 'public' (default: 'full' for owner, 'public' for others)

**Response:**
```typescript
{
  stack: {
    id: string;
    supplements: SupplementItem[];  // Filtered based on format
    scanDate: string;
    isLocked: boolean;
    lockUntilDate?: string;
    performanceCorrelation?: {
      workoutImprovements: number;    // Percentage change
      recoveryImprovements: number;
      confidenceScore: number;        // 0-100
    };
  };
  privacyNote?: string;  // If viewing public version
}
```

### PUT /api/supplements/stack/:stackId/unlock
Request early unlock for supplement stack modification.

**Request Body:**
```typescript
{
  reason: 'medical_change' | 'dosage_adjustment' | 'supplement_discontinuation';
  details?: string;           // Optional explanation
}
```

**Response:**
```typescript
{
  unlocked: boolean;
  unlockDuration: number;     // Hours allowed for modification
  expiresAt: string;          // ISO timestamp
  modificationsAllowed: number;  // Number of changes permitted
}
```

**Status Codes:**
- 200: Stack temporarily unlocked
- 400: Invalid reason or stack not locked
- 429: Too many unlock requests (max 2 per month)

### POST /api/social/share
Share workout data or supplement stack with community.

**Request Body:**
```typescript
{
  contentType: 'workout' | 'supplement_stack' | 'exercise_demo';
  contentId: string;
  isPublic: boolean;          // True for public, false for clustered sharing
  ghostMode: boolean;         // Anonymous sharing
  clusteringCriteria: string[];  // For algorithmic matching
}
```

**Response:**
```typescript
{
  shareId: string;
  shareUrl?: string;          // If public sharing
  expectedReach: number;      // Estimated users who will see it
  privacyLevel: 'public' | 'clustered' | 'ghost';
  medicalDataFiltered: boolean;  // True if Rx compounds removed
}
```

**Status Codes:**
- 201: Content shared successfully
- 400: Invalid content type or ID
- 403: Content contains private medical information
- 422: User has reached daily sharing limit (10 per day)

### GET /api/social/feed/:userId
Retrieve personalized social feed based on clustering.

**Query Parameters:**
- `limit`: number (default: 20, max: 50)
- `offset`: number (default: 0)
- `contentType`: string (optional filter)
- `clusterId`: string (optional, for debugging)

**Response:**
```typescript
{
  items: SocialShareItem[];
  clusteringUsed: string[];   // Active clustering criteria
  hasMore: boolean;
  refreshInterval: number;    // Seconds until new content available
}
```

## Real-Time WebSocket Events

### Connection: `/ws/intensity/:userId`
Real-time intensity scoring and coaching updates during workouts.

**Authentication:** Bearer token in connection headers

#### Client → Server Events

**strain_update:**
```typescript
{
  event: 'strain_update';
  data: {
    strainScore: number;       // 0-100
    status: 'green' | 'yellow' | 'red';
    timestamp: number;         // Unix timestamp
  };
}
```

**set_completed:**
```typescript
{
  event: 'set_completed';
  data: {
    setId: string;
    intensityComponents: {
      tempoScore: number;
      motionSmoothnessScore: number;
      repConsistencyScore: number;
      userFeedbackScore: number;
    };
    strainModifier: number;
  };
}
```

**voice_feedback:**
```typescript
{
  event: 'voice_feedback';
  data: {
    enabled: boolean;
    intensity: number;         // 0-100
    isZenMode: boolean;
  };
}
```

#### Server → Client Events

**coaching_message:**
```typescript
{
  event: 'coaching_message';
  data: {
    message: string;
    voiceMessage?: string;     // Base64 encoded audio
    priority: 'low' | 'medium' | 'high';
    duration: number;          // Display duration in seconds
  };
}
```

**intensity_calculated:**
```typescript
{
  event: 'intensity_calculated';
  data: {
    intensityScoreId: string;
    totalScore: number;
    breakdown: {
      tempoScore: number;
      motionSmoothnessScore: number;
      repConsistencyScore: number;
      userFeedbackScore: number;
      strainModifier: number;
    };
    isCapped: boolean;
  };
}
```

**rest_extension:**
```typescript
{
  event: 'rest_extension';
  data: {
    additionalSeconds: number;
    reason: 'strain_too_high' | 'ai_recommendation';
    canOverride: boolean;
  };
}
```

**coaching_context_update:**
```typescript
{
  event: 'coaching_context_update';
  data: {
    calibrationPhase: 'week1' | 'active' | 'complete';
    adaptationsApplied: string[];  // List of recent adaptations
    nextCalibrationIn?: number;    // Days until next calibration
  };
}
```

## Rate Limits

| Endpoint | Limit | Window |
|----------|--------|---------|
| `/api/intensity/score` | 60 requests | 1 minute |
| `/api/coaching/context` | 120 requests | 1 minute |
| `/api/supplements/scan` | 30 requests | 1 minute |
| `/api/social/share` | 10 requests | 1 day |
| WebSocket strain_update | 1 per second | - |

## Error Response Format

All endpoints use consistent error response format:

```typescript
{
  error: {
    code: string;              // Machine-readable error code
    message: string;           // Human-readable message
    details?: object;          // Additional error context
    retryAfter?: number;       // Seconds before retry (for rate limits)
  };
  requestId: string;           // For debugging and support
  timestamp: string;           // ISO timestamp
}
```

## Authentication

All endpoints require JWT authentication with the following claims:
- `userId`: string - User identifier
- `role`: 'user' | 'trainer' | 'admin' - User role
- `subscriptionTier`: 'free' | 'pro' | 'elite' - Subscription level

WebSocket connections require the JWT token in the `Authorization` header during handshake.

## Caching Strategy

- Intensity scores: No caching (always fresh for analysis)
- Coaching context: 5-second cache to prevent excessive AI calls  
- Supplement data: 24-hour cache from OpenFoodFacts
- Social feed: 2-minute cache per user cluster
- Voice messages: 1-hour cache for repeated coaching scenarios