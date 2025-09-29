import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // AI Summary System Tables
  user_configs: defineTable({
    userId: v.id("users"),
    configJson: v.string(), // stringified JSON object
    createdAt: v.string(),
    updatedAt: v.string(),
  }).index("by_user", ["userId"]),

  user_monthly_summaries: defineTable({
    userId: v.id("users"),
    monthKey: v.string(), // e.g. "2025-09"
    monthlySummaryJson: v.string(), // stringified JSON
    createdAt: v.string(),
    updatedAt: v.string(),
  }).index("by_user_and_month", ["userId", "monthKey"]),

  user_yearly_summaries: defineTable({
    userId: v.id("users"),
    yearlySummaryJson: v.string(), // stringified JSON object
    subscriptionStartDate: v.string(), // Unix timestamp as string
    createdAt: v.string(),
    updatedAt: v.string(),
  }).index("by_user", ["userId"]),
  wearableFeedback: defineTable({
    userId: v.id("users"),
    timestamp: v.string(),
    feedback: v.string(), // e.g. "Set Completed", "Too Easy", "Too Hard"
    summary: v.optional(v.any()), // e.g. { avgHR, avgSpO2, strain, sessionDuration }
  }).index("by_user", ["userId"]).index("by_user_and_time", ["userId", "timestamp"]),
  // Users table - handles both clients and trainers
  users: defineTable({
    email: v.string(),
    name: v.string(),
    role: v.union(v.literal("client"), v.literal("trainer"), v.literal("admin")),
    profileImage: v.optional(v.string()),
    createdAt: v.string(),
    updatedAt: v.string(),
    // Authentication fields
    passwordHash: v.string(),
    emailVerified: v.boolean(),
    isActive: v.boolean(),
    lastLogin: v.optional(v.string()),
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
    experience: v.optional(v.number()), // years
    isVerified: v.optional(v.boolean()),
    rating: v.optional(v.number()),
    totalClients: v.optional(v.number()),
    commissionTier: v.optional(v.number()), // Default 0.3 (30% app/70% trainer). For every Pro client, only 10% is taken on their transactions (per-client commission logic).
    // User preferences
    preferences: v.optional(v.object({
      units: v.optional(v.union(v.literal("metric"), v.literal("imperial"))),
      notifications: v.optional(v.boolean()),
      dataSharing: v.optional(v.boolean()),
      timezone: v.optional(v.string()),
    })),
    // Medical screening: injuries, conditions, notes
    medicalScreening: v.optional(v.object({
      injuries: v.optional(v.array(v.string())),
      conditions: v.optional(v.array(v.string())),
      notes: v.optional(v.string()),
    })),

    // Smart Set Nudging & Device Support
    smartSetNudges: v.optional(v.boolean()), // User toggle
    smartSetNudgesActive: v.optional(v.boolean()), // Auto-managed (true if device supports real-time strain)
    connectedWearable: v.optional(v.union(
      v.literal("whoop"),
      v.literal("apple_watch"),
      v.literal("samsung_watch"),
      v.literal("fitbit"),
      v.literal("polar")
    )),
    // AI Coach Preference
    coachPreference: v.optional(v.object({
      coachType: v.union(v.literal("alice"), v.literal("aiden")),
      selectedAt: v.string(),
    })),
  }).index("by_email", ["email"]).index("by_role", ["role"]).index("by_active", ["isActive"]),

  // User sessions for authentication
  sessions: defineTable({
    userId: v.id("users"),
    token: v.string(),
    expiresAt: v.string(),
    createdAt: v.string(),
    lastActivity: v.string(),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    isActive: v.boolean(),
  }).index("by_token", ["token"]).index("by_user", ["userId"]).index("by_expires", ["expiresAt"]),

  // Password reset tokens
  passwordResets: defineTable({
    email: v.string(),
    token: v.string(),
    expiresAt: v.string(),
    used: v.boolean(),
    createdAt: v.string(),
  }).index("by_token", ["token"]).index("by_email", ["email"]),

  // Fitness tracker data
  fitnessData: defineTable({
    userId: v.id("users"),
    dataType: v.union(
      v.literal("steps"),
      v.literal("heartRate"),
      v.literal("sleep"),
      v.literal("calories"),
      v.literal("distance"),
      v.literal("activeMinutes"),
      v.literal("strain"),
      v.literal("recovery"),
      v.literal("hrv")
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
    trainerId: v.optional(v.id("users")),
    difficulty: v.union(v.literal("beginner"), v.literal("intermediate"), v.literal("advanced")),
    duration: v.number(), // weeks
    category: v.array(v.string()), // strength, cardio, flexibility, etc.
    equipment: v.array(v.string()), // required equipment
    isPublished: v.boolean(),
    rating: v.optional(v.number()),
    totalPurchases: v.optional(v.number()),
    tags: v.array(v.string()),
    jsonData: v.optional(v.string()), // structured JSON for program details
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

  // Master exercise database (from Free Exercise DB)
  exerciseDatabase: defineTable({
    // Core exercise info
    exerciseId: v.string(), // unique identifier from source
    name: v.string(),
    instructions: v.array(v.string()),
    category: v.string(), // strength, cardio, stretching, etc.
    // Difficulty and mechanics
    level: v.string(), // beginner, intermediate, expert
    force: v.optional(v.string()), // push, pull, static
    mechanic: v.optional(v.string()), // compound, isolation
    // Muscle groups
    primaryMuscles: v.array(v.string()),
    secondaryMuscles: v.array(v.string()),
    // Equipment and recommendations
    equipment: v.optional(v.string()), // primary equipment needed
    alternativeEquipment: v.array(v.string()), // alternative options
    recommendedMachines: v.array(v.string()), // specific machine recommendations
    // Media
    images: v.array(v.string()),
    // Import metadata
    importedAt: v.string(),
    source: v.string(), // "free-exercise-db"
  }).index("by_exercise_id", ["exerciseId"])
    .index("by_category", ["category"])
    .index("by_equipment", ["equipment"])
    .index("by_level", ["level"])
    .index("by_primary_muscle", ["primaryMuscles"]),

  // Equipment recommendations and alternatives
  equipmentRecommendations: defineTable({
    equipmentType: v.string(), // "dumbbell", "machine", "cable", etc.
    primaryMachines: v.array(v.string()), // main recommendations
    alternatives: v.array(v.string()), // backup options
    homeAlternatives: v.array(v.string()), // home gym options
    description: v.string(),
    priceRange: v.optional(v.string()), // "$", "$$", "$$$"
    spaceRequired: v.optional(v.string()), // "minimal", "moderate", "large"
  }).index("by_equipment_type", ["equipmentType"]),

  // User equipment preferences
  userEquipmentPreferences: defineTable({
    userId: v.id("users"),
    preferredEquipment: v.array(v.string()), // user's preferred machines
    avoidedEquipment: v.array(v.string()), // equipment they can't/won't use
    gymType: v.optional(v.string()), // "home", "commercial", "budget"
    lastUpdated: v.string(),
  }).index("by_user", ["userId"]),

  // Exercises within workouts (now references exercise database)
  exercises: defineTable({
    workoutId: v.id("workouts"),
    exerciseDbId: v.id("exerciseDatabase"), // reference to master exercise
    sets: v.number(),
    reps: v.optional(v.string()), // "10-12" or "to failure"
    weight: v.optional(v.number()), // kg
    duration: v.optional(v.number()), // seconds for time-based exercises
    restTime: v.optional(v.number()), // seconds
    order: v.number(), // order within the workout
    selectedEquipment: v.optional(v.string()), // user's equipment choice
    notes: v.optional(v.string()),
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
    // Music state for this session
    musicState: v.optional(v.object({
      track: v.optional(v.string()),
      artist: v.optional(v.string()),
      position: v.optional(v.number()), // seconds
      isPlaying: v.optional(v.boolean()),
      album: v.optional(v.string()),
      coverUrl: v.optional(v.string()),
      source: v.optional(v.string()), // e.g. 'spotify', 'apple_music'
    })),
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

  // WHOOP device connections
  whoopConnections: defineTable({
    userId: v.id("users"),
    whoopUserId: v.string(), // WHOOP's user ID
    accessToken: v.string(),
    refreshToken: v.string(),
    expiresIn: v.number(), // seconds until token expires
    scope: v.string(), // granted permissions
    connectedAt: v.string(),
    disconnectedAt: v.optional(v.string()),
    isActive: v.boolean(),
    createdAt: v.string(),
    updatedAt: v.string(),
  }).index("by_user", ["userId"]).index("by_whoop_user", ["whoopUserId"]),

  // Marketplace: Program purchases
  programPurchases: defineTable({
    userId: v.id("users"),
    programId: v.id("trainingPrograms"),
    trainerId: v.id("users"),
    purchaseType: v.literal("program"), // pre-made program
    amount: v.number(), // total amount paid by user
    planJson: v.string(), // JSON of the purchased plan for mobile app
    platformFee: v.number(), // 20% after Apple/Google tax markup
    trainerEarnings: v.number(),
    paymentStatus: v.union(v.literal("pending"), v.literal("completed"), v.literal("failed"), v.literal("refunded")),
    paymentIntentId: v.optional(v.string()), // Stripe payment intent ID
    purchaseDate: v.string(),
    accessExpiresAt: v.optional(v.string()), // if the program has limited access
    refundedAt: v.optional(v.string()),
    refundReason: v.optional(v.string()),
  }).index("by_user", ["userId"])
    .index("by_trainer", ["trainerId"])
    .index("by_program", ["programId"])
    .index("by_payment_status", ["paymentStatus"]),

  // Marketplace: Custom coaching services
  coachingServices: defineTable({
    trainerId: v.id("users"),
    clientId: v.id("users"),
    serviceType: v.union(v.literal("custom_program"), v.literal("ongoing_coaching"), v.literal("consultation")),
    title: v.string(),
    description: v.string(),
    price: v.number(), // total amount
    duration: v.optional(v.number()), // weeks for programs, sessions for coaching
    status: v.union(v.literal("pending"), v.literal("active"), v.literal("completed"), v.literal("cancelled")),
    paymentStatus: v.union(v.literal("pending"), v.literal("paid"), v.literal("failed")),
    paymentIntentId: v.optional(v.string()),
    platformFee: v.number(), // 20% commission for custom services
    trainerEarnings: v.number(), // 80% goes to trainer
    requestedAt: v.string(),
    acceptedAt: v.optional(v.string()),
    completedAt: v.optional(v.string()),
    deliveredAt: v.optional(v.string()), // when trainer delivers the custom program
    clientNotes: v.optional(v.string()), // initial request from client
    trainerNotes: v.optional(v.string()), // trainer's notes on the service
  }).index("by_trainer", ["trainerId"])
    .index("by_client", ["clientId"])
    .index("by_status", ["status"])
    .index("by_service_type", ["serviceType"]),

  // Health data sharing permissions
  healthDataSharing: defineTable({
    clientId: v.id("users"),
    trainerId: v.id("users"),
    serviceId: v.optional(v.id("coachingServices")), // linked to specific coaching service
    isActive: v.boolean(),
    sharedDataTypes: v.array(v.string()), // which fitness data to share: "steps", "heartRate", "sleep", etc.
    shareLevel: v.union(v.literal("summary"), v.literal("detailed"), v.literal("full")),
    startDate: v.string(),
    endDate: v.optional(v.string()), // when sharing expires
    permissions: v.array(v.string()), // specific permissions: "view", "download", "analyze"
    clientConsent: v.boolean(),
    clientConsentDate: v.string(),
    revokedAt: v.optional(v.string()),
    revokedReason: v.optional(v.string()),
  }).index("by_client", ["clientId"])
    .index("by_trainer", ["trainerId"])
    .index("by_service", ["serviceId"])
    .index("by_active", ["isActive"]),

  // Revenue tracking for platform and trainers
  revenueTransactions: defineTable({
    type: v.union(v.literal("program_purchase"), v.literal("coaching_service"), v.literal("refund")),
    referenceId: v.union(v.id("programPurchases"), v.id("coachingServices")), // reference to purchase or service
    trainerId: v.id("users"),
    clientId: v.id("users"),
    grossAmount: v.number(), // total transaction amount
    platformFee: v.number(), // our commission
    trainerEarnings: v.number(), // amount trainer receives
    processingFees: v.optional(v.number()), // Stripe/payment processing fees
    netPlatformEarnings: v.number(), // platform fee minus processing costs
    payoutStatus: v.union(v.literal("pending"), v.literal("processing"), v.literal("paid"), v.literal("failed")),
    payoutDate: v.optional(v.string()),
    payoutId: v.optional(v.string()), // Stripe payout/transfer ID
    transactionDate: v.string(),
    metadata: v.optional(v.object({
      programName: v.optional(v.string()),
      serviceName: v.optional(v.string()),
      paymentMethod: v.optional(v.string())
    })),
  }).index("by_trainer", ["trainerId"])
    .index("by_client", ["clientId"])
    .index("by_type", ["type"])
    .index("by_payout_status", ["payoutStatus"])
    .index("by_transaction_date", ["transactionDate"]),

  // Trainer payout history
  trainerPayouts: defineTable({
    trainerId: v.id("users"),
    amount: v.number(),
    currency: v.string(),
    payoutMethod: v.union(v.literal("stripe_transfer"), v.literal("bank_transfer"), v.literal("paypal")),
    stripePayoutId: v.optional(v.string()),
    status: v.union(v.literal("pending"), v.literal("processing"), v.literal("paid"), v.literal("failed"), v.literal("cancelled")),
    scheduledDate: v.string(),
    paidDate: v.optional(v.string()),
    failureReason: v.optional(v.string()),
    transactionIds: v.array(v.id("revenueTransactions")), // which transactions this payout covers
    periodStart: v.string(),
    periodEnd: v.string(),
    metadata: v.optional(v.object({
      transactionCount: v.optional(v.number()),
      bankAccount: v.optional(v.string())
    })),
  }).index("by_trainer", ["trainerId"])
    .index("by_status", ["status"])
    .index("by_scheduled_date", ["scheduledDate"]),

  // Messages between trainers and clients
  trainerClientMessages: defineTable({
    senderId: v.id("users"),
    receiverId: v.id("users"),
    serviceId: v.optional(v.id("coachingServices")), // linked to specific service
    messageType: v.union(v.literal("text"), v.literal("progress_update"), v.literal("program_delivery"), v.literal("system")),
    subject: v.optional(v.string()),
    content: v.string(),
    attachments: v.optional(v.array(v.string())), // file URLs
    isRead: v.boolean(),
    readAt: v.optional(v.string()),
    sentAt: v.string(),
    metadata: v.optional(v.object({
      programId: v.optional(v.id("trainingPrograms")),
      workoutData: v.optional(v.any()), // shared workout results
    })),
  }).index("by_sender", ["senderId"])
    .index("by_receiver", ["receiverId"])
    .index("by_service", ["serviceId"])
    .index("by_participants", ["senderId", "receiverId"]),

  // Admin Users - separate from regular users for enhanced security
  adminUsers: defineTable({
    email: v.string(),
    name: v.string(),
    role: v.union(
      v.literal("super_admin"),
      v.literal("platform_admin"),
      v.literal("user_support"),
      v.literal("content_moderator"),
      v.literal("financial_admin"),
      v.literal("analytics_viewer")
    ),
    permissions: v.array(v.string()), // granular permissions array
    passwordHash: v.string(),
    mfaSecret: v.optional(v.string()), // TOTP secret for MFA
    mfaEnabled: v.boolean(),
    isActive: v.boolean(),
    lastLogin: v.optional(v.string()),
    failedLoginAttempts: v.number(),
    lockedUntil: v.optional(v.string()),
    createdAt: v.string(),
    createdBy: v.id("adminUsers"),
    updatedAt: v.string(),
    ipWhitelist: v.optional(v.array(v.string())), // allowed IP addresses
    sessionTimeout: v.optional(v.number()), // custom session timeout in minutes
  }).index("by_email", ["email"])
    .index("by_role", ["role"])
    .index("by_active", ["isActive"]),

  // Admin Sessions - track active admin sessions
  adminSessions: defineTable({
    adminId: v.id("adminUsers"),
    sessionToken: v.string(),
    ipAddress: v.string(),
    userAgent: v.string(),
    createdAt: v.string(),
    expiresAt: v.string(),
    lastActivity: v.string(),
    isActive: v.boolean(),
    revokedAt: v.optional(v.string()),
    revokedReason: v.optional(v.string()),
  }).index("by_admin", ["adminId"])
    .index("by_token", ["sessionToken"])
    .index("by_active", ["isActive"])
    .index("by_expires", ["expiresAt"]),

  // Audit Logs - comprehensive logging of all admin actions
  auditLogs: defineTable({
    adminId: v.id("adminUsers"),
    action: v.string(), // action performed (e.g., "user_suspended", "content_approved")
    resource: v.string(), // resource type (e.g., "user", "content", "system")
    resourceId: v.optional(v.string()), // ID of the affected resource
    details: v.any(), // detailed information about the action
    ipAddress: v.string(),
    userAgent: v.string(),
    timestamp: v.string(),
    severity: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("critical")),
    category: v.union(
      v.literal("authentication"),
      v.literal("user_management"),
      v.literal("content_moderation"),
      v.literal("financial"),
      v.literal("system_config"),
      v.literal("data_access")
    ),
    outcome: v.union(v.literal("success"), v.literal("failure"), v.literal("partial")),
    errorMessage: v.optional(v.string()),
  }).index("by_admin", ["adminId"])
    .index("by_action", ["action"])
    .index("by_resource", ["resource"])
    .index("by_timestamp", ["timestamp"])
    .index("by_severity", ["severity"])
    .index("by_category", ["category"]),

  // Moderation Queue - content awaiting review
  moderationQueue: defineTable({
    itemType: v.union(
      v.literal("custom_exercise"),
      v.literal("trainer_message"),
      v.literal("user_report"),
      v.literal("program_content"),
      v.literal("user_profile")
    ),
    itemId: v.string(), // ID of the item being moderated
    reportedBy: v.optional(v.id("users")), // user who reported (if applicable)
    reportReason: v.optional(v.string()),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("urgent")),
    status: v.union(v.literal("pending"), v.literal("under_review"), v.literal("approved"), v.literal("rejected"), v.literal("escalated")),
    assignedTo: v.optional(v.id("adminUsers")), // admin assigned to review
    content: v.any(), // snapshot of content being moderated
    flags: v.array(v.string()), // automated flags (e.g., "inappropriate_language", "spam")
    reviewNotes: v.optional(v.string()),
    decision: v.optional(v.string()),
    decisionReason: v.optional(v.string()),
    createdAt: v.string(),
    assignedAt: v.optional(v.string()),
    reviewedAt: v.optional(v.string()),
    escalatedAt: v.optional(v.string()),
    autoFlagged: v.boolean(), // whether this was flagged automatically
    confidenceScore: v.optional(v.number()), // AI confidence score for auto-flagged content
  }).index("by_status", ["status"])
    .index("by_priority", ["priority"])
    .index("by_assigned", ["assignedTo"])
    .index("by_type", ["itemType"])
    .index("by_created", ["createdAt"])
    .index("by_reported_by", ["reportedBy"]),

  // Admin Permissions - granular permission definitions
  adminPermissions: defineTable({
    name: v.string(), // permission name (e.g., "users.read", "content.moderate")
    resource: v.string(), // resource category (e.g., "users", "content", "analytics")
    action: v.string(), // action type (e.g., "read", "write", "delete", "moderate")
    description: v.string(),
    isSystemPermission: v.boolean(), // whether this is a core system permission
    createdAt: v.string(),
    updatedAt: v.string(),
  }).index("by_resource", ["resource"])
    .index("by_name", ["name"])
    .index("by_system", ["isSystemPermission"]),

  // Admin Role Definitions - predefined roles with permission sets
  adminRoles: defineTable({
    name: v.string(),
    displayName: v.string(),
    description: v.string(),
    permissions: v.array(v.string()), // array of permission names
    isSystemRole: v.boolean(), // whether this is a core system role
    createdAt: v.string(),
    updatedAt: v.string(),
  }).index("by_name", ["name"])
    .index("by_system", ["isSystemRole"]),

  // Support Tickets - user support and issue tracking
  supportTickets: defineTable({
    userId: v.id("users"),
    subject: v.string(),
    status: v.union(v.literal("open"), v.literal("in_progress"), v.literal("resolved"), v.literal("closed")),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("urgent")),
    category: v.optional(v.string()),
    assignedTo: v.optional(v.id("adminUsers")),
    createdBy: v.optional(v.id("adminUsers")),
    createdAt: v.string(),
    updatedAt: v.optional(v.string()),
    resolvedAt: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  }).index("by_user", ["userId"])
    .index("by_status", ["status"])
    .index("by_priority", ["priority"])
    .index("by_assigned", ["assignedTo"])
    .index("by_created", ["createdAt"]),

  // Support Messages - messages within support tickets
  supportMessages: defineTable({
    ticketId: v.id("supportTickets"),
    senderId: v.union(v.id("users"), v.id("adminUsers")),
    senderType: v.union(v.literal("user"), v.literal("admin")),
    content: v.string(),
    attachments: v.optional(v.array(v.string())),
    isInternal: v.boolean(),
    timestamp: v.string(),
  }).index("by_ticket", ["ticketId"])
    .index("by_sender", ["senderId"])
    .index("by_timestamp", ["timestamp"]),

  // Platform Announcements - system-wide announcements
  platformAnnouncements: defineTable({
    title: v.string(),
    content: v.string(),
    type: v.union(v.literal("info"), v.literal("warning"), v.literal("maintenance"), v.literal("feature")),
    targetAudience: v.union(v.literal("all"), v.literal("clients"), v.literal("trainers"), v.literal("premium")),
    sentBy: v.id("adminUsers"),
    createdAt: v.string(),
    scheduledFor: v.string(),
    expiresAt: v.optional(v.string()),
    isActive: v.boolean(),
    recipientCount: v.number(),
  }).index("by_type", ["type"])
    .index("by_audience", ["targetAudience"])
    .index("by_active", ["isActive"])
    .index("by_scheduled", ["scheduledFor"]),

  // User Messages - targeted messages to users
  userMessages: defineTable({
    subject: v.string(),
    content: v.string(),
    type: v.union(v.literal("email"), v.literal("push"), v.literal("in_app")),
    sentBy: v.id("adminUsers"),
    sentAt: v.string(),
    recipientCount: v.number(),
    deliveryStatus: v.union(v.literal("pending"), v.literal("sent"), v.literal("failed")),
    targetCriteria: v.optional(v.any()),
  }).index("by_type", ["type"])
    .index("by_sent_by", ["sentBy"])
    .index("by_sent_at", ["sentAt"])
    .index("by_status", ["deliveryStatus"]),

  // Message Recipients - tracking message delivery
  messageRecipients: defineTable({
    messageId: v.union(v.id("platformAnnouncements"), v.id("userMessages")),
    messageType: v.union(v.literal("announcement"), v.literal("message")),
    userId: v.id("users"),
    deliveryStatus: v.union(v.literal("pending"), v.literal("delivered"), v.literal("failed"), v.literal("read")),
    deliveredAt: v.optional(v.string()),
    readAt: v.optional(v.string()),
    failureReason: v.optional(v.string()),
  }).index("by_message", ["messageId"])
    .index("by_user", ["userId"])
    .index("by_status", ["deliveryStatus"]),

  // Privacy Requests - GDPR and privacy compliance
  privacyRequests: defineTable({
    userId: v.id("users"),
    requestType: v.union(v.literal("access"), v.literal("portability"), v.literal("deletion"), v.literal("rectification")),
    status: v.union(v.literal("pending"), v.literal("in_progress"), v.literal("completed"), v.literal("rejected")),
    handledBy: v.optional(v.id("adminUsers")),
    requestedAt: v.string(),
    completedAt: v.optional(v.string()),
    notes: v.optional(v.string()),
    estimatedCompletion: v.optional(v.string()),
    rejectionReason: v.optional(v.string()),
  }).index("by_user", ["userId"])
    .index("by_type", ["requestType"])
    .index("by_status", ["status"])
    .index("by_requested", ["requestedAt"]),

  // Data Exports - user data exports for GDPR compliance
  dataExports: defineTable({
    userId: v.id("users"),
    requestedBy: v.id("adminUsers"),
    exportType: v.union(v.literal("full"), v.literal("basic"), v.literal("deleted")),
    status: v.union(v.literal("pending"), v.literal("processing"), v.literal("completed"), v.literal("failed")),
    downloadUrl: v.optional(v.string()),
    expiresAt: v.optional(v.string()),
    includeDeleted: v.boolean(),
    requestedAt: v.string(),
    completedAt: v.optional(v.string()),
    fileSize: v.optional(v.number()),
    errorMessage: v.optional(v.string()),
  }).index("by_user", ["userId"])
    .index("by_requested_by", ["requestedBy"])
    .index("by_status", ["status"])
    .index("by_expires", ["expiresAt"]),

  // Data Deletions - tracking user data deletions
  dataDeletions: defineTable({
    userId: v.id("users"),
    deletionType: v.union(v.literal("soft"), v.literal("hard")),
    deletedBy: v.id("adminUsers"),
    deletedAt: v.string(),
    reason: v.string(),
    deletedRecords: v.number(),
    backupLocation: v.optional(v.string()),
    isReversible: v.boolean(),
  }).index("by_user", ["userId"])
    .index("by_deleted_by", ["deletedBy"])
    .index("by_deleted_at", ["deletedAt"]),

  // Nutrition Goals - user's daily/weekly nutrition targets
  nutritionGoals: defineTable({
    userId: v.id("users"),
    name: v.string(), // e.g., "Weight Loss Phase 1", "Muscle Gain"
    calories: v.number(),
    protein: v.number(), // grams
    carbs: v.number(), // grams
    fat: v.number(), // grams
    fiber: v.number(), // grams
    sugar: v.number(), // grams
    sodium: v.number(), // mg
    isActive: v.boolean(),
    createdBy: v.id("users"), // who created this goal (user or trainer)
    createdAt: v.string(),
    updatedAt: v.string(),
    startDate: v.string(),
    endDate: v.optional(v.string()),
    notes: v.optional(v.string()),
  }).index("by_user", ["userId"])
    .index("by_active", ["userId", "isActive"])
    .index("by_created_by", ["createdBy"]),

  // Food Database - master food items with nutrition info
  foodDatabase: defineTable({
    name: v.string(),
    brand: v.optional(v.string()),
    barcode: v.optional(v.string()),
    category: v.string(), // e.g., "protein", "vegetable", "dairy"
    nutritionPer100g: v.object({
      calories: v.number(),
      protein: v.number(),
      carbs: v.number(),
      fat: v.number(),
      fiber: v.number(),
      sugar: v.number(),
      sodium: v.number(),
      vitamins: v.optional(v.any()),
      minerals: v.optional(v.any()),
    }),
    servingSizes: v.array(v.object({
      name: v.string(),
      grams: v.number(),
      description: v.string(),
    })),
    verified: v.boolean(),
    source: v.string(), // "openfoodfacts", "usda", "manual"
    createdAt: v.string(),
    updatedAt: v.string(),
  }).index("by_name", ["name"])
    .index("by_category", ["category"])
    .index("by_barcode", ["barcode"])
    .index("by_verified", ["verified"]),

  // Food Entries - user's logged meals and snacks
  foodEntries: defineTable({
    userId: v.id("users"),
    foodId: v.id("foodDatabase"),
    servingSize: v.number(), // grams
    mealType: v.union(v.literal("breakfast"), v.literal("lunch"), v.literal("dinner"), v.literal("snack")),
    date: v.string(), // YYYY-MM-DD
    time: v.string(), // HH:MM
    nutrition: v.object({
      calories: v.number(),
      protein: v.number(),
      carbs: v.number(),
      fat: v.number(),
      fiber: v.number(),
      sugar: v.number(),
      sodium: v.number(),
    }),
    notes: v.optional(v.string()),
    loggedBy: v.id("users"), // who logged this entry (user or trainer)
    createdAt: v.string(),
    updatedAt: v.string(),
  }).index("by_user", ["userId"])
    .index("by_user_and_date", ["userId", "date"])
    .index("by_meal_type", ["userId", "mealType", "date"])
    .index("by_logged_by", ["loggedBy"]),

  // Meal Plans - structured meal plans created by trainers
  mealPlans: defineTable({
    name: v.string(),
    description: v.string(),
    clientId: v.id("users"),
    trainerId: v.id("users"),
    isActive: v.boolean(),
    startDate: v.string(),
    endDate: v.optional(v.string()),
    goals: v.array(v.string()), // e.g., ["weight_loss", "muscle_gain"]
    preferences: v.optional(v.object({
      dietaryRestrictions: v.array(v.string()),
      allergies: v.array(v.string()),
      cuisinePreferences: v.array(v.string()),
      budget: v.optional(v.string()),
    })),
    createdAt: v.string(),
    updatedAt: v.string(),
  }).index("by_client", ["clientId"])
    .index("by_trainer", ["trainerId"])
    .index("by_active", ["clientId", "isActive"]),

  // Meal Plan Days - daily structure within a meal plan
  mealPlanDays: defineTable({
    mealPlanId: v.id("mealPlans"),
    dayNumber: v.number(), // 1-7 for weekly plans
    meals: v.array(v.object({
      type: v.union(v.literal("breakfast"), v.literal("lunch"), v.literal("dinner"), v.literal("snack")),
      foods: v.array(v.object({
        foodId: v.id("foodDatabase"),
        servingSize: v.number(),
        notes: v.optional(v.string()),
      })),
      totalNutrition: v.object({
        calories: v.number(),
        protein: v.number(),
        carbs: v.number(),
        fat: v.number(),
        fiber: v.number(),
        sugar: v.number(),
        sodium: v.number(),
      }),
    })),
    totalNutrition: v.object({
      calories: v.number(),
      protein: v.number(),
      carbs: v.number(),
      fat: v.number(),
      fiber: v.number(),
      sugar: v.number(),
      sodium: v.number(),
    }),
    notes: v.optional(v.string()),
  }).index("by_meal_plan", ["mealPlanId"])
    .index("by_day", ["mealPlanId", "dayNumber"]),

  // Nutrition Progress Tracking
  nutritionProgress: defineTable({
    userId: v.id("users"),
    date: v.string(), // YYYY-MM-DD
    goalId: v.optional(v.id("nutritionGoals")),
    actualNutrition: v.object({
      calories: v.number(),
      protein: v.number(),
      carbs: v.number(),
      fat: v.number(),
      fiber: v.number(),
      sugar: v.number(),
      sodium: v.number(),
    }),
    goalNutrition: v.optional(v.object({
      calories: v.number(),
      protein: v.number(),
      carbs: v.number(),
      fat: v.number(),
      fiber: v.number(),
      sugar: v.number(),
      sodium: v.number(),
    })),
    adherenceScore: v.number(), // 0-100 percentage
    notes: v.optional(v.string()),
    createdAt: v.string(),
  }).index("by_user", ["userId"])
    .index("by_user_and_date", ["userId", "date"])
    .index("by_goal", ["goalId"]),

  // AI Coaching System Tables
  aiCoachingPersonas: defineTable({
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
  }).index("by_id", ["id"]),

  workoutTriggers: defineTable({
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
  }).index("by_id", ["id"])
    .index("by_priority", ["priority"]),

  voiceResponses: defineTable({
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
  }).index("by_user", ["userId"])
    .index("by_trigger", ["triggerId"])
    .index("by_persona", ["personaId"])
    .index("by_user_trigger", ["userId", "triggerId"])
    .index("by_created_at", ["createdAt"])
    .index("by_deleted_at", ["deletedAt"]),

  userSubscriptions: defineTable({
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
  }).index("by_user", ["userId"])
    .index("by_subscription_type", ["subscriptionType"])
    .index("by_active", ["isActive"]),

  trainingData: defineTable({
    id: v.string(), // UUID
    personaId: v.string(),
    inputPrompt: v.string(),
    expectedOutput: v.string(),
    actualOutput: v.optional(v.string()),
    quality: v.optional(v.number()), // 0-1 quality score
    userFeedback: v.optional(v.object({
      rating: v.number(), // 1-5
      helpful: v.boolean(),
      comments: v.optional(v.string()),
    })),
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
  }).index("by_persona", ["personaId"])
    .index("by_validated", ["isValidated"])
    .index("by_training_batch", ["trainingBatch"])
    .index("by_quality", ["quality"]),

  audioCache: defineTable({
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
  }).index("by_cache_key", ["cacheKey"])
    .index("by_persona", ["personaId"])
    .index("by_expires_at", ["expiresAt"])
    .index("by_hit_count", ["hitCount"])
    .index("by_last_accessed", ["lastAccessed"]),
});
