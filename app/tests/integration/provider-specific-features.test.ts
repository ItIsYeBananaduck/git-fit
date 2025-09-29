import { describe, test, expect, beforeEach } from 'vitest';
import { ConvexTestingHelper } from 'convex/testing';
import { api } from '../../../convex/_generated/api.js';
import { Id } from '../../../convex/_generated/dataModel.js';

describe('Provider-Specific Features Integration Tests', () => {
  let t: ConvexTestingHelper;
  let userId: Id<"users">;
  let spotifyFeatureId: Id<"providerFeatures">;
  let appleMusicFeatureId: Id<"providerFeatures">;

  beforeEach(async () => {
    t = new ConvexTestingHelper();
    
    // Create test user
    userId = await t.mutation(api.users.create, {
      email: "test@example.com",
      name: "Test User"
    });

    // Initialize provider features
    const initResult = await t.mutation(api.providerSpecificFeatures.initializeProviderFeatures);
    expect(initResult.success).toBe(true);
    expect(initResult.featuresCreated).toBeGreaterThan(0);

    // Get feature IDs for testing
    const spotifyFeatures = await t.query(api.providerSpecificFeatures.getProviderFeatures, {
      providerId: "spotify",
      enabledOnly: true
    });
    spotifyFeatureId = spotifyFeatures.find(f => f.featureType === "spotify_connect")?._id;

    const appleMusicFeatures = await t.query(api.providerSpecificFeatures.getProviderFeatures, {
      providerId: "apple_music",
      enabledOnly: true
    });
    appleMusicFeatureId = appleMusicFeatures.find(f => f.featureType === "apple_music_radio")?._id;

    expect(spotifyFeatureId).toBeDefined();
    expect(appleMusicFeatureId).toBeDefined();
  });

  describe('Feature Initialization and Discovery', () => {
    test('should initialize all provider features correctly', async () => {
      const spotifyFeatures = await t.query(api.providerSpecificFeatures.getProviderFeatures, {
        providerId: "spotify"
      });
      
      expect(spotifyFeatures.length).toBeGreaterThan(0);
      
      const spotifyConnect = spotifyFeatures.find(f => f.featureType === "spotify_connect");
      expect(spotifyConnect).toBeDefined();
      expect(spotifyConnect.featureName).toBe("Spotify Connect");
      expect(spotifyConnect.isPremiumOnly).toBe(true);
      expect(spotifyConnect.capabilities).toContain("device_discovery");
      expect(spotifyConnect.requirements.permissions).toContain("user-modify-playback-state");

      const appleMusicFeatures = await t.query(api.providerSpecificFeatures.getProviderFeatures, {
        providerId: "apple_music"
      });
      
      expect(appleMusicFeatures.length).toBeGreaterThan(0);
      
      const appleMusicRadio = appleMusicFeatures.find(f => f.featureType === "apple_music_radio");
      expect(appleMusicRadio).toBeDefined();
      expect(appleMusicRadio.featureName).toBe("Apple Music Radio");
      expect(appleMusicRadio.isPremiumOnly).toBe(false);
      expect(appleMusicRadio.capabilities).toContain("live_radio_streaming");

      const youtubeMusicFeatures = await t.query(api.providerSpecificFeatures.getProviderFeatures, {
        providerId: "youtube_music"
      });
      
      expect(youtubeMusicFeatures.length).toBeGreaterThan(0);
      
      const youtubePremium = youtubeMusicFeatures.find(f => f.featureType === "youtube_premium");
      expect(youtubePremium).toBeDefined();
      expect(youtubePremium.featureName).toBe("YouTube Premium Features");
      expect(youtubePremium.isPremiumOnly).toBe(true);
      expect(youtubePremium.capabilities).toContain("ad_free_playback");
    });

    test('should filter features by enabled status', async () => {
      const allFeatures = await t.query(api.providerSpecificFeatures.getProviderFeatures, {
        providerId: "spotify"
      });
      
      const enabledFeatures = await t.query(api.providerSpecificFeatures.getProviderFeatures, {
        providerId: "spotify",
        enabledOnly: true
      });

      expect(allFeatures.length).toBeGreaterThanOrEqual(enabledFeatures.length);
      expect(enabledFeatures.every(f => f.isEnabled)).toBe(true);
    });
  });

  describe('User Feature Management', () => {
    test('should enable feature for user with valid connection', async () => {
      // Create OAuth connection for user
      const connectionId = await t.mutation(api.userOAuthConnections.create, {
        userId,
        providerId: "spotify",
        accessToken: "encrypted_access_token",
        refreshToken: "encrypted_refresh_token",
        tokenExpiry: Date.now() + (60 * 60 * 1000),
        scopes: ["user-modify-playback-state", "user-read-playback-state"],
        externalUserId: "spotify_user_123",
        isPremium: true
      });

      // Enable Spotify Connect feature
      const userFeatureId = await t.mutation(api.providerSpecificFeatures.enableUserProviderFeature, {
        userId,
        featureId: spotifyFeatureId,
        configuration: {
          preferredDeviceType: "speaker",
          autoTransfer: true
        }
      });

      expect(userFeatureId).toBeDefined();

      // Verify feature is enabled for user
      const userFeatures = await t.query(api.providerSpecificFeatures.getUserEnabledFeatures, {
        userId,
        providerId: "spotify"
      });

      expect(userFeatures.length).toBe(1);
      expect(userFeatures[0].featureId).toBe(spotifyFeatureId);
      expect(userFeatures[0].isEnabled).toBe(true);
      expect(userFeatures[0].configuration.preferredDeviceType).toBe("speaker");
    });

    test('should reject feature enablement without valid connection', async () => {
      // Try to enable feature without OAuth connection
      await expect(
        t.mutation(api.providerSpecificFeatures.enableUserProviderFeature, {
          userId,
          featureId: spotifyFeatureId
        })
      ).rejects.toThrow("User must be connected to spotify to enable this feature");
    });

    test('should reject premium feature for non-premium user', async () => {
      // Create non-premium OAuth connection
      const connectionId = await t.mutation(api.userOAuthConnections.create, {
        userId,
        providerId: "spotify",
        accessToken: "encrypted_access_token",
        refreshToken: "encrypted_refresh_token",
        tokenExpiry: Date.now() + (60 * 60 * 1000),
        scopes: ["user-read-playback-state"],
        externalUserId: "spotify_user_123",
        isPremium: false
      });

      // Try to enable premium feature
      await expect(
        t.mutation(api.providerSpecificFeatures.enableUserProviderFeature, {
          userId,
          featureId: spotifyFeatureId // Spotify Connect is premium-only
        })
      ).rejects.toThrow("This feature requires a premium subscription");
    });
  });

  describe('Feature Execution - Spotify Connect', () => {
    let userFeatureId: Id<"userProviderFeatures">;

    beforeEach(async () => {
      // Setup Spotify connection and enable feature
      const connectionId = await t.mutation(api.userOAuthConnections.create, {
        userId,
        providerId: "spotify",
        accessToken: "encrypted_access_token",
        refreshToken: "encrypted_refresh_token",
        tokenExpiry: Date.now() + (60 * 60 * 1000),
        scopes: ["user-modify-playback-state", "user-read-playback-state"],
        externalUserId: "spotify_user_123",
        isPremium: true
      });

      userFeatureId = await t.mutation(api.providerSpecificFeatures.enableUserProviderFeature, {
        userId,
        featureId: spotifyFeatureId
      });
    });

    test('should execute get_devices action', async () => {
      // Mock Spotify API response
      const mockDevicesResponse = {
        devices: [
          {
            id: "device_1",
            is_active: true,
            is_private_session: false,
            is_restricted: false,
            name: "Test Speaker",
            type: "Speaker",
            volume_percent: 80
          }
        ]
      };

      // Execute get_devices action
      const result = await t.mutation(api.providerSpecificFeatures.executeFeatureAction, {
        userId,
        featureId: spotifyFeatureId,
        action: "get_devices"
      });

      expect(result).toBeDefined();
      // In a real implementation, we'd mock the Spotify API call
      // For now, we verify the action was attempted
    });

    test('should execute transfer_playback action with valid parameters', async () => {
      const result = await t.mutation(api.providerSpecificFeatures.executeFeatureAction, {
        userId,
        featureId: spotifyFeatureId,
        action: "transfer_playback",
        parameters: {
          device_ids: ["device_123"],
          play: true
        }
      });

      expect(result).toBeDefined();
    });

    test('should validate parameters for volume control', async () => {
      // Valid volume
      const validResult = await t.mutation(api.providerSpecificFeatures.executeFeatureAction, {
        userId,
        featureId: spotifyFeatureId,
        action: "set_volume",
        parameters: {
          volume_percent: 75
        }
      });

      expect(validResult).toBeDefined();

      // Invalid volume (should be rejected by validation)
      await expect(
        t.mutation(api.providerSpecificFeatures.executeFeatureAction, {
          userId,
          featureId: spotifyFeatureId,
          action: "set_volume",
          parameters: {
            volume_percent: 150 // Invalid: > 100
          }
        })
      ).rejects.toThrow("volume_percent must be a number between 0 and 100");
    });

    test('should handle playback control actions', async () => {
      const actions = ["play", "pause", "skip_next", "skip_previous"];

      for (const action of actions) {
        const result = await t.mutation(api.providerSpecificFeatures.executeFeatureAction, {
          userId,
          featureId: spotifyFeatureId,
          action,
          parameters: action === "play" ? {
            context_uri: "spotify:playlist:test123"
          } : {}
        });

        expect(result).toBeDefined();
      }
    });
  });

  describe('Feature Execution - Apple Music Radio', () => {
    let userFeatureId: Id<"userProviderFeatures">;

    beforeEach(async () => {
      // Setup Apple Music connection and enable feature
      const connectionId = await t.mutation(api.userOAuthConnections.create, {
        userId,
        providerId: "apple_music",
        accessToken: "encrypted_apple_token",
        tokenExpiry: Date.now() + (60 * 60 * 1000),
        scopes: ["music-library-read", "music-playback"],
        externalUserId: "apple_user_456",
        isPremium: false // Apple Music Radio is free
      });

      userFeatureId = await t.mutation(api.providerSpecificFeatures.enableUserProviderFeature, {
        userId,
        featureId: appleMusicFeatureId
      });
    });

    test('should execute get_radio_stations action', async () => {
      const result = await t.mutation(api.providerSpecificFeatures.executeFeatureAction, {
        userId,
        featureId: appleMusicFeatureId,
        action: "get_radio_stations"
      });

      expect(result).toBeDefined();
    });

    test('should execute create_personal_station action', async () => {
      const result = await t.mutation(api.providerSpecificFeatures.executeFeatureAction, {
        userId,
        featureId: appleMusicFeatureId,
        action: "create_personal_station",
        parameters: {
          name: "My Workout Station",
          seed: {
            type: "artist",
            id: "artist_123"
          }
        }
      });

      expect(result).toBeDefined();
    });

    test('should require seed parameter for station creation', async () => {
      await expect(
        t.mutation(api.providerSpecificFeatures.executeFeatureAction, {
          userId,
          featureId: appleMusicFeatureId,
          action: "create_personal_station",
          parameters: {
            name: "My Station"
            // Missing seed parameter
          }
        })
      ).rejects.toThrow("seed parameter is required");
    });
  });

  describe('Usage Statistics and Analytics', () => {
    test('should track feature usage statistics', async () => {
      // Setup and enable feature
      const connectionId = await t.mutation(api.userOAuthConnections.create, {
        userId,
        providerId: "spotify",
        accessToken: "encrypted_access_token",
        tokenExpiry: Date.now() + (60 * 60 * 1000),
        scopes: ["user-modify-playback-state"],
        externalUserId: "spotify_user_123",
        isPremium: true
      });

      const userFeatureId = await t.mutation(api.providerSpecificFeatures.enableUserProviderFeature, {
        userId,
        featureId: spotifyFeatureId
      });

      // Execute multiple actions to generate usage stats
      const actions = ["get_devices", "play", "pause"];
      for (const action of actions) {
        await t.mutation(api.providerSpecificFeatures.executeFeatureAction, {
          userId,
          featureId: spotifyFeatureId,
          action
        });
      }

      // Check usage statistics
      const featureStats = await t.query(api.providerSpecificFeatures.getFeatureUsageStats, {
        featureId: spotifyFeatureId
      });

      expect(featureStats).toHaveLength(1);
      expect(featureStats[0].totalUsers).toBe(1);
      expect(featureStats[0].activeUsers).toBe(1);
      expect(featureStats[0].usageCount).toBe(3); // 3 actions executed
      expect(featureStats[0].lastUsedAt).toBeDefined();
    });

    test('should aggregate provider-level usage statistics', async () => {
      // Enable multiple Spotify features
      const spotifyFeatures = await t.query(api.providerSpecificFeatures.getProviderFeatures, {
        providerId: "spotify",
        enabledOnly: true
      });

      // Setup connection
      const connectionId = await t.mutation(api.userOAuthConnections.create, {
        userId,
        providerId: "spotify",
        accessToken: "encrypted_access_token",
        tokenExpiry: Date.now() + (60 * 60 * 1000),
        scopes: ["user-modify-playback-state", "user-read-playback-state"],
        externalUserId: "spotify_user_123",
        isPremium: true
      });

      // Enable and use multiple features
      for (const feature of spotifyFeatures) {
        await t.mutation(api.providerSpecificFeatures.enableUserProviderFeature, {
          userId,
          featureId: feature._id
        });

        await t.mutation(api.providerSpecificFeatures.executeFeatureAction, {
          userId,
          featureId: feature._id,
          action: "get_devices" // Generic action for testing
        });
      }

      // Get provider-level stats
      const providerStats = await t.query(api.providerSpecificFeatures.getFeatureUsageStats, {
        providerId: "spotify"
      });

      expect(providerStats.length).toBe(spotifyFeatures.length);
      expect(providerStats.every(stat => stat.usageCount > 0)).toBe(true);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle feature not found', async () => {
      const fakeFeatureId = "invalid_feature_id" as Id<"providerFeatures">;
      
      await expect(
        t.mutation(api.providerSpecificFeatures.enableUserProviderFeature, {
          userId,
          featureId: fakeFeatureId
        })
      ).rejects.toThrow("Feature not found");
    });

    test('should handle unsupported action', async () => {
      // Setup valid feature
      const connectionId = await t.mutation(api.userOAuthConnections.create, {
        userId,
        providerId: "spotify",
        accessToken: "encrypted_access_token",
        tokenExpiry: Date.now() + (60 * 60 * 1000),
        scopes: ["user-modify-playback-state"],
        externalUserId: "spotify_user_123",
        isPremium: true
      });

      const userFeatureId = await t.mutation(api.providerSpecificFeatures.enableUserProviderFeature, {
        userId,
        featureId: spotifyFeatureId
      });

      // Try unsupported action
      await expect(
        t.mutation(api.providerSpecificFeatures.executeFeatureAction, {
          userId,
          featureId: spotifyFeatureId,
          action: "unsupported_action"
        })
      ).rejects.toThrow("Unsupported Spotify Connect action");
    });

    test('should handle missing required parameters', async () => {
      // Setup valid feature
      const connectionId = await t.mutation(api.userOAuthConnections.create, {
        userId,
        providerId: "spotify",
        accessToken: "encrypted_access_token",
        tokenExpiry: Date.now() + (60 * 60 * 1000),
        scopes: ["user-modify-playback-state"],
        externalUserId: "spotify_user_123",
        isPremium: true
      });

      const userFeatureId = await t.mutation(api.providerSpecificFeatures.enableUserProviderFeature, {
        userId,
        featureId: spotifyFeatureId
      });

      // Try action with missing required parameter
      await expect(
        t.mutation(api.providerSpecificFeatures.executeFeatureAction, {
          userId,
          featureId: spotifyFeatureId,
          action: "transfer_playback",
          parameters: {} // Missing device_ids
        })
      ).rejects.toThrow("device_ids parameter is required and must be an array");
    });

    test('should handle feature not enabled for user', async () => {
      await expect(
        t.mutation(api.providerSpecificFeatures.executeFeatureAction, {
          userId,
          featureId: spotifyFeatureId,
          action: "get_devices"
        })
      ).rejects.toThrow("Feature not enabled for user");
    });
  });

  describe('Feature Configuration Management', () => {
    test('should support custom feature configuration', async () => {
      // Setup connection
      const connectionId = await t.mutation(api.userOAuthConnections.create, {
        userId,
        providerId: "spotify",
        accessToken: "encrypted_access_token",
        tokenExpiry: Date.now() + (60 * 60 * 1000),
        scopes: ["user-modify-playback-state"],
        externalUserId: "spotify_user_123",
        isPremium: true
      });

      // Enable feature with custom configuration
      const userFeatureId = await t.mutation(api.providerSpecificFeatures.enableUserProviderFeature, {
        userId,
        featureId: spotifyFeatureId,
        configuration: {
          autoTransfer: true,
          preferredDeviceType: "speaker",
          maxVolumeLimit: 80,
          fadeTransitions: true
        }
      });

      // Verify configuration is stored
      const userFeatures = await t.query(api.providerSpecificFeatures.getUserEnabledFeatures, {
        userId
      });

      const feature = userFeatures.find(f => f.featureId === spotifyFeatureId);
      expect(feature).toBeDefined();
      expect(feature.configuration.autoTransfer).toBe(true);
      expect(feature.configuration.preferredDeviceType).toBe("speaker");
      expect(feature.configuration.maxVolumeLimit).toBe(80);
      expect(feature.configuration.fadeTransitions).toBe(true);
    });

    test('should update existing feature configuration', async () => {
      // Setup connection and enable feature
      const connectionId = await t.mutation(api.userOAuthConnections.create, {
        userId,
        providerId: "spotify",
        accessToken: "encrypted_access_token",
        tokenExpiry: Date.now() + (60 * 60 * 1000),
        scopes: ["user-modify-playback-state"],
        externalUserId: "spotify_user_123",
        isPremium: true
      });

      const userFeatureId = await t.mutation(api.providerSpecificFeatures.enableUserProviderFeature, {
        userId,
        featureId: spotifyFeatureId,
        configuration: { autoTransfer: false }
      });

      // Update configuration
      await t.mutation(api.providerSpecificFeatures.enableUserProviderFeature, {
        userId,
        featureId: spotifyFeatureId,
        configuration: { 
          autoTransfer: true,
          preferredDeviceType: "computer"
        }
      });

      // Verify updated configuration
      const userFeatures = await t.query(api.providerSpecificFeatures.getUserEnabledFeatures, {
        userId
      });

      const feature = userFeatures.find(f => f.featureId === spotifyFeatureId);
      expect(feature.configuration.autoTransfer).toBe(true);
      expect(feature.configuration.preferredDeviceType).toBe("computer");
    });
  });
});