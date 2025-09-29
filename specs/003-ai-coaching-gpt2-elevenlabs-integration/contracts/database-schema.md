# Database Schema Contracts

## Convex Schema Definitions

### AI Coaching Personas Collection

```typescript
// convex/schema.ts additions

import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const aiCoachingPersonas = defineTable({
  id: v.string(), // "alice" | "aiden"
  name: v.string(),
  description: v.string(),
  voiceModel: v.string(), // ElevenLabs voice ID
  voicePreviewUrl: v.string(),
  personality: v.object({
    enthusiasm: v.number(), // 0-1
    supportiveness: v.number(), // 0-1
    directness: v.number(), // 0-1
    communicationStyle: v.string(),
  }),
  trainingPrompts: v.array(v.string()),
  isActive: v.boolean(),
  createdAt: v.number(),
  updatedAt: v.number(),
}).index("by_id", ["id"]);

export const workoutTriggers = defineTable({
  id: v.string(), // "onboarding" | "pre-start" | etc.
  name: v.string(),
  description: v.string(),
  promptTemplate: v.string(),
  requiredContext: v.array(v.string()),
  maxResponseLength: v.number(),
  priority: v.number(), // 1-10, higher = more important
  conditions: v.object({
    deviceRequired: v.optional(v.string()), // "earbuds" | "any"
    subscriptionLevel: v.optional(v.string()), // "free" | "pro" | "trainer"
    trainingPhase: v.optional(v.string()), // "onboarding" | "active" | "recovery"
  }),
  isActive: v.boolean(),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_id", ["id"])
  .index("by_priority", ["priority"]);

export const voiceResponses = defineTable({
  id: v.string(), // UUID
  userId: v.string(),
  triggerId: v.string(),
  personaId: v.string(),
  textContent: v.string(),
  toastMessage: v.string(),
  audioUrl: v.optional(v.string()),
  audioLength: v.optional(v.number()), // seconds
  metadata: v.object({
    generationLatency: v.number(), // ms
    ttsLatency: v.optional(v.number()), // ms
    cacheHit: v.boolean(),
    modelVersion: v.string(),
    inputTokens: v.number(),
    outputTokens: v.number(),
  }),
  workoutContext: v.object({
    exercise: v.optional(v.string()),
    reps: v.optional(v.number()),
    weight: v.optional(v.number()),
    strain: v.optional(v.number()),
    heartRate: v.optional(v.number()),
    sleepHours: v.optional(v.number()),
  }),
  deviceState: v.object({
    hasEarbuds: v.boolean(),
    audioEnabled: v.boolean(),
    platform: v.string(), // "ios" | "android" | "web"
  }),
  feedbackRating: v.optional(v.number()), // 1-5
  feedbackHelpful: v.optional(v.boolean()),
  feedbackComments: v.optional(v.string()),
  deletedAt: v.optional(v.number()), // GDPR compliance
  createdAt: v.number(),
})
  .index("by_user", ["userId"])
  .index("by_trigger", ["triggerId"])
  .index("by_persona", ["personaId"])
  .index("by_user_trigger", ["userId", "triggerId"])
  .index("by_created_at", ["createdAt"])
  .index("by_deleted_at", ["deletedAt"]);

export const userSubscriptions = defineTable({
  userId: v.string(),
  subscriptionType: v.string(), // "free" | "pro" | "trainer"
  voiceAccess: v.boolean(),
  trainingFrequency: v.string(), // "weekly" | "monthly" | "none"
  preferredPersona: v.string(), // "alice" | "aiden"
  devicePreferences: v.object({
    autoDetectEarbuds: v.boolean(),
    fallbackToSpeaker: v.boolean(),
    toastDuration: v.number(), // ms
    maxDailyCoaching: v.number(), // rate limiting
  }),
  privacySettings: v.object({
    allowDataCollection: v.boolean(),
    allowAITraining: v.boolean(),
    dataRetentionDays: v.number(), // 1-180
    excludeBiometrics: v.boolean(),
  }),
  usageStats: v.object({
    totalResponses: v.number(),
    monthlyResponses: v.number(),
    averageRating: v.optional(v.number()),
    lastUsed: v.optional(v.number()),
  }),
  isActive: v.boolean(),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_user", ["userId"])
  .index("by_subscription_type", ["subscriptionType"])
  .index("by_active", ["isActive"]);

export const trainingData = defineTable({
  id: v.string(), // UUID
  personaId: v.string(),
  inputPrompt: v.string(),
  expectedOutput: v.string(),
  actualOutput: v.optional(v.string()),
  quality: v.optional(v.number()), // 0-1 quality score
  userFeedback: v.optional(
    v.object({
      rating: v.number(), // 1-5
      helpful: v.boolean(),
      comments: v.optional(v.string()),
    })
  ),
  trainingMetrics: v.object({
    loss: v.optional(v.number()),
    accuracy: v.optional(v.number()),
    perplexity: v.optional(v.number()),
  }),
  isValidated: v.boolean(),
  usedInTraining: v.boolean(),
  trainingBatch: v.optional(v.string()),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_persona", ["personaId"])
  .index("by_validated", ["isValidated"])
  .index("by_training_batch", ["trainingBatch"])
  .index("by_quality", ["quality"]);

export const audioCache = defineTable({
  cacheKey: v.string(), // hash of text + persona + voice settings
  textContent: v.string(),
  personaId: v.string(),
  audioUrl: v.string(),
  audioLength: v.number(), // seconds
  fileSize: v.number(), // bytes
  format: v.string(), // "mp3" | "wav"
  quality: v.string(), // "low" | "medium" | "high"
  generationCost: v.number(), // USD
  hitCount: v.number(),
  lastAccessed: v.number(),
  expiresAt: v.number(), // TTL for cache eviction
  createdAt: v.number(),
})
  .index("by_cache_key", ["cacheKey"])
  .index("by_persona", ["personaId"])
  .index("by_expires_at", ["expiresAt"])
  .index("by_hit_count", ["hitCount"])
  .index("by_last_accessed", ["lastAccessed"]);
```

