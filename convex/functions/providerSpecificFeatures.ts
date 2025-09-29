import { v } from "convex/values";
import { mutation, query } from "../_generated/server.js";
import { api } from "../_generated/api.js";
import { Id } from "../_generated/dataModel.js";

/**
 * Provider-Specific Features Implementation
 * 
 * Implements advanced features specific to each music platform:
 * - Spotify Connect for remote device control
 * - Apple Music radio and live streaming
 * - YouTube Music premium features
 */

// Provider-specific feature types
const FEATURE_TYPES = {
  SPOTIFY_CONNECT: "spotify_connect",
  APPLE_MUSIC_RADIO: "apple_music_radio", 
  YOUTUBE_PREMIUM: "youtube_premium",
  DEVICE_CONTROL: "device_control",
  LIVE_STREAMING: "live_streaming",
  OFFLINE_PLAYBACK: "offline_playback"
} as const;

/**
 * Initialize provider-specific features for supported platforms
 */
export const initializeProviderFeatures = mutation({
  args: {},
  handler: async (ctx) => {
    // Spotify Features
    const spotifyFeatures = [
      {
        providerId: "spotify",
        featureType: FEATURE_TYPES.SPOTIFY_CONNECT,
        featureName: "Spotify Connect",
        description: "Control playback on remote Spotify-enabled devices",
        isEnabled: true,
        isPremiumOnly: true,
        configuration: {
          deviceTypes: ["speaker", "smart_tv", "mobile", "computer", "tablet"],
          supportedActions: ["play", "pause", "skip", "volume", "seek", "queue"],
          requiresDeviceAuth: true,
          maxConcurrentDevices: 1
        },
        capabilities: [
          "device_discovery",
          "remote_control", 
          "transfer_playback",
          "device_volume_control",
          "queue_management"
        ],
        requirements: {
          minAppVersion: "8.5.0",
          platformSupport: ["ios", "android", "web"],
          permissions: ["user-modify-playback-state", "user-read-playback-state"],
          premiumRequired: true
        }
      },
      {
        providerId: "spotify",
        featureType: FEATURE_TYPES.DEVICE_CONTROL,
        featureName: "Device Control",
        description: "Advanced device management and control",
        isEnabled: true,
        isPremiumOnly: false,
        configuration: {
          supportedCommands: ["get_devices", "transfer_playback", "set_volume"],
          pollingInterval: 5000, // milliseconds
          deviceTimeout: 30000
        },
        capabilities: ["device_listing", "playback_transfer", "volume_control"],
        requirements: {
          platformSupport: ["ios", "android", "web"],
          permissions: ["user-read-playback-state", "user-modify-playback-state"],
          premiumRequired: false
        }
      }
    ];

    // Apple Music Features
    const appleMusicFeatures = [
      {
        providerId: "apple_music",
        featureType: FEATURE_TYPES.APPLE_MUSIC_RADIO,
        featureName: "Apple Music Radio",
        description: "Access to Apple Music radio stations and live content",
        isEnabled: true,
        isPremiumOnly: false,
        configuration: {
          supportedStations: ["apple_music_1", "apple_music_hits", "apple_music_country"],
          liveContent: true,
          onDemandReplays: true,
          personalizedStations: true
        },
        capabilities: [
          "live_radio_streaming",
          "station_discovery",
          "personalized_stations",
          "radio_history",
          "show_schedules"
        ],
        requirements: {
          minAppVersion: "1.6.0",
          platformSupport: ["ios", "android", "web"],
          permissions: ["music-library-read", "music-playback"],
          premiumRequired: false
        }
      },
      {
        providerId: "apple_music",
        featureType: FEATURE_TYPES.LIVE_STREAMING,
        featureName: "Live Streaming",
        description: "Live concerts and exclusive streaming content",
        isEnabled: true,
        isPremiumOnly: true,
        configuration: {
          maxConcurrentStreams: 1,
          supportedQuality: ["high", "lossless", "spatial_audio"],
          bufferingStrategy: "adaptive"
        },
        capabilities: ["live_events", "exclusive_content", "spatial_audio", "lossless_streaming"],
        requirements: {
          platformSupport: ["ios", "android"],
          permissions: ["music-playback", "network-access"],
          premiumRequired: true
        }
      }
    ];

    // YouTube Music Features
    const youtubeMusicFeatures = [
      {
        providerId: "youtube_music",
        featureType: FEATURE_TYPES.YOUTUBE_PREMIUM,
        featureName: "YouTube Premium Features",
        description: "Ad-free listening and background playback",
        isEnabled: true,
        isPremiumOnly: true,
        configuration: {
          adFreePlayback: true,
          backgroundPlay: true,
          downloadsEnabled: true,
          maxDownloadQuality: "high"
        },
        capabilities: [
          "ad_free_playback",
          "background_playback", 
          "offline_downloads",
          "premium_content_access"
        ],
        requirements: {
          minAppVersion: "4.47",
          platformSupport: ["ios", "android", "web"],
          permissions: ["music-library-read", "storage-access"],
          premiumRequired: true
        }
      },
      {
        providerId: "youtube_music",
        featureType: FEATURE_TYPES.OFFLINE_PLAYBACK,
        featureName: "Offline Playback",
        description: "Download and play music without internet connection",
        isEnabled: true,
        isPremiumOnly: true,
        configuration: {
          maxDownloads: 100000, // tracks
          downloadQuality: ["low", "medium", "high"],
          autoDownload: true,
          storageLimit: "unlimited"
        },
        capabilities: ["offline_downloads", "smart_downloads", "auto_downloads"],
        requirements: {
          platformSupport: ["ios", "android"],
          permissions: ["storage-access", "background-processing"],
          premiumRequired: true
        }
      }
    ];

    const allFeatures = [...spotifyFeatures, ...appleMusicFeatures, ...youtubeMusicFeatures];
    const now = Date.now();

    // Insert features into database
    const insertedFeatures = [];
    for (const feature of allFeatures) {
      const featureId = await ctx.db.insert("providerFeatures", {
        ...feature,
        usageStats: {
          totalUsers: 0,
          activeUsers: 0,
          usageCount: 0,
          lastUsedAt: undefined
        },
        createdAt: now,
        updatedAt: now
      });
      insertedFeatures.push(featureId);
    }

    return {
      success: true,
      featuresCreated: insertedFeatures.length,
      features: insertedFeatures
    };
  }
});

