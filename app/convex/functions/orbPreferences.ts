/**
 * Orb Preferences Convex Functions
 * 
 * Purpose: Server-side functions for Alice orb color customization
 * Features:
 * - HSL color validation and persistence
 * - Sync conflict resolution
 * - Real-time updates with <250ms target
 * - User preference management
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/_generated/server";
import { 
  validateHueValue, 
  validateTimestamp, 
  validateSyncVersion,
  DEFAULT_ORB_PREFERENCES,
  resolveSyncConflict,
  OrbPreferencesValidationError
} from "../models/orbPreferences.js";

/**
 * Update user's orb color preferences
 * 
 * @param userId - User ID
 * @param baseColorHue - New hue value (0-360)
 * @param customColorEnabled - Whether custom color is enabled
 * @param clientSyncVersion - Client's current sync version for conflict resolution
 * @returns Updated preferences with new sync version
 */
export const updateOrbPreferences = mutation({
  args: {
    userId: v.id("users"),
    baseColorHue: v.optional(v.number()),
    customColorEnabled: v.optional(v.boolean()),
    clientSyncVersion: v.optional(v.number()),
  },
  handler: async (ctx: any, args: any) => {
    const { userId, baseColorHue, customColorEnabled, clientSyncVersion } = args;
    
    try {
      // Validate inputs
      if (baseColorHue !== undefined && !validateHueValue(baseColorHue)) {
        throw new OrbPreferencesValidationError(
          "baseColorHue", 
          baseColorHue, 
          "Must be between 0 and 360 degrees"
        );
      }

      if (clientSyncVersion !== undefined && !validateSyncVersion(clientSyncVersion)) {
        throw new OrbPreferencesValidationError(
          "clientSyncVersion",
          clientSyncVersion,
          "Must be a non-negative integer"
        );
      }

      const now = Date.now();
      
      // Check if user exists
      const user = await ctx.db.get(userId);
      if (!user) {
        throw new Error(`User not found: ${userId}`);
      }

      // Get existing preferences
      const existingPrefs = await ctx.db
        .query("aliceOrbPreferences")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .first();

      if (existingPrefs) {
        // Update existing preferences
        
        // Prepare update data
        const updateData = {
          lastModified: now,
          syncVersion: existingPrefs.syncVersion + 1,
        };

        // Handle potential sync conflicts
        if (clientSyncVersion !== undefined && clientSyncVersion < existingPrefs.syncVersion) {
          // Client is behind - resolve conflict
          const clientPrefs = {
            baseColorHue: baseColorHue ?? existingPrefs.baseColorHue,
            customColorEnabled: customColorEnabled ?? existingPrefs.customColorEnabled,
            lastModified: now,
            syncVersion: clientSyncVersion,
          };

          const serverPrefs = {
            baseColorHue: existingPrefs.baseColorHue,
            customColorEnabled: existingPrefs.customColorEnabled,
            lastModified: existingPrefs.lastModified,
            syncVersion: existingPrefs.syncVersion,
          };

          const resolved = resolveSyncConflict(clientPrefs, serverPrefs);
          
          // Apply resolved values
          if (resolved === clientPrefs) {
            if (baseColorHue !== undefined) updateData.baseColorHue = baseColorHue;
            if (customColorEnabled !== undefined) updateData.customColorEnabled = customColorEnabled;
          }
          // If server wins, keep existing values (no additional updates needed)
        } else {
          // No conflict - apply updates normally
          if (baseColorHue !== undefined) updateData.baseColorHue = baseColorHue;
          if (customColorEnabled !== undefined) updateData.customColorEnabled = customColorEnabled;
        }

        await ctx.db.patch(existingPrefs._id, updateData);

        // Return updated preferences
        const updated = await ctx.db.get(existingPrefs._id);
        return updated;
      } else {
        // Create new preferences
        const newPrefs = {
          userId,
          baseColorHue: baseColorHue ?? DEFAULT_ORB_PREFERENCES.baseColorHue,
          customColorEnabled: customColorEnabled ?? DEFAULT_ORB_PREFERENCES.customColorEnabled,
          lastModified: now,
          syncVersion: clientSyncVersion ?? DEFAULT_ORB_PREFERENCES.syncVersion,
        };

        const prefId = await ctx.db.insert("aliceOrbPreferences", newPrefs);
        const created = await ctx.db.get(prefId);
        return created;
      }
    } catch (error) {
      console.error("Error updating orb preferences:", error);
      
      if (error instanceof OrbPreferencesValidationError) {
        throw error;
      }
      
      throw new Error(`Failed to update orb preferences: ${error.message}`);
    }
  },
});

