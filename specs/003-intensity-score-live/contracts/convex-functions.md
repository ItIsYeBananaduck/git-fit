# Convex Contracts: Intensity Score (Live)

## Overview
Convex functions for real-time workout intensity scoring with strain monitoring, AI coaching, and social features. All operations use Convex's type-safe database with real-time subscriptions.

## Convex Schema Extensions

```typescript
// Add to app/convex/schema.ts
export default defineSchema({
  // ... existing tables

  intensityScores: defineTable({
    userId: v.id("users"),
    workoutSessionId: v.id("workoutSessions"),
    setId: v.id("workoutSets"),
    tempoScore: v.number(),           // 0-100
    motionSmoothnessScore: v.number(), // 0-100
    repConsistencyScore: v.number(),   // 0-100
    userFeedbackScore: v.number(),     // -15 to +20
    strainModifier: v.number(),        // 0.85, 0.95, or 1.0
    totalScore: v.number(),            // Calculated final score
    isEstimated: v.boolean(),          // True if no wearable data
    createdAt: v.number(),             // Unix timestamp
  })
    .index("by_user", ["userId"])
    .index("by_workout_session", ["workoutSessionId"])
    .index("by_user_created", ["userId", "createdAt"])
    .searchIndex("by_exercise_and_date", {
      searchField: "exerciseId",
      filterFields: ["userId", "createdAt"]
    }),

  aiCoachingContext: defineTable({
    userId: v.id("users"),
    coachPersonality: v.union(v.literal("alice"), v.literal("aiden")),
    currentStrainStatus: v.union(
      v.literal("green"), 
      v.literal("yellow"), 
      v.literal("red")
    ),
    calibrationPhase: v.union(
      v.literal("week1"),
      v.literal("active"), 
      v.literal("complete")
    ),
    voiceEnabled: v.boolean(),
    hasEarbuds: v.boolean(),
    voiceIntensity: v.number(),        // 0-100
    isZenMode: v.boolean(),
    lastCoachingMessage: v.string(),
    updatedAt: v.number(),             // Unix timestamp
  })
    .index("by_user", ["userId"]),

  supplementStacks: defineTable({
    userId: v.id("users"),
    scanDate: v.number(),              // Unix timestamp
    lockUntilDate: v.number(),         // scanDate + 28 days
    isLocked: v.boolean(),
    performanceBaseline: v.optional(v.object({
      avgIntensityScore: v.number(),
      avgRecoveryTime: v.number(),
      workoutFrequency: v.number(),
    })),
    lastModification: v.number(),
    isShared: v.boolean(),
    autoWipeDate: v.number(),          // scanDate + 52 weeks
  })
    .index("by_user", ["userId"])
    .index("by_auto_wipe", ["autoWipeDate"]),

  supplementItems: defineTable({
    stackId: v.id("supplementStacks"),
    barcode: v.string(),
    name: v.string(),                  // From OpenFoodFacts
    dosage: v.string(),
    timing: v.string(),
    isRxCompound: v.boolean(),
    publicHash: v.optional(v.string()), // Only if not Rx
    categoryType: v.string(),
  })
    .index("by_stack", ["stackId"])
    .index("by_barcode", ["barcode"]),

  socialShares: defineTable({
    userId: v.id("users"),
    contentType: v.union(
      v.literal("workout"),
      v.literal("supplement_stack"),
      v.literal("exercise_demo")
    ),
    contentId: v.string(),             // ID of shared content
    isPublic: v.boolean(),
    likesCount: v.number(),
    clusteredBy: v.array(v.string()), // Clustering criteria
    ghostMode: v.boolean(),           // Anonymous sharing
    sharedAt: v.number(),             // Unix timestamp
    lastInteraction: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_content", ["contentType", "contentId"])
    .index("by_clustering", ["clusteredBy"]),
});
```

## Convex Mutations

### `intensity:calculateScore`

Calculate and store intensity score for a workout set.

**Arguments:**
```typescript
{
  workoutSessionId: Id<"workoutSessions">;
  setId: Id<"workoutSets">;
  tempoScore: number;               // 0-100
  motionSmoothnessScore: number;    // 0-100
  repConsistencyScore: number;      // 0-100
  userFeedbackScore: number;        // -15 to +20
  strainModifier: number;           // 0.85, 0.95, or 1.0
  isEstimated: boolean;             // true if no wearable data
}
```

**Returns:**
```typescript
{
  intensityScoreId: Id<"intensityScores">;
  totalScore: number;               // Calculated final score
  isCapped: boolean;                // True if score was capped at 100%
}
```

