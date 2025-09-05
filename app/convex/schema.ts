import { defineSchema, defineTable} from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Users table - handles both clients and trainers
  users: defineTable({
    email: v.string(),
    name: v.string(),
    role: v.union(v.literal("client"), v.literal("trainer"), v.literal("admin")),
    profileImage: v.optional(v.string()),
    createdAt: v.string(),
    updatedAt: v.string(),
    // Client-specific fields
    dateOfBirth: v.optional(v.string()),
    height: v.optional(v.number()), // in cm
    weight: v.optional(v.number()), // in kg
    fitnessLevel: v.optional(v.union(v.literal("beginner"), v.literal("intermediate"), v.literal("advanced"))),
    goals: v.optional(v.array(v.string())), // weight loss, muscle gain, endurance, etc.
    // Trainer-specific fields
    certifications: v.optional(v.array(v.string())),
    specialties: v.optional(v.array(v.string())),
    bio: v.optional(v.string()),
    hourlyRate: v.optional(v.number()),
    isVerified: v.optional(v.boolean()),
    rating: v.optional(v.number()),
    totalClients: v.optional(v.number()),
  }).index("by_email", ["email"]).index("by_role", ["role"]),

  // Fitness tracker data
  fitnessData: defineTable({
    userId: v.id("users"),
    dataType: v.union(
      v.literal("steps"), 
      v.literal("heartRate"), 
      v.literal("sleep"), 
      v.literal("calories"),
      v.literal("distance"),
      v.literal("activeMinutes")
    ),
    value: v.number(),
    unit: v.string(), // steps, bpm, hours, kcal, km, minutes
    timestamp: v.string(),
    source: v.string(), // fitbit, apple_health, garmin, etc.
    createdAt: v.string(),
  }).index("by_user_and_type", ["userId", "dataType"]).index("by_user_and_date", ["userId", "timestamp"]),

  // Training programs
  trainingPrograms: defineTable({
    name: v.string(),
    description: v.string(),
    price: v.number(),
    createdAt: v.string(),
    updatedAt: v.string(),
    trainerId: v.id("users"),
    difficulty: v.union(v.literal("beginner"), v.literal("intermediate"), v.literal("advanced")),
    duration: v.number(), // weeks
    category: v.array(v.string()), // strength, cardio, flexibility, etc.
    equipment: v.array(v.string()), // required equipment
    isPublished: v.boolean(),
    rating: v.optional(v.number()),
    totalPurchases: v.optional(v.number()),
    tags: v.array(v.string()),
  }).index("by_trainer", ["trainerId"]).index("by_difficulty", ["difficulty"]).index("by_published", ["isPublished"]),

  // Individual workouts within a program
  workouts: defineTable({
    programId: v.id("trainingPrograms"),
    name: v.string(),
    description: v.string(),
    dayNumber: v.number(), // which day in the program
    weekNumber: v.number(), // which week in the program
    estimatedDuration: v.number(), // minutes
    targetMuscleGroups: v.array(v.string()),
    createdAt: v.string(),
  }).index("by_program", ["programId"]).index("by_program_and_day", ["programId", "dayNumber"]),

  // Exercises within workouts
  exercises: defineTable({
    workoutId: v.id("workouts"),
    name: v.string(),
    description: v.string(),
    sets: v.number(),
    reps: v.optional(v.string()), // "10-12" or "to failure"
    weight: v.optional(v.number()), // kg
    duration: v.optional(v.number()), // seconds for time-based exercises
    restTime: v.optional(v.number()), // seconds
    order: v.number(), // order within the workout
    instructions: v.string(),
    videoUrl: v.optional(v.string()),
    muscleGroups: v.array(v.string()),
  }).index("by_workout", ["workoutId"]).index("by_workout_and_order", ["workoutId", "order"]),

  // User's active/purchased programs
  userPrograms: defineTable({
    userId: v.id("users"),
    programId: v.id("trainingPrograms"),
    startDate: v.string(),
    currentDay: v.number(),
    currentWeek: v.number(),
    isCompleted: v.boolean(),
    progress: v.number(), // percentage 0-100
    purchaseDate: v.string(),
    lastWorkoutDate: v.optional(v.string()),
  }).index("by_user", ["userId"]).index("by_user_and_program", ["userId", "programId"]),

  // Workout sessions (actual completed workouts)
  workoutSessions: defineTable({
    userId: v.id("users"),
    workoutId: v.id("workouts"),
    userProgramId: v.id("userPrograms"),
    startTime: v.string(),
    endTime: v.optional(v.string()),
    duration: v.optional(v.number()), // actual duration in minutes
    isCompleted: v.boolean(),
    notes: v.optional(v.string()),
    averageHeartRate: v.optional(v.number()),
    maxHeartRate: v.optional(v.number()),
    caloriesBurned: v.optional(v.number()),
    createdAt: v.string(),
  }).index("by_user", ["userId"]).index("by_user_and_workout", ["userId", "workoutId"]),

  // Individual exercise performance tracking
  exercisePerformance: defineTable({
    sessionId: v.id("workoutSessions"),
    exerciseId: v.id("exercises"),
    actualSets: v.number(),
    actualReps: v.array(v.number()), // reps per set
    actualWeight: v.array(v.number()), // weight per set in kg
    actualDuration: v.optional(v.number()), // for time-based exercises
    difficulty: v.optional(v.union(v.literal("easy"), v.literal("moderate"), v.literal("hard"))),
    notes: v.optional(v.string()),
    createdAt: v.string(),
  }).index("by_session", ["sessionId"]).index("by_exercise", ["exerciseId"]),

  // Program adaptations based on performance and fitness data
  programAdaptations: defineTable({
    userProgramId: v.id("userPrograms"),
    adaptationType: v.union(
      v.literal("intensity_increase"),
      v.literal("intensity_decrease"),
      v.literal("rest_day_added"),
      v.literal("exercise_substitution"),
      v.literal("volume_adjustment")
    ),
    reason: v.string(), // why the adaptation was made
    originalValue: v.string(),
    newValue: v.string(),
    appliedDate: v.string(),
    effectiveFrom: v.string(), // when this adaptation takes effect
    createdAt: v.string(),
  }).index("by_user_program", ["userProgramId"]),

  // Reviews and ratings for programs
  programReviews: defineTable({
    userId: v.id("users"),
    programId: v.id("trainingPrograms"),
    rating: v.number(), // 1-5
    review: v.optional(v.string()),
    isVerified: v.boolean(), // true if user completed the program
    createdAt: v.string(),
  }).index("by_program", ["programId"]).index("by_user", ["userId"]),

  // Trainer-client relationships
  trainerClients: defineTable({
    trainerId: v.id("users"),
    clientId: v.id("users"),
    status: v.union(v.literal("active"), v.literal("pending"), v.literal("completed"), v.literal("cancelled")),
    startDate: v.string(),
    endDate: v.optional(v.string()),
    monthlyRate: v.optional(v.number()),
    notes: v.optional(v.string()),
    createdAt: v.string(),
  }).index("by_trainer", ["trainerId"]).index("by_client", ["clientId"]),
});