/**
 * Get user's orb color preferences
 * 
 * @param userId - User ID
 * @returns User's orb preferences or default values if none exist
 */
export const getOrbPreferences = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const { userId } = args;
    
    try {
      // Check if user exists
      const user = await ctx.db.get(userId);
      if (!user) {
        throw new Error(`User not found: ${userId}`);
      }

      // Get user's preferences
      const preferences = await ctx.db
        .query("aliceOrbPreferences")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .first();

      if (preferences) {
        return preferences;
      }

      // Return default preferences if none exist
      return {
        _id: null, // Indicates this is a default/virtual record
        userId,
        baseColorHue: DEFAULT_ORB_PREFERENCES.baseColorHue,
        customColorEnabled: DEFAULT_ORB_PREFERENCES.customColorEnabled,
        lastModified: Date.now(),
        syncVersion: DEFAULT_ORB_PREFERENCES.syncVersion,
        _creationTime: Date.now(),
      };
    } catch (error) {
      console.error("Error getting orb preferences:", error);
      throw new Error(`Failed to get orb preferences: ${error.message}`);
    }
  },
});

/**
 * Get orb preferences for multiple users (batch query)
 * 
 * @param userIds - Array of user IDs
 * @returns Array of user preferences
 */
export const getMultipleOrbPreferences = query({
  args: {
    userIds: v.array(v.id("users")),
  },
  handler: async (ctx, args) => {
    const { userIds } = args;
    
    if (userIds.length === 0) {
      return [];
    }

    if (userIds.length > 100) {
      throw new Error("Cannot query more than 100 users at once");
    }

    try {
      const preferences = [];
      
      for (const userId of userIds) {
        const userPrefs = await ctx.db
          .query("aliceOrbPreferences")
          .withIndex("by_user", (q) => q.eq("userId", userId))
          .first();

        if (userPrefs) {
          preferences.push(userPrefs);
        } else {
          // Add default preferences for users without custom settings
          preferences.push({
            _id: null,
            userId,
            baseColorHue: DEFAULT_ORB_PREFERENCES.baseColorHue,
            customColorEnabled: DEFAULT_ORB_PREFERENCES.customColorEnabled,
            lastModified: Date.now(),
            syncVersion: DEFAULT_ORB_PREFERENCES.syncVersion,
            _creationTime: Date.now(),
          });
        }
      }

      return preferences;
    } catch (error) {
      console.error("Error getting multiple orb preferences:", error);
      throw new Error(`Failed to get multiple orb preferences: ${error.message}`);
    }
  },
});

/**
 * Reset user's orb preferences to defaults
 * 
 * @param userId - User ID
 * @returns Updated preferences with default values
 */