**Implementation:**
```typescript
// app/convex/functions/intensity.ts
export const calculateScore = mutation({
  args: {
    workoutSessionId: v.id("workoutSessions"),
    setId: v.id("workoutSets"),
    tempoScore: v.number(),
    motionSmoothnessScore: v.number(),
    repConsistencyScore: v.number(),
    userFeedbackScore: v.number(),
    strainModifier: v.number(),
    isEstimated: v.boolean(),
  },
  handler: async (ctx, args) => {
    // Validate component scores
    if (args.tempoScore < 0 || args.tempoScore > 100) {
      throw new ConvexError("Tempo score must be 0-100");
    }
    
    // Calculate total score using the formula
    const totalScore = (
      args.tempoScore * 0.30 +
      args.motionSmoothnessScore * 0.25 +
      args.repConsistencyScore * 0.20 +
      args.userFeedbackScore * 0.15
    ) * args.strainModifier;
    
    // Apply capping for regular users
    const user = await ctx.db.get(ctx.auth.getUserIdentity().userId);
    const isCapped = user?.role !== "trainer" && totalScore > 100;
    const finalScore = isCapped ? 100 : totalScore;
    
    const intensityScoreId = await ctx.db.insert("intensityScores", {
      userId: ctx.auth.getUserIdentity().userId,
      workoutSessionId: args.workoutSessionId,
      setId: args.setId,
      tempoScore: args.tempoScore,
      motionSmoothnessScore: args.motionSmoothnessScore,
      repConsistencyScore: args.repConsistencyScore,
      userFeedbackScore: args.userFeedbackScore,
      strainModifier: args.strainModifier,
      totalScore: finalScore,
      isEstimated: args.isEstimated,
      createdAt: Date.now(),
    });
    
    return {
      intensityScoreId,
      totalScore: finalScore,
      isCapped,
    };
  },
});
```

### `coaching:updateContext`

Update AI coaching context with latest strain and performance data.

**Arguments:**
```typescript
{
  currentStrainStatus: "green" | "yellow" | "red";
  intensityScoreId?: Id<"intensityScores">;
  voiceEnabled: boolean;
  hasEarbuds: boolean;
  voiceIntensity: number;           // 0-100
  isZenMode: boolean;
  workoutPhase: "warmup" | "working_sets" | "cooldown";
}
```

**Returns:**
```typescript
{
  coachingMessage: string;          // Personalized coaching response
  voiceMessage?: string;            // Audio message if voice enabled
  intensityAdjustment?: {
    suggestedRestExtension: number; // Additional seconds
    shouldReduceIntensity: boolean;
    reasonCode: string;
  };
}
```

### `supplements:scanItem`

Process barcode scan and create supplement item.

**Arguments:**
```typescript
{
  barcode: string;
  dosage?: string;
  timing?: string;
}
```

**Returns:**
```typescript
{
  item: {
    itemId: Id<"supplementItems">;
    name: string;
    isRxCompound: boolean;
    publicHash?: string;
  };
  nutritionFacts?: object;
  warningFlags: string[];
}
```

### `supplements:createStack`

Create or update user's supplement stack.

**Arguments:**
```typescript
{
  supplementItems: Id<"supplementItems">[];
  performanceBaseline?: {
    avgIntensityScore: number;
    avgRecoveryTime: number;
    workoutFrequency: number;
  };
  replaceExisting: boolean;
}
```

**Returns:**
```typescript
{
  stackId: Id<"supplementStacks">;
  isLocked: boolean;
  lockUntilDate: number;
  supplementCount: number;
  autoWipeDate: number;
}
```

### `social:shareContent`

Share workout data or supplement stack with community.

**Arguments:**
```typescript
{
  contentType: "workout" | "supplement_stack" | "exercise_demo";
  contentId: string;
  isPublic: boolean;
  ghostMode: boolean;
  clusteringCriteria: string[];
}
```

**Returns:**
```typescript
{
  shareId: Id<"socialShares">;
  expectedReach: number;
  privacyLevel: "public" | "clustered" | "ghost";
  medicalDataFiltered: boolean;
}
```

## Convex Queries

### `intensity:getHistory`

Retrieve intensity score history for analysis and coaching.

**Arguments:**
```typescript
{
  userId?: Id<"users">;             // Optional, defaults to current user
  limit?: number;                   // Default 50, max 200
  offset?: number;                  // Default 0
  exerciseId?: string;              // Optional filter
  dateFrom?: number;                // Unix timestamp
  dateTo?: number;                  // Unix timestamp
}
```

**Returns:**
```typescript
{
  scores: IntensityScore[];
  totalCount: number;
  hasMore: boolean;
  avgScore: number;
  trendDirection: "up" | "down" | "stable";
}
```

### `coaching:getVoiceStatus`

Get current voice coaching status and settings.

**Returns:**
```typescript
{
  voiceEnabled: boolean;
  hasEarbuds: boolean;
  coachPersonality: "alice" | "aiden";
  voiceIntensity: number;
  isZenMode: boolean;
  lastVoiceMessage?: string;
  estimatedBatteryImpact: number;
}
```

### `supplements:getStack`

Retrieve user's current supplement stack.

**Arguments:**
```typescript
{
  userId?: Id<"users">;             // Optional, defaults to current user
  includeRx?: boolean;              // Default false, only owner can set true
  format?: "full" | "public";      // Default "full" for owner
}
```