/**
 * Get available features for a specific provider
 */
export const getProviderFeatures = query({
  args: {
    providerId: v.string(),
    enabledOnly: v.optional(v.boolean())
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("providerFeatures")
      .withIndex("by_provider_id", (q: any) => q.eq("providerId", args.providerId));

    if (args.enabledOnly) {
      query = query.filter((q: any) => q.eq(q.field("isEnabled"), true));
    }

    return await query.collect();
  }
});

/**
 * Enable a provider-specific feature for a user
 */
export const enableUserProviderFeature = mutation({
  args: {
    userId: v.id("users"),
    featureId: v.id("providerFeatures"),
    configuration: v.optional(v.object({}))
  },
  handler: async (ctx, args) => {
    // Get the feature details
    const feature = await ctx.db.get(args.featureId);
    if (!feature) {
      throw new Error("Feature not found");
    }

    // Check if user has the required provider connection
    const connection = await ctx.db
      .query("userOAuthConnections")
      .withIndex("by_user_provider", (q: any) => 
        q.eq("userId", args.userId).eq("providerId", feature.providerId)
      )
      .filter((q: any) => q.eq(q.field("isActive"), true))
      .first();

    if (!connection) {
      throw new Error(`User must be connected to ${feature.providerId} to enable this feature`);
    }

    // Check premium requirements
    if (feature.isPremiumOnly && !connection.isPremium) {
      throw new Error("This feature requires a premium subscription");
    }

    // Check if feature is already enabled for user
    const existingUserFeature = await ctx.db
      .query("userProviderFeatures")
      .withIndex("by_user_feature", (q: any) => 
        q.eq("userId", args.userId).eq("featureId", args.featureId)
      )
      .first();

    const now = Date.now();

    if (existingUserFeature) {
      // Update existing feature
      await ctx.db.patch(existingUserFeature._id, {
        isEnabled: true,
        configuration: args.configuration || {},
        updatedAt: now
      });
      return existingUserFeature._id;
    } else {
      // Create new user feature
      const userFeatureId = await ctx.db.insert("userProviderFeatures", {
        userId: args.userId,
        providerId: feature.providerId,
        featureId: args.featureId,
        isEnabled: true,
        configuration: args.configuration || {},
        usageCount: 0,
        lastUsedAt: undefined,
        createdAt: now,
        updatedAt: now
      });

      // Update feature usage stats
      await ctx.db.patch(args.featureId, {
        usageStats: {
          ...feature.usageStats,
          totalUsers: feature.usageStats.totalUsers + 1,
          activeUsers: feature.usageStats.activeUsers + 1
        },
        updatedAt: now
      });

      return userFeatureId;
    }
  }
});

