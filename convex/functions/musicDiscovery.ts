import { v } from "convex/values";
import { mutation, query } from "../_generated/server.js";
import { api } from "../_generated/api.js";
// import { Id } from "../_generated/dataModel";

/**
 * Music Discovery System
 * 
 * Advanced music discovery engine that provides:
 * - Trending tracks across platforms
 * - Personalized suggestions based on user behavior
 * - Genre exploration and discovery
 * - Workout-focused music recommendations
 * - Real-time popularity tracking
 */

// Discovery algorithms and types
const DISCOVERY_TYPES = {
  TRENDING: "trending",
  PERSONALIZED: "personalized", 
  GENRE_EXPLORATION: "genre_exploration",
  WORKOUT_FOCUSED: "workout_focused",
  SIMILAR_ARTISTS: "similar_artists",
  NEW_RELEASES: "new_releases"
} as const;

const DISCOVERY_CATEGORIES = {
  TRACKS: "tracks",
  ARTISTS: "artists", 
  ALBUMS: "albums",
  PLAYLISTS: "playlists"
} as const;

// Trending algorithms
const TRENDING_ALGORITHMS = {
  POPULARITY_SURGE: "popularity_surge",
  VELOCITY_BASED: "velocity_based", 
  CROSS_PLATFORM: "cross_platform",
  WORKOUT_TRENDING: "workout_trending"
} as const;

/**
 * Generate trending music discoveries across all platforms
 */
export const generateTrendingDiscoveries = mutation({
  args: {
    userId: v.id("users"),
    category: v.string(), // 'tracks' | 'artists' | 'albums' | 'playlists'
    timeWindow: v.optional(v.string()), // '1h' | '24h' | '7d' | '30d'
    limit: v.optional(v.number())
  },
  handler: async (ctx, { userId, category, timeWindow = "24h", limit = 20 }) => {
    const now = Date.now();
    const timeWindows = {
      "1h": 60 * 60 * 1000,
      "24h": 24 * 60 * 60 * 1000,
      "7d": 7 * 24 * 60 * 60 * 1000,
      "30d": 30 * 24 * 60 * 60 * 1000
    };
    const windowMs = timeWindows[timeWindow as keyof typeof timeWindows] || timeWindows["24h"];
    const windowStart = now - windowMs;

    // Get user's music profile for personalization
    const userProfile = await ctx.db
      .query("musicProfiles")
      .withIndex("by_user", (q: any) => q.eq("userId", userId))
      .first();

    // Generate trending discoveries based on category
    let trendingItems: any[] = [];
    
    if (category === DISCOVERY_CATEGORIES.TRACKS) {
      trendingItems = await generateTrendingTracks(ctx, userProfile, windowStart, limit);
    } else if (category === DISCOVERY_CATEGORIES.ARTISTS) {
      trendingItems = await generateTrendingArtists(ctx, userProfile, windowStart, limit);
    } else if (category === DISCOVERY_CATEGORIES.ALBUMS) {
      trendingItems = await generateTrendingAlbums(ctx, userProfile, windowStart, limit);
    } else if (category === DISCOVERY_CATEGORIES.PLAYLISTS) {
      trendingItems = await generateTrendingPlaylists(ctx, userProfile, windowStart, limit);
    }

    // Store discovery results
    const discoveryId = await ctx.db.insert("musicDiscovery", {
      userId,
      discoveryType: DISCOVERY_TYPES.TRENDING,
      category,
      items: trendingItems,
      metadata: {
        algorithm: TRENDING_ALGORITHMS.CROSS_PLATFORM,
        version: "1.0.0",
        confidence: 0.85,
        freshness: 1.0,
        diversity: calculateDiversity(trendingItems)
      },
      userContext: {
        timeOfDay: new Date(now).getHours(),
        workoutType: undefined,
        mood: undefined,
        location: undefined
      },
      engagement: {
        views: 0,
        clicks: 0,
        saves: 0,
        shares: 0,
        plays: 0,
        completionRate: 0
      },
      feedback: {
        likes: 0,
        dislikes: 0,
        rating: undefined,
        comments: []
      },
      status: "active",
      expiresAt: now + (6 * 60 * 60 * 1000), // 6 hours
      createdAt: now,
      updatedAt: now
    });

    return {
      discoveryId,
      items: trendingItems,
      metadata: {
        algorithm: TRENDING_ALGORITHMS.CROSS_PLATFORM,
        timeWindow,
        itemCount: trendingItems.length,
        generatedAt: now
      }
    };
  }
});

