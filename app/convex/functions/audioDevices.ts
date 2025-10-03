/**
 * Audio Devices Convex Functions
 * 
 * Purpose: Server-side functions for audio device management
 * Features:
 * - Device enumeration and tracking
 * - Quality assessment storage
 * - Device preference management
 * - Connection monitoring
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import {
  validateAudioDevice,
  validateQualityMetrics,
  validateDeviceContext,
  DEFAULT_QUALITY_METRICS,
  AUDIO_DEVICE_TYPES,
  DEVICE_CONNECTION_STATES,
  AudioDeviceError,
  QualityAssessmentError,
  DeviceNotFoundError,
  calculateDeviceScore,
  isHighQualityDevice,
  getDeviceRecommendation,
  mergeQualityMetrics,
} from "../models/audioDevices";

/**
 * Register or update audio device information
 * 
 * @param userId - User ID
 * @param deviceInfo - Audio device information
 * @returns Registration result
 */
export const registerAudioDevice = mutation({
  args: {
    userId: v.id("users"),
    deviceInfo: v.object({
      deviceId: v.string(),
      label: v.string(),
      type: v.string(),
      isDefault: v.optional(v.boolean()),
      capabilities: v.optional(v.object({
        sampleRates: v.optional(v.array(v.number())),
        channelCounts: v.optional(v.array(v.number())),
        latency: v.optional(v.number()),
        bufferSize: v.optional(v.number()),
      })),
      metadata: v.optional(v.any()),
    }),
    connectionState: v.optional(v.string()),
    qualityMetrics: v.optional(v.object({
      sampleRate: v.optional(v.number()),
      bitDepth: v.optional(v.number()),
      latency: v.optional(v.number()),
      signalToNoise: v.optional(v.number()),
      dynamicRange: v.optional(v.number()),
      totalHarmonicDistortion: v.optional(v.number()),
    })),
  },
  handler: async (ctx, args) => {
    const { 
      userId, 
      deviceInfo, 
      connectionState = "connected",
      qualityMetrics = DEFAULT_QUALITY_METRICS 
    } = args;
    
    try {
      // Validate inputs
      if (!validateAudioDevice(deviceInfo)) {
        throw new AudioDeviceError(
          deviceInfo.deviceId,
          "Invalid device information format"
        );
      }

      if (!DEVICE_CONNECTION_STATES.includes(connectionState)) {
        throw new AudioDeviceError(
          deviceInfo.deviceId,
          `Invalid connection state: ${connectionState}`
        );
      }

      if (!validateQualityMetrics(qualityMetrics)) {
        throw new QualityAssessmentError(
          deviceInfo.deviceId,
          "Invalid quality metrics format"
        );
      }

      // Check if user exists
      const user = await ctx.db.get(userId);
      if (!user) {
        throw new Error(`User not found: ${userId}`);
      }

      // Check if device already exists
      const existingDevice = await ctx.db
        .query("audioDevices")
        .withIndex("by_user_device", (q) => 
          q.eq("userId", userId)
           .eq("deviceId", deviceInfo.deviceId)
        )
        .first();

      const now = Date.now();
      const deviceScore = calculateDeviceScore(qualityMetrics);
      const isHighQuality = isHighQualityDevice(qualityMetrics);

      if (existingDevice) {
        // Update existing device
        const mergedMetrics = mergeQualityMetrics(existingDevice.qualityMetrics, qualityMetrics);
        
        await ctx.db.patch(existingDevice._id, {
          label: deviceInfo.label,
          type: deviceInfo.type,
          isDefault: deviceInfo.isDefault || false,
          capabilities: deviceInfo.capabilities || {},
          connectionState,
          qualityMetrics: mergedMetrics,
          deviceScore: calculateDeviceScore(mergedMetrics),
          isHighQuality: isHighQualityDevice(mergedMetrics),
          lastSeen: now,
          metadata: {
            ...existingDevice.metadata,
            ...deviceInfo.metadata,
            lastUpdated: now,
          },
        });

        const updated = await ctx.db.get(existingDevice._id);
        
        return {
          success: true,
          deviceId: deviceInfo.deviceId,
          device: updated,
          wasUpdated: true,
          qualityImproved: calculateDeviceScore(mergedMetrics) > existingDevice.deviceScore,
        };
      } else {
        // Create new device entry
        const audioDeviceId = await ctx.db.insert("audioDevices", {
          userId,
          deviceId: deviceInfo.deviceId,
          label: deviceInfo.label,
          type: deviceInfo.type,
          isDefault: deviceInfo.isDefault || false,
          capabilities: deviceInfo.capabilities || {},
          connectionState,
          qualityMetrics,
          deviceScore,
          isHighQuality,
          firstSeen: now,
          lastSeen: now,
          metadata: {
            ...deviceInfo.metadata,
            registered: now,
          },
        });

        const created = await ctx.db.get(audioDeviceId);
        
        return {
          success: true,
          deviceId: deviceInfo.deviceId,
          device: created,
          wasUpdated: false,
          qualityScore: deviceScore,
        };
      }
    } catch (error) {
      console.error("Error registering audio device:", error);
      
      if (error instanceof AudioDeviceError ||
          error instanceof QualityAssessmentError) {
        throw error;
      }
      
      throw new Error(`Failed to register audio device: ${error.message}`);
    }
  },
});

