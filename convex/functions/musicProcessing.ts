/**
 * Music Data Processing - Convex Functions
 * 
 * Implements advanced music data fetching and processing:
 * - User profile synchronization with external APIs
 * - Playlist analysis and track feature extraction
 * - Audio feature processing and genre analysis
 * - Music preference learning and pattern recognition
 */

import { mutation, query } from '../_generated/server.js';
import { v, ConvexError } from 'convex/values.js';
import { MusicServiceFactory } from '../lib/musicServices.js';

// ====================================================================================
// MUSIC DATA PROCESSING FUNCTIONS
// ====================================================================================

/**
 * Process and sync comprehensive music data from external APIs
 */
export const processMusicData = mutation({
  args: {
    connectionId: v.id('userOAuthConnections'),
    processingOptions: v.optional(v.object({
      includeAudioFeatures: v.optional(v.boolean()),
      includeGenreAnalysis: v.optional(v.boolean()),
      includePlaylistAnalysis: v.optional(v.boolean()),
      batchSize: v.optional(v.number()),
      maxTracks: v.optional(v.number()),
    })),
  },
  handler: async (ctx: any, args: any) => {
    try {
      // Get OAuth connection
      const connection = await ctx.db.get(args.connectionId);
      if (!connection || !connection.isActive) {
        throw new ConvexError({
          message: 'OAuth connection not found or inactive',
          code: 'CONNECTION_NOT_FOUND'
        });
      }

      // Create service instance
      const service = MusicServiceFactory.createService(
        connection.providerId,
        connection.accessToken
      );

      const options = {
        includeAudioFeatures: true,
        includeGenreAnalysis: true,
        includePlaylistAnalysis: false, // Privacy default
        batchSize: 50,
        maxTracks: 500,
        ...args.processingOptions
      };

      const startTime = Date.now();
      const processingResults = {
        tracksProcessed: 0,
        artistsProcessed: 0,
        audioFeaturesExtracted: 0,
        genresAnalyzed: 0,
        playlistsAnalyzed: 0,
        errors: [] as string[],
      };

      // Step 1: Fetch and process top tracks
      try {
        const topTracks = await service.getTopTracks('medium_term', options.maxTracks);
        processingResults.tracksProcessed = topTracks.length;

        // Process tracks in batches for audio features
        if (options.includeAudioFeatures && topTracks.length > 0) {
          const trackIds = topTracks.map(track => track.id);
          const audioFeatures = await processAudioFeaturesBatch(
            service, 
            trackIds, 
            options.batchSize
          );
          
          // Merge audio features with tracks
          const tracksWithFeatures = topTracks.map(track => {
            const features = audioFeatures.find(f => f && f.id === track.id);
            return features ? { ...track, audioFeatures: features } : track;
          });

          processingResults.audioFeaturesExtracted = audioFeatures.filter(f => f).length;
          
          // Store processed tracks
          await storeProcessedTracks(ctx, connection.userId, connection.providerId, tracksWithFeatures);
        }
      } catch (error) {
        processingResults.errors.push(`Track processing error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      // Step 2: Fetch and process top artists
      try {
        const topArtists = await service.getTopArtists('medium_term', 50);
        processingResults.artistsProcessed = topArtists.length;

        if (topArtists.length > 0) {
          await storeProcessedArtists(ctx, connection.userId, connection.providerId, topArtists);
        }
      } catch (error) {
        processingResults.errors.push(`Artist processing error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      // Step 3: Genre analysis
      if (options.includeGenreAnalysis) {
        try {
          const genreAnalysis = await performGenreAnalysis(ctx, connection.userId, connection.providerId);
          processingResults.genresAnalyzed = genreAnalysis.totalGenres;
          
          await storeGenreAnalysis(ctx, connection.userId, connection.providerId, genreAnalysis);
        } catch (error) {
          processingResults.errors.push(`Genre analysis error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Step 4: Playlist analysis (if enabled)
      if (options.includePlaylistAnalysis) {
        try {
          const playlists = await service.getUserPlaylists(20);
          const playlistAnalysis = await analyzeUserPlaylists(playlists);
          processingResults.playlistsAnalyzed = playlists.length;
          
          await storePlaylistAnalysis(ctx, connection.userId, connection.providerId, playlistAnalysis);
        } catch (error) {
          processingResults.errors.push(`Playlist analysis error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Update connection with processing statistics
      await ctx.db.patch(connection._id, {
        lastSyncAt: Date.now(),
        successfulRequests: connection.successfulRequests + 1,
        totalRequests: connection.totalRequests + 1,
        updatedAt: Date.now(),
      });

      const processingTime = Date.now() - startTime;

      return {
        success: true,
        connectionId: args.connectionId,
        providerId: connection.providerId,
        providerName: connection.providerDisplayName,
        processingTime,
        results: processingResults,
        message: `Successfully processed music data from ${connection.providerDisplayName}`,
      };

    } catch (error) {
      console.error('Error processing music data:', error);
      if (error instanceof ConvexError) {
        throw error;
      }
      throw new ConvexError({
        message: 'Failed to process music data',
        code: 'MUSIC_PROCESSING_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },
});

/**
 * Analyze playlist composition and extract insights
 */
export const analyzePlaylistComposition = query({
  args: {
    userId: v.string(),
    providerId: v.string(),
    playlistId: v.optional(v.string()),
    analysisType: v.optional(v.string()), // 'workout', 'genre', 'energy', 'tempo'
  },
  handler: async (ctx, args) => {
    try {
      // Get user's music profile
      const profile = await ctx.db
        .query('musicProfiles')
        .filter((q: any) => q.eq(q.field('userId'), args.userId))
        .filter(q => q.eq(q.field('providerId'), args.providerId))
        .first();

      if (!profile) {
        throw new ConvexError({
          message: 'Music profile not found',
          code: 'PROFILE_NOT_FOUND'
        });
      }

      // Get stored playlist analysis data
      const playlistAnalysis = await ctx.db
        .query('musicProfiles') // Assuming playlist analysis is stored in profile
        .filter(q => q.eq(q.field('userId'), args.userId))
        .filter(q => q.eq(q.field('providerId'), args.providerId))
        .first();

      if (!playlistAnalysis?.playlistAnalysis) {
        return {
          analysis: null,
          message: 'No playlist analysis data available. Please sync playlists first.',
          hasData: false,
        };
      }

      const analysis = playlistAnalysis.playlistAnalysis;
      let filteredAnalysis = analysis;

      // Filter by analysis type
      if (args.analysisType) {
        filteredAnalysis = filterAnalysisByType(analysis, args.analysisType);
      }

      // Filter by specific playlist
      if (args.playlistId) {
        filteredAnalysis = analysis.playlists?.find((p: any) => p.id === args.playlistId);
        if (!filteredAnalysis) {
          throw new ConvexError({
            message: 'Playlist not found in analysis data',
            code: 'PLAYLIST_NOT_FOUND'
          });
        }
      }

      return {
        analysis: filteredAnalysis,
        metadata: {
          totalPlaylists: analysis.totalPlaylists || 0,
          totalTracks: analysis.totalTracks || 0,
          analysisDate: analysis.createdAt,
          providerId: args.providerId,
          analysisType: args.analysisType || 'all',
        },
        insights: generatePlaylistInsights(filteredAnalysis),
        hasData: true,
      };

    } catch (error) {
      console.error('Error analyzing playlist composition:', error);
      if (error instanceof ConvexError) {
        throw error;
      }
      throw new ConvexError({
        message: 'Failed to analyze playlist composition',
        code: 'PLAYLIST_ANALYSIS_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },
});

/**
 * Extract and process audio features for tracks
 */
export const extractAudioFeatures = mutation({
  args: {
    connectionId: v.id('userOAuthConnections'),
    trackIds: v.array(v.string()),
    analysisOptions: v.optional(v.object({
      includeWorkoutMetrics: v.optional(v.boolean()),
      includeMoodAnalysis: v.optional(v.boolean()),
      includeGenrePrediction: v.optional(v.boolean()),
    })),
  },
  handler: async (ctx, args) => {
    try {
      // Get OAuth connection
      const connection = await ctx.db.get(args.connectionId);
      if (!connection || !connection.isActive) {
        throw new ConvexError({
          message: 'OAuth connection not found or inactive',
          code: 'CONNECTION_NOT_FOUND'
        });
      }

      // Create service instance
      const service = MusicServiceFactory.createService(
        connection.providerId,
        connection.accessToken
      );

      const options = {
        includeWorkoutMetrics: true,
        includeMoodAnalysis: true,
        includeGenrePrediction: false, // Computationally expensive
        ...args.analysisOptions
      };

      // Extract raw audio features
      const audioFeatures = await service.getAudioFeatures(args.trackIds);
      
      if (audioFeatures.length === 0) {
        return {
          success: true,
          extractedFeatures: [],
          processedFeatures: [],
          message: 'No audio features available for the provided tracks',
        };
      }

      // Process and enhance audio features
      const processedFeatures = await Promise.all(
        audioFeatures.map(async (features) => {
          const processed = {
            ...features,
            processed: {
              workoutScore: options.includeWorkoutMetrics ? calculateWorkoutScore(features) : null,
              moodProfile: options.includeMoodAnalysis ? analyzeMoodProfile(features) : null,
              intensityLevel: calculateIntensityLevel(features),
              danceability: features.danceability,
              energyLevel: categorizeEnergyLevel(features.energy),
              tempoCategory: categorizeTempoCategory(features.tempo),
            }
          };

          return processed;
        })
      );

      // Store processed audio features
      await storeProcessedAudioFeatures(
        ctx, 
        connection.userId, 
        connection.providerId, 
        processedFeatures
      );

      return {
        success: true,
        connectionId: args.connectionId,
        extractedFeatures: audioFeatures,
        processedFeatures: processedFeatures,
        summary: {
          totalFeatures: processedFeatures.length,
          averageEnergy: calculateAverage(processedFeatures.map(f => f.energy)),
          averageTempo: calculateAverage(processedFeatures.map(f => f.tempo)),
          averageValence: calculateAverage(processedFeatures.map(f => f.valence)),
          workoutSuitability: calculateWorkoutSuitability(processedFeatures),
        },
        message: `Successfully extracted and processed ${processedFeatures.length} audio features`,
      };

    } catch (error) {
      console.error('Error extracting audio features:', error);
      if (error instanceof ConvexError) {
        throw error;
      }
      throw new ConvexError({
        message: 'Failed to extract audio features',
        code: 'AUDIO_FEATURES_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },
});

/**
 * Generate music listening pattern analysis
 */
export const analyzeListeningPatterns = query({
  args: {
    userId: v.string(),
    providerId: v.string(),
    timeRange: v.optional(v.string()), // 'week', 'month', 'year'
    includeComparisons: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    try {
      // Get user's music profile and processed data
      const profile = await ctx.db
        .query('musicProfiles')
        .filter(q => q.eq(q.field('userId'), args.userId))
        .filter(q => q.eq(q.field('providerId'), args.providerId))
        .first();

      if (!profile) {
        throw new ConvexError({
          message: 'Music profile not found',
          code: 'PROFILE_NOT_FOUND'
        });
      }

      // Analyze listening patterns from stored data
      const patterns = {
        genres: analyzeGenrePatterns(profile),
        audioFeatures: analyzeAudioFeaturePatterns(profile),
        temporal: analyzeTemporalPatterns(profile, args.timeRange),
        diversity: calculateListeningDiversity(profile),
        preferences: extractUserPreferences(profile),
      };

      // Add comparisons if requested
      let comparisons = null;
      if (args.includeComparisons) {
        comparisons = await generatePatternComparisons(ctx, patterns, args.userId);
      }

      return {
        patterns,
        comparisons,
        metadata: {
          profileId: profile._id,
          providerId: args.providerId,
          dataPoints: profile.topTracks?.length || 0,
          analysisDate: Date.now(),
          timeRange: args.timeRange || 'all',
        },
        insights: generateListeningInsights(patterns),
      };

    } catch (error) {
      console.error('Error analyzing listening patterns:', error);
      if (error instanceof ConvexError) {
        throw error;
      }
      throw new ConvexError({
        message: 'Failed to analyze listening patterns',
        code: 'PATTERN_ANALYSIS_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },
});

/**
 * Process music recommendations based on workout context
 */
export const processWorkoutRecommendations = mutation({
  args: {
    userId: v.string(),
    workoutContext: v.object({
      type: v.string(), // 'cardio', 'strength', 'yoga', 'hiit'
      intensity: v.number(), // 1-10
      duration: v.number(), // minutes
      targetBPM: v.optional(v.object({
        min: v.number(),
        max: v.number(),
      })),
    }),
    preferences: v.optional(v.object({
      excludeExplicit: v.optional(v.boolean()),
      preferredGenres: v.optional(v.array(v.string())),
      energyRange: v.optional(v.object({
        min: v.number(),
        max: v.number(),
      })),
    })),
  },
  handler: async (ctx, args) => {
    try {
      // Get user's music profiles
      const profiles = await ctx.db
        .query('musicProfiles')
        .filter(q => q.eq(q.field('userId'), args.userId))
        .filter(q => q.eq(q.field('isActive'), true))
        .collect();

      if (profiles.length === 0) {
        throw new ConvexError({
          message: 'No active music profiles found',
          code: 'NO_PROFILES'
        });
      }

      const workoutParams = {
        type: args.workoutContext.type,
        intensity: args.workoutContext.intensity,
        duration: args.workoutContext.duration,
        targetBPM: args.workoutContext.targetBPM || getDefaultBPMRange(args.workoutContext.type),
      };

      const recommendations = [];

      for (const profile of profiles) {
        // Process recommendations for each provider
        const providerRecs = await generateWorkoutSpecificRecommendations(
          profile,
          workoutParams,
          args.preferences
        );

        recommendations.push({
          providerId: profile.providerId,
          providerName: profile.providerDisplayName,
          recommendations: providerRecs,
          confidence: calculateRecommendationConfidence(profile, workoutParams),
        });
      }

      // Merge and rank recommendations
      const mergedRecommendations = mergeProviderRecommendations(recommendations);
      const rankedRecommendations = rankRecommendations(mergedRecommendations, workoutParams);

      // Store workout recommendations
      const recommendationId = await ctx.db.insert('workoutMusicRecommendations', {
        userId: args.userId,
        profileId: profiles[0]._id, // Primary profile
        providerId: 'merged', // Indicates merged recommendations
        title: `${workoutParams.type} Workout Playlist`,
        description: `AI-curated playlist for ${workoutParams.type} workouts`,
        workoutTypes: [workoutParams.type],
        intensityRange: {
          min: Math.max(1, workoutParams.intensity - 2),
          max: Math.min(10, workoutParams.intensity + 2),
        },
        recommendedTracks: rankedRecommendations.slice(0, 30), // Top 30 tracks
        audioFeatures: calculateTargetAudioFeatures(workoutParams),
        relevanceScore: calculateAverageConfidence(recommendations),
        algorithmVersion: '2.0',
        generatedAt: Date.now(),
        isActive: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      return {
        success: true,
        recommendationId,
        workoutContext: workoutParams,
        recommendations: rankedRecommendations.slice(0, 20), // Return top 20 for display
        providerBreakdown: recommendations.map(r => ({
          providerId: r.providerId,
          providerName: r.providerName,
          trackCount: r.recommendations.length,
          confidence: r.confidence,
        })),
        metadata: {
          totalRecommendations: rankedRecommendations.length,
          avgConfidence: calculateAverageConfidence(recommendations),
          processingTime: Date.now(),
        },
        message: `Generated ${rankedRecommendations.length} workout recommendations`,
      };

    } catch (error) {
      console.error('Error processing workout recommendations:', error);
      if (error instanceof ConvexError) {
        throw error;
      }
      throw new ConvexError({
        message: 'Failed to process workout recommendations',
        code: 'WORKOUT_RECOMMENDATION_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },
});

// ====================================================================================
// HELPER FUNCTIONS
// ====================================================================================

async function processAudioFeaturesBatch(service: any, trackIds: string[], batchSize: number): Promise<any[]> {
  const allFeatures = [];
  
  for (let i = 0; i < trackIds.length; i += batchSize) {
    const batch = trackIds.slice(i, i + batchSize);
    try {
      const features = await service.getAudioFeatures(batch);
      allFeatures.push(...features);
      
      // Small delay to respect rate limits
      if (i + batchSize < trackIds.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } catch (error) {
      console.error(`Error processing audio features batch ${i}-${i + batchSize}:`, error);
      // Continue with next batch even if one fails
    }
  }
  
  return allFeatures;
}

async function storeProcessedTracks(ctx: any, userId: string, providerId: string, tracks: any[]): Promise<void> {
  // Store in music profile or separate processed tracks table
  const profile = await ctx.db
    .query('musicProfiles')
    .filter((q: any) => q.eq(q.field('userId'), userId))
    .filter((q: any) => q.eq(q.field('providerId'), providerId))
    .first();

  if (profile) {
    await ctx.db.patch(profile._id, {
      topTracks: tracks,
      processedAt: Date.now(),
      updatedAt: Date.now(),
    });
  }
}

async function storeProcessedArtists(ctx: any, userId: string, providerId: string, artists: any[]): Promise<void> {
  const profile = await ctx.db
    .query('musicProfiles')
    .filter((q: any) => q.eq(q.field('userId'), userId))
    .filter((q: any) => q.eq(q.field('providerId'), providerId))
    .first();

  if (profile) {
    await ctx.db.patch(profile._id, {
      topArtists: artists,
      updatedAt: Date.now(),
    });
  }
}

async function performGenreAnalysis(ctx: any, userId: string, providerId: string): Promise<any> {
  const profile = await ctx.db
    .query('musicProfiles')
    .filter((q: any) => q.eq(q.field('userId'), userId))
    .filter((q: any) => q.eq(q.field('providerId'), providerId))
    .first();

  if (!profile?.topArtists) {
    return { totalGenres: 0, genreDistribution: {} };
  }

  const genreCount: Record<string, number> = {};
  const artistGenres = profile.topArtists.flatMap((artist: any) => artist.genres || []);
  
  artistGenres.forEach((genre: string) => {
    genreCount[genre] = (genreCount[genre] || 0) + 1;
  });

  return {
    totalGenres: Object.keys(genreCount).length,
    genreDistribution: genreCount,
    topGenres: Object.entries(genreCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([genre, count]) => ({ genre, count })),
  };
}

async function storeGenreAnalysis(ctx: any, userId: string, providerId: string, analysis: any): Promise<void> {
  const profile = await ctx.db
    .query('musicProfiles')
    .filter((q: any) => q.eq(q.field('userId'), userId))
    .filter((q: any) => q.eq(q.field('providerId'), providerId))
    .first();

  if (profile) {
    await ctx.db.patch(profile._id, {
      genreAnalysis: analysis,
      updatedAt: Date.now(),
    });
  }
}

async function analyzeUserPlaylists(playlists: any[]): Promise<any> {
  return {
    totalPlaylists: playlists.length,
    totalTracks: playlists.reduce((sum, p) => sum + p.tracks.total, 0),
    avgPlaylistSize: playlists.length > 0 ? playlists.reduce((sum, p) => sum + p.tracks.total, 0) / playlists.length : 0,
    publicPlaylists: playlists.filter(p => p.public).length,
    privatePlaylists: playlists.filter(p => !p.public).length,
    playlists: playlists.map(p => ({
      id: p.id,
      name: p.name,
      trackCount: p.tracks.total,
      isPublic: p.public,
    })),
  };
}

async function storePlaylistAnalysis(ctx: any, userId: string, providerId: string, analysis: any): Promise<void> {
  const profile = await ctx.db
    .query('musicProfiles')
    .filter((q: any) => q.eq(q.field('userId'), userId))
    .filter((q: any) => q.eq(q.field('providerId'), providerId))
    .first();

  if (profile) {
    await ctx.db.patch(profile._id, {
      playlistAnalysis: analysis,
      updatedAt: Date.now(),
    });
  }
}

async function storeProcessedAudioFeatures(ctx: any, userId: string, providerId: string, features: any[]): Promise<void> {
  // Store processed audio features for later analysis
  const profile = await ctx.db
    .query('musicProfiles')
    .filter((q: any) => q.eq(q.field('userId'), userId))
    .filter((q: any) => q.eq(q.field('providerId'), providerId))
    .first();

  if (profile) {
    await ctx.db.patch(profile._id, {
      processedAudioFeatures: features,
      audioFeaturesProcessedAt: Date.now(),
      updatedAt: Date.now(),
    });
  }
}

// Analysis helper functions
function calculateWorkoutScore(features: any): number {
  const energyWeight = 0.4;
  const tempoWeight = 0.3;
  const danceabilityWeight = 0.2;
  const valenceBias = 0.1;

  const normalizedTempo = Math.min(1, Math.max(0, (features.tempo - 60) / 140));
  
  return (
    features.energy * energyWeight +
    normalizedTempo * tempoWeight +
    features.danceability * danceabilityWeight +
    features.valence * valenceBias
  );
}

function analyzeMoodProfile(features: any): string {
  if (features.valence > 0.7 && features.energy > 0.7) return 'energetic-happy';
  if (features.valence > 0.7 && features.energy < 0.3) return 'peaceful-happy';
  if (features.valence < 0.3 && features.energy > 0.7) return 'aggressive-intense';
  if (features.valence < 0.3 && features.energy < 0.3) return 'sad-mellow';
  if (features.energy > 0.6) return 'energetic';
  if (features.valence > 0.6) return 'uplifting';
  return 'neutral';
}

function calculateIntensityLevel(features: any): number {
  return Math.round((features.energy + features.loudness / -10 + features.danceability) / 3 * 10);
}

function categorizeEnergyLevel(energy: number): string {
  if (energy > 0.8) return 'very-high';
  if (energy > 0.6) return 'high';
  if (energy > 0.4) return 'medium';
  if (energy > 0.2) return 'low';
  return 'very-low';
}

function categorizeTempoCategory(tempo: number): string {
  if (tempo > 140) return 'fast';
  if (tempo > 120) return 'moderate';
  if (tempo > 100) return 'slow';
  return 'very-slow';
}

function calculateAverage(numbers: number[]): number {
  return numbers.length > 0 ? numbers.reduce((a, b) => a + b) / numbers.length : 0;
}

function calculateWorkoutSuitability(features: any[]): number {
  const workoutScores = features.map(f => calculateWorkoutScore(f.processed || f));
  return calculateAverage(workoutScores);
}

// Pattern analysis functions
function analyzeGenrePatterns(profile: any): any {
  const genres = profile.topGenres || [];
  return {
    diversity: genres.length,
    dominantGenres: genres.slice(0, 5),
    distribution: genres.reduce((acc: any, genre: string, index: number) => {
      acc[genre] = Math.max(0.1, 1 - (index / genres.length));
      return acc;
    }, {}),
  };
}

function analyzeAudioFeaturePatterns(profile: any): any {
  const features = profile.processedAudioFeatures || [];
  if (features.length === 0) return {};

  return {
    averageEnergy: calculateAverage(features.map((f: any) => f.energy)),
    averageTempo: calculateAverage(features.map((f: any) => f.tempo)),
    averageValence: calculateAverage(features.map((f: any) => f.valence)),
    energyDistribution: categorizeDistribution(features.map((f: any) => f.energy)),
    tempoDistribution: categorizeDistribution(features.map((f: any) => f.tempo / 200)),
  };
}

function analyzeTemporalPatterns(profile: any, timeRange?: string): any {
  // This would require timestamp data from listening history
  return {
    timeRange: timeRange || 'all',
    analysisNote: 'Temporal analysis requires listening history timestamps',
  };
}

function calculateListeningDiversity(profile: any): any {
  const artists = new Set((profile.topTracks || []).map((t: any) => t.artists[0]?.name));
  const genres = new Set(profile.topGenres || []);
  
  return {
    artistDiversity: artists.size,
    genreDiversity: genres.size,
    diversityScore: (artists.size + genres.size) / Math.max(1, (profile.topTracks?.length || 0) / 5),
  };
}

function extractUserPreferences(profile: any): any {
  return {
    energyPreference: profile.averageEnergy || 0.5,
    tempoPreference: profile.averageTempo || 120,
    moodPreference: profile.averageValence || 0.5,
    topGenres: (profile.topGenres || []).slice(0, 5),
  };
}

function generateListeningInsights(patterns: any): string[] {
  const insights = [];
  
  if (patterns.audioFeatures?.averageEnergy > 0.7) {
    insights.push('You prefer high-energy music');
  }
  
  if (patterns.diversity?.diversityScore > 0.8) {
    insights.push('You have very diverse music taste');
  }
  
  if (patterns.genres?.dominantGenres?.length > 0) {
    insights.push(`Your top genre is ${patterns.genres.dominantGenres[0]}`);
  }
  
  return insights;
}

// Utility functions
function filterAnalysisByType(analysis: any, type: string): any {
  // Filter analysis data by type (workout, genre, energy, tempo)
  return analysis; // Simplified implementation
}

function generatePlaylistInsights(analysis: any): string[] {
  const insights = [];
  
  if (analysis?.totalPlaylists > 10) {
    insights.push('You have a large playlist collection');
  }
  
  if (analysis?.avgPlaylistSize > 50) {
    insights.push('You prefer longer playlists');
  }
  
  return insights;
}

async function generatePatternComparisons(ctx: any, patterns: any, userId: string): Promise<any> {
  // Generate comparisons with other users or general trends
  return {
    note: 'Pattern comparisons require aggregate user data',
  };
}

// Workout recommendation functions
function getDefaultBPMRange(workoutType: string): { min: number; max: number } {
  const ranges = {
    cardio: { min: 120, max: 140 },
    strength: { min: 100, max: 130 },
    yoga: { min: 60, max: 90 },
    hiit: { min: 140, max: 180 },
  };
  return ranges[workoutType as keyof typeof ranges] || { min: 100, max: 140 };
}

async function generateWorkoutSpecificRecommendations(profile: any, workoutParams: any, preferences: any): Promise<any[]> {
  const tracks = profile.topTracks || [];
  
  return tracks
    .filter((track: any) => {
      if (preferences?.excludeExplicit && track.explicit) return false;
      if (track.audioFeatures) {
        const tempo = track.audioFeatures.tempo;
        return tempo >= workoutParams.targetBPM.min && tempo <= workoutParams.targetBPM.max;
      }
      return true;
    })
    .slice(0, 20);
}

function calculateRecommendationConfidence(profile: any, workoutParams: any): number {
  let confidence = 0.5; // Base confidence
  
  if (profile.topTracks?.length > 20) confidence += 0.2;
  if (profile.processedAudioFeatures?.length > 0) confidence += 0.2;
  if (profile.genreAnalysis?.totalGenres > 5) confidence += 0.1;
  
  return Math.min(1, confidence);
}

function mergeProviderRecommendations(recommendations: any[]): any[] {
  const merged: any[] = [];
  const trackIds = new Set();
  
  recommendations.forEach(provider => {
    provider.recommendations.forEach((track: any) => {
      if (!trackIds.has(track.id)) {
        trackIds.add(track.id);
        merged.push({
          ...track,
          providerId: provider.providerId,
          confidence: provider.confidence,
        });
      }
    });
  });
  
  return merged;
}

function rankRecommendations(recommendations: any[], workoutParams: any): any[] {
  return recommendations
    .map(track => ({
      ...track,
      score: calculateTrackWorkoutScore(track, workoutParams),
    }))
    .sort((a, b) => b.score - a.score);
}

function calculateTrackWorkoutScore(track: any, workoutParams: any): number {
  let score = track.confidence || 0.5;
  
  if (track.audioFeatures) {
    const features = track.audioFeatures;
    const energyMatch = 1 - Math.abs(features.energy - getTargetEnergy(workoutParams.type));
    const tempoMatch = isTempoInRange(features.tempo, workoutParams.targetBPM) ? 1 : 0.3;
    
    score += (energyMatch + tempoMatch) / 2;
  }
  
  return Math.min(1, score);
}

function calculateTargetAudioFeatures(workoutParams: any): any {
  const targets = {
    cardio: { energy: 0.8, tempo: 130, valence: 0.7 },
    strength: { energy: 0.7, tempo: 115, valence: 0.6 },
    yoga: { energy: 0.3, tempo: 75, valence: 0.6 },
    hiit: { energy: 0.9, tempo: 160, valence: 0.8 },
  };
  
  return targets[workoutParams.type as keyof typeof targets] || targets.cardio;
}

function calculateAverageConfidence(recommendations: any[]): number {
  const confidences = recommendations.map(r => r.confidence);
  return calculateAverage(confidences);
}

function getTargetEnergy(workoutType: string): number {
  const energyTargets = { cardio: 0.8, strength: 0.7, yoga: 0.3, hiit: 0.9 };
  return energyTargets[workoutType as keyof typeof energyTargets] || 0.6;
}

function isTempoInRange(tempo: number, range: { min: number; max: number }): boolean {
  return tempo >= range.min && tempo <= range.max;
}

function categorizeDistribution(values: number[]): any {
  const categories = { low: 0, medium: 0, high: 0 };
  values.forEach(value => {
    if (value < 0.33) categories.low++;
    else if (value < 0.67) categories.medium++;
    else categories.high++;
  });
  return categories;
}