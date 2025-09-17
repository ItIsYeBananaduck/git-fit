import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  equipment: defineTable({
    name: v.string(),
    type: v.string(),
    description: v.optional(v.string()),
    image: v.optional(v.string()),
    createdBy: v.string(),
    createdAt: v.number(),
  }),

  goals: defineTable({
    userId: v.string(),
    goalType: v.string(), // primary or secondary
    primaryGoalType: v.string(), // e.g., weight_loss, muscle_gain, etc.
    secondaryGoalType: v.string(), // e.g., improve_energy, build_muscle, etc.
    details: v.object({}), // JSON object with goal-specific details
    priority: v.number(), // 1 for primary, 2+ for secondary
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }),

  users: defineTable({
    email: v.string(),
    name: v.string(),
    avatar: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }),

  fitnessData: defineTable({
    userId: v.string(),
    type: v.string(), // workout, nutrition, sleep, etc.
    data: v.object({}), // JSON data
    timestamp: v.number(),
  }),

  trainingPrograms: defineTable({
    userId: v.string(),
    name: v.string(),
    description: v.string(),
    exercises: v.array(v.object({})), // Array of exercise objects
    price: v.number(), // price in cents
    createdAt: v.number(),
    updatedAt: v.number(),
  }),

  nutritionGoals: defineTable({
    userId: v.string(),
    calories: v.number(),
    protein: v.number(),
    carbs: v.number(),
    fat: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }),

  foodEntries: defineTable({
    userId: v.string(),
    foodId: v.string(),
    name: v.string(),
    calories: v.number(),
    protein: v.number(),
    carbs: v.number(),
    fat: v.number(),
    quantity: v.number(),
    unit: v.string(),
    mealType: v.string(), // breakfast, lunch, dinner, snack
    timestamp: v.number(),
  }),

  healthDataSharing: defineTable({
    userId: v.string(),
    trainerId: v.string(),
    permissions: v.object({}), // JSON object with sharing permissions
    createdAt: v.number(),
    updatedAt: v.number(),
  }),

  userAchievements: defineTable({
    userId: v.string(),
    achievementId: v.string(),
    earnedAt: v.optional(v.number()), // null if not earned yet
    progress: v.number(), // 0-100
    createdAt: v.number(),
    updatedAt: v.number(),
  }),

  trainers: defineTable({
    trainerId: v.string(),
    userId: v.string(),
    certificationVerified: v.boolean(),
    bio: v.optional(v.string()),
    specialties: v.optional(v.array(v.string())),
    createdAt: v.number(),
    updatedAt: v.number(),
    stripeAccountId: v.optional(v.string()), // Stripe Connect account ID
    commissionPercent: v.optional(v.number()), // Current commission % (e.g. 30 for 30%)
  })
    .index("trainerId", ["trainerId"]),

  payouts: defineTable({
    trainerId: v.string(),
    amount: v.number(), // payout amount in cents
    currency: v.string(),
    periodStart: v.number(),
    periodEnd: v.number(),
    status: v.string(), // e.g. 'pending', 'paid', 'failed'
    stripePayoutId: v.optional(v.string()),
    createdAt: v.number(),
  }),

  purchases: defineTable({
    userId: v.string(),
    programId: v.string(),
    type: v.string(), // "oneTime" | "subscription"
    status: v.string(), // "active" | "expired" | "canceled"
    startDate: v.number(),
    endDate: v.optional(v.number()),
    stripeSubscriptionId: v.optional(v.string()),
  })
    .index("by_stripeSubscriptionId", ["stripeSubscriptionId"])
});