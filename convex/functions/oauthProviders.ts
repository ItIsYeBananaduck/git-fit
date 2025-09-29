/**
 * OAuth Provider Management - Convex Functions
 * 
 * Implements all OAuth provider management operations including:
 * - Get available OAuth providers
 * - Provider configuration management  
 * - Health monitoring and status updates
 * - Platform-specific provider filtering
 */

import { mutation, query } from '../_generated/server';
import { v, ConvexError } from 'convex/values';

// ====================================================================================
// OAUTH PROVIDER INITIALIZATION
// ====================================================================================

// Initialize OAuth provider configurations
export const initializeProviders = mutation({
  args: {},
  handler: async (ctx, args) => {
    // Check if providers already exist
    const existingProviders = await ctx.db.query("oauthProviders").collect();
    
    if (existingProviders.length > 0) {
      return { message: "OAuth providers already initialized", providers: existingProviders };
    }

    // Enhanced Spotify OAuth configuration
    const spotifyProvider = {
      id: "spotify",
      name: "spotify",
      displayName: "Spotify",
      description: "Connect to Spotify to sync your music preferences and get personalized workout playlists",
      scopes: [
        "user-read-private",
        "user-read-email", 
        "user-top-read",
        "playlist-read-private",
        "user-read-recently-played",
        "user-library-read",
        "playlist-modify-public",
        "playlist-modify-private"
      ],
      defaultScopes: [
        "user-read-private",
        "user-top-read",
        "playlist-read-private"
      ],
      authEndpoint: "https://accounts.spotify.com/authorize",
      tokenEndpoint: "https://accounts.spotify.com/api/token",
      revokeEndpoint: "https://accounts.spotify.com/api/revoke",
      redirectUri: process.env.SPOTIFY_REDIRECT_URI || "http://localhost:5173/oauth/callback/spotify",
      clientId: process.env.SPOTIFY_CLIENT_ID || "",
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET || "", // Encrypted in production
      features: {
        supportsRefreshToken: true,
        supportsTokenRevocation: true,
        supportsUserInfo: true,
        supportsPlaylistSync: true,
        supportsRealtimeData: false,
        rateLimitRpm: 100,
        maxTokenLifetime: 3600,
      },
      supportedPlatforms: ["ios", "android", "web"],
      platformConfig: {
        ios: {
          customScheme: "gitfit-spotify",
          universalLink: "https://gitfit.app/oauth/spotify",
          bundleIdentifier: "com.gitfit.app",
        },
        android: {
          customScheme: "gitfit-spotify",
          packageName: "com.gitfit.app",
          intentFilters: ["android.intent.action.VIEW"],
        },
        web: {
          redirectPaths: ["/oauth/callback/spotify"],
          corsOrigins: ["http://localhost:5173", "https://gitfit.app"],
        },
      },
      iconUrl: "/icons/spotify.svg",
      brandColor: "#1DB954",
      brandColorDark: "#1ed760",
      logoUrl: "/logos/spotify.png",
      buttonStyle: {
        backgroundColor: "#1DB954",
        textColor: "#FFFFFF",
        borderColor: "#1DB954",
        iconPosition: "left",
      },
      isEnabled: true,
      isProduction: false,
      maintenanceMode: false,
      healthStatus: "healthy",
      totalConnections: 0,
      activeConnections: 0,
      version: "1.0.0",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // Enhanced Apple Music OAuth configuration
    const appleMusicProvider = {
      id: "apple_music",
      name: "apple_music", 
      displayName: "Apple Music",
      description: "Connect to Apple Music to access your music library and preferences",
      scopes: [
        "user-read-private",
        "user-library-read",
        "user-read-recently-played",
        "playlist-read-private"
      ],
      defaultScopes: [
        "user-read-private",
        "user-library-read"
      ],
      authEndpoint: "https://authorize.music.apple.com/woa",
      tokenEndpoint: "https://api.music.apple.com/v1/oauth/token",
      redirectUri: process.env.APPLE_MUSIC_REDIRECT_URI || "http://localhost:5173/oauth/callback/apple-music",
      clientId: process.env.APPLE_MUSIC_CLIENT_ID || "",
      clientSecret: process.env.APPLE_MUSIC_CLIENT_SECRET || "",
      features: {
        supportsRefreshToken: true,
        supportsTokenRevocation: false,
        supportsUserInfo: true,
        supportsPlaylistSync: true,
        supportsRealtimeData: false,
        rateLimitRpm: 200,
        maxTokenLifetime: 86400,
      },
      supportedPlatforms: ["ios", "android", "web"],
      platformConfig: {
        ios: {
          customScheme: "gitfit-applemusic",
          universalLink: "https://gitfit.app/oauth/apple-music",
          bundleIdentifier: "com.gitfit.app",
        },
        android: {
          customScheme: "gitfit-applemusic",
          packageName: "com.gitfit.app",
          intentFilters: ["android.intent.action.VIEW"],
        },
        web: {
          redirectPaths: ["/oauth/callback/apple-music"],
          corsOrigins: ["http://localhost:5173", "https://gitfit.app"],
        },
      },
      iconUrl: "/icons/apple-music.svg",
      brandColor: "#FA233B",
      brandColorDark: "#ff1744",
      logoUrl: "/logos/apple-music.png",
      buttonStyle: {
        backgroundColor: "#FA233B",
        textColor: "#FFFFFF",
        borderColor: "#FA233B",
        iconPosition: "left",
      },
      isEnabled: true,
      isProduction: false,
      maintenanceMode: false,
      healthStatus: "healthy",
      totalConnections: 0,
      activeConnections: 0,
      version: "1.0.0",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // YouTube Music OAuth configuration
    const youtubeMusicProvider = {
      id: "youtube_music",
      name: "youtube_music",
      displayName: "YouTube Music",
      description: "Connect to YouTube Music to sync your music preferences and playlists",
      scopes: [
        "https://www.googleapis.com/auth/youtube.readonly",
        "https://www.googleapis.com/auth/youtubepartner",
        "openid",
        "email",
        "profile"
      ],
      defaultScopes: [
        "https://www.googleapis.com/auth/youtube.readonly",
        "openid",
        "email"
      ],
      authEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
      tokenEndpoint: "https://oauth2.googleapis.com/token",
      revokeEndpoint: "https://oauth2.googleapis.com/revoke",
      redirectUri: process.env.YOUTUBE_MUSIC_REDIRECT_URI || "http://localhost:5173/oauth/callback/youtube-music",
      clientId: process.env.YOUTUBE_MUSIC_CLIENT_ID || "",
      clientSecret: process.env.YOUTUBE_MUSIC_CLIENT_SECRET || "",
      features: {
        supportsRefreshToken: true,
        supportsTokenRevocation: true,
        supportsUserInfo: true,
        supportsPlaylistSync: true,
        supportsRealtimeData: false,
        rateLimitRpm: 1000,
        maxTokenLifetime: 3600,
      },
      supportedPlatforms: ["ios", "android", "web"],
      platformConfig: {
        ios: {
          customScheme: "gitfit-youtube",
          universalLink: "https://gitfit.app/oauth/youtube-music",
          bundleIdentifier: "com.gitfit.app",
        },
        android: {
          customScheme: "gitfit-youtube", 
          packageName: "com.gitfit.app",
          intentFilters: ["android.intent.action.VIEW"],
        },
        web: {
          redirectPaths: ["/oauth/callback/youtube-music"],
          corsOrigins: ["http://localhost:5173", "https://gitfit.app"],
        },
      },
      iconUrl: "/icons/youtube-music.svg",
      brandColor: "#FF0000",
      brandColorDark: "#cc0000",
      logoUrl: "/logos/youtube-music.png",
      buttonStyle: {
        backgroundColor: "#FF0000",
        textColor: "#FFFFFF",
        borderColor: "#FF0000",
        iconPosition: "left",
      },
      isEnabled: true,
      isProduction: false,
      maintenanceMode: false,
      healthStatus: "healthy",
      totalConnections: 0,
      activeConnections: 0,
      version: "1.0.0",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // Create provider records
    const spotifyId = await ctx.db.insert("oauthProviders", spotifyProvider);
    const appleMusicId = await ctx.db.insert("oauthProviders", appleMusicProvider);
    const youtubeMusicId = await ctx.db.insert("oauthProviders", youtubeMusicProvider);

    return {
      message: "OAuth providers initialized successfully",
      providers: [
        { ...spotifyProvider, _id: spotifyId },
        { ...appleMusicProvider, _id: appleMusicId },
        { ...youtubeMusicProvider, _id: youtubeMusicId }
      ]
    };
  }
});

// ====================================================================================
// OAUTH PROVIDER QUERIES
// ====================================================================================

/**
 * Get all available OAuth providers with optional filtering
 * Supports filtering by platform, enabled status, and production readiness
 */
export const getOAuthProviders = query({
  args: {
    platform: v.optional(v.string()), // 'ios' | 'android' | 'web'
    enabledOnly: v.optional(v.boolean()),
    productionOnly: v.optional(v.boolean()),
    includeHealthStatus: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    try {
      // Start with all providers
      let providersQuery = ctx.db.query('oauthProviders');

      // Apply filters based on arguments
      if (args.enabledOnly !== false) {
        // Default to enabled only unless explicitly set to false
        providersQuery = providersQuery.filter(q => q.eq(q.field('isEnabled'), true));
      }

      if (args.productionOnly) {
        providersQuery = providersQuery.filter(q => q.eq(q.field('isProduction'), true));
      }

      let providers = await providersQuery.collect();

      // Filter by platform support (client-side since it's an array field)
      if (args.platform) {
        providers = providers.filter(provider => 
          provider.supportedPlatforms.includes(args.platform!)
        );
      }

      // Add health status information if requested
      if (args.includeHealthStatus) {
        // Health status is already included in the provider object
        // Just ensure we're returning current information
        providers = providers.map(provider => ({
          ...provider,
          isHealthy: provider.healthStatus === 'healthy',
          lastHealthCheckFormatted: provider.lastHealthCheck 
            ? new Date(provider.lastHealthCheck).toISOString()
            : null
        }));
      }

      // Sort providers by display order (enabled first, then by name)
      providers.sort((a, b) => {
        if (a.isEnabled !== b.isEnabled) {
          return b.isEnabled ? 1 : -1; // Enabled first
        }
        return a.displayName.localeCompare(b.displayName);
      });

      return {
        providers,
        metadata: {
          total: providers.length,
          enabled: providers.filter(p => p.isEnabled).length,
          platform: args.platform || 'all',
          healthy: providers.filter(p => p.healthStatus === 'healthy').length,
          lastUpdated: Date.now()
        }
      };
    } catch (error) {
      console.error('Error fetching OAuth providers:', error);
      throw new ConvexError({
        message: 'Failed to fetch OAuth providers',
        code: 'PROVIDER_FETCH_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },
});

// Get all enabled OAuth providers (legacy compatibility)
export const getEnabledProviders = query({
  args: {},
  handler: async (ctx, args) => {
    return await ctx.db
      .query("oauthProviders")
      .withIndex("by_enabled", (q) => q.eq("isEnabled", true))
      .collect();
  }
});

// Get OAuth provider by ID (enhanced)
export const getProviderById = query({
  args: { 
    providerId: v.string(),
    includeSecrets: v.optional(v.boolean()), // Admin only
  },
  handler: async (ctx, args) => {
    try {
      const provider = await ctx.db
        .query("oauthProviders")
        .withIndex("by_id", (q) => q.eq("id", args.providerId))
        .unique();

      if (!provider) {
        throw new ConvexError({
          message: `OAuth provider '${args.providerId}' not found`,
          code: 'PROVIDER_NOT_FOUND'
        });
      }

      // Remove sensitive information unless explicitly requested (admin only)
      if (!args.includeSecrets) {
        const { clientSecret, ...publicProvider } = provider;
        return publicProvider;
      }

      return provider;
    } catch (error) {
      console.error(`Error fetching OAuth provider ${args.providerId}:`, error);
      if (error instanceof ConvexError) {
        throw error;
      }
      throw new ConvexError({
        message: 'Failed to fetch OAuth provider',
        code: 'PROVIDER_FETCH_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
});

// Get OAuth providers for a specific platform with configuration
export const getPlatformOAuthProviders = query({
  args: {
    platform: v.string(), // 'ios' | 'android' | 'web'
    includeConfig: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    try {
      const providers = await ctx.db
        .query('oauthProviders')
        .filter(q => q.eq(q.field('isEnabled'), true))
        .collect();

      // Filter by platform support and add platform-specific configuration
      const platformProviders = providers
        .filter(provider => provider.supportedPlatforms.includes(args.platform))
        .map(provider => {
          const platformConfig = provider.platformConfig[args.platform as keyof typeof provider.platformConfig];
          
          return {
            id: provider.id,
            name: provider.name,
            displayName: provider.displayName,
            scopes: provider.scopes,
            defaultScopes: provider.defaultScopes,
            iconUrl: provider.iconUrl,
            brandColor: provider.brandColor,
            brandColorDark: provider.brandColorDark,
            buttonStyle: provider.buttonStyle,
            isEnabled: provider.isEnabled,
            healthStatus: provider.healthStatus,
            ...(args.includeConfig && platformConfig ? { platformConfig } : {}),
            ...(args.includeConfig ? {
              authEndpoint: provider.authEndpoint,
              redirectUri: provider.redirectUri,
              features: provider.features
            } : {})
          };
        });

      return {
        providers: platformProviders,
        platform: args.platform,
        count: platformProviders.length,
        lastUpdated: Date.now()
      };
    } catch (error) {
      console.error(`Error fetching providers for platform ${args.platform}:`, error);
      throw new ConvexError({
        message: `Failed to fetch providers for platform ${args.platform}`,
        code: 'PLATFORM_PROVIDERS_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },
});

// Get user's OAuth connections with provider status (enhanced)
export const getUserConnections = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const providers = await ctx.db
      .query("oauthProviders")
      .withIndex("by_enabled", (q) => q.eq("isEnabled", true))
      .collect();

    const connections = await ctx.db
      .query("userOAuthConnections")
      .withIndex("by_user_active", (q) => q.eq("userId", args.userId).eq("isActive", true))
      .collect();

    const connectionMap = new Map(connections.map(conn => [conn.providerId, conn]));

    return providers.map(provider => {
      const connection = connectionMap.get(provider.id);
      return {
        provider,
        connection: connection || null,
        isConnected: !!connection,
        status: connection?.status || 'not_connected',
        isTokenValid: connection ? connection.tokenExpiry > Date.now() : false,
        lastSyncAt: connection?.lastSyncAt,
        connectionHealth: connection ? {
          consecutiveErrors: connection.consecutiveErrors,
          successRate: connection.successRate,
          lastError: connection.lastErrorMessage,
        } : null
      };
    });
  }
});

// ====================================================================================
// OAUTH PROVIDER MUTATIONS
// ====================================================================================

// Update provider configuration (enhanced)
export const updateProvider = mutation({
  args: {
    providerId: v.string(),
    updates: v.object({
      isEnabled: v.optional(v.boolean()),
      clientId: v.optional(v.string()),
      redirectUri: v.optional(v.string()),
      scopes: v.optional(v.array(v.string())),
      supportedPlatforms: v.optional(v.array(v.string())),
      healthStatus: v.optional(v.string()),
      maintenanceMode: v.optional(v.boolean()),
    })
  },
  handler: async (ctx, args) => {
    const provider = await ctx.db
      .query("oauthProviders")
      .withIndex("by_id", (q) => q.eq("id", args.providerId))
      .unique();

    if (!provider) {
      throw new Error(`OAuth provider ${args.providerId} not found`);
    }

    // Add timestamp for updates
    const updateData = {
      ...args.updates,
      updatedAt: Date.now()
    };

    await ctx.db.patch(provider._id, updateData);
    
    return await ctx.db.get(provider._id);
  }
});

/**
 * Enable or disable an OAuth provider
 */
export const toggleOAuthProvider = mutation({
  args: {
    providerId: v.string(),
    enabled: v.boolean(),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    try {
      const provider = await ctx.db
        .query('oauthProviders')
        .filter(q => q.eq(q.field('id'), args.providerId))
        .first();

      if (!provider) {
        throw new ConvexError({
          message: `OAuth provider '${args.providerId}' not found`,
          code: 'PROVIDER_NOT_FOUND'
        });
      }

      // Update the provider status
      await ctx.db.patch(provider._id, {
        isEnabled: args.enabled,
        updatedAt: Date.now(),
      });

      // If disabling, we might want to handle active connections
      if (!args.enabled) {
        // Get active connections for this provider
        const activeConnections = await ctx.db
          .query('userOAuthConnections')
          .filter(q => q.eq(q.field('providerId'), args.providerId))
          .filter(q => q.eq(q.field('isActive'), true))
          .collect();

        console.log(`Provider ${args.providerId} disabled. ${activeConnections.length} active connections affected.`);
      }

      return {
        providerId: args.providerId,
        enabled: args.enabled,
        activeConnectionsCount: provider.activeConnections,
        reason: args.reason,
        updatedAt: Date.now()
      };
    } catch (error) {
      console.error(`Error toggling OAuth provider ${args.providerId}:`, error);
      if (error instanceof ConvexError) {
        throw error;
      }
      throw new ConvexError({
        message: 'Failed to toggle OAuth provider',
        code: 'PROVIDER_TOGGLE_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },
});

/**
 * Update provider connection statistics
 */
export const updateProviderStats = mutation({
  args: {
    providerId: v.string(),
    totalConnections: v.optional(v.number()),
    activeConnections: v.optional(v.number()),
    lastConnectionAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    try {
      const provider = await ctx.db
        .query('oauthProviders')
        .filter(q => q.eq(q.field('id'), args.providerId))
        .first();

      if (!provider) {
        throw new ConvexError({
          message: `OAuth provider '${args.providerId}' not found`,
          code: 'PROVIDER_NOT_FOUND'
        });
      }

      const updateData: any = {
        updatedAt: Date.now(),
      };

      if (args.totalConnections !== undefined) {
        updateData.totalConnections = args.totalConnections;
      }
      if (args.activeConnections !== undefined) {
        updateData.activeConnections = args.activeConnections;
      }
      if (args.lastConnectionAt !== undefined) {
        updateData.lastConnectionAt = args.lastConnectionAt;
      }

      await ctx.db.patch(provider._id, updateData);

      return {
        providerId: args.providerId,
        stats: {
          totalConnections: args.totalConnections ?? provider.totalConnections,
          activeConnections: args.activeConnections ?? provider.activeConnections,
          lastConnectionAt: args.lastConnectionAt ?? provider.lastConnectionAt,
        }
      };
    } catch (error) {
      console.error(`Error updating provider stats ${args.providerId}:`, error);
      if (error instanceof ConvexError) {
        throw error;
      }
      throw new ConvexError({
        message: 'Failed to update provider statistics',
        code: 'PROVIDER_STATS_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },
});

/**
 * Get provider statistics and health summary
 */
export const getProviderHealthSummary = query({
  args: {},
  handler: async (ctx) => {
    try {
      const providers = await ctx.db.query('oauthProviders').collect();
      
      const summary = {
        total: providers.length,
        enabled: providers.filter(p => p.isEnabled).length,
        healthy: providers.filter(p => p.healthStatus === 'healthy').length,
        degraded: providers.filter(p => p.healthStatus === 'degraded').length,
        down: providers.filter(p => p.healthStatus === 'down').length,
        maintenance: providers.filter(p => p.maintenanceMode).length,
        totalConnections: providers.reduce((sum, p) => sum + p.totalConnections, 0),
        activeConnections: providers.reduce((sum, p) => sum + p.activeConnections, 0),
        platforms: {
          ios: providers.filter(p => p.supportedPlatforms.includes('ios')).length,
          android: providers.filter(p => p.supportedPlatforms.includes('android')).length,
          web: providers.filter(p => p.supportedPlatforms.includes('web')).length,
        },
        lastUpdated: Date.now()
      };

      return summary;
    } catch (error) {
      console.error('Error generating provider health summary:', error);
      throw new ConvexError({
        message: 'Failed to generate provider health summary',
        code: 'HEALTH_SUMMARY_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },
});