/**
 * Get available audio devices for user
 * 
 * @param userId - User ID
 * @param filterType - Optional device type filter
 * @param onlyConnected - Only return connected devices
 * @returns Array of audio devices
 */
export const getAudioDevices = query({
  args: {
    userId: v.id("users"),
    filterType: v.optional(v.string()),
    onlyConnected: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { userId, filterType, onlyConnected = false } = args;
    
    try {
      // Check if user exists
      const user = await ctx.db.get(userId);
      if (!user) {
        throw new Error(`User not found: ${userId}`);
      }

      // Get user's audio devices
      let devices = await ctx.db
        .query("audioDevices")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .collect();

      // Apply filters
      if (filterType && AUDIO_DEVICE_TYPES.includes(filterType)) {
        devices = devices.filter(device => device.type === filterType);
      }

      if (onlyConnected) {
        devices = devices.filter(device => device.connectionState === "connected");
      }

      // Add computed fields and sort by quality
      const enrichedDevices = devices.map(device => ({
        ...device,
        age: Date.now() - device.lastSeen,
        recommendation: getDeviceRecommendation(device.qualityMetrics, device.type),
        isRecent: (Date.now() - device.lastSeen) <= 5 * 60 * 1000, // 5 minutes
        qualityRating: device.isHighQuality ? "high" : device.deviceScore >= 60 ? "medium" : "low",
      }));

      // Sort by device score (highest quality first)
      enrichedDevices.sort((a, b) => {
        // Prioritize connected devices
        if (a.connectionState !== b.connectionState) {
          return a.connectionState === "connected" ? -1 : 1;
        }
        // Then by device score
        return b.deviceScore - a.deviceScore;
      });

      return enrichedDevices;
    } catch (error) {
      console.error("Error getting audio devices:", error);
      throw new Error(`Failed to get audio devices: ${error.message}`);
    }
  },
});

/**
 * Update device connection state
 * 
 * @param userId - User ID
 * @param deviceId - Device ID
 * @param connectionState - New connection state
 * @returns Update result
 */
export const updateDeviceConnection = mutation({
  args: {
    userId: v.id("users"),
    deviceId: v.string(),
    connectionState: v.string(),
    errorInfo: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId, deviceId, connectionState, errorInfo } = args;
    
    try {
      // Validate connection state
      if (!DEVICE_CONNECTION_STATES.includes(connectionState)) {
        throw new AudioDeviceError(
          deviceId,
          `Invalid connection state: ${connectionState}`
        );
      }

      // Find the device
      const device = await ctx.db
        .query("audioDevices")
        .withIndex("by_user_device", (q) => 
          q.eq("userId", userId)
           .eq("deviceId", deviceId)
        )
        .first();

      if (!device) {
        throw new DeviceNotFoundError(deviceId);
      }

      // Update connection state
      const updateData = {
        connectionState,
        lastSeen: Date.now(),
      };

      if (errorInfo) {
        updateData.metadata = {
          ...device.metadata,
          lastError: errorInfo,
          errorTimestamp: Date.now(),
        };
      }

      await ctx.db.patch(device._id, updateData);

      const updated = await ctx.db.get(device._id);
      
      return {
        success: true,
        deviceId,
        previousState: device.connectionState,
        currentState: connectionState,
        device: updated,
      };
    } catch (error) {
      console.error("Error updating device connection:", error);
      
      if (error instanceof AudioDeviceError ||
          error instanceof DeviceNotFoundError) {
        throw error;
      }
      
      throw new Error(`Failed to update device connection: ${error.message}`);
    }
  },
});