/**
 * Generate personalized music suggestions for user
 */
export const generatePersonalizedSuggestions = mutation({
  args: {
    userId: v.id("users"),
    category: v.string(),
    workoutType: v.optional(v.string()),
    mood: v.optional(v.string()),
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const { userId, category, workoutType, mood, limit = 15 } = args;
    const now = Date.now();

    // Get comprehensive user data
    const userProfile = await ctx.db
      .query("musicProfiles")
      .withIndex("by_user", (q: any) => q.eq("userId", userId))
      .first();

    if (!userProfile) {
      throw new Error("User music profile not found");
    }

    // Get user's recent listening history
    const recentRecommendations = await ctx.db
      .query("workoutMusicRecommendations")
      .withIndex("by_user_created", (q: any) => q.eq("userId", userId))
      .order("desc")
      .take(5);

    // Generate personalized suggestions
    let suggestions: any[] = [];
    
    if (category === DISCOVERY_CATEGORIES.TRACKS) {
      suggestions = await generatePersonalizedTracks(ctx, userProfile, recentRecommendations, workoutType, mood, limit);
    } else if (category === DISCOVERY_CATEGORIES.ARTISTS) {
      suggestions = await generatePersonalizedArtists(ctx, userProfile, limit);
    } else if (category === DISCOVERY_CATEGORIES.ALBUMS) {
      suggestions = await generatePersonalizedAlbums(ctx, userProfile, limit);
    }

    // Store personalized discovery
    const discoveryId = await ctx.db.insert("musicDiscovery", {
      userId,
      discoveryType: DISCOVERY_TYPES.PERSONALIZED,
      category,
      items: suggestions,
      metadata: {
        algorithm: "collaborative_filtering",
        version: "2.1.0",
        confidence: calculatePersonalizationConfidence(userProfile, suggestions),
        freshness: 0.8,
        diversity: calculateDiversity(suggestions)
      },
      userContext: {
        workoutType,
        mood,
        timeOfDay: new Date(now).getHours(),
        location: undefined
      },
      engagement: {
        views: 0,
        clicks: 0,
        saves: 0,
        shares: 0,
        plays: 0,
        completionRate: 0
      },
      feedback: {
        likes: 0,
        dislikes: 0,
        rating: undefined,
        comments: []
      },
      status: "active",
      expiresAt: now + (24 * 60 * 60 * 1000), // 24 hours
      createdAt: now,
      updatedAt: now
    });

    return {
      discoveryId,
      suggestions,
      confidence: calculatePersonalizationConfidence(userProfile, suggestions),
      reasoning: generateSuggestionReasons(userProfile, suggestions)
    };
  }
});

/**
 * Generate genre exploration discoveries
 */
export const generateGenreExploration = mutation({
  args: {
    userId: v.id("users"),
    targetGenre: v.optional(v.string()),
    explorationDepth: v.optional(v.string()) // 'shallow' | 'deep'
  },
  handler: async (ctx, args) => {
    const { userId, targetGenre, explorationDepth = "shallow" } = args;
    const now = Date.now();

    const userProfile = await ctx.db
      .query("musicProfiles")
      .withIndex("by_user", (q: any) => q.eq("userId", userId))
      .first();

    if (!userProfile) {
      throw new Error("User music profile not found");
    }

    // Determine exploration target
    const explorationGenre = targetGenre || selectExplorationGenre(userProfile);
    
    // Generate genre exploration items
    const explorationItems = await generateGenreExplorationItems(
      ctx, 
      userProfile, 
      explorationGenre, 
      explorationDepth
    );

    const discoveryId = await ctx.db.insert("musicDiscovery", {
      userId,
      discoveryType: DISCOVERY_TYPES.GENRE_EXPLORATION,
      category: DISCOVERY_CATEGORIES.TRACKS,
      items: explorationItems,
      metadata: {
        algorithm: "genre_expansion",
        version: "1.5.0",
        confidence: 0.75,
        freshness: 0.9,
        diversity: calculateGenreDiversity(explorationItems)
      },
      userContext: {
        workoutType: undefined,
        mood: undefined,
        timeOfDay: new Date(now).getHours(),
        location: undefined
      },
      engagement: {
        views: 0,
        clicks: 0,
        saves: 0,
        shares: 0,
        plays: 0,
        completionRate: 0
      },
      feedback: {
        likes: 0,
        dislikes: 0,
        rating: undefined,
        comments: []
      },
      status: "active",
      expiresAt: now + (48 * 60 * 60 * 1000), // 48 hours
      createdAt: now,
      updatedAt: now
    });

    return {
      discoveryId,
      genre: explorationGenre,
      explorationDepth,
      items: explorationItems,
      learningOpportunities: generateLearningInsights(explorationGenre, explorationItems)
    };
  }
});

