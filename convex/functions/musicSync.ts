/**
 * Music Profile Sync - Convex Functions
 * 
 * Implements music profile synchronization and recommendations:
 * - Sync user music profiles from streaming services
 * - Generate AI-powered workout music recommendations
 * - Update music preferences and listening patterns
 * - Real-time music data processing and analysis
 */

import { mutation, query } from '../_generated/server';
import { v, ConvexError } from 'convex/values';

// ====================================================================================
// MUSIC PROFILE SYNC FUNCTIONS
// ====================================================================================

/**
 * Sync music profile from connected streaming service
 */
export const syncMusicProfile = mutation({
  args: {
    userId: v.string(),
    providerId: v.string(),
    forceSync: v.optional(v.boolean()),
    syncOptions: v.optional(v.object({
      includeTopTracks: v.optional(v.boolean()),
      includeTopArtists: v.optional(v.boolean()),
      includeRecentTracks: v.optional(v.boolean()),
      includePlaylists: v.optional(v.boolean()),
      includeGenreAnalysis: v.optional(v.boolean()),
      timeRange: v.optional(v.string()), // 'short_term', 'medium_term', 'long_term'
    })),
  },
  handler: async (ctx, args) => {
    try {
      // Get OAuth connection
      const connection = await ctx.db
        .query('userOAuthConnections')
        .filter(q => q.eq(q.field('userId'), args.userId))
        .filter(q => q.eq(q.field('providerId'), args.providerId))
        .filter(q => q.eq(q.field('isActive'), true))
        .first();

      if (!connection || connection.status !== 'connected') {
        throw new ConvexError({
          message: `No active ${args.providerId} connection found`,
          code: 'CONNECTION_NOT_FOUND'
        });
      }

      // Check token validity
      const now = Date.now();
      if (connection.tokenExpiry <= now) {
        throw new ConvexError({
          message: 'OAuth token expired, please refresh',
          code: 'TOKEN_EXPIRED'
        });
      }

      // Get existing music profile
      let existingProfile = await ctx.db
        .query('musicProfiles')
        .filter(q => q.eq(q.field('userId'), args.userId))
        .filter(q => q.eq(q.field('providerId'), args.providerId))
        .first();

      // Check if sync is needed
      const syncCooldown = 15 * 60 * 1000; // 15 minutes
      if (!args.forceSync && existingProfile && existingProfile.lastSyncAt && 
          (now - existingProfile.lastSyncAt) < syncCooldown) {
        return {
          success: true,
          message: 'Profile recently synced, skipping',
          profileId: existingProfile._id,
          lastSyncAt: existingProfile.lastSyncAt,
          skipped: true
        };
      }

      // Get provider configuration
      const provider = await ctx.db
        .query('oauthProviders')
        .filter(q => q.eq(q.field('id'), args.providerId))
        .first();

      if (!provider) {
        throw new ConvexError({
          message: 'OAuth provider not found',
          code: 'PROVIDER_NOT_FOUND'
        });
      }

      // Sync music data from provider
      const syncOptions = {
        includeTopTracks: true,
        includeTopArtists: true,
        includeRecentTracks: true,
        includePlaylists: false, // Default to false for privacy
        includeGenreAnalysis: true,
        timeRange: 'medium_term', // Default to 6 months
        ...args.syncOptions
      };

      const musicData = await fetchMusicDataFromProvider(
        provider,
        connection.accessToken,
        syncOptions
      );

      // Process and analyze music data
      const analysisData = await analyzeMusicProfile(musicData);

      // Create or update music profile
      const profileData = {
        userId: args.userId,
        providerId: args.providerId,
        providerDisplayName: provider.displayName,
        isActive: true,
        ...musicData,
        ...analysisData,
        lastSyncAt: now,
        syncCount: (existingProfile?.syncCount || 0) + 1,
        lastSyncDuration: Date.now() - now, // Will be updated after processing
        preferences: {
          energyRange: analysisData.averageEnergy ? {
            min: Math.max(0, analysisData.averageEnergy - 0.3),
            max: Math.min(1, analysisData.averageEnergy + 0.3),
          } : { min: 0.3, max: 0.8 },
          tempoRange: analysisData.averageTempo ? {
            min: Math.max(60, analysisData.averageTempo - 40),
            max: Math.min(200, analysisData.averageTempo + 40),
          } : { min: 120, max: 160 },
          preferredGenres: analysisData.topGenres || [],
          excludedGenres: [],
          explicitContent: syncOptions.includeExplicitContent !== false,
          ...existingProfile?.preferences
        },
        updatedAt: now,
      };

      let profileId: string;
      
      if (existingProfile) {
        await ctx.db.patch(existingProfile._id, {
          ...profileData,
          createdAt: existingProfile.createdAt, // Preserve creation time
        });
        profileId = existingProfile._id;
      } else {
        profileId = await ctx.db.insert('musicProfiles', {
          ...profileData,
          createdAt: now,
        });
      }

      // Update connection sync statistics
      await ctx.db.patch(connection._id, {
        lastSyncAt: now,
        successfulRequests: connection.successfulRequests + 1,
        totalRequests: connection.totalRequests + 1,
        successRate: Math.min(100, ((connection.successfulRequests + 1) / (connection.totalRequests + 1)) * 100),
        updatedAt: now,
      });

      // Generate initial recommendations after successful sync
      if (!existingProfile) {
        try {
          await ctx.runMutation('musicSync:generateWorkoutRecommendations', {
            userId: args.userId,
            profileId: profileId,
          });
        } catch (error) {
          console.error('Failed to generate initial recommendations:', error);
          // Don't fail the sync if recommendation generation fails
        }
      }

      return {
        success: true,
        profileId: profileId,
        providerId: args.providerId,
        providerName: provider.displayName,
        syncedData: {
          topTracks: musicData.topTracks?.length || 0,
          topArtists: musicData.topArtists?.length || 0,
          recentTracks: musicData.recentTracks?.length || 0,
          playlists: musicData.playlists?.length || 0,
        },
        analysis: {
          genres: analysisData.topGenres?.length || 0,
          averageEnergy: analysisData.averageEnergy,
          averageTempo: analysisData.averageTempo,
          averageValence: analysisData.averageValence,
        },
        lastSyncAt: now,
        isNewProfile: !existingProfile,
        message: existingProfile 
          ? `Successfully updated ${provider.displayName} music profile`
          : `Successfully created ${provider.displayName} music profile`
      };

    } catch (error) {
      console.error(`Error syncing music profile for ${args.providerId}:`, error);
      
      // Update connection error statistics if connection exists
      try {
        const connection = await ctx.db
          .query('userOAuthConnections')
          .filter(q => q.eq(q.field('userId'), args.userId))
          .filter(q => q.eq(q.field('providerId'), args.providerId))
          .first();
        
        if (connection) {
          await ctx.db.patch(connection._id, {
            consecutiveErrors: connection.consecutiveErrors + 1,
            lastErrorMessage: error instanceof Error ? error.message : 'Music sync failed',
            lastErrorAt: Date.now(),
            totalRequests: connection.totalRequests + 1,
            successRate: Math.max(0, (connection.successfulRequests / (connection.totalRequests + 1)) * 100),
            updatedAt: Date.now(),
          });
        }
      } catch (updateError) {
        console.error('Failed to update connection error stats:', updateError);
      }

      if (error instanceof ConvexError) {
        throw error;
      }
      throw new ConvexError({
        message: 'Failed to sync music profile',
        code: 'MUSIC_SYNC_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },
});

/**
 * Get music recommendations for workout
 */
export const getMusicRecommendations = query({
  args: {
    userId: v.string(),
    workoutType: v.optional(v.string()), // 'cardio', 'strength', 'yoga', 'hiit'
    intensity: v.optional(v.number()), // 1-10 scale
    duration: v.optional(v.number()), // minutes
    preferredProvider: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    try {
      // Get user's active music profiles
      const profiles = await ctx.db
        .query('musicProfiles')
        .filter(q => q.eq(q.field('userId'), args.userId))
        .filter(q => q.eq(q.field('isActive'), true))
        .collect();

      if (profiles.length === 0) {
        return {
          recommendations: [],
          message: 'No music profiles found. Please connect a music streaming service.',
          hasProfiles: false,
        };
      }

      // Filter by preferred provider if specified
      const targetProfiles = args.preferredProvider
        ? profiles.filter(p => p.providerId === args.preferredProvider)
        : profiles;

      if (targetProfiles.length === 0) {
        return {
          recommendations: [],
          message: `No active profile found for ${args.preferredProvider}`,
          hasProfiles: true,
          availableProviders: profiles.map(p => ({
            providerId: p.providerId,
            providerName: p.providerDisplayName,
            lastSyncAt: p.lastSyncAt,
          })),
        };
      }

      // Get existing workout recommendations
      let recommendations = await ctx.db
        .query('workoutMusicRecommendations')
        .filter(q => q.eq(q.field('userId'), args.userId))
        .filter(q => q.eq(q.field('isActive'), true))
        .collect();

      // Filter recommendations based on workout parameters
      if (args.workoutType) {
        recommendations = recommendations.filter(r => 
          r.workoutTypes.includes(args.workoutType!) ||
          r.workoutTypes.includes('general')
        );
      }

      if (args.intensity) {
        recommendations = recommendations.filter(r => 
          args.intensity! >= (r.intensityRange?.min || 1) &&
          args.intensity! <= (r.intensityRange?.max || 10)
        );
      }

      if (args.preferredProvider) {
        recommendations = recommendations.filter(r => 
          r.providerId === args.preferredProvider
        );
      }

      // Sort by relevance score and limit results
      recommendations.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
      
      if (args.limit) {
        recommendations = recommendations.slice(0, args.limit);
      }

      // Enhance recommendations with real-time data
      const enhancedRecommendations = recommendations.map(rec => {
        const profile = targetProfiles.find(p => p.providerId === rec.providerId);
        return {
          ...rec,
          providerName: profile?.providerDisplayName || rec.providerId,
          profileLastSync: profile?.lastSyncAt,
          isProfileRecent: profile ? (Date.now() - profile.lastSyncAt) < (24 * 60 * 60 * 1000) : false,
        };
      });

      return {
        recommendations: enhancedRecommendations,
        workoutContext: {
          type: args.workoutType || 'general',
          intensity: args.intensity || 5,
          duration: args.duration,
        },
        profileSummary: {
          totalProfiles: profiles.length,
          activeProfiles: targetProfiles.length,
          providers: targetProfiles.map(p => p.providerId),
          lastSyncDates: targetProfiles.map(p => p.lastSyncAt),
        },
        hasProfiles: true,
        message: recommendations.length > 0 
          ? `Found ${recommendations.length} recommendations`
          : 'No recommendations found for the specified workout parameters',
      };

    } catch (error) {
      console.error('Error getting music recommendations:', error);
      throw new ConvexError({
        message: 'Failed to get music recommendations',
        code: 'RECOMMENDATIONS_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },
});

/**
 * Update user music preferences
 */
export const updateMusicPreferences = mutation({
  args: {
    userId: v.string(),
    providerId: v.string(),
    preferences: v.object({
      energyRange: v.optional(v.object({
        min: v.number(),
        max: v.number(),
      })),
      tempoRange: v.optional(v.object({
        min: v.number(),
        max: v.number(),
      })),
      preferredGenres: v.optional(v.array(v.string())),
      excludedGenres: v.optional(v.array(v.string())),
      explicitContent: v.optional(v.boolean()),
      workoutSpecific: v.optional(v.object({
        cardio: v.optional(v.object({
          energyBoost: v.optional(v.number()),
          tempoBoost: v.optional(v.number()),
        })),
        strength: v.optional(v.object({
          energyBoost: v.optional(v.number()),
          preferredGenres: v.optional(v.array(v.string())),
        })),
        yoga: v.optional(v.object({
          energyReduction: v.optional(v.number()),
          preferredGenres: v.optional(v.array(v.string())),
        })),
      })),
    }),
  },
  handler: async (ctx, args) => {
    try {
      // Get music profile
      const profile = await ctx.db
        .query('musicProfiles')
        .filter(q => q.eq(q.field('userId'), args.userId))
        .filter(q => q.eq(q.field('providerId'), args.providerId))
        .first();

      if (!profile) {
        throw new ConvexError({
          message: `Music profile not found for ${args.providerId}`,
          code: 'PROFILE_NOT_FOUND'
        });
      }

      // Validate preference values
      if (args.preferences.energyRange) {
        const { min, max } = args.preferences.energyRange;
        if (min < 0 || max > 1 || min >= max) {
          throw new ConvexError({
            message: 'Invalid energy range. Min must be 0-1, max must be 0-1, and min < max',
            code: 'INVALID_ENERGY_RANGE'
          });
        }
      }

      if (args.preferences.tempoRange) {
        const { min, max } = args.preferences.tempoRange;
        if (min < 40 || max > 220 || min >= max) {
          throw new ConvexError({
            message: 'Invalid tempo range. Min must be 40-220 BPM, max must be 40-220 BPM, and min < max',
            code: 'INVALID_TEMPO_RANGE'
          });
        }
      }

      // Update preferences
      const updatedPreferences = {
        ...profile.preferences,
        ...args.preferences,
        updatedAt: Date.now(),
      };

      await ctx.db.patch(profile._id, {
        preferences: updatedPreferences,
        updatedAt: Date.now(),
      });

      // Regenerate recommendations with new preferences
      try {
        await ctx.runMutation('musicSync:generateWorkoutRecommendations', {
          userId: args.userId,
          profileId: profile._id,
          forceRegenerate: true,
        });
      } catch (error) {
        console.error('Failed to regenerate recommendations:', error);
        // Don't fail the preference update if recommendation generation fails
      }

      return {
        success: true,
        profileId: profile._id,
        providerId: args.providerId,
        updatedPreferences: updatedPreferences,
        message: 'Music preferences updated successfully',
      };

    } catch (error) {
      console.error('Error updating music preferences:', error);
      if (error instanceof ConvexError) {
        throw error;
      }
      throw new ConvexError({
        message: 'Failed to update music preferences',
        code: 'PREFERENCES_UPDATE_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },
});

/**
 * Generate workout music recommendations using AI
 */
export const generateWorkoutRecommendations = mutation({
  args: {
    userId: v.string(),
    profileId: v.id('musicProfiles'),
    forceRegenerate: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    try {
      // Get music profile
      const profile = await ctx.db.get(args.profileId);
      
      if (!profile || profile.userId !== args.userId) {
        throw new ConvexError({
          message: 'Music profile not found or access denied',
          code: 'PROFILE_NOT_FOUND'
        });
      }

      // Check if recommendations exist and are recent
      if (!args.forceRegenerate) {
        const existingRecs = await ctx.db
          .query('workoutMusicRecommendations')
          .filter(q => q.eq(q.field('userId'), args.userId))
          .filter(q => q.eq(q.field('profileId'), args.profileId))
          .filter(q => q.eq(q.field('isActive'), true))
          .collect();

        const recentRecs = existingRecs.filter(rec => 
          (Date.now() - rec.createdAt) < (7 * 24 * 60 * 60 * 1000) // 7 days
        );

        if (recentRecs.length > 0) {
          return {
            success: true,
            message: 'Recent recommendations exist, skipping generation',
            recommendationsCount: recentRecs.length,
            skipped: true
          };
        }
      }

      // Generate recommendations based on music profile data
      const recommendations = await generateAIRecommendations(profile);

      // Store recommendations in database
      const now = Date.now();
      const savedRecs = [];

      for (const rec of recommendations) {
        const recId = await ctx.db.insert('workoutMusicRecommendations', {
          userId: args.userId,
          profileId: args.profileId,
          providerId: profile.providerId,
          ...rec,
          isActive: true,
          createdAt: now,
          updatedAt: now,
        });
        savedRecs.push(recId);
      }

      // Deactivate old recommendations
      if (args.forceRegenerate) {
        const oldRecs = await ctx.db
          .query('workoutMusicRecommendations')
          .filter(q => q.eq(q.field('userId'), args.userId))
          .filter(q => q.eq(q.field('profileId'), args.profileId))
          .filter(q => q.eq(q.field('isActive'), true))
          .collect();

        for (const oldRec of oldRecs) {
          if (!savedRecs.includes(oldRec._id)) {
            await ctx.db.patch(oldRec._id, {
              isActive: false,
              updatedAt: now,
            });
          }
        }
      }

      return {
        success: true,
        recommendationsGenerated: recommendations.length,
        profileId: args.profileId,
        providerId: profile.providerId,
        providerName: profile.providerDisplayName,
        message: `Generated ${recommendations.length} workout recommendations`,
      };

    } catch (error) {
      console.error('Error generating workout recommendations:', error);
      if (error instanceof ConvexError) {
        throw error;
      }
      throw new ConvexError({
        message: 'Failed to generate workout recommendations',
        code: 'RECOMMENDATION_GENERATION_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },
});

/**
 * Get user's music profile summary
 */
export const getUserMusicProfiles = query({
  args: {
    userId: v.string(),
    includeInactive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    try {
      let profiles = await ctx.db
        .query('musicProfiles')
        .filter(q => q.eq(q.field('userId'), args.userId))
        .collect();

      if (!args.includeInactive) {
        profiles = profiles.filter(p => p.isActive);
      }

      const profileSummaries = profiles.map(profile => ({
        profileId: profile._id,
        providerId: profile.providerId,
        providerName: profile.providerDisplayName,
        isActive: profile.isActive,
        lastSyncAt: profile.lastSyncAt,
        syncCount: profile.syncCount,
        tracksCount: profile.topTracks?.length || 0,
        artistsCount: profile.topArtists?.length || 0,
        genresCount: profile.topGenres?.length || 0,
        preferences: profile.preferences,
        analysis: {
          averageEnergy: profile.averageEnergy,
          averageTempo: profile.averageTempo,
          averageValence: profile.averageValence,
          dominantGenres: profile.topGenres?.slice(0, 3) || [],
        },
        isRecentSync: profile.lastSyncAt ? (Date.now() - profile.lastSyncAt) < (24 * 60 * 60 * 1000) : false,
        createdAt: profile.createdAt,
      }));

      return {
        profiles: profileSummaries,
        summary: {
          total: profiles.length,
          active: profiles.filter(p => p.isActive).length,
          providers: [...new Set(profiles.map(p => p.providerId))],
          recentSyncs: profiles.filter(p => p.lastSyncAt && (Date.now() - p.lastSyncAt) < (24 * 60 * 60 * 1000)).length,
        }
      };

    } catch (error) {
      console.error('Error getting user music profiles:', error);
      throw new ConvexError({
        message: 'Failed to get music profiles',
        code: 'PROFILES_FETCH_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },
});

// ====================================================================================
// HELPER FUNCTIONS
// ====================================================================================

/**
 * Fetch music data from streaming provider
 */
async function fetchMusicDataFromProvider(
  provider: any,
  accessToken: string,
  options: any
): Promise<any> {
  const musicData: any = {};

  // This is a simplified version - in production, you'd call actual APIs
  try {
    if (options.includeTopTracks) {
      musicData.topTracks = await fetchTopTracks(provider, accessToken, options.timeRange);
    }
    
    if (options.includeTopArtists) {
      musicData.topArtists = await fetchTopArtists(provider, accessToken, options.timeRange);
    }
    
    if (options.includeRecentTracks) {
      musicData.recentTracks = await fetchRecentTracks(provider, accessToken);
    }
    
    if (options.includePlaylists) {
      musicData.playlists = await fetchUserPlaylists(provider, accessToken);
    }

    return musicData;
  } catch (error) {
    console.error('Error fetching music data from provider:', error);
    throw new ConvexError({
      message: `Failed to fetch music data from ${provider.displayName}`,
      code: 'PROVIDER_API_ERROR',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Analyze music profile data to extract insights
 */
async function analyzeMusicProfile(musicData: any): Promise<any> {
  const analysis: any = {};

  try {
    // Analyze genres
    const allGenres: string[] = [];
    if (musicData.topArtists) {
      musicData.topArtists.forEach((artist: any) => {
        if (artist.genres) {
          allGenres.push(...artist.genres);
        }
      });
    }
    
    const genreCount = allGenres.reduce((acc: any, genre: string) => {
      acc[genre] = (acc[genre] || 0) + 1;
      return acc;
    }, {});
    
    analysis.topGenres = Object.entries(genreCount)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 10)
      .map(([genre]) => genre);

    // Analyze audio features (simplified - would use actual API data)
    if (musicData.topTracks) {
      const tracks = musicData.topTracks;
      analysis.averageEnergy = tracks.reduce((sum: number, track: any) => 
        sum + (track.audioFeatures?.energy || 0.5), 0) / tracks.length;
      analysis.averageTempo = tracks.reduce((sum: number, track: any) => 
        sum + (track.audioFeatures?.tempo || 120), 0) / tracks.length;
      analysis.averageValence = tracks.reduce((sum: number, track: any) => 
        sum + (track.audioFeatures?.valence || 0.5), 0) / tracks.length;
    }

    return analysis;
  } catch (error) {
    console.error('Error analyzing music profile:', error);
    return {
      topGenres: [],
      averageEnergy: 0.5,
      averageTempo: 120,
      averageValence: 0.5,
    };
  }
}

/**
 * Generate AI-powered workout recommendations
 */
async function generateAIRecommendations(profile: any): Promise<any[]> {
  // This is a simplified AI recommendation algorithm
  // In production, this would use machine learning models
  
  const recommendations = [];
  const workoutTypes = ['cardio', 'strength', 'yoga', 'hiit'];
  
  for (const workoutType of workoutTypes) {
    const rec = {
      title: `${workoutType.charAt(0).toUpperCase() + workoutType.slice(1)} Workout Mix`,
      description: `AI-curated playlist for ${workoutType} workouts based on your music taste`,
      workoutTypes: [workoutType],
      intensityRange: getIntensityRangeForWorkout(workoutType),
      recommendedTracks: selectTracksForWorkout(profile, workoutType),
      audioFeatures: getTargetAudioFeatures(workoutType, profile),
      relevanceScore: calculateRelevanceScore(profile, workoutType),
      algorithmVersion: '1.0',
      generatedAt: Date.now(),
    };
    
    recommendations.push(rec);
  }
  
  return recommendations;
}

// Helper functions for AI recommendations (simplified implementations)
function getIntensityRangeForWorkout(workoutType: string) {
  const ranges = {
    cardio: { min: 6, max: 10 },
    strength: { min: 5, max: 8 },
    yoga: { min: 1, max: 4 },
    hiit: { min: 8, max: 10 },
  };
  return ranges[workoutType as keyof typeof ranges] || { min: 4, max: 7 };
}

function selectTracksForWorkout(profile: any, workoutType: string) {
  // Simplified track selection based on audio features
  const topTracks = profile.topTracks || [];
  return topTracks.slice(0, 20).map((track: any) => ({
    id: track.id,
    name: track.name,
    artist: track.artists?.[0]?.name,
    previewUrl: track.previewUrl,
    externalUrl: track.externalUrl,
  }));
}

function getTargetAudioFeatures(workoutType: string, profile: any) {
  const baseFeatures = {
    energy: profile.averageEnergy || 0.5,
    tempo: profile.averageTempo || 120,
    valence: profile.averageValence || 0.5,
  };
  
  const adjustments = {
    cardio: { energy: 0.2, tempo: 20, valence: 0.1 },
    strength: { energy: 0.15, tempo: 10, valence: 0.05 },
    yoga: { energy: -0.3, tempo: -30, valence: 0.1 },
    hiit: { energy: 0.3, tempo: 30, valence: 0.2 },
  };
  
  const adj = adjustments[workoutType as keyof typeof adjustments] || { energy: 0, tempo: 0, valence: 0 };
  
  return {
    energy: Math.max(0, Math.min(1, baseFeatures.energy + adj.energy)),
    tempo: Math.max(60, Math.min(200, baseFeatures.tempo + adj.tempo)),
    valence: Math.max(0, Math.min(1, baseFeatures.valence + adj.valence)),
  };
}

function calculateRelevanceScore(profile: any, workoutType: string): number {
  // Simplified relevance scoring
  let score = 50; // Base score
  
  if (profile.topGenres && profile.topGenres.length > 0) {
    score += 20; // Has genre data
  }
  
  if (profile.lastSyncAt && (Date.now() - profile.lastSyncAt) < (7 * 24 * 60 * 60 * 1000)) {
    score += 20; // Recent sync
  }
  
  if (profile.topTracks && profile.topTracks.length >= 10) {
    score += 10; // Sufficient track data
  }
  
  return Math.min(100, score);
}

// Simplified provider API functions (would call real APIs in production)
async function fetchTopTracks(provider: any, accessToken: string, timeRange: string) {
  // Mock implementation - would call actual Spotify/Apple Music APIs
  return [];
}

async function fetchTopArtists(provider: any, accessToken: string, timeRange: string) {
  // Mock implementation - would call actual Spotify/Apple Music APIs
  return [];
}

async function fetchRecentTracks(provider: any, accessToken: string) {
  // Mock implementation - would call actual Spotify/Apple Music APIs
  return [];
}

async function fetchUserPlaylists(provider: any, accessToken: string) {
  // Mock implementation - would call actual Spotify/Apple Music APIs
  return [];
}