/**
 * Execute a provider-specific feature action
 */
export const executeFeatureAction = mutation({
  args: {
    userId: v.id("users"),
    featureId: v.id("providerFeatures"),
    action: v.string(),
    parameters: v.optional(v.object({}))
  },
  handler: async (ctx, args) => {
    // Verify user has feature enabled
    const userFeature = await ctx.db
      .query("userProviderFeatures")
      .withIndex("by_user_feature", (q: any) => 
        q.eq("userId", args.userId).eq("featureId", args.featureId)
      )
      .filter((q: any) => q.eq(q.field("isEnabled"), true))
      .first();

    if (!userFeature) {
      throw new Error("Feature not enabled for user");
    }

    const feature = await ctx.db.get(args.featureId);
    if (!feature) {
      throw new Error("Feature not found");
    }

    // Get user's OAuth connection
    const connection = await ctx.db
      .query("userOAuthConnections")
      .withIndex("by_user_provider", (q: any) => 
        q.eq("userId", args.userId).eq("providerId", feature.providerId)
      )
      .filter((q: any) => q.eq(q.field("isActive"), true))
      .first();

    if (!connection) {
      throw new Error("OAuth connection not found");
    }

    const result = await executeProviderSpecificAction(
      feature.providerId,
      feature.featureType,
      args.action,
      args.parameters || {},
      connection
    );

    // Update usage statistics
    const now = Date.now();
    await ctx.db.patch(userFeature._id, {
      usageCount: userFeature.usageCount + 1,
      lastUsedAt: now,
      updatedAt: now
    });

    await ctx.db.patch(args.featureId, {
      usageStats: {
        ...feature.usageStats,
        usageCount: feature.usageStats.usageCount + 1,
        lastUsedAt: now
      },
      updatedAt: now
    });

    return result;
  }
});

/**
 * Execute provider-specific actions based on feature type
 */
async function executeProviderSpecificAction(
  providerId: string,
  featureType: string,
  action: string,
  parameters: any,
  connection: any
) {
  switch (providerId) {
    case "spotify":
      return await executeSpotifyAction(featureType, action, parameters, connection);
    case "apple_music":
      return await executeAppleMusicAction(featureType, action, parameters, connection);
    case "youtube_music":
      return await executeYouTubeMusicAction(featureType, action, parameters, connection);
    default:
      throw new Error(`Unsupported provider: ${providerId}`);
  }
}

/**
 * Execute Spotify-specific actions
 */
async function executeSpotifyAction(featureType: string, action: string, parameters: any, connection: any) {
  switch (featureType) {
    case FEATURE_TYPES.SPOTIFY_CONNECT:
      return await executeSpotifyConnectAction(action, parameters, connection);
    case FEATURE_TYPES.DEVICE_CONTROL:
      return await executeSpotifyDeviceAction(action, parameters, connection);
    default:
      throw new Error(`Unsupported Spotify feature: ${featureType}`);
  }
}

/**
 * Execute Spotify Connect actions
 */
