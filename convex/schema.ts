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
    .index("by_id", ["id"])
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
      personalización: v.number(), // 0-1 how personalized to this user
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
});