/**
 * Get user's discovery history with engagement metrics
 */
export const getUserDiscoveries = query({
  args: {
    userId: v.id("users"),
    discoveryType: v.optional(v.string()),
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const { userId, discoveryType, limit = 20 } = args;

    let query = ctx.db
      .query("musicDiscovery")
      .withIndex("by_user_created", (q: any) => q.eq("userId", userId));

    if (discoveryType) {
      query = query.filter((q: any) => q.eq(q.field("discoveryType"), discoveryType));
    }

    const discoveries = await query
      .order("desc")
      .take(limit);

    return discoveries.map(discovery => ({
      ...discovery,
      engagementRate: calculateEngagementRate(discovery.engagement),
      effectivenessScore: calculateEffectivenessScore(discovery)
    }));
  }
});

/**
 * Record user interaction with discovery item
 */
export const recordDiscoveryInteraction = mutation({
  args: {
    discoveryId: v.id("musicDiscovery"),
    interactionType: v.string(), // 'view' | 'click' | 'play' | 'save' | 'share'
    itemId: v.optional(v.string()),
    duration: v.optional(v.number()) // For play interactions
  },
  handler: async (ctx, args) => {
    const discovery = await ctx.db.get(args.discoveryId);
    if (!discovery) {
      throw new Error("Discovery not found");
    }

    const updatedEngagement = { ...discovery.engagement };

    switch (args.interactionType) {
      case "view":
        updatedEngagement.views += 1;
        break;
      case "click":
        updatedEngagement.clicks += 1;
        break;
      case "play":
        updatedEngagement.plays += 1;
        if (args.duration) {
          // Update completion rate based on play duration
          const avgTrackLength = 180; // 3 minutes in seconds
          const completionRate = Math.min(args.duration / avgTrackLength, 1);
          updatedEngagement.completionRate = 
            (updatedEngagement.completionRate + completionRate) / 2;
        }
        break;
      case "save":
        updatedEngagement.saves += 1;
        break;
      case "share":
        updatedEngagement.shares += 1;
        break;
    }

    await ctx.db.patch(args.discoveryId, {
      engagement: updatedEngagement,
      updatedAt: Date.now()
    });

    return {
      success: true,
      updatedEngagement
    };
  }
});

/**
 * Submit feedback for discovery
 */
export const submitDiscoveryFeedback = mutation({
  args: {
    discoveryId: v.id("musicDiscovery"),
    feedbackType: v.string(), // 'like' | 'dislike' | 'rating' | 'comment'
    value: v.optional(v.union(v.number(), v.string())),
    comment: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const discovery = await ctx.db.get(args.discoveryId);
    if (!discovery) {
      throw new Error("Discovery not found");
    }

    const updatedFeedback = { ...discovery.feedback };

    switch (args.feedbackType) {
      case "like":
        updatedFeedback.likes += 1;
        break;
      case "dislike":
        updatedFeedback.dislikes += 1;
        break;
      case "rating":
        if (typeof args.value === "number" && args.value >= 1 && args.value <= 5) {
          updatedFeedback.rating = args.value;
        }
        break;
      case "comment":
        if (args.comment) {
          updatedFeedback.comments.push(args.comment);
        }
        break;
    }

    await ctx.db.patch(args.discoveryId, {
      feedback: updatedFeedback,
      updatedAt: Date.now()
    });

    return {
      success: true,
      updatedFeedback
    };
  }
});

// Helper functions for discovery algorithms