async function executeSpotifyConnectAction(action: string, parameters: any, connection: any) {
  // Decrypt access token
  const accessToken = connection.accessToken; // Would be decrypted in production

  switch (action) {
    case "get_devices":
      return await callSpotifyAPI("/v1/me/player/devices", "GET", null, accessToken);
    
    case "transfer_playback":
      if (!parameters.device_ids || !Array.isArray(parameters.device_ids)) {
        throw new Error("device_ids parameter is required and must be an array");
      }
      return await callSpotifyAPI("/v1/me/player", "PUT", {
        device_ids: parameters.device_ids,
        play: parameters.play || false
      }, accessToken);
    
    case "set_volume":
      if (typeof parameters.volume_percent !== "number" || parameters.volume_percent < 0 || parameters.volume_percent > 100) {
        throw new Error("volume_percent must be a number between 0 and 100");
      }
      return await callSpotifyAPI(
        `/v1/me/player/volume?volume_percent=${parameters.volume_percent}`,
        "PUT",
        null,
        accessToken
      );
    
    case "play":
      const playPayload: any = {};
      if (parameters.context_uri) playPayload.context_uri = parameters.context_uri;
      if (parameters.uris) playPayload.uris = parameters.uris;
      if (parameters.offset) playPayload.offset = parameters.offset;
      if (parameters.position_ms) playPayload.position_ms = parameters.position_ms;
      
      return await callSpotifyAPI("/v1/me/player/play", "PUT", playPayload, accessToken);
    
    case "pause":
      return await callSpotifyAPI("/v1/me/player/pause", "PUT", null, accessToken);
    
    case "skip_next":
      return await callSpotifyAPI("/v1/me/player/next", "POST", null, accessToken);
    
    case "skip_previous":
      return await callSpotifyAPI("/v1/me/player/previous", "POST", null, accessToken);
    
    default:
      throw new Error(`Unsupported Spotify Connect action: ${action}`);
  }
}

/**
 * Execute Spotify device control actions
 */
async function executeSpotifyDeviceAction(action: string, parameters: any, connection: any) {
  const accessToken = connection.accessToken;

  switch (action) {
    case "get_playback_state":
      return await callSpotifyAPI("/v1/me/player", "GET", null, accessToken);
    
    case "get_current_track":
      return await callSpotifyAPI("/v1/me/player/currently-playing", "GET", null, accessToken);
    
    case "seek":
      if (typeof parameters.position_ms !== "number") {
        throw new Error("position_ms parameter is required");
      }
      return await callSpotifyAPI(
        `/v1/me/player/seek?position_ms=${parameters.position_ms}`,
        "PUT",
        null,
        accessToken
      );
    
    default:
      throw new Error(`Unsupported device action: ${action}`);
  }
}

/**
 * Execute Apple Music actions
 */
async function executeAppleMusicAction(featureType: string, action: string, parameters: any, connection: any) {
  switch (featureType) {
    case FEATURE_TYPES.APPLE_MUSIC_RADIO:
      return await executeAppleMusicRadioAction(action, parameters, connection);
    case FEATURE_TYPES.LIVE_STREAMING:
      return await executeAppleMusicLiveAction(action, parameters, connection);
    default:
      throw new Error(`Unsupported Apple Music feature: ${featureType}`);
  }
}

/**
 * Execute Apple Music Radio actions
 */
async function executeAppleMusicRadioAction(action: string, parameters: any, connection: any) {
  const accessToken = connection.accessToken;

  switch (action) {
    case "get_radio_stations":
      return await callAppleMusicAPI("/v1/catalog/us/stations", "GET", null, accessToken);
    
    case "get_station_episodes":
      if (!parameters.station_id) {
        throw new Error("station_id parameter is required");
      }
      return await callAppleMusicAPI(
        `/v1/catalog/us/stations/${parameters.station_id}/episodes`,
        "GET",
        null,
        accessToken
      );
    
    case "create_personal_station":
      if (!parameters.seed) {
        throw new Error("seed parameter is required");
      }
      return await callAppleMusicAPI("/v1/me/stations", "POST", {
        name: parameters.name || "Personal Station",
        seed: parameters.seed
      }, accessToken);
    
    default:
      throw new Error(`Unsupported Apple Music Radio action: ${action}`);
  }
}

/**
 * Execute Apple Music Live Streaming actions
 */
async function executeAppleMusicLiveAction(action: string, parameters: any, connection: any) {
  const accessToken = connection.accessToken;

  switch (action) {
    case "get_live_events":
      return await callAppleMusicAPI("/v1/catalog/us/events", "GET", null, accessToken);
    
    case "join_live_event":
      if (!parameters.event_id) {
        throw new Error("event_id parameter is required");
      }
      return await callAppleMusicAPI(
        `/v1/me/events/${parameters.event_id}/join`,
        "POST",
        null,
        accessToken
      );
    
    default:
      throw new Error(`Unsupported live streaming action: ${action}`);
  }
}

/**
 * Execute YouTube Music actions
 */
