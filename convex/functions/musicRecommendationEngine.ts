/**
 * Music Recommendation Engine - Convex Functions
 * 
 * Implements AI-powered music recommendation system:
 * - Machine Learning algorithms for personalized recommendations
 * - Workout-context optimization and BPM matching
 * - Multi-provider recommendation fusion
 * - Real-time preference learning and adaptation
 * - Advanced similarity analysis and clustering
 */

import { mutation, query } from '../_generated/server';
import { v, ConvexError } from 'convex/values';

// ====================================================================================
// AI RECOMMENDATION ENGINE FUNCTIONS
// ====================================================================================

/**
 * Generate AI-powered personalized music recommendations
 */
export const generateAIRecommendations = mutation({
  args: {
    userId: v.string(),
    context: v.object({
      workoutType: v.string(), // 'cardio', 'strength', 'yoga', 'hiit', 'general'
      intensity: v.number(), // 1-10
      duration: v.number(), // minutes
      timeOfDay: v.optional(v.string()), // 'morning', 'afternoon', 'evening'
      mood: v.optional(v.string()), // 'energetic', 'focused', 'relaxed'
      environment: v.optional(v.string()), // 'gym', 'home', 'outdoor'
    }),
    preferences: v.optional(v.object({
      genres: v.optional(v.array(v.string())),
      excludeGenres: v.optional(v.array(v.string())),
      explicitContent: v.optional(v.boolean()),
      novelty: v.optional(v.number()), // 0-1 (familiar vs new music)
      diversity: v.optional(v.number()), // 0-1 (similar vs diverse)
      recency: v.optional(v.number()), // 0-1 (old vs recent tracks)
    })),
    algorithmOptions: v.optional(v.object({
      useCollaborativeFiltering: v.optional(v.boolean()),
      useContentBasedFiltering: v.optional(v.boolean()),
      useHybridApproach: v.optional(v.boolean()),
      minConfidence: v.optional(v.number()),
      maxRecommendations: v.optional(v.number()),
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
          message: 'No active music profiles found for recommendations',
          code: 'NO_PROFILES'
        });
      }

      // Get user's existing recommendations for learning
      const historicalRecommendations = await ctx.db
        .query('workoutMusicRecommendations')
        .filter(q => q.eq(q.field('userId'), args.userId))
        .order('desc')
        .take(10);

      const options = {
        useCollaborativeFiltering: true,
        useContentBasedFiltering: true,
        useHybridApproach: true,
        minConfidence: 0.3,
        maxRecommendations: 50,
        ...args.algorithmOptions
      };

      const preferences = {
        novelty: 0.3, // Slight preference for familiar music
        diversity: 0.6, // Good diversity
        recency: 0.4, // Mix of old and new
        explicitContent: false,
        ...args.preferences
      };

      const startTime = Date.now();
      let recommendations: any[] = [];

      // Multi-algorithm approach for better recommendations
      if (options.useContentBasedFiltering) {
        const contentRecs = await generateContentBasedRecommendations(
          profiles, 
          args.context, 
          preferences
        );
        recommendations = [...recommendations, ...contentRecs];
      }

      if (options.useCollaborativeFiltering) {
        const collabRecs = await generateCollaborativeFilteringRecommendations(
          ctx,
          args.userId,
          args.context,
          preferences
        );
        recommendations = [...recommendations, ...collabRecs];
      }

      if (options.useHybridApproach) {
        const hybridRecs = await generateHybridRecommendations(
          profiles,
          historicalRecommendations,
          args.context,
          preferences
        );
        recommendations = [...recommendations, ...hybridRecs];
      }

      // Apply ML-based ranking and filtering
      const rankedRecommendations = await applyMLRanking(
        recommendations,
        args.context,
        preferences,
        historicalRecommendations
      );

      // Apply diversity and novelty constraints
      const optimizedRecommendations = await optimizeRecommendationDiversity(
        rankedRecommendations,
        preferences,
        options.maxRecommendations
      );

      // Calculate confidence scores and metadata
      const finalRecommendations = optimizedRecommendations
        .filter(rec => rec.confidence >= options.minConfidence)
        .slice(0, options.maxRecommendations)
        .map(rec => ({
          ...rec,
          recommendationId: generateRecommendationId(),
          generatedAt: Date.now(),
          algorithm: rec.algorithm || 'hybrid',
          contextScore: calculateContextMatch(rec, args.context),
        }));

      // Store recommendation session for learning
      const sessionId = await ctx.db.insert('workoutMusicRecommendations', {
        userId: args.userId,
        profileId: profiles[0]._id, // Primary profile
        providerId: 'ai-engine',
        title: `${args.context.workoutType} AI Recommendations`,
        description: `AI-curated playlist for ${args.context.workoutType} workouts`,
        workoutTypes: [args.context.workoutType],
        intensityRange: {
          min: Math.max(1, args.context.intensity - 2),
          max: Math.min(10, args.context.intensity + 2),
        },
        recommendedTracks: finalRecommendations,
        audioFeatures: calculateTargetAudioFeatures(args.context),
        relevanceScore: calculateAverageConfidence(finalRecommendations),
        algorithmVersion: '3.0-ml',
        algorithmMetadata: {
          contentBased: options.useContentBasedFiltering,
          collaborative: options.useCollaborativeFiltering,
          hybrid: options.useHybridApproach,
          processingTime: Date.now() - startTime,
          totalCandidates: recommendations.length,
          finalCount: finalRecommendations.length,
        },
        generatedAt: startTime,
        isActive: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      return {
        success: true,
        sessionId,
        recommendations: finalRecommendations,
        metadata: {
          totalCandidates: recommendations.length,
          finalCount: finalRecommendations.length,
          avgConfidence: calculateAverageConfidence(finalRecommendations),
          processingTime: Date.now() - startTime,
          algorithmsUsed: {
            contentBased: options.useContentBasedFiltering,
            collaborative: options.useCollaborativeFiltering,
            hybrid: options.useHybridApproach,
          },
          context: args.context,
          preferences: preferences,
        },
        insights: generateRecommendationInsights(finalRecommendations, args.context),
        message: `Generated ${finalRecommendations.length} AI-powered recommendations`,
      };

    } catch (error) {
      console.error('Error generating AI recommendations:', error);
      if (error instanceof ConvexError) {
        throw error;
      }
      throw new ConvexError({
        message: 'Failed to generate AI recommendations',
        code: 'AI_RECOMMENDATION_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },
});

/**
 * Learn from user feedback to improve recommendation quality
 */
export const learnFromFeedback = mutation({
  args: {
    userId: v.string(),
    recommendationId: v.string(),
    feedback: v.object({
      rating: v.number(), // 1-5 stars
      listened: v.boolean(),
      completed: v.boolean(),
      liked: v.optional(v.boolean()),
      skipped: v.optional(v.boolean()),
      context: v.optional(v.object({
        actualWorkoutType: v.optional(v.string()),
        actualIntensity: v.optional(v.number()),
        actualDuration: v.optional(v.number()),
      })),
      comments: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    try {
      // Find the recommendation session
      const session = await ctx.db
        .query('workoutMusicRecommendations')
        .filter(q => q.eq(q.field('userId'), args.userId))
        .filter(q => q.eq(q.field('providerId'), 'ai-engine'))
        .order('desc')
        .first();

      if (!session) {
        throw new ConvexError({
          message: 'Recommendation session not found',
          code: 'SESSION_NOT_FOUND'
        });
      }

      // Find specific recommendation
      const recommendation = session.recommendedTracks?.find(
        (track: any) => track.recommendationId === args.recommendationId
      );

      if (!recommendation) {
        throw new ConvexError({
          message: 'Specific recommendation not found',
          code: 'RECOMMENDATION_NOT_FOUND'
        });
      }

      // Update recommendation with feedback
      const updatedTracks = session.recommendedTracks.map((track: any) => {
        if (track.recommendationId === args.recommendationId) {
          return {
            ...track,
            feedback: {
              ...args.feedback,
              submittedAt: Date.now(),
            },
            learningData: {
              previousConfidence: track.confidence,
              feedbackWeight: calculateFeedbackWeight(args.feedback),
              adjustedConfidence: adjustConfidenceFromFeedback(track.confidence, args.feedback),
            },
          };
        }
        return track;
      });

      await ctx.db.patch(session._id, {
        recommendedTracks: updatedTracks,
        updatedAt: Date.now(),
      });

      // Extract learning patterns
      const learningPatterns = await extractLearningPatterns(args.feedback, recommendation);

      // Update user preferences based on feedback
      await updateUserPreferencesFromFeedback(
        ctx,
        args.userId,
        args.feedback,
        recommendation,
        learningPatterns
      );

      // Store learning data for future recommendations
      const learningData = {
        userId: args.userId,
        recommendationId: args.recommendationId,
        feedback: args.feedback,
        trackFeatures: recommendation.audioFeatures,
        context: session.workoutTypes?.[0] || 'general',
        patterns: learningPatterns,
        timestamp: Date.now(),
      };

      await storeLearningData(ctx, learningData);

      return {
        success: true,
        message: 'Feedback processed and learning patterns updated',
        learningPatterns,
        adjustedConfidence: updatedTracks.find(
          (t: any) => t.recommendationId === args.recommendationId
        )?.learningData?.adjustedConfidence,
      };

    } catch (error) {
      console.error('Error processing recommendation feedback:', error);
      if (error instanceof ConvexError) {
        throw error;
      }
      throw new ConvexError({
        message: 'Failed to process recommendation feedback',
        code: 'FEEDBACK_LEARNING_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },
});

/**
 * Generate similar tracks based on ML clustering
 */
export const findSimilarTracks = query({
  args: {
    userId: v.string(),
    referenceTrack: v.object({
      id: v.string(),
      name: v.string(),
      artists: v.array(v.any()),
      audioFeatures: v.optional(v.any()),
      genres: v.optional(v.array(v.string())),
    }),
    similarityOptions: v.optional(v.object({
      audioFeatureWeight: v.optional(v.number()),
      genreWeight: v.optional(v.number()),
      artistWeight: v.optional(v.number()),
      maxResults: v.optional(v.number()),
      minSimilarity: v.optional(v.number()),
    })),
  },
  handler: async (ctx, args) => {
    try {
      // Get user's music profiles
      const profiles = await ctx.db
        .query('musicProfiles')
        .filter(q => q.eq(q.field('userId'), args.userId))
        .collect();

      if (profiles.length === 0) {
        return {
          similarTracks: [],
          message: 'No music profiles found for similarity analysis',
        };
      }

      const options = {
        audioFeatureWeight: 0.6,
        genreWeight: 0.2,
        artistWeight: 0.2,
        maxResults: 20,
        minSimilarity: 0.3,
        ...args.similarityOptions
      };

      // Collect all tracks from user profiles
      const allTracks: any[] = [];
      profiles.forEach(profile => {
        if (profile.topTracks) {
          allTracks.push(...profile.topTracks);
        }
      });

      if (allTracks.length === 0) {
        return {
          similarTracks: [],
          message: 'No tracks available for similarity analysis',
        };
      }

      // Calculate similarity scores for all tracks
      const similarityScores = allTracks
        .filter(track => track.id !== args.referenceTrack.id) // Exclude reference track
        .map(track => ({
          ...track,
          similarityScore: calculateTrackSimilarity(
            args.referenceTrack,
            track,
            options
          ),
        }))
        .filter(track => track.similarityScore >= options.minSimilarity)
        .sort((a, b) => b.similarityScore - a.similarityScore)
        .slice(0, options.maxResults);

      // Enhance results with clustering information
      const enhancedResults = similarityScores.map(track => ({
        ...track,
        similarityReasons: generateSimilarityReasons(args.referenceTrack, track),
        clusterInfo: assignTrackCluster(track, args.referenceTrack),
      }));

      return {
        similarTracks: enhancedResults,
        referenceTrack: args.referenceTrack,
        similarityMetrics: {
          totalCandidates: allTracks.length - 1,
          filteredResults: similarityScores.length,
          avgSimilarity: calculateAverageSimilarity(similarityScores),
          options,
        },
        message: `Found ${enhancedResults.length} similar tracks`,
      };

    } catch (error) {
      console.error('Error finding similar tracks:', error);
      throw new ConvexError({
        message: 'Failed to find similar tracks',
        code: 'SIMILARITY_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },
});

/**
 * Analyze and predict user music preferences using ML
 */
export const predictUserPreferences = query({
  args: {
    userId: v.string(),
    context: v.optional(v.object({
      workoutType: v.optional(v.string()),
      timeOfDay: v.optional(v.string()),
      mood: v.optional(v.string()),
    })),
    predictionOptions: v.optional(v.object({
      includeTrendAnalysis: v.optional(v.boolean()),
      includeSeasonality: v.optional(v.boolean()),
      predictionHorizon: v.optional(v.string()), // 'week', 'month', 'quarter'
    })),
  },
  handler: async (ctx, args) => {
    try {
      // Get user's music profiles and historical data
      const profiles = await ctx.db
        .query('musicProfiles')
        .filter(q => q.eq(q.field('userId'), args.userId))
        .collect();

      const recommendations = await ctx.db
        .query('workoutMusicRecommendations')
        .filter(q => q.eq(q.field('userId'), args.userId))
        .order('desc')
        .take(50);

      if (profiles.length === 0 && recommendations.length === 0) {
        return {
          predictions: null,
          confidence: 0,
          message: 'Insufficient data for preference prediction',
        };
      }

      const options = {
        includeTrendAnalysis: true,
        includeSeasonality: false, // Requires more historical data
        predictionHorizon: 'month',
        ...args.predictionOptions
      };

      // Analyze historical preferences
      const historicalAnalysis = analyzeHistoricalPreferences(profiles, recommendations);

      // Generate preference predictions
      const predictions = {
        genres: predictGenrePreferences(historicalAnalysis, args.context),
        audioFeatures: predictAudioFeaturePreferences(historicalAnalysis, args.context),
        artists: predictArtistPreferences(historicalAnalysis),
        workoutContexts: predictWorkoutContextPreferences(recommendations),
        trends: options.includeTrendAnalysis ? analyzeTrends(recommendations) : null,
      };

      // Calculate prediction confidence
      const confidence = calculatePredictionConfidence(
        historicalAnalysis,
        recommendations.length
      );

      // Generate actionable insights
      const insights = generatePreferenceInsights(predictions, confidence);

      return {
        predictions,
        confidence,
        insights,
        metadata: {
          dataPoints: {
            profiles: profiles.length,
            recommendations: recommendations.length,
            totalTracks: historicalAnalysis.totalTracks,
          },
          context: args.context,
          predictionHorizon: options.predictionHorizon,
          analysisDate: Date.now(),
        },
        message: `Generated preference predictions with ${Math.round(confidence * 100)}% confidence`,
      };

    } catch (error) {
      console.error('Error predicting user preferences:', error);
      throw new ConvexError({
        message: 'Failed to predict user preferences',
        code: 'PREFERENCE_PREDICTION_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },
});

/**
 * Optimize playlist for workout progression
 */
export const optimizeWorkoutPlaylist = mutation({
  args: {
    userId: v.string(),
    workoutPlan: v.object({
      phases: v.array(v.object({
        name: v.string(), // 'warmup', 'main', 'cooldown'
        duration: v.number(), // minutes
        targetIntensity: v.number(), // 1-10
        targetBPM: v.optional(v.object({
          min: v.number(),
          max: v.number(),
        })),
      })),
      totalDuration: v.number(),
      workoutType: v.string(),
    }),
    optimizationOptions: v.optional(v.object({
      smoothTransitions: v.optional(v.boolean()),
      energyProgression: v.optional(v.boolean()),
      avoidRepeats: v.optional(v.boolean()),
      maxTracksPerArtist: v.optional(v.number()),
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

      const options = {
        smoothTransitions: true,
        energyProgression: true,
        avoidRepeats: true,
        maxTracksPerArtist: 2,
        ...args.optimizationOptions
      };

      // Collect all available tracks
      const allTracks: any[] = [];
      profiles.forEach(profile => {
        if (profile.topTracks) {
          allTracks.push(...profile.topTracks);
        }
      });

      if (allTracks.length === 0) {
        throw new ConvexError({
          message: 'No tracks available for playlist optimization',
          code: 'NO_TRACKS'
        });
      }

      // Optimize playlist for each workout phase
      const optimizedPhases = await Promise.all(
        args.workoutPlan.phases.map(async (phase, index) => {
          const phaseTracks = await selectTracksForPhase(
            allTracks,
            phase,
            args.workoutPlan.workoutType,
            options,
            index === 0 ? null : args.workoutPlan.phases[index - 1] // Previous phase for transitions
          );

          return {
            ...phase,
            tracks: phaseTracks,
            trackCount: phaseTracks.length,
            avgBPM: calculateAverage(phaseTracks.map(t => t.audioFeatures?.tempo || 120)),
            avgEnergy: calculateAverage(phaseTracks.map(t => t.audioFeatures?.energy || 0.5)),
          };
        })
      );

      // Merge phases into complete playlist
      const completePlaylist = optimizedPhases.flatMap(phase => 
        phase.tracks.map((track: any) => ({
          ...track,
          phase: phase.name,
          phasePosition: track.phasePosition,
        }))
      );

      // Apply global optimizations
      const finalPlaylist = await applyGlobalPlaylistOptimizations(
        completePlaylist,
        options,
        args.workoutPlan
      );

      // Store optimized playlist
      const playlistId = await ctx.db.insert('workoutMusicRecommendations', {
        userId: args.userId,
        profileId: profiles[0]._id,
        providerId: 'ai-optimizer',
        title: `Optimized ${args.workoutPlan.workoutType} Workout`,
        description: `AI-optimized playlist for ${args.workoutPlan.totalDuration} min ${args.workoutPlan.workoutType} workout`,
        workoutTypes: [args.workoutPlan.workoutType],
        intensityRange: {
          min: Math.min(...args.workoutPlan.phases.map(p => p.targetIntensity)),
          max: Math.max(...args.workoutPlan.phases.map(p => p.targetIntensity)),
        },
        recommendedTracks: finalPlaylist,
        audioFeatures: calculatePlaylistAudioFeatures(finalPlaylist),
        relevanceScore: 0.95, // High relevance for optimized playlists
        algorithmVersion: '3.0-optimizer',
        algorithmMetadata: {
          workoutPlan: args.workoutPlan,
          optimizationOptions: options,
          phasesOptimized: optimizedPhases.length,
          totalTracks: finalPlaylist.length,
        },
        generatedAt: Date.now(),
        isActive: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      return {
        success: true,
        playlistId,
        optimizedPlaylist: finalPlaylist,
        phases: optimizedPhases,
        optimization: {
          totalTracks: finalPlaylist.length,
          estimatedDuration: estimatePlaylistDuration(finalPlaylist),
          energyProgression: calculateEnergyProgression(optimizedPhases),
          bpmProgression: calculateBPMProgression(optimizedPhases),
          artistDiversity: calculateArtistDiversity(finalPlaylist),
          transitionQuality: calculateTransitionQuality(finalPlaylist, options.smoothTransitions),
        },
        message: `Optimized ${finalPlaylist.length}-track playlist for ${args.workoutPlan.workoutType} workout`,
      };

    } catch (error) {
      console.error('Error optimizing workout playlist:', error);
      if (error instanceof ConvexError) {
        throw error;
      }
      throw new ConvexError({
        message: 'Failed to optimize workout playlist',
        code: 'PLAYLIST_OPTIMIZATION_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },
});

// ====================================================================================
// MACHINE LEARNING HELPER FUNCTIONS
// ====================================================================================

async function generateContentBasedRecommendations(
  profiles: any[], 
  context: any, 
  preferences: any
): Promise<any[]> {
  const recommendations: any[] = [];
  
  for (const profile of profiles) {
    if (profile.topTracks && profile.processedAudioFeatures) {
      // Find tracks similar to user's listening history
      const userTracks = profile.topTracks;
      const targetFeatures = calculateContextTargetFeatures(context);
      
      const scored = userTracks.map((track: any) => ({
        ...track,
        algorithm: 'content-based',
        confidence: calculateContentBasedScore(track, targetFeatures, preferences),
        providerId: profile.providerId,
      })).filter((track: any) => track.confidence > 0.2);
      
      recommendations.push(...scored);
    }
  }
  
  return recommendations;
}

async function generateCollaborativeFilteringRecommendations(
  ctx: any,
  userId: string,
  context: any,
  preferences: any
): Promise<any[]> {
  // Simplified collaborative filtering - would need user-item matrix in production
  const userRecommendations = await ctx.db
    .query('workoutMusicRecommendations')
    .filter((q: any) => q.eq(q.field('workoutTypes'), [context.workoutType]))
    .take(20);

  const recommendations: any[] = [];
  
  userRecommendations.forEach((session: any) => {
    if (session.userId !== userId && session.recommendedTracks) {
      const tracks = session.recommendedTracks.map((track: any) => ({
        ...track,
        algorithm: 'collaborative',
        confidence: session.relevanceScore || 0.5,
        providerId: session.providerId,
      }));
      recommendations.push(...tracks);
    }
  });
  
  return recommendations;
}

async function generateHybridRecommendations(
  profiles: any[],
  historicalRecommendations: any[],
  context: any,
  preferences: any
): Promise<any[]> {
  const recommendations: any[] = [];
  
  // Combine content-based and historical patterns
  if (historicalRecommendations.length > 0) {
    const patterns = extractPatterns(historicalRecommendations);
    
    profiles.forEach(profile => {
      if (profile.topTracks) {
        const hybridScored = profile.topTracks.map((track: any) => ({
          ...track,
          algorithm: 'hybrid',
          confidence: calculateHybridScore(track, patterns, context, preferences),
          providerId: profile.providerId,
        })).filter((track: any) => track.confidence > 0.3);
        
        recommendations.push(...hybridScored);
      }
    });
  }
  
  return recommendations;
}

async function applyMLRanking(
  recommendations: any[],
  context: any,
  preferences: any,
  historicalData: any[]
): Promise<any[]> {
  return recommendations.map(rec => ({
    ...rec,
    mlScore: calculateMLScore(rec, context, preferences, historicalData),
    rankingFactors: {
      contextMatch: calculateContextMatch(rec, context),
      preferenceAlign: calculatePreferenceAlignment(rec, preferences),
      historicalPerformance: calculateHistoricalPerformance(rec, historicalData),
      audioFeatureScore: calculateAudioFeatureScore(rec, context),
    },
  })).sort((a, b) => b.mlScore - a.mlScore);
}

async function optimizeRecommendationDiversity(
  recommendations: any[],
  preferences: any,
  maxRecommendations: number
): Promise<any[]> {
  const diversityWeight = preferences.diversity || 0.6;
  const noveltyWeight = preferences.novelty || 0.3;
  
  const optimized: any[] = [];
  const usedArtists = new Set();
  const usedGenres = new Set();
  
  for (const rec of recommendations) {
    if (optimized.length >= maxRecommendations) break;
    
    let diversityBonus = 0;
    const artistName = rec.artists?.[0]?.name;
    const genres = rec.genres || [];
    
    // Diversity bonus for new artists/genres
    if (artistName && !usedArtists.has(artistName)) {
      diversityBonus += diversityWeight * 0.3;
      usedArtists.add(artistName);
    }
    
    genres.forEach((genre: string) => {
      if (!usedGenres.has(genre)) {
        diversityBonus += diversityWeight * 0.1;
        usedGenres.add(genre);
      }
    });
    
    // Novelty scoring
    const noveltyScore = calculateNoveltyScore(rec, preferences.recency || 0.4);
    
    optimized.push({
      ...rec,
      optimizedScore: rec.mlScore + diversityBonus + (noveltyScore * noveltyWeight),
      diversityBonus,
      noveltyScore,
    });
  }
  
  return optimized.sort((a, b) => b.optimizedScore - a.optimizedScore);
}

// Utility functions for ML algorithms
function calculateContentBasedScore(track: any, targetFeatures: any, preferences: any): number {
  if (!track.audioFeatures) return 0.3; // Default score without features
  
  const features = track.audioFeatures;
  let score = 0;
  
  // Audio feature matching
  score += (1 - Math.abs(features.energy - targetFeatures.energy)) * 0.4;
  score += (1 - Math.abs(features.tempo - targetFeatures.tempo) / 200) * 0.3;
  score += (1 - Math.abs(features.valence - targetFeatures.valence)) * 0.2;
  score += features.danceability * 0.1;
  
  // Apply preferences
  if (preferences.explicitContent === false && track.explicit) {
    score *= 0.5;
  }
  
  return Math.max(0, Math.min(1, score));
}

function calculateHybridScore(track: any, patterns: any, context: any, preferences: any): number {
  let score = 0.4; // Base score
  
  // Pattern matching
  if (patterns.workoutTypes?.[context.workoutType]) {
    score += patterns.workoutTypes[context.workoutType] * 0.3;
  }
  
  // Audio features
  if (track.audioFeatures && patterns.avgAudioFeatures) {
    const featureMatch = 1 - Math.abs(
      track.audioFeatures.energy - patterns.avgAudioFeatures.energy
    );
    score += featureMatch * 0.3;
  }
  
  return Math.max(0, Math.min(1, score));
}

function calculateMLScore(rec: any, context: any, preferences: any, historicalData: any[]): number {
  const weights = {
    confidence: 0.3,
    contextMatch: 0.25,
    preferences: 0.2,
    historical: 0.15,
    audioFeatures: 0.1,
  };
  
  return (
    (rec.confidence || 0.5) * weights.confidence +
    calculateContextMatch(rec, context) * weights.contextMatch +
    calculatePreferenceAlignment(rec, preferences) * weights.preferences +
    calculateHistoricalPerformance(rec, historicalData) * weights.historical +
    calculateAudioFeatureScore(rec, context) * weights.audioFeatures
  );
}

function calculateContextMatch(rec: any, context: any): number {
  let match = 0.5; // Base match
  
  if (rec.audioFeatures) {
    const targetEnergy = getTargetEnergyForContext(context);
    match += (1 - Math.abs(rec.audioFeatures.energy - targetEnergy)) * 0.5;
  }
  
  return Math.max(0, Math.min(1, match));
}

function calculatePreferenceAlignment(rec: any, preferences: any): number {
  let alignment = 0.5;
  
  if (preferences.genres?.length > 0 && rec.genres) {
    const genreOverlap = preferences.genres.some((g: string) => 
      rec.genres.includes(g)
    );
    alignment += genreOverlap ? 0.3 : -0.1;
  }
  
  if (preferences.explicitContent === false && rec.explicit) {
    alignment -= 0.2;
  }
  
  return Math.max(0, Math.min(1, alignment));
}

function calculateHistoricalPerformance(rec: any, historicalData: any[]): number {
  // Look for similar tracks in historical data
  const similarTracks = historicalData.flatMap((session: any) => 
    session.recommendedTracks || []
  ).filter((track: any) => 
    track.id === rec.id || 
    track.artists?.[0]?.name === rec.artists?.[0]?.name
  );
  
  if (similarTracks.length === 0) return 0.5; // No historical data
  
  const avgRating = similarTracks.reduce((sum: number, track: any) => 
    sum + (track.feedback?.rating || 3), 0
  ) / similarTracks.length;
  
  return avgRating / 5; // Normalize to 0-1
}

function calculateAudioFeatureScore(rec: any, context: any): number {
  if (!rec.audioFeatures) return 0.5;
  
  const target = getTargetAudioFeaturesForContext(context);
  let score = 0;
  
  Object.keys(target).forEach(feature => {
    const diff = Math.abs(rec.audioFeatures[feature] - target[feature]);
    score += 1 - diff;
  });
  
  return score / Object.keys(target).length;
}

// Additional helper functions
function calculateTrackSimilarity(track1: any, track2: any, options: any): number {
  let similarity = 0;
  let totalWeight = 0;
  
  // Audio features similarity
  if (track1.audioFeatures && track2.audioFeatures && options.audioFeatureWeight > 0) {
    const audioSim = calculateAudioFeatureSimilarity(track1.audioFeatures, track2.audioFeatures);
    similarity += audioSim * options.audioFeatureWeight;
    totalWeight += options.audioFeatureWeight;
  }
  
  // Genre similarity
  if (track1.genres && track2.genres && options.genreWeight > 0) {
    const genreSim = calculateGenreSimilarity(track1.genres, track2.genres);
    similarity += genreSim * options.genreWeight;
    totalWeight += options.genreWeight;
  }
  
  // Artist similarity
  if (track1.artists && track2.artists && options.artistWeight > 0) {
    const artistSim = calculateArtistSimilarity(track1.artists, track2.artists);
    similarity += artistSim * options.artistWeight;
    totalWeight += options.artistWeight;
  }
  
  return totalWeight > 0 ? similarity / totalWeight : 0;
}

function calculateAudioFeatureSimilarity(features1: any, features2: any): number {
  const weights = {
    energy: 0.3,
    tempo: 0.25,
    valence: 0.2,
    danceability: 0.15,
    acousticness: 0.1,
  };
  
  let similarity = 0;
  Object.keys(weights).forEach(feature => {
    if (features1[feature] !== undefined && features2[feature] !== undefined) {
      const diff = Math.abs(features1[feature] - features2[feature]);
      const normalizedDiff = feature === 'tempo' ? diff / 200 : diff;
      similarity += (1 - normalizedDiff) * weights[feature as keyof typeof weights];
    }
  });
  
  return similarity;
}

function generateSimilarityReasons(ref: any, track: any): string[] {
  const reasons = [];
  
  if (ref.audioFeatures && track.audioFeatures) {
    const energyDiff = Math.abs(ref.audioFeatures.energy - track.audioFeatures.energy);
    if (energyDiff < 0.2) reasons.push('Similar energy levels');
    
    const tempoDiff = Math.abs(ref.audioFeatures.tempo - track.audioFeatures.tempo);
    if (tempoDiff < 20) reasons.push('Similar tempo');
  }
  
  if (ref.genres && track.genres) {
    const commonGenres = ref.genres.filter((g: string) => track.genres.includes(g));
    if (commonGenres.length > 0) reasons.push(`Shared genres: ${commonGenres.join(', ')}`);
  }
  
  return reasons;
}

// Context and feature calculation helpers
function calculateContextTargetFeatures(context: any): any {
  const targets = {
    cardio: { energy: 0.8, tempo: 130, valence: 0.7 },
    strength: { energy: 0.7, tempo: 115, valence: 0.6 },
    yoga: { energy: 0.3, tempo: 75, valence: 0.6 },
    hiit: { energy: 0.9, tempo: 160, valence: 0.8 },
    general: { energy: 0.6, tempo: 120, valence: 0.6 },
  };
  
  return targets[context.workoutType as keyof typeof targets] || targets.general;
}

function getTargetEnergyForContext(context: any): number {
  const energyMap = { cardio: 0.8, strength: 0.7, yoga: 0.3, hiit: 0.9 };
  return energyMap[context.workoutType as keyof typeof energyMap] || 0.6;
}

function getTargetAudioFeaturesForContext(context: any): any {
  return calculateContextTargetFeatures(context);
}

function extractPatterns(recommendations: any[]): any {
  const patterns: any = {
    workoutTypes: {},
    avgAudioFeatures: { energy: 0, tempo: 0, valence: 0 },
  };
  
  let totalFeatures = 0;
  
  recommendations.forEach(session => {
    if (session.workoutTypes?.[0]) {
      const type = session.workoutTypes[0];
      patterns.workoutTypes[type] = (patterns.workoutTypes[type] || 0) + 0.1;
    }
    
    if (session.audioFeatures) {
      patterns.avgAudioFeatures.energy += session.audioFeatures.energy || 0;
      patterns.avgAudioFeatures.tempo += session.audioFeatures.tempo || 0;
      patterns.avgAudioFeatures.valence += session.audioFeatures.valence || 0;
      totalFeatures++;
    }
  });
  
  if (totalFeatures > 0) {
    patterns.avgAudioFeatures.energy /= totalFeatures;
    patterns.avgAudioFeatures.tempo /= totalFeatures;
    patterns.avgAudioFeatures.valence /= totalFeatures;
  }
  
  return patterns;
}

// Feedback learning functions
function calculateFeedbackWeight(feedback: any): number {
  let weight = 0.5; // Base weight
  
  if (feedback.listened) weight += 0.2;
  if (feedback.completed) weight += 0.2;
  if (feedback.rating) weight += (feedback.rating - 3) * 0.1; // Rating impact
  
  return Math.max(0.1, Math.min(1, weight));
}

function adjustConfidenceFromFeedback(currentConfidence: number, feedback: any): number {
  const adjustment = (feedback.rating - 3) * 0.1; // -0.2 to +0.2
  return Math.max(0, Math.min(1, currentConfidence + adjustment));
}

async function extractLearningPatterns(feedback: any, recommendation: any): Promise<any> {
  return {
    ratingPattern: feedback.rating > 3 ? 'positive' : 'negative',
    engagementPattern: feedback.completed ? 'high' : 'low',
    contextAlignment: feedback.context ? 'provided' : 'none',
    audioFeaturePreferences: recommendation.audioFeatures ? {
      energy: recommendation.audioFeatures.energy,
      tempo: recommendation.audioFeatures.tempo,
      rating: feedback.rating,
    } : null,
  };
}

async function updateUserPreferencesFromFeedback(
  ctx: any,
  userId: string,
  feedback: any,
  recommendation: any,
  patterns: any
): Promise<void> {
  // This would update a user preferences table/document
  // For now, we'll just log the learning
  console.log('Learning from feedback:', {
    userId,
    rating: feedback.rating,
    patterns,
  });
}

async function storeLearningData(ctx: any, learningData: any): Promise<void> {
  // Store in a learning/analytics table for future ML improvements
  // This would be implemented with a proper learning data schema
  console.log('Stored learning data:', learningData.timestamp);
}

// More utility functions
function generateRecommendationId(): string {
  return `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function calculateTargetAudioFeatures(context: any): any {
  return calculateContextTargetFeatures(context);
}

function calculateAverageConfidence(recommendations: any[]): number {
  if (recommendations.length === 0) return 0;
  return recommendations.reduce((sum, rec) => sum + (rec.confidence || 0), 0) / recommendations.length;
}

function calculateAverage(numbers: number[]): number {
  return numbers.length > 0 ? numbers.reduce((a, b) => a + b) / numbers.length : 0;
}

function generateRecommendationInsights(recommendations: any[], context: any): string[] {
  const insights = [];
  
  const avgEnergy = calculateAverage(
    recommendations.map(r => r.audioFeatures?.energy || 0.5)
  );
  
  if (avgEnergy > 0.7) {
    insights.push('High-energy tracks selected for intense workout');
  }
  
  const uniqueArtists = new Set(
    recommendations.map(r => r.artists?.[0]?.name).filter(Boolean)
  );
  
  insights.push(`${uniqueArtists.size} unique artists for variety`);
  
  return insights;
}

// Prediction and analysis functions
function analyzeHistoricalPreferences(profiles: any[], recommendations: any[]): any {
  const analysis = {
    totalTracks: 0,
    genreDistribution: {} as Record<string, number>,
    avgAudioFeatures: { energy: 0, tempo: 0, valence: 0 },
    workoutTypes: {} as Record<string, number>,
  };
  
  profiles.forEach(profile => {
    if (profile.topTracks) {
      analysis.totalTracks += profile.topTracks.length;
    }
  });
  
  recommendations.forEach(session => {
    if (session.workoutTypes?.[0]) {
      const type = session.workoutTypes[0];
      analysis.workoutTypes[type] = (analysis.workoutTypes[type] || 0) + 1;
    }
  });
  
  return analysis;
}

function predictGenrePreferences(analysis: any, context?: any): any {
  return {
    predicted: ['pop', 'rock', 'electronic'], // Simplified
    confidence: 0.7,
  };
}

function predictAudioFeaturePreferences(analysis: any, context?: any): any {
  return {
    energy: { predicted: 0.7, confidence: 0.8 },
    tempo: { predicted: 120, confidence: 0.6 },
    valence: { predicted: 0.6, confidence: 0.5 },
  };
}

function predictArtistPreferences(analysis: any): any {
  return {
    predicted: ['Various Artists'],
    confidence: 0.5,
  };
}

function predictWorkoutContextPreferences(recommendations: any[]): any {
  const contextCounts: Record<string, number> = {};
  
  recommendations.forEach(session => {
    if (session.workoutTypes?.[0]) {
      const type = session.workoutTypes[0];
      contextCounts[type] = (contextCounts[type] || 0) + 1;
    }
  });
  
  return {
    predicted: Object.keys(contextCounts).sort((a, b) => contextCounts[b] - contextCounts[a]),
    distribution: contextCounts,
  };
}

function analyzeTrends(recommendations: any[]): any {
  return {
    trend: 'stable',
    confidence: 0.5,
  };
}

function calculatePredictionConfidence(analysis: any, dataPoints: number): number {
  let confidence = Math.min(0.9, dataPoints / 100); // More data = higher confidence
  
  if (analysis.totalTracks > 50) confidence += 0.1;
  if (Object.keys(analysis.workoutTypes).length > 2) confidence += 0.1;
  
  return Math.max(0.1, confidence);
}

function generatePreferenceInsights(predictions: any, confidence: number): string[] {
  const insights = [];
  
  if (confidence > 0.7) {
    insights.push('High confidence in preference predictions');
  }
  
  if (predictions.genres?.predicted?.length > 0) {
    insights.push(`Likely to enjoy ${predictions.genres.predicted[0]} music`);
  }
  
  return insights;
}

// Playlist optimization functions
async function selectTracksForPhase(
  allTracks: any[],
  phase: any,
  workoutType: string,
  options: any,
  previousPhase?: any
): Promise<any[]> {
  const targetBPM = phase.targetBPM || { min: 100, max: 140 };
  const phaseDuration = phase.duration;
  const estimatedTracksNeeded = Math.ceil(phaseDuration / 3.5); // ~3.5 min per track
  
  // Filter tracks suitable for this phase
  let suitableTracks = allTracks.filter(track => {
    if (!track.audioFeatures) return false;
    
    const tempo = track.audioFeatures.tempo;
    const energy = track.audioFeatures.energy;
    
    // BPM matching
    if (tempo < targetBPM.min || tempo > targetBPM.max) return false;
    
    // Energy matching for phase intensity
    const targetEnergy = phase.targetIntensity / 10;
    if (Math.abs(energy - targetEnergy) > 0.4) return false;
    
    return true;
  });
  
  if (suitableTracks.length === 0) {
    // Fallback to less strict filtering
    suitableTracks = allTracks.filter(track => track.audioFeatures?.tempo > 80);
  }
  
  // Score and sort tracks for this phase
  const scoredTracks = suitableTracks.map((track, index) => ({
    ...track,
    phaseScore: calculatePhaseScore(track, phase, previousPhase),
    phasePosition: index,
  })).sort((a, b) => b.phaseScore - a.phaseScore);
  
  // Apply diversity constraints
  const selectedTracks = [];
  const usedArtists = new Set();
  
  for (const track of scoredTracks) {
    if (selectedTracks.length >= estimatedTracksNeeded) break;
    
    const artistName = track.artists?.[0]?.name;
    if (options.avoidRepeats && artistName && usedArtists.has(artistName)) {
      if (usedArtists.size < options.maxTracksPerArtist) continue;
    }
    
    selectedTracks.push(track);
    if (artistName) usedArtists.add(artistName);
  }
  
  return selectedTracks;
}

function calculatePhaseScore(track: any, phase: any, previousPhase?: any): number {
  let score = 0.5; // Base score
  
  if (track.audioFeatures) {
    const features = track.audioFeatures;
    
    // Intensity matching
    const targetIntensity = phase.targetIntensity / 10;
    score += (1 - Math.abs(features.energy - targetIntensity)) * 0.4;
    
    // BPM matching
    const targetBPM = phase.targetBPM ? (phase.targetBPM.min + phase.targetBPM.max) / 2 : 120;
    score += (1 - Math.abs(features.tempo - targetBPM) / 100) * 0.3;
    
    // Phase-specific preferences
    if (phase.name === 'warmup') {
      score += features.valence * 0.2; // Positive vibes for warmup
    } else if (phase.name === 'main') {
      score += features.energy * 0.2; // High energy for main phase
    } else if (phase.name === 'cooldown') {
      score += (1 - features.energy) * 0.2; // Lower energy for cooldown
    }
    
    // Smooth transitions
    if (previousPhase && previousPhase.targetBPM) {
      const prevTargetBPM = (previousPhase.targetBPM.min + previousPhase.targetBPM.max) / 2;
      const bpmTransition = Math.abs(features.tempo - prevTargetBPM);
      score += (1 - bpmTransition / 50) * 0.1; // Bonus for smooth BPM transitions
    }
  }
  
  return Math.max(0, Math.min(1, score));
}

async function applyGlobalPlaylistOptimizations(
  playlist: any[],
  options: any,
  workoutPlan: any
): Promise<any[]> {
  let optimizedPlaylist = [...playlist];
  
  // Apply smooth transitions between phases
  if (options.smoothTransitions) {
    optimizedPlaylist = await smoothPhaseTransitions(optimizedPlaylist);
  }
  
  // Apply energy progression optimization
  if (options.energyProgression) {
    optimizedPlaylist = await optimizeEnergyProgression(optimizedPlaylist, workoutPlan);
  }
  
  return optimizedPlaylist;
}

async function smoothPhaseTransitions(playlist: any[]): Promise<any[]> {
  // Sort tracks within phase boundaries to create smoother transitions
  const phases = groupTracksByPhase(playlist);
  const smoothedPlaylist = [];
  
  for (const phase of Object.values(phases) as any[]) {
    const sortedPhase = phase.sort((a: any, b: any) => {
      if (!a.audioFeatures || !b.audioFeatures) return 0;
      return a.audioFeatures.tempo - b.audioFeatures.tempo; // Sort by tempo
    });
    smoothedPlaylist.push(...sortedPhase);
  }
  
  return smoothedPlaylist;
}

async function optimizeEnergyProgression(playlist: any[], workoutPlan: any): Promise<any[]> {
  // Ensure energy progression matches workout plan phases
  return playlist; // Simplified - would implement energy curve optimization
}

function groupTracksByPhase(playlist: any[]): Record<string, any[]> {
  const phases: Record<string, any[]> = {};
  
  playlist.forEach(track => {
    const phase = track.phase || 'main';
    if (!phases[phase]) phases[phase] = [];
    phases[phase].push(track);
  });
  
  return phases;
}

// Calculation utilities
function calculatePlaylistAudioFeatures(playlist: any[]): any {
  const tracks = playlist.filter(track => track.audioFeatures);
  if (tracks.length === 0) return null;
  
  const features = ['energy', 'tempo', 'valence', 'danceability'];
  const avgFeatures: any = {};
  
  features.forEach(feature => {
    avgFeatures[feature] = calculateAverage(
      tracks.map(track => track.audioFeatures[feature] || 0)
    );
  });
  
  return avgFeatures;
}

function estimatePlaylistDuration(playlist: any[]): number {
  // Estimate ~3.5 minutes per track (average song length)
  return playlist.length * 3.5;
}

function calculateEnergyProgression(phases: any[]): number[] {
  return phases.map(phase => phase.avgEnergy || 0.5);
}

function calculateBPMProgression(phases: any[]): number[] {
  return phases.map(phase => phase.avgBPM || 120);
}

function calculateArtistDiversity(playlist: any[]): number {
  const uniqueArtists = new Set(
    playlist.map(track => track.artists?.[0]?.name).filter(Boolean)
  );
  return uniqueArtists.size / Math.max(1, playlist.length);
}

function calculateTransitionQuality(playlist: any[], smoothTransitions: boolean): number {
  if (!smoothTransitions || playlist.length < 2) return 1;
  
  let totalTransitionScore = 0;
  let transitions = 0;
  
  for (let i = 1; i < playlist.length; i++) {
    const prev = playlist[i - 1];
    const curr = playlist[i];
    
    if (prev.audioFeatures && curr.audioFeatures) {
      const tempoDiff = Math.abs(prev.audioFeatures.tempo - curr.audioFeatures.tempo);
      const transitionScore = 1 - (tempoDiff / 50); // Normalize to 0-1
      totalTransitionScore += Math.max(0, transitionScore);
      transitions++;
    }
  }
  
  return transitions > 0 ? totalTransitionScore / transitions : 1;
}

// Additional similarity functions
function calculateGenreSimilarity(genres1: string[], genres2: string[]): number {
  if (!genres1?.length || !genres2?.length) return 0;
  
  const intersection = genres1.filter(g => genres2.includes(g));
  const union = [...new Set([...genres1, ...genres2])];
  
  return intersection.length / union.length; // Jaccard similarity
}

function calculateArtistSimilarity(artists1: any[], artists2: any[]): number {
  if (!artists1?.length || !artists2?.length) return 0;
  
  const names1 = artists1.map(a => a.name?.toLowerCase()).filter(Boolean);
  const names2 = artists2.map(a => a.name?.toLowerCase()).filter(Boolean);
  
  const intersection = names1.filter(name => names2.includes(name));
  return intersection.length > 0 ? 1 : 0; // Binary similarity for artists
}

function assignTrackCluster(track: any, referenceTrack: any): any {
  // Simplified clustering based on audio features
  if (!track.audioFeatures || !referenceTrack.audioFeatures) {
    return { cluster: 'unknown', confidence: 0 };
  }
  
  const energyDiff = Math.abs(track.audioFeatures.energy - referenceTrack.audioFeatures.energy);
  const tempoDiff = Math.abs(track.audioFeatures.tempo - referenceTrack.audioFeatures.tempo);
  
  if (energyDiff < 0.3 && tempoDiff < 30) {
    return { cluster: 'similar', confidence: 0.8 };
  } else if (energyDiff < 0.5 && tempoDiff < 50) {
    return { cluster: 'related', confidence: 0.6 };
  } else {
    return { cluster: 'different', confidence: 0.4 };
  }
}

function calculateAverageSimilarity(tracks: any[]): number {
  const similarities = tracks.map(track => track.similarityScore).filter(Boolean);
  return calculateAverage(similarities);
}

function calculateNoveltyScore(track: any, recencyPreference: number): number {
  // Simplified novelty scoring - would use release date, popularity, user history
  const baseNovelty = 0.5;
  
  // Bonus for less popular tracks (if popularity data available)
  if (track.popularity && track.popularity < 50) {
    return Math.min(1, baseNovelty + (recencyPreference * 0.3));
  }
  
  return baseNovelty;
}