/**
 * Update device quality metrics
 * 
 * @param userId - User ID
 * @param deviceId - Device ID
 * @param qualityMetrics - New quality metrics
 * @returns Update result
 */
export const updateDeviceQuality = mutation({
  args: {
    userId: v.id("users"),
    deviceId: v.string(),
    qualityMetrics: v.object({
      sampleRate: v.optional(v.number()),
      bitDepth: v.optional(v.number()),
      latency: v.optional(v.number()),
      signalToNoise: v.optional(v.number()),
      dynamicRange: v.optional(v.number()),
      totalHarmonicDistortion: v.optional(v.number()),
    }),
    merge: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { userId, deviceId, qualityMetrics, merge = true } = args;
    
    try {
      // Validate quality metrics
      if (!validateQualityMetrics(qualityMetrics)) {
        throw new QualityAssessmentError(
          deviceId,
          "Invalid quality metrics format"
        );
      }

      // Find the device
      const device = await ctx.db
        .query("audioDevices")
        .withIndex("by_user_device", (q) => 
          q.eq("userId", userId)
           .eq("deviceId", deviceId)
        )
        .first();

      if (!device) {
        throw new DeviceNotFoundError(deviceId);
      }

      // Merge or replace quality metrics
      const finalMetrics = merge 
        ? mergeQualityMetrics(device.qualityMetrics, qualityMetrics)
        : { ...DEFAULT_QUALITY_METRICS, ...qualityMetrics };

      const newDeviceScore = calculateDeviceScore(finalMetrics);
      const newIsHighQuality = isHighQualityDevice(finalMetrics);

      // Update device
      await ctx.db.patch(device._id, {
        qualityMetrics: finalMetrics,
        deviceScore: newDeviceScore,
        isHighQuality: newIsHighQuality,
        lastSeen: Date.now(),
        metadata: {
          ...device.metadata,
          qualityUpdated: Date.now(),
          previousScore: device.deviceScore,
        },
      });

      const updated = await ctx.db.get(device._id);
      
      return {
        success: true,
        deviceId,
        previousScore: device.deviceScore,
        currentScore: newDeviceScore,
        qualityImproved: newDeviceScore > device.deviceScore,
        device: updated,
        recommendation: getDeviceRecommendation(finalMetrics, device.type),
      };
    } catch (error) {
      console.error("Error updating device quality:", error);
      
      if (error instanceof QualityAssessmentError ||
          error instanceof DeviceNotFoundError) {
        throw error;
      }
      
      throw new Error(`Failed to update device quality: ${error.message}`);
    }
  },
});

/**
 * Get device recommendations for user
 * 
 * @param userId - User ID
 * @param preferredType - Preferred device type
 * @returns Device recommendations
 */