async function executeYouTubeMusicAction(featureType: string, action: string, parameters: any, connection: any) {
  switch (featureType) {
    case FEATURE_TYPES.YOUTUBE_PREMIUM:
      return await executeYouTubePremiumAction(action, parameters, connection);
    case FEATURE_TYPES.OFFLINE_PLAYBACK:
      return await executeYouTubeOfflineAction(action, parameters, connection);
    default:
      throw new Error(`Unsupported YouTube Music feature: ${featureType}`);
  }
}

/**
 * Execute YouTube Premium actions
 */
async function executeYouTubePremiumAction(action: string, parameters: any, connection: any) {
  const accessToken = connection.accessToken;

  switch (action) {
    case "get_premium_content":
      return await callYouTubeMusicAPI("/premium/content", "GET", null, accessToken);
    
    case "enable_background_play":
      return await callYouTubeMusicAPI("/player/background", "POST", {
        enabled: true
      }, accessToken);
    
    default:
      throw new Error(`Unsupported YouTube Premium action: ${action}`);
  }
}

/**
 * Execute YouTube Offline actions
 */
async function executeYouTubeOfflineAction(action: string, parameters: any, connection: any) {
  const accessToken = connection.accessToken;

  switch (action) {
    case "download_track":
      if (!parameters.track_id) {
        throw new Error("track_id parameter is required");
      }
      return await callYouTubeMusicAPI("/downloads", "POST", {
        trackId: parameters.track_id,
        quality: parameters.quality || "high"
      }, accessToken);
    
    case "get_downloads":
      return await callYouTubeMusicAPI("/downloads", "GET", null, accessToken);
    
    case "delete_download":
      if (!parameters.download_id) {
        throw new Error("download_id parameter is required");
      }
      return await callYouTubeMusicAPI(
        `/downloads/${parameters.download_id}`,
        "DELETE",
        null,
        accessToken
      );
    
    default:
      throw new Error(`Unsupported offline action: ${action}`);
  }
}

/**
 * Helper functions to call provider APIs
 */
async function callSpotifyAPI(endpoint: string, method: string, body: any, accessToken: string) {
  const response = await fetch(`https://api.spotify.com${endpoint}`, {
    method,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    throw new Error(`Spotify API error: ${response.status} ${response.statusText}`);
  }

  return response.status === 204 ? null : await response.json();
}

async function callAppleMusicAPI(endpoint: string, method: string, body: any, accessToken: string) {
  const response = await fetch(`https://api.music.apple.com${endpoint}`, {
    method,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    throw new Error(`Apple Music API error: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}

async function callYouTubeMusicAPI(endpoint: string, method: string, body: any, accessToken: string) {
  // Note: YouTube Music API is not publicly available, this is a placeholder
  const response = await fetch(`https://music.youtube.com/youtubei/v1${endpoint}`, {
    method,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    throw new Error(`YouTube Music API error: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Get user's enabled features
 */
export const getUserEnabledFeatures = query({
  args: {
    userId: v.id("users"),
    providerId: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("userProviderFeatures")
      .withIndex("by_user_provider", (q: any) => q.eq("userId", args.userId));

    if (args.providerId) {
      query = query.filter((q: any) => q.eq(q.field("providerId"), args.providerId));
    }

    const userFeatures = await query
      .filter((q: any) => q.eq(q.field("isEnabled"), true))
      .collect();

    // Get feature details
    const featuresWithDetails = await Promise.all(
      userFeatures.map(async (userFeature) => {
        const featureDetails = await ctx.db.get(userFeature.featureId);
        return {
          ...userFeature,
          feature: featureDetails
        };
      })
    );

    return featuresWithDetails;
  }
});

/**
 * Get feature usage statistics
 */
export const getFeatureUsageStats = query({
  args: {
    featureId: v.optional(v.id("providerFeatures")),
    providerId: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    if (args.featureId) {
      const feature = await ctx.db.get(args.featureId);
      return feature ? [feature.usageStats] : [];
    }

    if (args.providerId) {
      const features = await ctx.db
        .query("providerFeatures")
        .withIndex("by_provider_id", (q: any) => q.eq("providerId", args.providerId))
        .collect();
      
      return features.map(f => ({
        featureId: f._id,
        featureName: f.featureName,
        ...f.usageStats
      }));
    }

    // Return overall stats
    const allFeatures = await ctx.db.query("providerFeatures").collect();
    return allFeatures.map(f => ({
      featureId: f._id,
      featureName: f.featureName,
      providerId: f.providerId,
      ...f.usageStats
    }));
  }
});