import { describe, test, expect, beforeEach } from 'vitest';
import { ConvexTestingHelper } from 'convex/testing';
import { api } from '../../../convex/_generated/api.js';
import { Id } from '../../../convex/_generated/dataModel.js';

describe('Music Discovery Integration Tests', () => {
  let t: ConvexTestingHelper;
  let userId: Id<"users">;
  let musicProfileId: Id<"musicProfiles">;

  beforeEach(async () => {
    t = new ConvexTestingHelper();
    
    // Create test user
    userId = await t.mutation(api.users.create, {
      email: "test@example.com",
      name: "Test User"
    });

    // Create comprehensive music profile
    musicProfileId = await t.mutation(api.musicProfiles.create, {
      userId,
      topGenres: [
        {
          id: "electronic",
          name: "Electronic",
          confidence: 0.9,
          workoutSuitability: 0.95,
          popularity: 85,
          source: "spotify",
          lastUpdated: Date.now(),
          cardioScore: 0.95,
          strengthScore: 0.8,
          yogaScore: 0.3,
          hiitScore: 0.9
        },
        {
          id: "rock",
          name: "Rock",
          confidence: 0.8,
          workoutSuitability: 0.85,
          popularity: 90,
          source: "spotify",
          lastUpdated: Date.now(),
          cardioScore: 0.7,
          strengthScore: 0.95,
          yogaScore: 0.2,
          hiitScore: 0.85
        },
        {
          id: "pop",
          name: "Pop",
          confidence: 0.7,
          workoutSuitability: 0.8,
          popularity: 95,
          source: "spotify",
          lastUpdated: Date.now(),
          cardioScore: 0.8,
          strengthScore: 0.6,
          yogaScore: 0.5,
          hiitScore: 0.75
        }
      ],
      workoutPreferences: {
        preferredGenres: ["electronic", "rock"],
        avoidedGenres: ["jazz", "classical"],
        energyRange: { min: 0.6, max: 1.0, preferred: 0.8 },
        tempoRange: { min: 120, max: 180, preferred: 140 },
        valenceRange: { min: 0.4, max: 1.0, preferred: 0.7 },
        explicitContent: true,
        instrumentalOnly: false,
        maxTrackLength: 300,
        fadeInOut: true,
        gapless: false
      },
      listeningStats: {
        totalTracks: 1500,
        totalPlaytime: 75000, // 75,000 minutes
        averageTrackLength: 210,
        mostActiveHour: 18,
        mostActiveDay: 2, // Tuesday
        diversityScore: 0.8
      },
      primaryProvider: "spotify",
      connectedProviders: ["spotify", "apple_music"]
    });
  });

  describe('Trending Music Discovery', () => {
    test('should generate trending tracks discovery', async () => {
      const result = await t.mutation(api.musicDiscovery.generateTrendingDiscoveries, {
        userId,
        category: "tracks",
        timeWindow: "24h",
        limit: 15
      });

      expect(result.discoveryId).toBeDefined();
      expect(result.items).toHaveLength(15);
      expect(result.metadata.algorithm).toBe("cross_platform");
      expect(result.metadata.timeWindow).toBe("24h");
      expect(result.metadata.itemCount).toBe(15);

      // Verify track structure
      const firstTrack = result.items[0];
      expect(firstTrack).toHaveProperty("id");
      expect(firstTrack).toHaveProperty("name");
      expect(firstTrack).toHaveProperty("artist");
      expect(firstTrack).toHaveProperty("imageUrl");
      expect(firstTrack).toHaveProperty("previewUrl");
      expect(firstTrack).toHaveProperty("externalUrls");
      expect(firstTrack).toHaveProperty("score");
      expect(firstTrack).toHaveProperty("reason");
      expect(firstTrack).toHaveProperty("source");
      expect(firstTrack.score).toBeGreaterThan(0);
      expect(firstTrack.score).toBeLessThanOrEqual(1);
    });

    test('should generate trending artists discovery', async () => {
      const result = await t.mutation(api.musicDiscovery.generateTrendingDiscoveries, {
        userId,
        category: "artists",
        timeWindow: "7d",
        limit: 10
      });

      expect(result.discoveryId).toBeDefined();
      expect(result.items).toHaveLength(10);
      expect(result.metadata.timeWindow).toBe("7d");

      const firstArtist = result.items[0];
      expect(firstArtist).toHaveProperty("id");
      expect(firstArtist).toHaveProperty("name");
      expect(firstArtist).toHaveProperty("imageUrl");
      expect(firstArtist).toHaveProperty("externalUrls");
      expect(firstArtist.reason).toContain("workout");
    });

    test('should generate trending albums and playlists', async () => {
      const albumsResult = await t.mutation(api.musicDiscovery.generateTrendingDiscoveries, {
        userId,
        category: "albums",
        limit: 8
      });

      expect(albumsResult.items).toHaveLength(8);
      expect(albumsResult.items[0]).toHaveProperty("artist");

      const playlistsResult = await t.mutation(api.musicDiscovery.generateTrendingDiscoveries, {
        userId,
        category: "playlists",
        limit: 5
      });

      expect(playlistsResult.items).toHaveLength(5);
      expect(playlistsResult.items[0].reason).toContain("fitness");
    });

    test('should store discovery with proper metadata', async () => {
      const result = await t.mutation(api.musicDiscovery.generateTrendingDiscoveries, {
        userId,
        category: "tracks",
        limit: 20
      });

      // Retrieve stored discovery
      const discoveries = await t.query(api.musicDiscovery.getUserDiscoveries, {
        userId,
        discoveryType: "trending",
        limit: 5
      });

      expect(discoveries).toHaveLength(1);
      const discovery = discoveries[0];
      
      expect(discovery.discoveryType).toBe("trending");
      expect(discovery.category).toBe("tracks");
      expect(discovery.items).toHaveLength(20);
      expect(discovery.metadata.algorithm).toBe("cross_platform");
      expect(discovery.metadata.confidence).toBeGreaterThan(0);
      expect(discovery.metadata.diversity).toBeGreaterThan(0);
      expect(discovery.status).toBe("active");
      expect(discovery.expiresAt).toBeGreaterThan(Date.now());
    });
  });

  describe('Personalized Music Suggestions', () => {
    test('should generate personalized track suggestions', async () => {
      const result = await t.mutation(api.musicDiscovery.generatePersonalizedSuggestions, {
        userId,
        category: "tracks",
        workoutType: "cardio",
        mood: "energetic",
        limit: 12
      });

      expect(result.discoveryId).toBeDefined();
      expect(result.suggestions).toHaveLength(12);
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.reasoning).toBeInstanceOf(Array);
      expect(result.reasoning.length).toBeGreaterThan(0);

      // Verify suggestions match user preferences
      const firstSuggestion = result.suggestions[0];
      expect(firstSuggestion.name).toContain("Electronic"); // Should match top genre
      expect(firstSuggestion.reason).toContain("Electronic"); // Should reference user's preference
      expect(firstSuggestion.score).toBeGreaterThan(0.7); // High confidence for top genre
    });

    test('should generate personalized artist suggestions', async () => {
      const result = await t.mutation(api.musicDiscovery.generatePersonalizedSuggestions, {
        userId,
        category: "artists",
        limit: 8
      });

      expect(result.suggestions).toHaveLength(8);
      expect(result.confidence).toBeGreaterThan(0);
      
      const suggestion = result.suggestions[0];
      expect(suggestion.reason).toContain("Similar"); // Should reference similarity
      expect(suggestion.source).toBe("collaborative_filtering");
    });

    test('should consider workout context in suggestions', async () => {
      const strengthResult = await t.mutation(api.musicDiscovery.generatePersonalizedSuggestions, {
        userId,
        category: "tracks",
        workoutType: "strength",
        limit: 10
      });

      const cardioResult = await t.mutation(api.musicDiscovery.generatePersonalizedSuggestions, {
        userId,
        category: "tracks", 
        workoutType: "cardio",
        limit: 10
      });

      // Different workout types should produce different suggestions
      // (In a real implementation, this would be more sophisticated)
      expect(strengthResult.suggestions).toHaveLength(10);
      expect(cardioResult.suggestions).toHaveLength(10);
      expect(strengthResult.discoveryId).not.toBe(cardioResult.discoveryId);
    });

    test('should handle user without music profile gracefully', async () => {
      // Create user without music profile
      const newUserId = await t.mutation(api.users.create, {
        email: "newuser@example.com",
        name: "New User"
      });

      await expect(
        t.mutation(api.musicDiscovery.generatePersonalizedSuggestions, {
          userId: newUserId,
          category: "tracks"
        })
      ).rejects.toThrow("User music profile not found");
    });

    test('should store personalized discovery with user context', async () => {
      await t.mutation(api.musicDiscovery.generatePersonalizedSuggestions, {
        userId,
        category: "tracks",
        workoutType: "hiit",
        mood: "aggressive"
      });

      const discoveries = await t.query(api.musicDiscovery.getUserDiscoveries, {
        userId,
        discoveryType: "personalized"
      });

      expect(discoveries).toHaveLength(1);
      const discovery = discoveries[0];
      
      expect(discovery.userContext.workoutType).toBe("hiit");
      expect(discovery.userContext.mood).toBe("aggressive");
      expect(discovery.metadata.algorithm).toBe("collaborative_filtering");
    });
  });

  describe('Genre Exploration', () => {
    test('should generate shallow genre exploration', async () => {
      const result = await t.mutation(api.musicDiscovery.generateGenreExploration, {
        userId,
        targetGenre: "ambient",
        explorationDepth: "shallow"
      });

      expect(result.discoveryId).toBeDefined();
      expect(result.genre).toBe("ambient");
      expect(result.explorationDepth).toBe("shallow");
      expect(result.items).toHaveLength(15); // Shallow = 15 items
      expect(result.learningOpportunities).toBeInstanceOf(Array);
      expect(result.learningOpportunities.length).toBeGreaterThan(0);

      // Verify items are themed for the genre
      const firstItem = result.items[0];
      expect(firstItem.name).toContain("ambient");
      expect(firstItem.reason).toContain("Explore the ambient genre");
    });

    test('should generate deep genre exploration', async () => {
      const result = await t.mutation(api.musicDiscovery.generateGenreExploration, {
        userId,
        targetGenre: "synthwave",
        explorationDepth: "deep"
      });

      expect(result.items).toHaveLength(25); // Deep = 25 items
      expect(result.genre).toBe("synthwave");
      expect(result.explorationDepth).toBe("deep");
    });

    test('should auto-select exploration genre when not specified', async () => {
      const result = await t.mutation(api.musicDiscovery.generateGenreExploration, {
        userId
        // No targetGenre specified
      });

      expect(result.genre).toBeDefined();
      expect(result.genre).not.toBe("electronic"); // Should not be user's top genre
      expect(result.genre).not.toBe("rock");
      expect(result.items.length).toBeGreaterThan(0);
    });

    test('should store exploration discovery with proper metadata', async () => {
      await t.mutation(api.musicDiscovery.generateGenreExploration, {
        userId,
        targetGenre: "lo-fi"
      });

      const discoveries = await t.query(api.musicDiscovery.getUserDiscoveries, {
        userId,
        discoveryType: "genre_exploration"
      });

      expect(discoveries).toHaveLength(1);
      const discovery = discoveries[0];
      
      expect(discovery.category).toBe("tracks");
      expect(discovery.metadata.algorithm).toBe("genre_expansion");
      expect(discovery.metadata.diversity).toBeGreaterThan(0.5); // Should be reasonably diverse
      expect(discovery.expiresAt).toBeGreaterThan(Date.now() + 24 * 60 * 60 * 1000); // 48 hours
    });
  });

  describe('Discovery Interaction Tracking', () => {
    let discoveryId: Id<"musicDiscovery">;

    beforeEach(async () => {
      const result = await t.mutation(api.musicDiscovery.generateTrendingDiscoveries, {
        userId,
        category: "tracks",
        limit: 10
      });
      discoveryId = result.discoveryId;
    });

    test('should record view interactions', async () => {
      const result = await t.mutation(api.musicDiscovery.recordDiscoveryInteraction, {
        discoveryId,
        interactionType: "view"
      });

      expect(result.success).toBe(true);
      expect(result.updatedEngagement.views).toBe(1);

      // Record multiple views
      await t.mutation(api.musicDiscovery.recordDiscoveryInteraction, {
        discoveryId,
        interactionType: "view"
      });

      const discoveries = await t.query(api.musicDiscovery.getUserDiscoveries, {
        userId,
        limit: 1
      });

      expect(discoveries[0].engagement.views).toBe(2);
      expect(discoveries[0].engagementRate).toBeGreaterThan(0);
    });

    test('should record play interactions with duration', async () => {
      await t.mutation(api.musicDiscovery.recordDiscoveryInteraction, {
        discoveryId,
        interactionType: "play",
        itemId: "track_1",
        duration: 180 // 3 minutes
      });

      const discoveries = await t.query(api.musicDiscovery.getUserDiscoveries, {
        userId,
        limit: 1
      });

      const discovery = discoveries[0];
      expect(discovery.engagement.plays).toBe(1);
      expect(discovery.engagement.completionRate).toBeGreaterThan(0);
      expect(discovery.engagement.completionRate).toBeLessThanOrEqual(1);
    });

    test('should record various interaction types', async () => {
      const interactions = ["view", "click", "play", "save", "share"];
      
      for (const interactionType of interactions) {
        await t.mutation(api.musicDiscovery.recordDiscoveryInteraction, {
          discoveryId,
          interactionType,
          itemId: `item_${interactionType}`,
          duration: interactionType === "play" ? 120 : undefined
        });
      }

      const discoveries = await t.query(api.musicDiscovery.getUserDiscoveries, {
        userId,
        limit: 1
      });

      const engagement = discoveries[0].engagement;
      expect(engagement.views).toBe(1);
      expect(engagement.clicks).toBe(1);
      expect(engagement.plays).toBe(1);
      expect(engagement.saves).toBe(1);
      expect(engagement.shares).toBe(1);
    });
  });

  describe('Discovery Feedback System', () => {
    let discoveryId: Id<"musicDiscovery">;

    beforeEach(async () => {
      const result = await t.mutation(api.musicDiscovery.generatePersonalizedSuggestions, {
        userId,
        category: "tracks",
        limit: 5
      });
      discoveryId = result.discoveryId;
    });

    test('should submit like and dislike feedback', async () => {
      // Submit like
      const likeResult = await t.mutation(api.musicDiscovery.submitDiscoveryFeedback, {
        discoveryId,
        feedbackType: "like"
      });

      expect(likeResult.success).toBe(true);
      expect(likeResult.updatedFeedback.likes).toBe(1);

      // Submit dislike
      await t.mutation(api.musicDiscovery.submitDiscoveryFeedback, {
        discoveryId,
        feedbackType: "dislike"
      });

      const discoveries = await t.query(api.musicDiscovery.getUserDiscoveries, {
        userId,
        limit: 1
      });

      const feedback = discoveries[0].feedback;
      expect(feedback.likes).toBe(1);
      expect(feedback.dislikes).toBe(1);
    });

    test('should submit rating feedback', async () => {
      const result = await t.mutation(api.musicDiscovery.submitDiscoveryFeedback, {
        discoveryId,
        feedbackType: "rating",
        value: 4
      });

      expect(result.success).toBe(true);
      expect(result.updatedFeedback.rating).toBe(4);

      // Verify rating is stored
      const discoveries = await t.query(api.musicDiscovery.getUserDiscoveries, {
        userId,
        limit: 1
      });

      expect(discoveries[0].feedback.rating).toBe(4);
    });

    test('should submit comment feedback', async () => {
      const comment = "Great suggestions! Love the energy level.";
      
      const result = await t.mutation(api.musicDiscovery.submitDiscoveryFeedback, {
        discoveryId,
        feedbackType: "comment",
        comment
      });

      expect(result.success).toBe(true);
      expect(result.updatedFeedback.comments).toContain(comment);

      // Submit multiple comments
      await t.mutation(api.musicDiscovery.submitDiscoveryFeedback, {
        discoveryId,
        feedbackType: "comment",
        comment: "Could use more variety though."
      });

      const discoveries = await t.query(api.musicDiscovery.getUserDiscoveries, {
        userId,
        limit: 1
      });

      expect(discoveries[0].feedback.comments).toHaveLength(2);
    });

    test('should validate rating values', async () => {
      // Valid rating
      await t.mutation(api.musicDiscovery.submitDiscoveryFeedback, {
        discoveryId,
        feedbackType: "rating",
        value: 5
      });

      // Invalid rating should not be stored (but shouldn't throw error)
      await t.mutation(api.musicDiscovery.submitDiscoveryFeedback, {
        discoveryId,
        feedbackType: "rating",
        value: 10 // Invalid: > 5
      });

      const discoveries = await t.query(api.musicDiscovery.getUserDiscoveries, {
        userId,
        limit: 1
      });

      expect(discoveries[0].feedback.rating).toBe(5); // Should still be the valid rating
    });
  });

  describe('Discovery Analytics and Effectiveness', () => {
    test('should calculate engagement rates correctly', async () => {
      const result = await t.mutation(api.musicDiscovery.generateTrendingDiscoveries, {
        userId,
        category: "tracks",
        limit: 10
      });

      // Simulate user engagement
      const interactions = [
        "view", "view", "view", // 3 views
        "click", "click",       // 2 clicks  
        "play", "save"          // 1 play, 1 save
      ];

      for (const interaction of interactions) {
        await t.mutation(api.musicDiscovery.recordDiscoveryInteraction, {
          discoveryId: result.discoveryId,
          interactionType: interaction
        });
      }

      const discoveries = await t.query(api.musicDiscovery.getUserDiscoveries, {
        userId,
        limit: 1
      });

      const discovery = discoveries[0];
      // Engagement rate = total interactions / views = 7 / 3 = 2.33
      expect(discovery.engagementRate).toBeCloseTo(2.33, 1);
      expect(discovery.effectivenessScore).toBeGreaterThan(0);
    });

    test('should calculate effectiveness scores with feedback', async () => {
      const result = await t.mutation(api.musicDiscovery.generatePersonalizedSuggestions, {
        userId,
        category: "tracks",
        limit: 5
      });

      // Add engagement
      await t.mutation(api.musicDiscovery.recordDiscoveryInteraction, {
        discoveryId: result.discoveryId,
        interactionType: "view"
      });
      await t.mutation(api.musicDiscovery.recordDiscoveryInteraction, {
        discoveryId: result.discoveryId,
        interactionType: "play",
        duration: 180
      });

      // Add positive feedback
      await t.mutation(api.musicDiscovery.submitDiscoveryFeedback, {
        discoveryId: result.discoveryId,
        feedbackType: "like"
      });
      await t.mutation(api.musicDiscovery.submitDiscoveryFeedback, {
        discoveryId: result.discoveryId,
        feedbackType: "rating",
        value: 5
      });

      const discoveries = await t.query(api.musicDiscovery.getUserDiscoveries, {
        userId,
        limit: 1
      });

      const discovery = discoveries[0];
      expect(discovery.effectivenessScore).toBeGreaterThan(0.5); // Should be quite effective
    });
  });

  describe('Discovery History and Management', () => {
    test('should retrieve user discovery history', async () => {
      // Generate multiple discoveries
      await t.mutation(api.musicDiscovery.generateTrendingDiscoveries, {
        userId,
        category: "tracks"
      });

      await t.mutation(api.musicDiscovery.generatePersonalizedSuggestions, {
        userId,
        category: "artists"
      });

      await t.mutation(api.musicDiscovery.generateGenreExploration, {
        userId,
        targetGenre: "ambient"
      });

      const allDiscoveries = await t.query(api.musicDiscovery.getUserDiscoveries, {
        userId
      });

      expect(allDiscoveries).toHaveLength(3);
      
      // Should be ordered by creation date (newest first)
      expect(allDiscoveries[0].createdAt).toBeGreaterThanOrEqual(allDiscoveries[1].createdAt);
      expect(allDiscoveries[1].createdAt).toBeGreaterThanOrEqual(allDiscoveries[2].createdAt);

      // Verify different discovery types
      const discoveryTypes = allDiscoveries.map(d => d.discoveryType);
      expect(discoveryTypes).toContain("trending");
      expect(discoveryTypes).toContain("personalized");
      expect(discoveryTypes).toContain("genre_exploration");
    });

    test('should filter discoveries by type', async () => {
      // Generate discoveries of different types
      await t.mutation(api.musicDiscovery.generateTrendingDiscoveries, {
        userId,
        category: "tracks"
      });

      await t.mutation(api.musicDiscovery.generateTrendingDiscoveries, {
        userId,
        category: "artists"
      });

      await t.mutation(api.musicDiscovery.generatePersonalizedSuggestions, {
        userId,
        category: "tracks"
      });

      // Filter for trending only
      const trendingDiscoveries = await t.query(api.musicDiscovery.getUserDiscoveries, {
        userId,
        discoveryType: "trending"
      });

      expect(trendingDiscoveries).toHaveLength(2);
      expect(trendingDiscoveries.every(d => d.discoveryType === "trending")).toBe(true);

      // Filter for personalized only
      const personalizedDiscoveries = await t.query(api.musicDiscovery.getUserDiscoveries, {
        userId,
        discoveryType: "personalized"
      });

      expect(personalizedDiscoveries).toHaveLength(1);
      expect(personalizedDiscoveries[0].discoveryType).toBe("personalized");
    });

    test('should respect discovery limits', async () => {
      // Generate more discoveries than requested limit
      for (let i = 0; i < 5; i++) {
        await t.mutation(api.musicDiscovery.generateTrendingDiscoveries, {
          userId,
          category: "tracks"
        });
      }

      const limitedDiscoveries = await t.query(api.musicDiscovery.getUserDiscoveries, {
        userId,
        limit: 3
      });

      expect(limitedDiscoveries).toHaveLength(3);
    });
  });

  describe('Discovery Expiration and Status', () => {
    test('should set appropriate expiration times', async () => {
      const now = Date.now();

      // Trending discoveries expire in 6 hours
      const trendingResult = await t.mutation(api.musicDiscovery.generateTrendingDiscoveries, {
        userId,
        category: "tracks"
      });

      // Personalized suggestions expire in 24 hours
      const personalizedResult = await t.mutation(api.musicDiscovery.generatePersonalizedSuggestions, {
        userId,
        category: "tracks"
      });

      // Genre exploration expires in 48 hours
      const explorationResult = await t.mutation(api.musicDiscovery.generateGenreExploration, {
        userId
      });

      const discoveries = await t.query(api.musicDiscovery.getUserDiscoveries, {
        userId
      });

      const trendingDiscovery = discoveries.find(d => d.discoveryType === "trending");
      const personalizedDiscovery = discoveries.find(d => d.discoveryType === "personalized");
      const explorationDiscovery = discoveries.find(d => d.discoveryType === "genre_exploration");

      // Verify expiration times (allowing for some test execution time)
      expect(trendingDiscovery.expiresAt).toBeLessThan(now + 7 * 60 * 60 * 1000); // < 7 hours
      expect(personalizedDiscovery.expiresAt).toBeLessThan(now + 25 * 60 * 60 * 1000); // < 25 hours
      expect(explorationDiscovery.expiresAt).toBeLessThan(now + 49 * 60 * 60 * 1000); // < 49 hours

      expect(trendingDiscovery.expiresAt).toBeGreaterThan(now + 5 * 60 * 60 * 1000); // > 5 hours
      expect(personalizedDiscovery.expiresAt).toBeGreaterThan(now + 23 * 60 * 60 * 1000); // > 23 hours
      expect(explorationDiscovery.expiresAt).toBeGreaterThan(now + 47 * 60 * 60 * 1000); // > 47 hours
    });

    test('should mark discoveries as active by default', async () => {
      await t.mutation(api.musicDiscovery.generateTrendingDiscoveries, {
        userId,
        category: "tracks"
      });

      const discoveries = await t.query(api.musicDiscovery.getUserDiscoveries, {
        userId,
        limit: 1
      });

      expect(discoveries[0].status).toBe("active");
    });
  });
});