**Returns:**
```typescript
{
  stack: {
    stackId: Id<"supplementStacks">;
    items: SupplementItem[];
    scanDate: number;
    isLocked: boolean;
    lockUntilDate?: number;
    performanceCorrelation?: {
      workoutImprovements: number;
      recoveryImprovements: number;
      confidenceScore: number;
    };
  };
  privacyNote?: string;
}
```

### `social:getFeed`

Retrieve personalized social feed based on clustering.

**Arguments:**
```typescript
{
  limit?: number;                   // Default 20, max 50
  offset?: number;                  // Default 0
  contentType?: string;             // Optional filter
  clusterId?: string;               // Optional debugging
}
```

**Returns:**
```typescript
{
  items: SocialShare[];
  clusteringUsed: string[];
  hasMore: boolean;
  refreshInterval: number;          // Seconds until new content
}
```

## Convex Actions (HTTP/External APIs)

### `supplements:fetchProductData`

Fetch supplement information from OpenFoodFacts API.

**Arguments:**
```typescript
{
  barcode: string;
}
```

**Returns:**
```typescript
{
  name: string;
  categoryType: string;
  nutritionFacts: object;
  isRxCompound: boolean;           // Auto-detected
  ingredients: string[];
}
```

### `coaching:generateVoiceMessage`

Generate AI voice coaching message (calls external AI service).

**Arguments:**
```typescript
{
  coachPersonality: "alice" | "aiden";
  message: string;
  voiceIntensity: number;
  userId: Id<"users">;
}
```

**Returns:**
```typescript
{
  audioUrl: string;                // Temporary URL for audio file
  duration: number;                // Length in seconds
  expiresAt: number;               // Unix timestamp
}
```

## Real-Time Subscriptions

### Intensity Score Updates

**Query:** `intensity:watchWorkoutIntensity`
```typescript
// Real-time intensity scores for active workout
const intensityScores = useQuery(api.intensity.watchWorkoutIntensity, {
  workoutSessionId: currentWorkoutId
});
```

### Coaching Context Changes

**Query:** `coaching:watchContext`
```typescript
// Live coaching context updates
const coachingContext = useQuery(api.coaching.watchContext, {
  userId: currentUserId
});
```

### Social Feed Updates

**Query:** `social:watchFeed`
```typescript
// Live social feed with new content
const socialFeed = useQuery(api.social.watchFeed, {
  limit: 20
});
```

## Convex Scheduled Actions

### `supplements:cleanupExpiredStacks`

Auto-wipe supplement stacks after 52 weeks (runs daily).

```typescript
// app/convex/crons.ts
export default cronJobs;

cronJobs.daily(
  "cleanup expired supplement stacks",
  { hourUTC: 2, minuteUTC: 0 }, // 2 AM UTC daily
  internal.supplements.cleanupExpiredStacks,
);
```

### `intensity:calculateWeeklyTrends`

Calculate weekly intensity trends for AI coaching (runs Mondays).

```typescript
cronJobs.weekly(
  "calculate intensity trends",
  { dayOfWeek: "monday", hourUTC: 1, minuteUTC: 0 },
  internal.intensity.calculateWeeklyTrends,
);
```

### `social:updateFeedClustering`

Refresh social feed clustering algorithms (runs daily).

```typescript
cronJobs.daily(
  "update social clustering",
  { hourUTC: 3, minuteUTC: 30 },
  internal.social.updateFeedClustering,
);
```

## File Structure

```
app/convex/
├── functions/
│   ├── intensity.ts        # Intensity scoring mutations and queries
│   ├── coaching.ts         # AI coaching context management  
│   ├── supplements.ts      # Supplement stack operations
│   └── social.ts          # Social sharing functionality
├── actions/
│   ├── supplements.ts      # OpenFoodFacts API integration
│   └── coaching.ts        # AI voice generation service
├── schema.ts              # Extended with new tables
└── crons.ts               # Scheduled background tasks
```

## Authentication & Permissions

All functions use Convex's built-in authentication:

```typescript
// User must be authenticated
const identity = await ctx.auth.getUserIdentity();
if (!identity) throw new ConvexError("Not authenticated");

// Role-based access (trainers vs users)
const user = await ctx.db.get(identity.userId);
const isTrainer = user?.role === "trainer";

// Own data access only (except trainers)
if (args.userId && args.userId !== identity.userId && !isTrainer) {
  throw new ConvexError("Access denied");
}
```

## Rate Limiting

Convex provides built-in rate limiting per function:

- Mutations: 1000 requests/minute per user
- Queries: Unlimited (cached automatically)  
- Actions: 100 requests/minute per user (external API calls)
- Real-time subscriptions: Auto-throttled based on changes

## Error Handling

All functions use Convex's `ConvexError` for consistent error responses:

```typescript
import { ConvexError } from "convex/values";

// Validation errors
if (score < 0 || score > 100) {
  throw new ConvexError("Score must be between 0-100");
}

// Permission errors  
if (!canAccess) {
  throw new ConvexError("Access denied");
}

// External service errors
try {
  const result = await externalAPI();
} catch (error) {
  throw new ConvexError("External service unavailable");
}
```