## Database Constraints

### Data Validation Rules

```typescript
// Validation functions for database operations

export function validateCoachingTriggerRequest(request: any): boolean {
  const validTriggers = [
    "onboarding",
    "pre-start",
    "set-start",
    "set-end",
    "strainsync",
    "workout-end",
  ];
  const validPersonas = ["alice", "aiden"];

  if (!validTriggers.includes(request.triggerId)) return false;
  if (request.personaId && !validPersonas.includes(request.personaId))
    return false;
  if (
    request.workoutContext?.strain &&
    (request.workoutContext.strain < 0 || request.workoutContext.strain > 100)
  )
    return false;
  if (request.workoutContext?.reps && request.workoutContext.reps < 1)
    return false;
  if (request.workoutContext?.weight && request.workoutContext.weight < 0)
    return false;

  return true;
}

export function validateSubscriptionUpdate(update: any): boolean {
  const validPersonas = ["alice", "aiden"];
  const validSubscriptionTypes = ["free", "pro", "trainer"];

  if (
    update.preferredPersona &&
    !validPersonas.includes(update.preferredPersona)
  )
    return false;
  if (
    update.subscriptionType &&
    !validSubscriptionTypes.includes(update.subscriptionType)
  )
    return false;
  if (
    update.privacySettings?.dataRetentionDays &&
    (update.privacySettings.dataRetentionDays < 1 ||
      update.privacySettings.dataRetentionDays > 180)
  )
    return false;
  if (
    update.devicePreferences?.toastDuration &&
    (update.devicePreferences.toastDuration < 1000 ||
      update.devicePreferences.toastDuration > 10000)
  )
    return false;

  return true;
}
```

### Privacy Compliance Constraints

```typescript
// GDPR/CCPA compliance functions

export async function scheduleDataDeletion(
  userId: string,
  days: number
): Promise<void> {
  const deletionDate = Date.now() + days * 24 * 60 * 60 * 1000;

  // Schedule deletion of voice responses
  await ctx.db.patch(voiceResponseId, {
    deletedAt: deletionDate,
  });
}

export async function anonymizeTrainingData(personaId: string): Promise<void> {
  // Remove any potentially identifying information from training data
  const trainingRecords = await ctx.db
    .query("trainingData")
    .withIndex("by_persona", (q) => q.eq("personaId", personaId))
    .collect();

  for (const record of trainingRecords) {
    await ctx.db.patch(record._id, {
      inputPrompt: sanitizeText(record.inputPrompt),
      expectedOutput: sanitizeText(record.expectedOutput),
    });
  }
}

export function sanitizeText(text: string): string {
  // Remove personal identifiers, maintain training value
  return text
    .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, "[EMAIL]")
    .replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, "[PHONE]")
    .replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, "[IP]");
}
```

## Rate Limiting Schema

```typescript
export const rateLimits = defineTable({
  userId: v.string(),
  requestType: v.string(), // "coaching_trigger" | "tts_generation"
  windowStart: v.number(), // timestamp
  requestCount: v.number(),
  windowSize: v.number(), // seconds (3600 for hourly)
  maxRequests: v.number(),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_user_type", ["userId", "requestType"])
  .index("by_window", ["windowStart"]);

// Rate limit configurations
export const RATE_LIMITS = {
  free: {
    coaching_trigger: { requests: 50, window: 3600 }, // 50/hour
    tts_generation: { requests: 20, window: 3600 }, // 20/hour
  },
  pro: {
    coaching_trigger: { requests: 200, window: 3600 }, // 200/hour
    tts_generation: { requests: 100, window: 3600 }, // 100/hour
  },
  trainer: {
    coaching_trigger: { requests: 1000, window: 3600 }, // 1000/hour
    tts_generation: { requests: 500, window: 3600 }, // 500/hour
  },
};
```