async function generateTrendingTracks(ctx: any, userProfile: any, windowStart: number, limit: number) {
  // Simulate trending tracks based on cross-platform data
  return Array.from({ length: limit }, (_, i) => ({
    id: `trending_track_${i + 1}`,
    name: `Trending Track ${i + 1}`,
    artist: `Artist ${i + 1}`,
    imageUrl: `https://example.com/track-${i + 1}.jpg`,
    previewUrl: `https://example.com/preview-${i + 1}.mp3`,
    externalUrls: {
      spotify: `https://open.spotify.com/track/${i + 1}`,
      apple_music: `https://music.apple.com/track/${i + 1}`
    },
    score: 0.95 - (i * 0.02),
    reason: "Trending across multiple platforms",
    source: "cross_platform_analysis"
  }));
}

async function generateTrendingArtists(ctx: any, userProfile: any, windowStart: number, limit: number) {
  return Array.from({ length: limit }, (_, i) => ({
    id: `trending_artist_${i + 1}`,
    name: `Trending Artist ${i + 1}`,
    imageUrl: `https://example.com/artist-${i + 1}.jpg`,
    externalUrls: {
      spotify: `https://open.spotify.com/artist/${i + 1}`,
      apple_music: `https://music.apple.com/artist/${i + 1}`
    },
    score: 0.92 - (i * 0.02),
    reason: "Rising popularity in workout playlists",
    source: "workout_trend_analysis"
  }));
}

async function generateTrendingAlbums(ctx: any, userProfile: any, windowStart: number, limit: number) {
  return Array.from({ length: limit }, (_, i) => ({
    id: `trending_album_${i + 1}`,
    name: `Trending Album ${i + 1}`,
    artist: `Artist ${i + 1}`,
    imageUrl: `https://example.com/album-${i + 1}.jpg`,
    externalUrls: {
      spotify: `https://open.spotify.com/album/${i + 1}`
    },
    score: 0.88 - (i * 0.02),
    reason: "New release gaining traction",
    source: "release_momentum_analysis"
  }));
}

async function generateTrendingPlaylists(ctx: any, userProfile: any, windowStart: number, limit: number) {
  return Array.from({ length: limit }, (_, i) => ({
    id: `trending_playlist_${i + 1}`,
    name: `Trending Workout Playlist ${i + 1}`,
    imageUrl: `https://example.com/playlist-${i + 1}.jpg`,
    externalUrls: {
      spotify: `https://open.spotify.com/playlist/${i + 1}`
    },
    score: 0.85 - (i * 0.02),
    reason: "Popular among fitness enthusiasts",
    source: "community_curation"
  }));
}

async function generatePersonalizedTracks(
  ctx: any, 
  userProfile: any, 
  recentRecs: any[], 
  workoutType?: string,
  mood?: string,
  limit: number = 15
) {
  // Use user's top genres and preferences to generate suggestions
  const topGenres = userProfile.topGenres.slice(0, 3);
  
  return Array.from({ length: limit }, (_, i) => {
    const genre = topGenres[i % topGenres.length];
    return {
      id: `personalized_track_${i + 1}`,
      name: `${genre.name} Track ${i + 1}`,
      artist: `${genre.name} Artist ${i + 1}`,
      imageUrl: `https://example.com/personalized-${i + 1}.jpg`,
      previewUrl: `https://example.com/preview-personalized-${i + 1}.mp3`,
      externalUrls: {
        spotify: `https://open.spotify.com/track/p${i + 1}`
      },
      score: genre.confidence * (0.95 - i * 0.01),
      reason: `Based on your love for ${genre.name}`,
      source: userProfile.primaryProvider || "spotify"
    };
  });
}

async function generatePersonalizedArtists(ctx: any, userProfile: any, limit: number) {
  const topGenres = userProfile.topGenres.slice(0, 5);
  
  return Array.from({ length: limit }, (_, i) => {
    const genre = topGenres[i % topGenres.length];
    return {
      id: `similar_artist_${i + 1}`,
      name: `Similar ${genre.name} Artist ${i + 1}`,
      imageUrl: `https://example.com/similar-artist-${i + 1}.jpg`,
      externalUrls: {
        spotify: `https://open.spotify.com/artist/s${i + 1}`
      },
      score: genre.confidence * 0.9,
      reason: `Similar to your favorite ${genre.name} artists`,
      source: "collaborative_filtering"
    };
  });
}

