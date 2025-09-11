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
    // Authentication fields
    passwordHash: v.string(),
    emailVerified: v.boolean(),
    isActive: v.boolean(),
    lastLogin: v.optional(v.string()),
    failedLoginAttempts: v.optional(v.number()),
    lockedUntil: v.optional(v.string()),
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
    // User preferences
    preferences: v.optional(v.object({
      units: v.optional(v.union(v.literal("metric"), v.literal("imperial"))),
      notifications: v.optional(v.boolean()),
      dataSharing: v.optional(v.boolean()),
      timezone: v.optional(v.string()),
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

  // Subscriptions for consumers and Trainer Pro (B2B)
  subscriptions: defineTable({
    userId: v.id("users"),
    type: v.union(v.literal("consumer"), v.literal("trainer_pro")),
    provider: v.union(v.literal("stripe"), v.literal("iap")),
    status: v.union(
      v.literal("active"),
      v.literal("trialing"),
      v.literal("past_due"),
      v.literal("canceled"),
      v.literal("incomplete"),
      v.literal("incomplete_expired")
    ),
    startedAt: v.string(),
    currentPeriodEnd: v.string(),
    cancelAt: v.optional(v.string()),
    providerCustomerId: v.optional(v.string()),
    providerSubscriptionId: v.optional(v.string()),
  })
    .index("by_user", ["userId"]) 
    .index("by_provider_sub", ["providerSubscriptionId"]),

  // Email verification tokens
  emailVerifications: defineTable({
    userId: v.id("users"),
    token: v.string(),
    expiresAt: v.string(),
    usedAt: v.optional(v.string()),
    createdAt: v.string(),
  }).index("by_token", ["token"]).index("by_user", ["userId"]),

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
    platformFee: v.number(), // 10% commission for pre-made programs
    trainerEarnings: v.number(), // 90% goes to trainer
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
});