export const resetOrbPreferences = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const { userId } = args;
    
    try {
      // Check if user exists
      const user = await ctx.db.get(userId);
      if (!user) {
        throw new Error(`User not found: ${userId}`);
      }

      // Get existing preferences
      const existingPrefs = await ctx.db
        .query("aliceOrbPreferences")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .first();

      const now = Date.now();

      if (existingPrefs) {
        // Reset to defaults
        const resetData = {
          baseColorHue: DEFAULT_ORB_PREFERENCES.baseColorHue,
          customColorEnabled: DEFAULT_ORB_PREFERENCES.customColorEnabled,
          lastModified: now,
          syncVersion: existingPrefs.syncVersion + 1,
        };

        await ctx.db.patch(existingPrefs._id, resetData);
        const updated = await ctx.db.get(existingPrefs._id);
        return updated;
      } else {
        // Create new default preferences
        const defaultPrefs = {
          userId,
          baseColorHue: DEFAULT_ORB_PREFERENCES.baseColorHue,
          customColorEnabled: DEFAULT_ORB_PREFERENCES.customColorEnabled,
          lastModified: now,
          syncVersion: DEFAULT_ORB_PREFERENCES.syncVersion,
        };

        const prefId = await ctx.db.insert("aliceOrbPreferences", defaultPrefs);
        const created = await ctx.db.get(prefId);
        return created;
      }
    } catch (error) {
      console.error("Error resetting orb preferences:", error);
      throw new Error(`Failed to reset orb preferences: ${error.message}`);
    }
  },
});

/**
 * Delete user's orb preferences
 * 
 * @param userId - User ID
 * @returns Success status
 */
export const deleteOrbPreferences = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const { userId } = args;
    
    try {
      // Get existing preferences
      const existingPrefs = await ctx.db
        .query("aliceOrbPreferences")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .first();

      if (existingPrefs) {
        await ctx.db.delete(existingPrefs._id);
        return { success: true, deletedId: existingPrefs._id };
      }

      return { success: true, deletedId: null }; // Nothing to delete
    } catch (error) {
      console.error("Error deleting orb preferences:", error);
      throw new Error(`Failed to delete orb preferences: ${error.message}`);
    }
  },
});

/**
 * Get orb preferences with computed adjusted color for current strain
 * 
 * @param userId - User ID
 * @param currentStrain - Current workout strain (0-120)
 * @returns Preferences with computed adjusted color
 */
export const getOrbPreferencesWithAdjustedColor = query({
  args: {
    userId: v.id("users"),
    currentStrain: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { userId, currentStrain = 0 } = args;
    
    try {
      // Get base preferences
      const preferences = await ctx.runQuery(api.orbPreferences.getOrbPreferences, { userId });
      
      if (!preferences) {
        throw new Error("Failed to get orb preferences");
      }

      // Calculate adjusted color if custom color is enabled
      let adjustedColor = null;
      if (preferences.customColorEnabled) {
        // Import color calculation function
        const { calculateStrainAdjustedColor } = await import("../models/orbPreferences");
        
        const adjustedHSL = calculateStrainAdjustedColor(
          preferences.baseColorHue,
          currentStrain
        );
        
        adjustedColor = {
          hue: adjustedHSL[0],
          saturation: adjustedHSL[1],
          lightness: adjustedHSL[2],
        };
      }

      return {
        ...preferences,
        adjustedColor,
        computedForStrain: currentStrain,
        computedAt: Date.now(),
      };
    } catch (error) {
      console.error("Error getting orb preferences with adjusted color:", error);
      throw new Error(`Failed to get adjusted orb preferences: ${error.message}`);
    }
  },
});

/**
 * Utility function to validate orb preferences data
 */
export const validateOrbPreferencesData = query({
  args: {
    baseColorHue: v.number(),
    customColorEnabled: v.boolean(),
    syncVersion: v.number(),
  },
  handler: async (ctx, args) => {
    const { baseColorHue, customColorEnabled, syncVersion } = args;
    
    const validation = {
      isValid: true,
      errors: [] as string[],
    };

    if (!validateHueValue(baseColorHue)) {
      validation.isValid = false;
      validation.errors.push(`Invalid hue value: ${baseColorHue}. Must be 0-360.`);
    }

    if (typeof customColorEnabled !== 'boolean') {
      validation.isValid = false;
      validation.errors.push(`Invalid customColorEnabled: ${customColorEnabled}. Must be boolean.`);
    }

    if (!validateSyncVersion(syncVersion)) {
      validation.isValid = false;
      validation.errors.push(`Invalid syncVersion: ${syncVersion}. Must be non-negative integer.`);
    }

    return validation;
  },
});