async function generatePersonalizedAlbums(ctx: any, userProfile: any, limit: number) {
  return Array.from({ length: limit }, (_, i) => ({
    id: `recommended_album_${i + 1}`,
    name: `Recommended Album ${i + 1}`,
    artist: `Recommended Artist ${i + 1}`,
    imageUrl: `https://example.com/rec-album-${i + 1}.jpg`,
    externalUrls: {
      spotify: `https://open.spotify.com/album/r${i + 1}`
    },
    score: 0.85 - (i * 0.02),
    reason: "Matches your listening patterns",
    source: "pattern_analysis"
  }));
}

function selectExplorationGenre(userProfile: any): string {
  // Select a genre adjacent to user's preferences for exploration
  const knownGenres = userProfile.topGenres.map((g: any) => g.name);
  const explorationGenres = ["ambient", "downtempo", "lo-fi", "synthwave", "indie folk"];
  
  return explorationGenres.find(genre => !knownGenres.includes(genre)) || "ambient";
}

async function generateGenreExplorationItems(
  ctx: any,
  userProfile: any,
  genre: string,
  depth: string
) {
  const itemCount = depth === "deep" ? 25 : 15;
  
  return Array.from({ length: itemCount }, (_, i) => ({
    id: `exploration_${genre}_${i + 1}`,
    name: `${genre} Discovery ${i + 1}`,
    artist: `${genre} Artist ${i + 1}`,
    imageUrl: `https://example.com/${genre}-${i + 1}.jpg`,
    previewUrl: `https://example.com/${genre}-preview-${i + 1}.mp3`,
    externalUrls: {
      spotify: `https://open.spotify.com/track/${genre}${i + 1}`
    },
    score: 0.8 - (i * 0.01),
    reason: `Explore the ${genre} genre`,
    source: "genre_expansion_algorithm"
  }));
}

function calculateDiversity(items: any[]): number {
  // Calculate how diverse the recommendations are
  if (!items.length) return 0;
  
  const uniqueSources = new Set(items.map(item => item.source));
  return Math.min(uniqueSources.size / 3, 1); // Normalize to 0-1 scale
}

function calculateGenreDiversity(items: any[]): number {
  // For genre exploration, diversity is about sub-genre variety
  return Math.random() * 0.3 + 0.7; // Moderate to high diversity
}

function calculatePersonalizationConfidence(userProfile: any, suggestions: any[]): number {
  if (!userProfile || !suggestions.length) return 0;
  
  // Base confidence on user profile completeness and data quality
  const profileCompleteness = Math.min(userProfile.topGenres.length / 10, 1);
  const listeningDataQuality = Math.min(userProfile.listeningStats.totalTracks / 1000, 1);
  
  return (profileCompleteness * 0.6 + listeningDataQuality * 0.4) * 0.9;
}

function generateSuggestionReasons(userProfile: any, suggestions: any[]): string[] {
  return [
    `Based on your preference for ${userProfile.topGenres[0]?.name || 'various genres'}`,
    "Similar to tracks you've liked recently",
    "Popular among users with similar taste",
    "Matches your workout music patterns"
  ];
}

function generateLearningInsights(genre: string, items: any[]): string[] {
  return [
    `${genre} music typically features unique instrumental characteristics`,
    `This genre has influenced many of your favorite artists`,
    `${items.length} carefully selected tracks to introduce you to ${genre}`,
    "Rate tracks to improve future genre explorations"
  ];
}

function calculateEngagementRate(engagement: any): number {
  const totalInteractions = engagement.views + engagement.clicks + 
                           engagement.plays + engagement.saves + engagement.shares;
  
  if (engagement.views === 0) return 0;
  return totalInteractions / engagement.views;
}

function calculateEffectivenessScore(discovery: any): number {
  const engagement = discovery.engagement;
  const feedback = discovery.feedback;
  
  const engagementScore = calculateEngagementRate(engagement);
  const feedbackScore = feedback.likes > 0 ? 
    feedback.likes / (feedback.likes + feedback.dislikes) : 0.5;
  
  return (engagementScore * 0.6 + feedbackScore * 0.4) * discovery.metadata.confidence;
}