export const getDeviceRecommendations = query({
  args: {
    userId: v.id("users"),
    preferredType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId, preferredType } = args;
    
    try {
      // Check if user exists
      const user = await ctx.db.get(userId);
      if (!user) {
        throw new Error(`User not found: ${userId}`);
      }

      // Get user's devices
      const devices = await ctx.db
        .query("audioDevices")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .collect();

      if (devices.length === 0) {
        return {
          hasDevices: false,
          recommendations: [],
          suggestedActions: ["Connect an audio device to get personalized recommendations"],
        };
      }

      // Filter by preferred type if specified
      const filteredDevices = preferredType 
        ? devices.filter(device => device.type === preferredType)
        : devices;

      // Generate recommendations
      const recommendations = filteredDevices.map(device => ({
        deviceId: device.deviceId,
        label: device.label,
        type: device.type,
        score: device.deviceScore,
        isHighQuality: device.isHighQuality,
        connectionState: device.connectionState,
        recommendation: getDeviceRecommendation(device.qualityMetrics, device.type),
        reasons: [],
      }));

      // Add recommendation reasons
      recommendations.forEach(rec => {
        const device = devices.find(d => d.deviceId === rec.deviceId);
        if (device) {
          if (device.isHighQuality) {
            rec.reasons.push("High audio quality");
          }
          if (device.connectionState === "connected") {
            rec.reasons.push("Currently connected");
          }
          if (device.isDefault) {
            rec.reasons.push("System default device");
          }
          if (device.qualityMetrics.latency < 50) {
            rec.reasons.push("Low latency");
          }
        }
      });

      // Sort by score and connection state
      recommendations.sort((a, b) => {
        if (a.connectionState !== b.connectionState) {
          return a.connectionState === "connected" ? -1 : 1;
        }
        return b.score - a.score;
      });

      // Generate suggested actions
      const suggestedActions = [];
      const hasHighQuality = recommendations.some(r => r.isHighQuality);
      const hasConnected = recommendations.some(r => r.connectionState === "connected");

      if (!hasHighQuality) {
        suggestedActions.push("Consider upgrading to a higher quality audio device");
      }
      if (!hasConnected) {
        suggestedActions.push("Connect your preferred audio device");
      }
      if (recommendations.length === 1) {
        suggestedActions.push("Add additional audio devices for backup options");
      }

      return {
        hasDevices: true,
        recommendations: recommendations.slice(0, 5), // Top 5 recommendations
        suggestedActions,
        totalDevices: devices.length,
        highQualityDevices: devices.filter(d => d.isHighQuality).length,
      };
    } catch (error) {
      console.error("Error getting device recommendations:", error);
      throw new Error(`Failed to get device recommendations: ${error.message}`);
    }
  },
});

/**
 * Remove audio device
 * 
 * @param userId - User ID
 * @param deviceId - Device ID to remove
 * @returns Removal result
 */
export const removeAudioDevice = mutation({
  args: {
    userId: v.id("users"),
    deviceId: v.string(),
  },
  handler: async (ctx, args) => {
    const { userId, deviceId } = args;
    
    try {
      // Find the device
      const device = await ctx.db
        .query("audioDevices")
        .withIndex("by_user_device", (q) => 
          q.eq("userId", userId)
           .eq("deviceId", deviceId)
        )
        .first();

      if (!device) {
        throw new DeviceNotFoundError(deviceId);
      }

      // Remove the device
      await ctx.db.delete(device._id);

      return {
        success: true,
        deviceId,
        removedDevice: {
          label: device.label,
          type: device.type,
          score: device.deviceScore,
        },
      };
    } catch (error) {
      console.error("Error removing audio device:", error);
      
      if (error instanceof DeviceNotFoundError) {
        throw error;
      }
      
      throw new Error(`Failed to remove audio device: ${error.message}`);
    }
  },
});

/**
 * Cleanup disconnected devices
 * 
 * @param userId - User ID
 * @param maxAgeMs - Maximum age for disconnected devices (default: 30 days)
 * @returns Cleanup result
 */
export const cleanupDisconnectedDevices = mutation({
  args: {
    userId: v.optional(v.id("users")),
    maxAgeMs: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { userId, maxAgeMs = 30 * 24 * 60 * 60 * 1000 } = args;
    
    try {
      const cutoffTime = Date.now() - maxAgeMs;

      // Build query
      let query = ctx.db.query("audioDevices");
      
      if (userId) {
        query = query.withIndex("by_user", (q) => q.eq("userId", userId));
      }

      const devices = await query.collect();

      // Filter disconnected devices older than cutoff
      const devicesToRemove = devices.filter(device => 
        device.connectionState === "disconnected" && 
        device.lastSeen < cutoffTime
      );

      // Remove old disconnected devices
      let removedCount = 0;
      for (const device of devicesToRemove) {
        await ctx.db.delete(device._id);
        removedCount++;
      }

      return {
        success: true,
        removedCount,
        maxAgeMs,
        cutoffTime,
        processedDevices: devices.length,
      };
    } catch (error) {
      console.error("Error cleaning up disconnected devices:", error);
      throw new Error(`Failed to cleanup disconnected devices: ${error.message}`);
    }
  },
});