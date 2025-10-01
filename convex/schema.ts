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
    // Voice UI fields
    voiceEnabled: v.optional(v.boolean()),
    voiceProfile: v.optional(v.object({
      voiceId: v.optional(v.string()),
      stability: v.optional(v.number()),
      similarityBoost: v.optional(v.number()),
      style: v.optional(v.string()),
    })),
    // AI Training fields
    aiTrainingConsent: v.optional(v.boolean()),
    dataContributionLevel: v.optional(v.string()),
    privacySettings: v.optional(v.object({
      allowPersonalization: v.optional(v.boolean()),
      retentionDays: v.optional(v.number()),
      shareLevel: v.optional(v.string()),
    })),
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
    .index("by_stripeSubscriptionId", ["stripeSubscriptionId"]),

  // OAuth Implementation & Platform-Specific UI Entities

  oauthProviders: defineTable({
    id: v.string(), // 'spotify' | 'apple_music' | 'youtube_music'
    name: v.string(),
    displayName: v.string(),
    description: v.optional(v.string()),
    // OAuth Configuration
    scopes: v.array(v.string()),
    defaultScopes: v.array(v.string()), // Recommended scopes for this provider
    authEndpoint: v.string(),
    tokenEndpoint: v.string(),
    revokeEndpoint: v.optional(v.string()),
    redirectUri: v.string(),
    clientId: v.string(), // Environment-specific
    clientSecret: v.string(), // Encrypted, environment-specific
    // Provider Features & Capabilities
    features: v.object({
      supportsRefreshToken: v.boolean(),
      supportsTokenRevocation: v.boolean(),
      supportsUserInfo: v.boolean(),
      supportsPlaylistSync: v.boolean(),
      supportsRealtimeData: v.boolean(),
      rateLimitRpm: v.number(), // Requests per minute
      maxTokenLifetime: v.number(), // Seconds
    }),
    // Platform Support
    supportedPlatforms: v.array(v.string()), // 'ios' | 'android' | 'web'
    platformConfig: v.object({
      ios: v.optional(v.object({
        customScheme: v.string(),
        universalLink: v.optional(v.string()),
        bundleIdentifier: v.string(),
      })),
      android: v.optional(v.object({
        customScheme: v.string(),
        packageName: v.string(),
        intentFilters: v.array(v.string()),
      })),
      web: v.optional(v.object({
        redirectPaths: v.array(v.string()),
        corsOrigins: v.array(v.string()),
      })),
    }),
    // UI & Branding
    iconUrl: v.optional(v.string()),
    brandColor: v.optional(v.string()),
    brandColorDark: v.optional(v.string()),
    logoUrl: v.optional(v.string()),
    buttonStyle: v.object({
      backgroundColor: v.string(),
      textColor: v.string(),
      borderColor: v.optional(v.string()),
      iconPosition: v.string(), // 'left' | 'right' | 'center'
    }),
    // Provider Status
    isEnabled: v.boolean(),
    isProduction: v.boolean(),
    maintenanceMode: v.boolean(),
    lastHealthCheck: v.optional(v.number()),
    healthStatus: v.string(), // 'healthy' | 'degraded' | 'down'
    // Usage Statistics
    totalConnections: v.number(),
    activeConnections: v.number(),
    lastConnectionAt: v.optional(v.number()),
    // Metadata
    version: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_provider_id", ["id"])
    .index("by_enabled", ["isEnabled"])
    .index("by_platform", ["supportedPlatforms"])
    .index("by_health_status", ["healthStatus"])
    .index("by_production", ["isProduction"])
    .index("by_last_health_check", ["lastHealthCheck"])
    .index("by_enabled_production", ["isEnabled", "isProduction"]),

  userOAuthConnections: defineTable({
    userId: v.string(),
    providerId: v.string(), // References OAuthProvider.id
    // Token Management
    accessToken: v.string(), // Encrypted
    refreshToken: v.optional(v.string()), // Encrypted
    tokenExpiry: v.number(), // Unix timestamp
    scopes: v.array(v.string()),
    grantedPermissions: v.array(v.string()), // Actual permissions granted by user
    tokenType: v.string(), // 'Bearer' | 'OAuth'
    // Connection Status
    isActive: v.boolean(),
    status: v.string(), // 'connected' | 'expired' | 'revoked' | 'error'
    lastSyncAt: v.optional(v.number()),
    nextSyncAt: v.optional(v.number()),
    syncInterval: v.number(), // Minutes
    // Provider-specific user info
    externalUserId: v.string(),
    displayName: v.optional(v.string()),
    email: v.optional(v.string()),
    profileImageUrl: v.optional(v.string()),
    username: v.optional(v.string()),
    country: v.optional(v.string()),
    isPremium: v.optional(v.boolean()), // For music services
    // Connection Health & Error Handling
    lastErrorAt: v.optional(v.number()),
    lastErrorMessage: v.optional(v.string()),
    lastErrorCode: v.optional(v.string()),
    retryCount: v.number(),
    maxRetries: v.number(),
    backoffDelay: v.number(), // Milliseconds
    consecutiveErrors: v.number(),
    // Connection Quality Metrics
    responseTimeMs: v.optional(v.number()),
    successRate: v.number(), // 0-1 scale
    dataQuality: v.number(), // 0-1 scale
    // Usage Statistics
    totalApiCalls: v.number(),
    totalDataSynced: v.number(), // Bytes
    lastActivityAt: v.optional(v.number()),
    // Security & Audit
    ipAddressHash: v.optional(v.string()), // Where connection was created
    userAgent: v.optional(v.string()),
    connectionSource: v.string(), // 'web' | 'ios' | 'android'
    // Platform-specific metadata
    platformData: v.object({}), // { deviceInfo, appVersion, etc. }
    // Lifecycle
    createdAt: v.number(),
    updatedAt: v.number(),
    lastRefreshedAt: v.optional(v.number()),
    expiresAt: v.optional(v.number()), // When user should re-authorize
  })
    .index("by_user_provider", ["userId", "providerId"])
    .index("by_provider_active", ["providerId", "isActive"])
    .index("by_user_active", ["userId", "isActive"])
    .index("by_status", ["status"])
    .index("by_next_sync", ["nextSyncAt"])
    .index("by_expires_at", ["expiresAt"])
    .index("by_external_user_id", ["providerId", "externalUserId"])
    .index("by_consecutive_errors", ["consecutiveErrors", "status"])
    .index("by_provider_expires", ["providerId", "expiresAt"])
    .index("by_connection_source", ["connectionSource", "createdAt"]),

  musicProfiles: defineTable({
    userId: v.string(),
    // Profile Metadata
    profileVersion: v.string(), // Schema version for migrations
    lastFullSync: v.number(),
    nextSyncDue: v.number(),
    syncStatus: v.string(), // 'syncing' | 'completed' | 'error' | 'paused'
    // Aggregated Music Taste Data from all connected platforms
    topGenres: v.array(v.object({
      id: v.string(),
      name: v.string(),
      confidence: v.number(), // 0-1 how strongly user likes this genre
      workoutSuitability: v.number(), // 0-1 how good for workouts
      popularity: v.number(), // 0-100 general popularity
      source: v.string(), // Which provider contributed this
      lastUpdated: v.number(),
      // Workout context scoring
      cardioScore: v.number(), // 0-1 suitability for cardio
      strengthScore: v.number(), // 0-1 suitability for strength training
      yogaScore: v.number(), // 0-1 suitability for yoga/flexibility
      hiitScore: v.number(), // 0-1 suitability for HIIT
    })),
    topArtists: v.array(v.object({
      id: v.string(),
      name: v.string(),
      imageUrl: v.optional(v.string()),
      genres: v.array(v.string()),
      popularity: v.number(), // 0-100
      energy: v.number(), // 0-1 scale
      followers: v.optional(v.number()),
      playCount: v.number(),
      lastPlayed: v.optional(v.number()),
      workoutFrequency: v.number(), // 0-1 how often played during workouts
      source: v.string(),
      externalUrls: v.object({}), // { [platform]: url }
    })),
    topTracks: v.array(v.object({
      id: v.string(),
      name: v.string(),
      artist: v.string(),
      artistId: v.optional(v.string()),
      album: v.optional(v.string()),
      albumId: v.optional(v.string()),
      // Track Properties
      durationMs: v.number(),
      explicit: v.boolean(),
      popularity: v.number(), // 0-100
      // Audio Features (Spotify-style)
      energy: v.number(), // 0-1 scale
      tempo: v.number(), // BPM
      danceability: v.number(), // 0-1 scale
      valence: v.number(), // 0-1 positivity scale
      loudness: v.number(), // dB
      speechiness: v.number(), // 0-1 scale
      acousticness: v.number(), // 0-1 scale
      instrumentalness: v.number(), // 0-1 scale
      liveness: v.number(), // 0-1 scale
      // Media & Links
      imageUrl: v.optional(v.string()),
      previewUrl: v.optional(v.string()),
      externalUrls: v.object({}), // { [platform: string]: string }
      // User Interaction Data
      playCount: v.number(),
      skipCount: v.number(),
      likeStatus: v.optional(v.string()), // 'liked' | 'disliked' | 'neutral'
      lastPlayed: v.optional(v.number()),
      addedToPlaylist: v.boolean(),
      workoutUsage: v.object({
        totalWorkouts: v.number(),
        cardioWorkouts: v.number(),
        strengthWorkouts: v.number(),
        averageRating: v.number(), // 1-5
      }),
      source: v.string(),
      lastUpdated: v.number(),
    })),
    // Workout Music Preferences & Analysis
    workoutPreferences: v.object({
      preferredGenres: v.array(v.string()),
      avoidedGenres: v.array(v.string()),
      energyRange: v.object({
        min: v.number(), // 0-1 scale
        max: v.number(),
        preferred: v.number(),
      }),
      tempoRange: v.object({
        min: v.number(), // BPM
        max: v.number(),
        preferred: v.number(),
      }),
      valenceRange: v.object({
        min: v.number(), // 0-1 positivity scale
        max: v.number(),
        preferred: v.number(),
      }),
      // Advanced preferences
      explicitContent: v.boolean(),
      instrumentalOnly: v.boolean(),
      maxTrackLength: v.number(), // Seconds
      fadeInOut: v.boolean(),
      gapless: v.boolean(),
    }),
    // Workout Phase Preferences
    phasePreferences: v.object({
      warmup: v.object({
        duration: v.number(), // Minutes
        energyRange: v.object({ min: v.number(), max: v.number() }),
        tempoRange: v.object({ min: v.number(), max: v.number() }),
        preferredGenres: v.array(v.string()),
      }),
      main: v.object({
        duration: v.number(),
        energyRange: v.object({ min: v.number(), max: v.number() }),
        tempoRange: v.object({ min: v.number(), max: v.number() }),
        preferredGenres: v.array(v.string()),
        intensityProgression: v.boolean(),
      }),
      cooldown: v.object({
        duration: v.number(),
        energyRange: v.object({ min: v.number(), max: v.number() }),
        tempoRange: v.object({ min: v.number(), max: v.number() }),
        preferredGenres: v.array(v.string()),
      }),
    }),
    // Platform-specific data and sync status
    platformData: v.object({}), // { [providerId: string]: { playlists, recentTracks, lastUpdated, syncErrors } }
    connectedProviders: v.array(v.string()),
    primaryProvider: v.optional(v.string()), // Preferred provider for recommendations
    // Analytics & Insights
    listeningStats: v.object({
      totalTracks: v.number(),
      totalPlaytime: v.number(), // Minutes
      averageTrackLength: v.number(),
      mostActiveHour: v.number(), // 0-23
      mostActiveDay: v.number(), // 0-6 (Sunday = 0)
      diversityScore: v.number(), // 0-1 how varied their taste is
    }),
    workoutStats: v.object({
      totalWorkoutPlaylists: v.number(),
      averageWorkoutLength: v.number(), // Minutes
      mostUsedGenre: v.optional(v.string()),
      averageWorkoutEnergy: v.number(), // 0-1
      consistencyScore: v.number(), // 0-1 how consistent their preferences are
    }),
    // Metadata
    createdAt: v.number(),
    lastUpdated: v.number(),
    version: v.number(), // Incremented on each update for conflict resolution
  })
    .index("by_user", ["userId"])
    .index("by_last_updated", ["lastUpdated"])
    .index("by_sync_status", ["syncStatus"])
    .index("by_primary_provider", ["primaryProvider"])
    .index("by_next_sync", ["nextSyncDue"])
    .index("by_sync_due_status", ["nextSyncDue", "syncStatus"])
    .index("by_provider_updated", ["primaryProvider", "lastUpdated"]),

  workoutMusicRecommendations: defineTable({
    userId: v.string(),
    workoutId: v.optional(v.string()), // Optional link to specific workout
    // Recommendation Metadata
    recommendationId: v.string(), // Unique identifier
    version: v.string(), // Algorithm version used
    createdAt: v.number(),
    expiresAt: v.number(), // When recommendations become stale
    // Recommendation Context & Input
    context: v.object({
      workoutType: v.string(), // 'cardio' | 'strength' | 'yoga' | 'hiit' | etc.
      targetIntensity: v.number(), // 0-1 scale
      duration: v.number(), // Total minutes
      phases: v.array(v.object({
        name: v.string(), // 'warmup' | 'main' | 'cooldown'
        duration: v.number(), // Minutes
        targetIntensity: v.number(),
        targetTempo: v.optional(v.number()),
      })),
      timeOfDay: v.optional(v.number()), // Hour 0-23
      location: v.optional(v.string()), // 'home' | 'gym' | 'outdoor'
      equipment: v.optional(v.array(v.string())),
    }),
    // User Preferences Applied
    appliedPreferences: v.object({
      genres: v.array(v.string()),
      energy: v.object({ min: v.number(), max: v.number() }),
      tempo: v.object({ min: v.number(), max: v.number() }),
      valence: v.object({ min: v.number(), max: v.number() }),
      explicitContent: v.boolean(),
      maxTrackLength: v.number(),
    }),
    // Recommended Tracks with Enhanced Metadata
    tracks: v.array(v.object({
      // Basic Track Info
      id: v.string(),
      name: v.string(),
      artist: v.string(),
      artistId: v.optional(v.string()),
      album: v.optional(v.string()),
      albumId: v.optional(v.string()),
      // Track Properties
      durationMs: v.number(),
      explicit: v.boolean(),
      popularity: v.number(),
      // Audio Features
      energy: v.number(), // 0-1 scale
      tempo: v.number(), // BPM
      danceability: v.number(), // 0-1 scale
      valence: v.number(), // 0-1 positivity scale
      loudness: v.number(), // dB
      speechiness: v.number(),
      acousticness: v.number(),
      instrumentalness: v.number(),
      liveness: v.number(),
      // Media & Links
      imageUrl: v.optional(v.string()),
      previewUrl: v.optional(v.string()),
      externalUrls: v.object({}),
      // Recommendation-specific fields
      recommendationScore: v.number(), // 0-1 why this was recommended
      confidenceScore: v.number(), // 0-1 how confident the algorithm is
      reasoning: v.array(v.string()), // Array of reasons: ['high_energy', 'matches_tempo', 'user_history']
      position: v.number(), // Order in playlist (1-based)
      phaseMatch: v.string(), // 'warmup' | 'main' | 'cooldown'
      intensityMatch: v.number(), // 0-1 how well it matches target intensity
      // Fallback options
      alternatives: v.optional(v.array(v.object({
        trackId: v.string(),
        reason: v.string(),
        score: v.number(),
      }))),
      // Source & Attribution
      source: v.string(), // Which provider this came from
      providerId: v.string(),
      isFromUserHistory: v.boolean(),
      similarityToUserTaste: v.number(), // 0-1
    })),
    // Playlist Structure & Flow
    playlistStructure: v.object({
      totalDuration: v.number(), // Milliseconds
      trackCount: v.number(),
      averageEnergy: v.number(),
      averageTempo: v.number(),
      energyProgression: v.array(v.number()), // Energy curve over time
      tempoProgression: v.array(v.number()), // Tempo curve over time
      genreDistribution: v.object({}), // { genre: percentage }
      transitions: v.array(v.object({
        fromTrackId: v.string(),
        toTrackId: v.string(),
        transitionScore: v.number(), // 0-1 how smooth the transition
        reason: v.string(),
      })),
    }),
    // Algorithm Information
    algorithm: v.object({
      name: v.string(), // 'collaborative_filtering' | 'content_based' | 'hybrid'
      version: v.string(),
      modelId: v.optional(v.string()),
      parameters: v.object({}), // Algorithm-specific parameters used
      trainingData: v.object({
        userHistoryWeight: v.number(),
        genreWeight: v.number(),
        audioFeatureWeight: v.number(),
        popularityWeight: v.number(),
      }),
    }),
    // Quality & Performance Metrics
    qualityMetrics: v.object({
      confidence: v.number(), // 0-1 overall confidence in recommendations
      diversity: v.number(), // 0-1 how diverse the playlist is
      novelty: v.number(), // 0-1 how many new-to-user tracks
      coverage: v.number(), // 0-1 how well it covers user preferences
      coherence: v.number(), // 0-1 how well tracks flow together
      personalization: v.number(), // 0-1 how personalized to this user
    }),
    // User Feedback & Learning
    feedback: v.object({
      rating: v.optional(v.number()), // 1-5 stars
      usedInWorkout: v.boolean(),
      completionRate: v.optional(v.number()), // 0-1 how much of playlist was used
      skipRate: v.optional(v.number()), // 0-1 percentage of tracks skipped
      likedTracks: v.array(v.string()), // Track IDs that were liked
      dislikedTracks: v.array(v.string()), // Track IDs that were disliked
      comments: v.optional(v.string()),
      workoutRating: v.optional(v.number()), // 1-5 how well it supported the workout
      energyMatch: v.optional(v.number()), // 1-5 how well energy matched workout
      moodMatch: v.optional(v.number()), // 1-5 how well mood matched
      feedbackAt: v.optional(v.number()),
    }),
    // Usage Analytics
    usage: v.object({
      views: v.number(),
      plays: v.number(),
      shares: v.number(),
      saves: v.number(),
      lastUsedAt: v.optional(v.number()),
      totalPlayTime: v.number(), // Seconds actually played
      deviceTypes: v.array(v.string()), // ['ios', 'android', 'web']
    }),
    // Status & Lifecycle
    status: v.string(), // 'generated' | 'delivered' | 'used' | 'expired' | 'archived'
    tags: v.array(v.string()), // For categorization and search
    isPublic: v.boolean(), // Can other users see this recommendation
    isFeatured: v.boolean(), // Highlighted recommendation
  })
    .index("by_user_context_type", ["userId", "context.workoutType"])
    .index("by_user_created", ["userId", "createdAt"])
    .index("by_workout_id", ["workoutId"])
    .index("by_recommendation_id", ["recommendationId"])
    .index("by_status", ["status"])
    .index("by_expires_at", ["expiresAt"])
    .index("by_algorithm_name", ["algorithm.name"])
    .index("by_is_featured", ["isFeatured"])
    .index("by_user_status_created", ["userId", "status", "createdAt"])
    .index("by_featured_status", ["isFeatured", "status"]),

  platformUIStates: defineTable({
    userId: v.string(),
    platform: v.string(), // 'ios' | 'android' | 'web'
    // Device Information & Capabilities
    deviceInfo: v.object({
      platform: v.string(), // 'ios' | 'android' | 'web' | 'desktop'
      version: v.string(), // OS version
      model: v.optional(v.string()), // Device model
      manufacturer: v.optional(v.string()),
      architecture: v.optional(v.string()), // 'arm64' | 'x86_64'
      screenSize: v.object({
        width: v.number(), // Physical pixels
        height: v.number(),
        density: v.number(), // DPI or scale factor
        aspectRatio: v.number(),
        orientation: v.string(), // 'portrait' | 'landscape'
      }),
      // Advanced Device Capabilities
      capabilities: v.object({
        // Display & UI
        hasNotch: v.boolean(),
        hasHomeIndicator: v.boolean(),
        supportsDarkMode: v.boolean(),
        supportsSystemColors: v.boolean(),
        supportsLargeText: v.boolean(),
        maxBrightness: v.optional(v.number()),
        // Interaction
        supportsHaptics: v.boolean(),
        supportsTouchID: v.boolean(),
        supportsFaceID: v.boolean(),
        supportsForce3DTouch: v.boolean(),
        supportsMultitouch: v.boolean(),
        maxTouchPoints: v.number(),
        // Audio & Media
        supportsAudioOutput: v.boolean(),
        supportsBluetoothAudio: v.boolean(),
        supportsWirelessCharging: v.boolean(),
        supportsNFC: v.boolean(),
        // Sensors & Hardware
        hasAccelerometer: v.boolean(),
        hasGyroscope: v.boolean(),
        hasCompass: v.boolean(),
        hasGPS: v.boolean(),
        hasHeartRateMonitor: v.boolean(),
        // Network & Connectivity
        supportsWiFi: v.boolean(),
        supportsCellular: v.boolean(),
        supportsOffline: v.boolean(),
        // Performance
        memoryGB: v.optional(v.number()),
        storageGB: v.optional(v.number()),
        batteryCapacity: v.optional(v.number()),
        cpuCores: v.optional(v.number()),
      }),
      // Runtime Environment
      runtimeInfo: v.object({
        appVersion: v.string(),
        buildNumber: v.string(),
        environment: v.string(), // 'development' | 'staging' | 'production'
        capacitorVersion: v.optional(v.string()),
        webviewVersion: v.optional(v.string()),
        userAgent: v.optional(v.string()),
      }),
    }),
    // User Interface Preferences
    uiPreferences: v.object({
      // Theme & Appearance
      theme: v.string(), // 'light' | 'dark' | 'system' | 'high_contrast'
      colorScheme: v.string(), // Primary color scheme
      accentColor: v.optional(v.string()),
      fontSize: v.string(), // 'small' | 'medium' | 'large' | 'extra_large'
      fontFamily: v.optional(v.string()),
      animations: v.boolean(),
      reducedMotion: v.boolean(),
      // Accessibility
      highContrast: v.boolean(),
      voiceOverEnabled: v.boolean(),
      switchControlEnabled: v.boolean(),
      assistiveTouchEnabled: v.boolean(),
      // Interaction
      hapticFeedback: v.boolean(),
      soundEffects: v.boolean(),
      vibration: v.boolean(),
      doubleTabEnabled: v.boolean(),
      swipeGestures: v.boolean(),
    }),
    // Layout & Component Preferences
    layoutPreferences: v.object({
      // Screen Layouts
      homeScreenLayout: v.array(v.object({
        componentId: v.string(),
        position: v.number(),
        size: v.string(), // 'small' | 'medium' | 'large'
        isVisible: v.boolean(),
        customConfig: v.optional(v.object({})),
      })),
      workoutScreenLayout: v.array(v.object({
        componentId: v.string(),
        position: v.number(),
        size: v.string(),
        isVisible: v.boolean(),
        customConfig: v.optional(v.object({})),
      })),
      navigationStyle: v.string(), // 'tabs' | 'drawer' | 'stack' | 'split'
      bottomSheetPreference: v.boolean(),
      sidebarPreference: v.boolean(),
      // Widget Configurations
      widgets: v.array(v.object({
        widgetId: v.string(),
        type: v.string(), // 'quick_stats' | 'workout_progress' | 'music_player'
        position: v.object({ x: v.number(), y: v.number() }),
        size: v.object({ width: v.number(), height: v.number() }),
        settings: v.object({}),
        isEnabled: v.boolean(),
      })),
    }),
    // Platform-Specific Settings
    platformSpecificSettings: v.object({
      // iOS Settings
      ios: v.optional(v.object({
        useSystemColors: v.boolean(),
        preferLargeText: v.boolean(),
        voiceOverOptimized: v.boolean(),
        guidedAccessMode: v.boolean(),
        safariInAppBrowsing: v.boolean(),
        nativeSharing: v.boolean(),
        shortcutSupport: v.boolean(),
        widgetSupport: v.boolean(),
        handoffSupport: v.boolean(),
        continuityCamera: v.boolean(),
        // iOS UI Customizations
        statusBarStyle: v.string(), // 'default' | 'light' | 'dark'
        homeIndicatorStyle: v.string(),
        navigationBarStyle: v.string(),
        tabBarStyle: v.string(),
      })),
      // Android Settings
      android: v.optional(v.object({
        materialYou: v.boolean(),
        adaptiveIcons: v.boolean(),
        edgeToEdge: v.boolean(),
        gestureNavigation: v.boolean(),
        splitScreenSupport: v.boolean(),
        pictureInPicture: v.boolean(),
        backgroundAppRefresh: v.boolean(),
        notificationChannels: v.array(v.string()),
        // Android UI Customizations
        systemBarsStyle: v.string(),
        navigationBarColor: v.optional(v.string()),
        statusBarColor: v.optional(v.string()),
        actionBarStyle: v.string(),
      })),
      // Web Settings
      web: v.optional(v.object({
        keyboardShortcuts: v.boolean(),
        desktopNotifications: v.boolean(),
        fullscreenMode: v.boolean(),
        offlineMode: v.boolean(),
        progressiveWebApp: v.boolean(),
        responsiveBreakpoints: v.object({
          mobile: v.number(), // px
          tablet: v.number(),
          desktop: v.number(),
          ultrawide: v.number(),
        }),
        // Web UI Customizations
        scrollBehavior: v.string(), // 'smooth' | 'instant'
        loadingIndicatorStyle: v.string(),
        tooltipDelay: v.number(), // ms
        animationDuration: v.number(), // ms
      })),
    }),
    // Performance & Optimization Settings
    performanceSettings: v.object({
      // Rendering & Graphics
      animationQuality: v.string(), // 'high' | 'medium' | 'low' | 'off'
      imageQuality: v.string(), // 'original' | 'high' | 'medium' | 'low'
      preloadImages: v.boolean(),
      lazyLoadComponents: v.boolean(),
      // Data & Sync
      backgroundSync: v.boolean(),
      cacheSize: v.number(), // MB
      offlineSupport: v.boolean(),
      autoUpdate: v.boolean(),
      // Battery & Resources
      batteryOptimization: v.boolean(),
      dataUsageOptimization: v.boolean(),
      cpuThrottling: v.boolean(),
      memoryLimitMB: v.optional(v.number()),
    }),
    // User Experience Enhancements
    uxEnhancements: v.object({
      // Smart Features
      smartNotifications: v.boolean(),
      contextualHints: v.boolean(),
      adaptiveInterface: v.boolean(),
      predictiveText: v.boolean(),
      // Quick Actions
      quickActionsEnabled: v.boolean(),
      customQuickActions: v.array(v.object({
        actionId: v.string(),
        label: v.string(),
        icon: v.string(),
        gesture: v.optional(v.string()),
        isEnabled: v.boolean(),
      })),
      // Personalization
      dashboardCustomization: v.boolean(),
      workoutTypePreferences: v.array(v.string()),
      defaultWorkoutDuration: v.number(), // minutes
      reminderSettings: v.object({
        enabled: v.boolean(),
        frequency: v.string(), // 'daily' | 'weekly' | 'custom'
        preferredTime: v.optional(v.string()), // 'HH:MM'
      }),
    }),
    // Usage Analytics & Learning
    usageAnalytics: v.object({
      // Session Data
      totalSessions: v.number(),
      averageSessionLength: v.number(), // minutes
      lastSessionAt: v.optional(v.number()),
      mostUsedFeatures: v.array(v.string()),
      // Interaction Patterns
      tapPatterns: v.object({}), // Heatmap data
      swipeDirections: v.array(v.string()),
      navigationPaths: v.array(v.string()),
      errorRate: v.number(), // 0-1
      // Adaptive Learning
      learnedPreferences: v.object({}),
      adaptationScore: v.number(), // 0-1 how well UI is adapted
      suggestionAcceptanceRate: v.number(), // 0-1
    }),
    // State Management & Sync
    stateMetadata: v.object({
      version: v.number(), // Schema version
      lastSyncAt: v.optional(v.number()),
      syncStatus: v.string(), // 'synced' | 'pending' | 'conflict' | 'error'
      conflicts: v.array(v.object({
        field: v.string(),
        localValue: v.any(),
        remoteValue: v.any(),
        timestamp: v.number(),
      })),
      backupData: v.optional(v.object({})), // Last known good state
    }),
    // Security & Privacy
    privacySettings: v.object({
      dataCollectionConsent: v.boolean(),
      analyticsEnabled: v.boolean(),
      crashReportingEnabled: v.boolean(),
      usageDataSharing: v.string(), // 'none' | 'anonymous' | 'identified'
      locationTrackingEnabled: v.boolean(),
      biometricDataEnabled: v.boolean(),
    }),
    // Lifecycle & Metadata
    isActive: v.boolean(),
    lastUsedAt: v.number(),
    createdAt: v.number(),
    lastUpdated: v.number(),
    migratedFrom: v.optional(v.string()), // Previous schema version
  })
    .index("by_user_platform", ["userId", "platform"])
    .index("by_platform", ["platform"])
    .index("by_last_used", ["lastUsedAt"])
    .index("by_is_active", ["isActive"])
    .index("by_sync_status", ["stateMetadata.syncStatus"])
    .index("by_device_model", ["deviceInfo.model"])
    .index("by_app_version", ["deviceInfo.runtimeInfo.appVersion"])
    .index("by_platform_active", ["platform", "isActive"])
    .index("by_inactive_cleanup", ["isActive", "lastUsedAt"])
    .index("by_version_platform", ["deviceInfo.runtimeInfo.appVersion", "platform"]),

  oauthSessions: defineTable({
    userId: v.string(),
    providerId: v.string(),
    // PKCE Flow Data
    codeVerifier: v.string(), // Encrypted
    codeChallenge: v.string(),
    codeChallengeMethod: v.string(), // 'S256'
    state: v.string(),
    nonce: v.string(),
    // Session Metadata
    sessionId: v.string(), // Unique session identifier
    createdAt: v.number(),
    expiresAt: v.number(),
    lastActivityAt: v.number(),
    timeoutAt: v.number(), // Session timeout
    // OAuth Flow Configuration
    redirectUri: v.string(),
    scopes: v.array(v.string()),
    responseType: v.string(), // 'code'
    grantType: v.string(), // 'authorization_code'
    // Flow Tracking & Status
    status: v.string(), // 'initiated' | 'authorized' | 'completed' | 'expired' | 'error' | 'cancelled'
    flowStep: v.string(), // 'authorization' | 'callback' | 'token_exchange' | 'completed'
    authorizationCode: v.optional(v.string()), // Temporary storage, encrypted
    errorMessage: v.optional(v.string()),
    errorCode: v.optional(v.string()),
    errorDescription: v.optional(v.string()),
    // Platform Context
    platform: v.string(), // 'ios' | 'android' | 'web'
    deviceInfo: v.object({
      userAgent: v.optional(v.string()),
      platform: v.string(),
      version: v.string(),
      model: v.optional(v.string()),
    }),
    networkInfo: v.object({
      ipAddressHash: v.optional(v.string()), // Hashed for security
      country: v.optional(v.string()),
      city: v.optional(v.string()),
    }),
    // Security & Audit
    attempts: v.number(), // Number of authorization attempts
    maxAttempts: v.number(),
    securityFlags: v.object({
      suspiciousActivity: v.boolean(),
      rateLimited: v.boolean(),
      blockedCountry: v.boolean(),
      requiresVerification: v.boolean(),
    }),
    // Session Metrics
    authorizationDuration: v.optional(v.number()), // Milliseconds
    callbackProcessingTime: v.optional(v.number()),
    totalFlowTime: v.optional(v.number()),
    // Debugging & Analytics
    referrer: v.optional(v.string()),
    utmSource: v.optional(v.string()),
    utmMedium: v.optional(v.string()),
    sessionTrace: v.array(v.object({
      step: v.string(),
      timestamp: v.number(),
      duration: v.optional(v.number()),
      success: v.boolean(),
      errorMessage: v.optional(v.string()),
    })),
  })
    .index("by_state", ["state"])
    .index("by_session_id", ["sessionId"])
    .index("by_user_provider", ["userId", "providerId"])
    .index("by_expires_at", ["expiresAt"])
    .index("by_status", ["status"])
    .index("by_platform", ["platform"])
    .index("by_flow_step", ["flowStep"])
    .index("by_created_at", ["createdAt"])
    .index("by_user_status", ["userId", "status"])
    .index("by_platform_status", ["platform", "status"])
    .index("by_flow_status", ["flowStep", "status"]),

  musicSyncStatus: defineTable({
    userId: v.string(),
    providerId: v.string(), // References OAuthProvider.id
    connectionId: v.id('userOAuthConnections'),
    syncType: v.string(), // 'full' | 'incremental' | 'favorites' | 'playlists'
    status: v.string(), // 'initializing' | 'in_progress' | 'paused' | 'completed' | 'failed' | 'cancelled' | 'superseded'
    priority: v.string(), // 'low' | 'normal' | 'high' | 'critical'
    
    // Progress Tracking
    progress: v.object({
      phase: v.string(), // 'initialization' | 'authentication' | 'data_fetch' | 'processing' | 'finalization'
      currentStep: v.string(), // Detailed step within phase
      stepProgress: v.number(), // 0-1 progress within current step
      overallProgress: v.number(), // 0-1 overall completion
      estimatedTotal: v.number(), // Estimated total items to process
      processedItems: v.number(), // Items successfully processed
      failedItems: v.number(), // Items that failed processing
      skippedItems: v.number(), // Items intentionally skipped
    }),
    
    // Timing Information
    timing: v.object({
      startedAt: v.number(),
      estimatedDuration: v.number(), // Milliseconds
      estimatedCompletion: v.number(), // Unix timestamp
      lastUpdateAt: v.number(),
      phaseStartedAt: v.number(),
      completedAt: v.optional(v.number()),
      cancelledAt: v.optional(v.number()),
      pausedAt: v.optional(v.number()),
      resumedAt: v.optional(v.number()),
      actualDuration: v.optional(v.number()), // Milliseconds
      totalPausedTime: v.optional(v.number()), // Milliseconds
    }),
    
    // Sync Configuration
    config: v.object({
      batchSize: v.number(),
      maxConcurrency: v.number(),
      timeoutMs: v.number(),
      includeAnalytics: v.boolean(),
      enableRealTimeUpdates: v.boolean(),
    }),
    
    // Client Information
    clientInfo: v.object({
      platform: v.optional(v.string()),
      version: v.optional(v.string()),
      connectionType: v.optional(v.string()), // 'wifi' | 'cellular' | 'ethernet'
      deviceId: v.optional(v.string()),
    }),
    
    // Performance Metrics
    metrics: v.object({
      itemsPerSecond: v.number(),
      bytesTransferred: v.number(),
      apiCallsMade: v.number(),
      errorsEncountered: v.number(),
      retryAttempts: v.number(),
    }),
    
    // Detailed Phase Information
    phases: v.array(v.object({
      name: v.string(),
      description: v.string(),
      estimatedDuration: v.number(),
      estimatedItems: v.number(),
    })),
    currentPhaseIndex: v.number(),
    
    // Error and Warning Tracking
    errors: v.array(v.object({
      error: v.any(),
      timestamp: v.number(),
      phase: v.string(),
      step: v.optional(v.string()),
    })),
    warnings: v.array(v.object({
      warning: v.string(),
      timestamp: v.number(),
      phase: v.string(),
    })),
    
    // Control History
    controlHistory: v.optional(v.array(v.object({
      success: v.boolean(),
      action: v.string(), // 'pause' | 'resume' | 'cancel' | 'restart'
      previousStatus: v.string(),
      newStatus: v.string(),
      timestamp: v.number(),
      reason: v.optional(v.string()),
    }))),
    
    // Status Flags
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user_provider", ["userId", "providerId"])
    .index("by_status", ["status"])
    .index("by_user_status", ["userId", "status"])
    .index("by_provider_status", ["providerId", "status"])
    .index("by_priority", ["priority"])
    .index("by_created_at", ["createdAt"])
    .index("by_updated_at", ["updatedAt"])
    .index("by_phase", ["progress.phase"])
    .index("by_is_active", ["isActive"])
    .index("by_connection_id", ["connectionId"])
    .index("by_user_provider_active", ["userId", "providerId", "isActive"])
    .index("by_estimated_completion", ["timing.estimatedCompletion"])
    .index("by_user_created_desc", ["userId", "createdAt"])
    .index("by_status_priority", ["status", "priority"]),

  // OAuth Security Audit & Monitoring Tables

  securityAuditLog: defineTable({
    userId: v.optional(v.id("users")),
    eventType: v.string(), // 'login_attempt' | 'token_refresh' | 'suspicious_activity' | etc.
    riskLevel: v.number(), // 1-4 (low, medium, high, critical)
    description: v.string(),
    metadata: v.object({}), // { ip, userAgent, provider, endpoint, errorCode, additional }
    timestamp: v.number(),
    resolved: v.boolean(),
    expiresAt: v.number(), // Data retention (2 years)
  })
    .index("by_userId_timestamp", ["userId", "timestamp"])
    .index("by_timestamp", ["timestamp"])
    .index("by_event_type", ["eventType"])
    .index("by_risk_level", ["riskLevel"])
    .index("by_resolved", ["resolved"])
    .index("by_expires_at", ["expiresAt"])
    .index("by_user_risk", ["userId", "riskLevel"])
    .index("by_type_timestamp", ["eventType", "timestamp"]),

  securityAlerts: defineTable({
    eventId: v.id("securityAuditLog"),
    alertLevel: v.string(), // 'high' | 'critical'
    description: v.string(),
    timestamp: v.number(),
    acknowledged: v.boolean(),
    acknowledgedBy: v.optional(v.string()),
    acknowledgedAt: v.optional(v.number()),
    resolvedAt: v.optional(v.number()),
    resolution: v.optional(v.string()),
  })
    .index("by_timestamp", ["timestamp"])
    .index("by_alert_level", ["alertLevel"])
    .index("by_acknowledged", ["acknowledged"])
    .index("by_event_id", ["eventId"])
    .index("by_level_acknowledged", ["alertLevel", "acknowledged"]),

  // Provider-Specific Features Tables

  providerFeatures: defineTable({
    providerId: v.string(), // References OAuthProvider.id
    featureType: v.string(), // 'spotify_connect' | 'apple_music_radio' | 'youtube_premium'
    featureName: v.string(),
    description: v.string(),
    isEnabled: v.boolean(),
    isPremiumOnly: v.boolean(),
    configuration: v.object({}), // Feature-specific configuration
    capabilities: v.array(v.string()), // What the feature can do
    requirements: v.object({
      minAppVersion: v.optional(v.string()),
      platformSupport: v.array(v.string()),
      permissions: v.array(v.string()),
      premiumRequired: v.boolean(),
    }),
    usageStats: v.object({
      totalUsers: v.number(),
      activeUsers: v.number(),
      usageCount: v.number(),
      lastUsedAt: v.optional(v.number()),
    }),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_provider_id", ["providerId"])
    .index("by_feature_type", ["featureType"])
    .index("by_enabled", ["isEnabled"])
    .index("by_provider_enabled", ["providerId", "isEnabled"])
    .index("by_premium_only", ["isPremiumOnly"]),

  userProviderFeatures: defineTable({
    userId: v.id("users"),
    providerId: v.string(),
    featureId: v.id("providerFeatures"),
    isEnabled: v.boolean(),
    configuration: v.object({}), // User-specific feature settings
    usageCount: v.number(),
    lastUsedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user_provider", ["userId", "providerId"])
    .index("by_user_feature", ["userId", "featureId"])
    .index("by_feature_id", ["featureId"])
    .index("by_enabled", ["isEnabled"])
    .index("by_last_used", ["lastUsedAt"]),

  // Music Discovery Tables

  musicDiscovery: defineTable({
    userId: v.id("users"),
    discoveryType: v.string(), // 'trending' | 'personalized' | 'genre_exploration' | 'workout_focused'
    category: v.string(), // 'tracks' | 'artists' | 'albums' | 'playlists'
    items: v.array(v.object({
      id: v.string(),
      name: v.string(),
      artist: v.optional(v.string()),
      imageUrl: v.optional(v.string()),
      previewUrl: v.optional(v.string()),
      externalUrls: v.object({}),
      score: v.number(), // Relevance/popularity score
      reason: v.string(), // Why this was recommended
      source: v.string(), // Which provider/algorithm
    })),
    metadata: v.object({
      algorithm: v.string(),
      version: v.string(),
      confidence: v.number(), // 0-1
      freshness: v.number(), // How recent the discovery is
      diversity: v.number(), // How diverse the recommendations are
    }),
    userContext: v.object({
      workoutType: v.optional(v.string()),
      mood: v.optional(v.string()),
      timeOfDay: v.optional(v.number()),
      location: v.optional(v.string()),
    }),
    engagement: v.object({
      views: v.number(),
      clicks: v.number(),
      saves: v.number(),
      shares: v.number(),
      plays: v.number(),
      completionRate: v.number(), // 0-1
    }),
    feedback: v.object({
      likes: v.number(),
      dislikes: v.number(),
      rating: v.optional(v.number()), // 1-5
      comments: v.array(v.string()),
    }),
    status: v.string(), // 'active' | 'expired' | 'archived'
    expiresAt: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user_type", ["userId", "discoveryType"])
    .index("by_user_category", ["userId", "category"])
    .index("by_expires_at", ["expiresAt"])
    .index("by_status", ["status"])
    .index("by_created_at", ["createdAt"])
    .index("by_user_created", ["userId", "createdAt"]),

  // OAuth Analytics Tables

  oauthAnalytics: defineTable({
    userId: v.optional(v.id("users")),
    providerId: v.string(),
    eventType: v.string(), // 'connection' | 'disconnection' | 'token_refresh' | 'api_call' | 'sync'
    action: v.string(), // Specific action taken
    metadata: v.object({
      platform: v.optional(v.string()),
      userAgent: v.optional(v.string()),
      ipAddress: v.optional(v.string()),
      duration: v.optional(v.number()),
      success: v.boolean(),
      errorCode: v.optional(v.string()),
      errorMessage: v.optional(v.string()),
      dataSize: v.optional(v.number()),
      responseTime: v.optional(v.number()),
    }),
    dimensions: v.object({
      hour: v.number(), // 0-23
      dayOfWeek: v.number(), // 0-6
      month: v.number(), // 1-12
      year: v.number(),
    }),
    metrics: v.object({
      count: v.number(),
      duration: v.optional(v.number()),
      bytes: v.optional(v.number()),
      errorRate: v.optional(v.number()),
    }),
    timestamp: v.number(),
  })
    .index("by_provider_timestamp", ["providerId", "timestamp"])
    .index("by_user_provider", ["userId", "providerId"])
    .index("by_event_type", ["eventType"])
    .index("by_timestamp", ["timestamp"])
    .index("by_success", ["metadata.success"])
    .index("by_provider_event", ["providerId", "eventType"])
    .index("by_hour", ["dimensions.hour"])
    .index("by_day", ["dimensions.dayOfWeek"]),

  providerPerformance: defineTable({
    providerId: v.string(),
    timeWindow: v.string(), // '1h' | '24h' | '7d' | '30d'
    metrics: v.object({
      totalRequests: v.number(),
      successfulRequests: v.number(),
      failedRequests: v.number(),
      averageResponseTime: v.number(), // milliseconds
      p95ResponseTime: v.number(),
      p99ResponseTime: v.number(),
      errorRate: v.number(), // 0-1
      uptime: v.number(), // 0-1
      throughput: v.number(), // requests per second
    }),
    errors: v.object({
      authentication: v.number(),
      rateLimit: v.number(),
      serverError: v.number(),
      network: v.number(),
      timeout: v.number(),
      other: v.number(),
    }),
    health: v.object({
      status: v.string(), // 'healthy' | 'degraded' | 'down'
      lastIncident: v.optional(v.number()),
      mttr: v.optional(v.number()), // Mean time to recovery in minutes
      availability: v.number(), // 0-1
    }),
    timestamp: v.number(),
    windowStart: v.number(),
    windowEnd: v.number(),
  })
    .index("by_provider_window", ["providerId", "timeWindow"])
    .index("by_timestamp", ["timestamp"])
    .index("by_provider_timestamp", ["providerId", "timestamp"])
    .index("by_health_status", ["health.status"]),

  // AI & Machine Learning Tables

  aiUserPreferences: defineTable({
    userId: v.string(),
    // Workout Preferences Learned from History
    workoutPreferences: v.object({
      preferredIntensity: v.number(), // 0-1 scale
      volumeTolerance: v.number(), // sets per session
      restTimePreference: v.number(), // seconds
      exerciseVariety: v.number(), // 0-1, how much user likes variety
      progressionRate: v.number(), // 0-1, how aggressive progression should be
      formFocus: v.number(), // 0-1, emphasis on form vs intensity
      timeConstraints: v.number(), // preferred session duration in minutes
    }),
    // Feedback Patterns
    feedbackPatterns: v.object({
      acceptanceRate: v.number(), // % of AI suggestions accepted
      modificationFrequency: v.number(), // how often user modifies suggestions
      skipRate: v.number(), // % of suggested exercises skipped
      intensityAdjustments: v.array(v.number()), // history of intensity changes
      commonRejectionReasons: v.array(v.string()),
    }),
    // Learning Confidence Scores
    confidenceScores: v.object({
      workoutRecommendations: v.number(), // 0-1
      exerciseSelection: v.number(),
      intensityAdjustment: v.number(),
      restTimeOptimization: v.number(),
      progressionTiming: v.number(),
    }),
    // Personal Goals & Context
    contextualFactors: v.object({
      fitnessLevel: v.string(), // 'beginner' | 'intermediate' | 'advanced'
      primaryGoals: v.array(v.string()),
      injuryHistory: v.array(v.string()),
      equipmentAccess: v.array(v.string()),
      timeAvailability: v.object({
        weekdays: v.number(), // minutes available
        weekends: v.number(),
        preferredTimes: v.array(v.string()), // 'morning' | 'afternoon' | 'evening'
      }),
    }),
    // Model Performance Tracking
    modelPerformance: v.object({
      totalInteractions: v.number(),
      successfulPredictions: v.number(),
      averageConfidence: v.number(),
      lastModelUpdate: v.number(),
      learningRate: v.number(), // how quickly to adapt to new patterns
    }),
    createdAt: v.number(),
    updatedAt: v.number(),
    lastInteractionAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_confidence", ["confidenceScores.workoutRecommendations"])
    .index("by_last_interaction", ["lastInteractionAt"])
    .index("by_fitness_level", ["contextualFactors.fitnessLevel"]),

  aiWorkoutTweaks: defineTable({
    userId: v.string(),
    workoutId: v.optional(v.string()),
    sessionId: v.string(), // unique identifier for workout session
    // AI Recommendation Details
    recommendation: v.object({
      type: v.string(), // 'weight_adjustment' | 'rep_modification' | 'rest_change' | 'exercise_substitution'
      originalValue: v.any(), // what was originally planned
      suggestedValue: v.any(), // what AI recommended
      confidence: v.number(), // 0-1
      reasoning: v.string(),
      factors: v.array(v.string()), // factors that influenced the decision
    }),
    // Context Information
    context: v.object({
      exerciseName: v.optional(v.string()),
      setNumber: v.optional(v.number()),
      previousPerformance: v.optional(v.object({
        completedSets: v.number(),
        completedReps: v.array(v.number()),
        rpe: v.optional(v.number()), // rate of perceived exertion
      })),
      userState: v.optional(v.object({
        fatigueLevel: v.number(), // 0-10
        motivation: v.number(), // 0-10
        timeConstraints: v.optional(v.number()), // remaining time in minutes
      })),
      environmentalFactors: v.optional(v.object({
        gymCrowding: v.optional(v.string()),
        equipmentAvailability: v.optional(v.boolean()),
        timeOfDay: v.string(),
      })),
    }),
    // User Response
    userResponse: v.object({
      action: v.string(), // 'accepted' | 'modified' | 'rejected' | 'ignored'
      actualValue: v.optional(v.any()), // what user actually did
      feedback: v.optional(v.string()), // user's textual feedback
      rating: v.optional(v.number()), // 1-5 stars
      modificationReason: v.optional(v.string()),
      responseTime: v.optional(v.number()), // seconds to respond
    }),
    // Outcome Tracking
    outcome: v.object({
      completed: v.boolean(),
      performanceRating: v.optional(v.number()), // 1-10
      injuries: v.optional(v.array(v.string())),
      nextSessionImpact: v.optional(v.string()), // how it affected next workout
      longTermEffect: v.optional(v.string()), // weekly/monthly impact
    }),
    // AI Model Information
    modelInfo: v.object({
      modelVersion: v.string(),
      algorithm: v.string(), // 'distilgpt2' | 'fallback'
      processingTime: v.number(), // milliseconds
      inputTokens: v.optional(v.number()),
      outputTokens: v.optional(v.number()),
    }),
    timestamp: v.number(),
    createdAt: v.number(),
  })
    .index("by_userId_session", ["userId", "sessionId"])
    .index("by_userId_timestamp", ["userId", "timestamp"])
    .index("by_recommendation_type", ["recommendation.type"])
    .index("by_user_response", ["userResponse.action"])
    .index("by_confidence", ["recommendation.confidence"])
    .index("by_model_version", ["modelInfo.modelVersion"])
    .index("by_outcome_success", ["outcome.completed"]),

  aiLearningEvents: defineTable({
    userId: v.string(),
    eventType: v.string(), // 'preference_update' | 'model_retrain' | 'confidence_adjustment' | 'pattern_discovery'
    // Event Data
    eventData: v.object({
      trigger: v.string(), // what triggered this learning event
      previousState: v.any(), // state before the change
      newState: v.any(), // state after the change
      changeVector: v.optional(v.array(v.number())), // numerical representation of change
      impactScore: v.number(), // 0-1, how significant this change is
    }),
    // Learning Context
    context: v.object({
      totalInteractions: v.number(), // how many interactions led to this
      timeSpan: v.number(), // days over which learning occurred
      dataQuality: v.number(), // 0-1, quality of underlying data
      conflictingSignals: v.optional(v.array(v.string())), // any contradictory patterns
    }),
    // Performance Impact
    performance: v.object({
      beforeAccuracy: v.number(), // accuracy before this learning
      afterAccuracy: v.number(), // predicted accuracy after
      confidenceImprovement: v.number(), // -1 to 1
      expectedUserSatisfaction: v.number(), // 0-1
    }),
    // Meta-Learning
    metaData: v.object({
      learningSpeed: v.string(), // 'slow' | 'moderate' | 'fast'
      stabilityScore: v.number(), // 0-1, how stable this learning is
      generalizability: v.number(), // 0-1, how well this applies to other users
      novelty: v.number(), // 0-1, how unique this pattern is
    }),
    timestamp: v.number(),
    processingTime: v.number(), // milliseconds to process this learning
  })
    .index("by_userId_type", ["userId", "eventType"])
    .index("by_timestamp", ["timestamp"])
    .index("by_impact_score", ["eventData.impactScore"])
    .index("by_learning_speed", ["metaData.learningSpeed"])
    .index("by_stability", ["metaData.stabilityScore"]),

  aiModelVersions: defineTable({
    version: v.string(),
    modelType: v.string(), // 'distilgpt2' | 'custom' | 'fallback'
    // Model Configuration
    configuration: v.object({
      baseModel: v.string(), // 'distilgpt2' | 'gpt2' | 'custom'
      maxTokens: v.number(),
      temperature: v.number(),
      topP: v.optional(v.number()),
      repetitionPenalty: v.optional(v.number()),
      customParameters: v.optional(v.object({})),
    }),
    // Performance Metrics
    performance: v.object({
      averageResponseTime: v.number(), // milliseconds
      averageAccuracy: v.number(), // 0-1
      userSatisfactionScore: v.number(), // 0-1
      tokensPerSecond: v.number(),
      cpuUtilization: v.number(), // 0-1
      memoryUsage: v.number(), // MB
    }),
    // Usage Statistics
    usage: v.object({
      totalRequests: v.number(),
      successfulRequests: v.number(),
      failedRequests: v.number(),
      averageRequestsPerDay: v.number(),
      peakRequestsPerMinute: v.number(),
    }),
    // Deployment Information
    deployment: v.object({
      status: v.string(), // 'active' | 'deprecated' | 'testing' | 'failed'
      deployedAt: v.number(),
      rolloutPercentage: v.number(), // 0-100
      canaryGroup: v.optional(v.array(v.string())), // user IDs for canary testing
      rollbackTriggered: v.boolean(),
      healthCheckStatus: v.string(), // 'healthy' | 'degraded' | 'unhealthy'
    }),
    // Quality Assurance
    qualityMetrics: v.object({
      testCoverage: v.number(), // 0-1
      regressionTestsPassed: v.number(),
      regressionTestsTotal: v.number(),
      userAcceptanceTestScore: v.number(), // 0-1
      safetyScore: v.number(), // 0-1, safety rail effectiveness
    }),
    // Change Log
    changes: v.array(v.object({
      type: v.string(), // 'feature' | 'bugfix' | 'performance' | 'safety'
      description: v.string(),
      impact: v.string(), // 'major' | 'minor' | 'patch'
      riskLevel: v.string(), // 'low' | 'medium' | 'high'
    })),
    createdAt: v.number(),
    createdBy: v.string(), // who deployed this version
    notes: v.optional(v.string()),
  })
    .index("by_version", ["version"])
    .index("by_status", ["deployment.status"])
    .index("by_performance", ["performance.averageAccuracy"])
    .index("by_created", ["createdAt"])
    .index("by_rollout", ["deployment.rolloutPercentage"]),

  // Enhanced Workout Tables for AI Integration

  workoutSessions: defineTable({
    userId: v.string(),
    programId: v.optional(v.string()),
    sessionId: v.string(), // unique identifier for this session
    // Session Metadata
    metadata: v.object({
      name: v.string(),
      startTime: v.number(),
      endTime: v.optional(v.number()),
      duration: v.optional(v.number()), // minutes
      status: v.string(), // 'planned' | 'in_progress' | 'completed' | 'abandoned'
      location: v.optional(v.string()),
      weather: v.optional(v.string()),
    }),
    // Planned vs Actual Performance
    exercises: v.array(v.object({
      exerciseId: v.string(),
      exerciseName: v.string(),
      order: v.number(),
      // Planned Parameters
      planned: v.object({
        sets: v.number(),
        reps: v.array(v.number()), // per set
        weight: v.optional(v.array(v.number())), // per set
        restTime: v.optional(v.number()), // seconds
        rpe: v.optional(v.number()), // target RPE
      }),
      // Actual Performance
      actual: v.optional(v.object({
        sets: v.number(),
        reps: v.array(v.number()),
        weight: v.optional(v.array(v.number())),
        restTime: v.optional(v.array(v.number())), // actual rest between sets
        rpe: v.optional(v.array(v.number())), // per set
        notes: v.optional(v.string()),
      })),
      // AI Interventions
      aiTweaks: v.optional(v.array(v.string())), // tweak IDs from aiWorkoutTweaks
      userModifications: v.optional(v.array(v.string())), // user's manual changes
    })),
    // User State & Feedback
    userState: v.object({
      preworkoutEnergy: v.optional(v.number()), // 1-10
      postworkoutEnergy: v.optional(v.number()),
      preworkoutMotivation: v.optional(v.number()),
      postworkoutSatisfaction: v.optional(v.number()),
      perceivedDifficulty: v.optional(v.number()), // 1-10
      enjoymentRating: v.optional(v.number()), // 1-10
    }),
    // Environmental Context
    context: v.object({
      timeOfDay: v.string(),
      dayOfWeek: v.number(),
      gymCrowding: v.optional(v.string()), // 'low' | 'medium' | 'high'
      equipmentAvailability: v.optional(v.number()), // 0-1
      socialContext: v.optional(v.string()), // 'alone' | 'trainer' | 'partner' | 'group'
      musicPlaying: v.optional(v.boolean()),
    }),
    // Performance Analytics
    analytics: v.object({
      totalVolume: v.number(), // sets × reps × weight
      averageIntensity: v.number(), // average RPE
      completionRate: v.number(), // 0-1
      progressionScore: v.number(), // compared to previous sessions
      formQuality: v.optional(v.number()), // 1-10 if assessed
      timeEfficiency: v.number(), // planned vs actual duration
    }),
    // AI Insights
    aiInsights: v.optional(v.object({
      performancePrediction: v.object({
        expectedCompletion: v.number(), // 0-1
        riskFactors: v.array(v.string()),
        recommendations: v.array(v.string()),
      }),
      learningOpportunities: v.array(v.string()),
      patternRecognition: v.optional(v.string()),
      nextSessionPreparation: v.optional(v.string()),
    })),
    // Integration with Other Systems
    integrations: v.object({
      wearableData: v.optional(v.string()), // reference to wearable data
      musicPlaylist: v.optional(v.string()),
      nutritionContext: v.optional(v.object({
        preWorkoutMeal: v.optional(v.string()),
        hydrationLevel: v.optional(v.number()),
        supplementation: v.optional(v.array(v.string())),
      })),
    }),
    // AI Training fields for workout data collection
    aiTrainingData: v.optional(v.object({
      includeInTraining: v.optional(v.boolean()),
      dataType: v.optional(v.string()),
      anonymizationLevel: v.optional(v.string()),
      contributedAt: v.optional(v.number()),
    })),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_userId_session", ["userId", "sessionId"])
    .index("by_userId_timestamp", ["userId", "createdAt"])
    .index("by_status", ["metadata.status"])
    .index("by_program", ["programId"])
    .index("by_completion_rate", ["analytics.completionRate"])
    .index("by_progression_score", ["analytics.progressionScore"]),

  // Enhanced Nutrition AI Tables

  // User Health Profiles with medical conditions and safety flags
  userHealthProfiles: defineTable({
    userId: v.string(),
    medicalConditions: v.array(v.string()), // diabetes, heart_condition, hypertension, etc.
    allergies: v.array(v.string()), // food allergies and intolerances
    medications: v.array(v.object({
      name: v.string(),
      dosage: v.optional(v.string()),
      nutritionInteractions: v.optional(v.array(v.string())), // nutrients affected
      timingRestrictions: v.optional(v.string()),
    })),
    safetyFlags: v.object({
      diabetesFlag: v.boolean(),
      heartConditionFlag: v.boolean(),
      kidneyIssueFlag: v.boolean(),
      digestiveIssueFlag: v.boolean(),
      eatingDisorderHistory: v.boolean(),
    }),
    metabolicData: v.object({
      basalMetabolicRate: v.optional(v.number()),
      totalDailyEnergyExpenditure: v.optional(v.number()),
      metabolicFlexibility: v.optional(v.number()), // 0-1 score
      insulinSensitivity: v.optional(v.number()), // 0-1 score
    }),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_diabetes_flag", ["safetyFlags.diabetesFlag"])
    .index("by_heart_condition", ["safetyFlags.heartConditionFlag"]),

  // Recovery and HRV Data for nutrition adjustments
  recoveryMetrics: defineTable({
    userId: v.string(),
    date: v.string(), // YYYY-MM-DD format
    hrvScore: v.optional(v.number()), // 0-100 HRV readiness score
    restingHeartRate: v.optional(v.number()),
    sleepQuality: v.optional(v.number()), // 0-10 scale
    sleepDuration: v.optional(v.number()), // hours
    stressLevel: v.optional(v.number()), // 0-10 scale
    hydrationStatus: v.optional(v.number()), // 0-100 percentage
    recoveryScore: v.number(), // composite 0-100 recovery score
    source: v.string(), // whoop, oura, apple_watch, manual, etc.
    rawData: v.optional(v.object({})), // store raw device data
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_userId_date", ["userId", "date"])
    .index("by_userId_timestamp", ["userId", "createdAt"])
    .index("by_recovery_score", ["recoveryScore"])
    .index("by_source", ["source"]),

  // Enhanced nutrition goals with recovery-aware adjustments
  adaptiveNutritionGoals: defineTable({
    userId: v.string(),
    baseGoals: v.object({
      calories: v.number(),
      protein: v.number(),
      carbs: v.number(),
      fat: v.number(),
      fiber: v.optional(v.number()),
      sugar: v.optional(v.number()),
      sodium: v.optional(v.number()),
    }),
    recoveryAdjustments: v.object({
      lowRecoveryMultiplier: v.number(), // e.g., 1.05 for 5% increase
      highRecoveryMultiplier: v.number(), // e.g., 0.98 for 2% decrease
      hydrationBoostThreshold: v.number(), // recovery score below which to boost hydration
      proteinBoostThreshold: v.number(), // recovery score below which to boost protein
    }),
    currentAdjustedGoals: v.object({
      calories: v.number(),
      protein: v.number(),
      carbs: v.number(),
      fat: v.number(),
      hydration: v.number(), // liters per day
      adjustmentReason: v.string(),
      lastAdjustedAt: v.number(),
    }),
    weeklyTargets: v.object({
      proteinMakeupDeficit: v.number(), // grams to makeup from previous days
      calorieMakeupDeficit: v.number(), // calories to makeup
      maxMakeupDays: v.number(), // how many days to spread makeup over
    }),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_last_adjusted", ["currentAdjustedGoals.lastAdjustedAt"]),

  // Hydration tracking and recommendations
  hydrationTracking: defineTable({
    userId: v.string(),
    date: v.string(), // YYYY-MM-DD format
    targetHydration: v.number(), // liters per day
    currentIntake: v.number(), // liters consumed so far
    recommendations: v.array(v.object({
      time: v.string(), // HH:MM format
      amount: v.number(), // liters
      reason: v.string(), // workout, recovery, temperature, etc.
      priority: v.string(), // high, medium, low
      completed: v.boolean(),
    })),
    recoveryBasedAdjustment: v.optional(v.number()), // additional liters based on recovery
    environmentFactors: v.optional(v.object({
      temperature: v.optional(v.number()), // celsius
      humidity: v.optional(v.number()), // percentage
      altitude: v.optional(v.number()), // meters
    })),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_userId_date", ["userId", "date"])
    .index("by_userId_timestamp", ["userId", "createdAt"]),

  // Nutrition AI recommendations and learning
  nutritionAIRecommendations: defineTable({
    userId: v.string(),
    recommendationType: v.string(), // meal_timing, macro_adjustment, hydration, supplement
    recommendation: v.object({
      title: v.string(),
      description: v.string(),
      action: v.string(), // increase_protein, adjust_timing, add_hydration, etc.
      targetValue: v.optional(v.number()),
      targetUnit: v.optional(v.string()),
      priority: v.string(), // high, medium, low
      safetyChecked: v.boolean(),
    }),
    reasoning: v.object({
      recoveryScore: v.optional(v.number()),
      hrvTrend: v.optional(v.string()),
      deficitDays: v.optional(v.number()),
      workoutIntensity: v.optional(v.string()),
      medicalConsiderations: v.optional(v.array(v.string())),
    }),
    userResponse: v.optional(v.object({
      accepted: v.boolean(),
      implemented: v.boolean(),
      feedback: v.optional(v.string()),
      modifiedValue: v.optional(v.number()),
      responseAt: v.number(),
    })),
    aiModelVersion: v.string(),
    confidence: v.number(), // 0-1 confidence score
    createdAt: v.number(),
    expiresAt: v.optional(v.number()),
  })
    .index("by_userId_type", ["userId", "recommendationType"])
    .index("by_userId_timestamp", ["userId", "createdAt"])
    .index("by_priority", ["recommendation.priority"])
    .index("by_confidence", ["confidence"])
    .index("by_expires", ["expiresAt"]),

  // Nutrition safety monitoring and alerts
  nutritionSafetyAlerts: defineTable({
    userId: v.string(),
    alertType: v.string(), // excessive_deficit, dangerous_surplus, interaction_warning, etc.
    severity: v.string(), // critical, warning, info
    message: v.string(),
    nutritionData: v.object({
      currentIntake: v.object({}),
      recommendedRange: v.object({}),
      violatedThreshold: v.string(),
    }),
    medicalRelevance: v.optional(v.array(v.string())), // relevant medical conditions
    actionRequired: v.boolean(),
    acknowledged: v.boolean(),
    resolvedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_userId_severity", ["userId", "severity"])
    .index("by_userId_timestamp", ["userId", "createdAt"])
    .index("by_acknowledged", ["acknowledged"])
    .index("by_action_required", ["actionRequired"]),

  // Meal planning with recovery-aware suggestions
  mealPlans: defineTable({
    userId: v.string(),
    date: v.string(), // YYYY-MM-DD format
    planType: v.string(), // ai_generated, manual, template
    meals: v.array(v.object({
      mealType: v.string(), // breakfast, lunch, dinner, snack
      foods: v.array(v.object({
        foodId: v.string(),
        name: v.string(),
        quantity: v.number(),
        unit: v.string(),
        nutrition: v.object({
          calories: v.number(),
          protein: v.number(),
          carbs: v.number(),
          fat: v.number(),
        }),
      })),
      timing: v.optional(v.string()), // HH:MM format
      recoveryOptimized: v.boolean(),
      workoutRelated: v.boolean(),
    })),
    totalNutrition: v.object({
      calories: v.number(),
      protein: v.number(),
      carbs: v.number(),
      fat: v.number(),
      hydration: v.number(),
    }),
    recoveryConsiderations: v.optional(v.object({
      recoveryScore: v.number(),
      recommendedAdjustments: v.array(v.string()),
      appliedAdjustments: v.array(v.string()),
    })),
    adherence: v.optional(v.object({
      mealsCompleted: v.number(),
      totalMeals: v.number(),
      macroAccuracy: v.number(), // 0-1 score
      updatedAt: v.number(),
    })),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_userId_date", ["userId", "date"])
    .index("by_userId_timestamp", ["userId", "createdAt"])
    .index("by_plan_type", ["planType"])
    .index("by_recovery_optimized", ["recoveryConsiderations.recoveryScore"]),

  // AI Training and Voice Synthesis System

  aiTrainingData: defineTable({
    dataId: v.string(), // Contract expects specific dataId field
    userId: v.optional(v.string()),
    workoutId: v.optional(v.string()), // Contract expects workoutId
    userConsent: v.boolean(), // Contract requires explicit consent tracking
    status: v.string(), // Contract expects: 'accepted', 'rejected', 'processing'
    dataType: v.string(), // 'workout', 'nutrition', 'recovery', 'voice_interaction'
    anonymizedData: v.object({ // Contract expects anonymizedData structure
      exerciseType: v.optional(v.string()),
      duration: v.optional(v.number()),
      intensity: v.optional(v.number()),
      additionalData: v.optional(v.object({})),
    }),
    content: v.optional(v.object({
      workout: v.optional(v.object({
        exercises: v.array(v.string()),
        sets: v.array(v.number()),
        reps: v.array(v.number()),
        weights: v.array(v.number()),
        duration: v.number(),
        intensity: v.number(),
        context: v.object({}),
      })),
      nutrition: v.optional(v.object({
        meals: v.array(v.object({})),
        calories: v.number(),
        macros: v.object({
          protein: v.number(),
          carbs: v.number(),
          fat: v.number(),
        }),
        timing: v.array(v.string()),
      })),
      recovery: v.optional(v.object({
        sleepHours: v.number(),
        recoveryScore: v.number(),
        hrv: v.optional(v.number()),
        stress: v.number(),
        activities: v.array(v.string()),
      })),
      voiceInteraction: v.optional(v.object({
        transcript: v.string(),
        intent: v.string(),
        confidence: v.number(),
        duration: v.number(),
        emotionalTone: v.optional(v.string()),
      })),
    })),
    submittedAt: v.number(), // Contract expects submittedAt timestamp
    annotations: v.object({
      labels: v.array(v.string()),
      categories: v.array(v.string()),
      qualityScore: v.number(),
      verified: v.boolean(),
      source: v.string(),
    }),
    privacy: v.object({
      anonymized: v.boolean(),
      consentLevel: v.string(),
      retentionDate: v.number(),
      sharePermission: v.boolean(),
    }),
    processingStatus: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_userId_type", ["userId", "dataType"])
    .index("by_type_status", ["dataType", "processingStatus"])
    .index("by_consent", ["privacy.consentLevel"])
    .index("by_quality", ["annotations.qualityScore"])
    .index("by_retention", ["privacy.retentionDate"]),

  voicePreferences: defineTable({
    userId: v.string(),
    voiceId: v.string(),
    name: v.string(),
    provider: v.string(), // 'elevenlabs', 'system', 'custom'
    settings: v.object({
      stability: v.number(),
      similarityBoost: v.number(),
      style: v.optional(v.string()),
      pace: v.optional(v.number()),
      volume: v.optional(v.number()),
    }),
    usage: v.object({
      totalUsage: v.number(),
      lastUsed: v.number(),
      averageLength: v.number(),
      contexts: v.array(v.string()),
    }),
    isActive: v.boolean(),
    isDefault: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_provider", ["provider"])
    .index("by_isDefault", ["isDefault"])
    .index("by_lastUsed", ["usage.lastUsed"]),

  aiModels: defineTable({
    modelId: v.string(), // Contract expects specific modelId field
    name: v.string(),
    version: v.string(),
    type: v.string(), // 'language', 'voice_synthesis', 'recommendation'
    status: v.string(), // 'training', 'deployed', 'archived' (contract specific values)
    metadata: v.object({
      accuracy: v.number(),
      description: v.optional(v.string()),
      tags: v.optional(v.array(v.string())),
    }),
    performanceMetrics: v.object({
      accuracy: v.number(),
      precision: v.number(),
      recall: v.number(),
      f1Score: v.optional(v.number()),
      latency: v.optional(v.number()),
    }),
    configuration: v.object({
      modelParams: v.object({}),
      hyperparameters: v.object({}),
      trainingConfig: v.object({}),
      endpoints: v.array(v.string()),
    }),
    training: v.object({
      datasetSize: v.number(),
      trainingSessions: v.number(),
      lastTrainingDate: v.number(),
      nextScheduledTraining: v.optional(v.number()),
    }),
    deployment: v.object({
      environment: v.string(),
      replicas: v.number(),
      autoScale: v.boolean(),
      deploymentId: v.optional(v.string()),
      estimatedCompletion: v.optional(v.number()),
    }),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_modelId", ["modelId"])
    .index("by_type", ["type"])
    .index("by_status", ["status"])
    .index("by_version", ["version"])
    .index("by_accuracy", ["performanceMetrics.accuracy"])
    .index("by_lastTraining", ["training.lastTrainingDate"]),

  trainingSessions: defineTable({
    modelId: v.optional(v.id("aiModels")), // Optional for contract flexibility
    sessionId: v.string(), // Contract expects this as primary identifier
    sessionType: v.string(), // Contract expects: 'coaching', etc.
    trainingMode: v.string(), // Contract expects: 'incremental', 'full'
    dataRetentionDays: v.number(),
    priority: v.optional(v.string()), // Contract expects: 'normal', 'high', 'low'
    status: v.string(), // Contract expects: 'active', 'paused', 'completed', 'failed', 'scheduled'
    progress: v.number(), // Contract expects simple percentage (0-100)
    estimatedDuration: v.optional(v.number()),
    metadata: v.object({
      description: v.optional(v.string()),
      tags: v.optional(v.array(v.string())),
      source: v.optional(v.string()),
    }),
    metrics: v.object({
      loss: v.optional(v.number()),
      accuracy: v.optional(v.number()),
      epochsCompleted: v.optional(v.number()),
      trainingLoss: v.optional(v.array(v.number())),
      validationLoss: v.optional(v.array(v.number())),
      learningRate: v.optional(v.number()),
    }),
    datasetInfo: v.optional(v.object({
      totalSamples: v.number(),
      trainingSamples: v.number(),
      validationSamples: v.number(),
      testSamples: v.number(),
      dataTypes: v.array(v.string()),
    })),
    resources: v.object({
      computeType: v.string(),
      memoryUsage: v.number(),
      gpuUtilization: v.optional(v.number()),
      estimatedCost: v.number(),
    }),
    logs: v.array(v.object({
      timestamp: v.number(),
      level: v.string(),
      message: v.string(),
      details: v.optional(v.object({})),
    })),
    startedAt: v.number(),
    completedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_model", ["modelId"])
    .index("by_status", ["status"])
    .index("by_session", ["sessionId"])
    .index("by_started", ["startedAt"])
    .index("by_completed", ["completedAt"]),

  voiceInteractions: defineTable({
    userId: v.string(),
    sessionId: v.string(),
    interactionType: v.string(), // 'coaching', 'workout_guidance', 'motivation', 'question_answer'
    input: v.object({
      text: v.optional(v.string()),
      audioUrl: v.optional(v.string()),
      transcript: v.optional(v.string()),
      intent: v.optional(v.string()),
    }),
    response: v.object({
      text: v.string(),
      audioUrl: v.optional(v.string()),
      voiceId: v.string(),
      emotionalTone: v.optional(v.string()),
      length: v.number(),
    }),
    context: v.object({
      workoutPhase: v.optional(v.string()),
      userMood: v.optional(v.string()),
      timeOfDay: v.string(),
      location: v.optional(v.string()),
    }),
    quality: v.object({
      audioQuality: v.number(),
      responseRelevance: v.number(),
      userSatisfaction: v.optional(v.number()),
      technicalIssues: v.array(v.string()),
    }),
    processing: v.object({
      synthesisTime: v.number(),
      cacheHit: v.boolean(),
      modelVersion: v.string(),
      apiCalls: v.number(),
    }),
    feedback: v.optional(v.object({
      helpful: v.boolean(),
      rating: v.number(),
      comments: v.optional(v.string()),
      followupNeeded: v.boolean(),
    })),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_session", ["sessionId"])
    .index("by_type", ["interactionType"])
    .index("by_satisfaction", ["quality.userSatisfaction"])
    .index("by_created", ["createdAt"]),

  voiceCache: defineTable({
    textHash: v.string(),
    text: v.string(),
    voiceId: v.string(),
    audioUrl: v.string(),
    metadata: v.object({
      duration: v.number(),
      fileSize: v.number(),
      format: v.string(),
      sampleRate: v.number(),
    }),
    usage: v.object({
      hitCount: v.number(),
      lastAccessed: v.number(),
      popularity: v.number(),
      contexts: v.array(v.string()),
    }),
    expiry: v.object({
      expiresAt: v.number(),
      priority: v.string(),
      canExtend: v.boolean(),
    }),
    quality: v.object({
      synthesisQuality: v.number(),
      compressionLevel: v.string(),
      verified: v.boolean(),
    }),
    createdAt: v.number(),
  })
    .index("by_textHash", ["textHash"])
    .index("by_voiceId", ["voiceId"])
    .index("by_hitCount", ["usage.hitCount"])
    .index("by_expiresAt", ["expiry.expiresAt"])
    .index("by_popularity", ["usage.popularity"]),
});