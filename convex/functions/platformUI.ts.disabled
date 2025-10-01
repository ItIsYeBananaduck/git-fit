/**
 * Platform UI Management - Convex Functions
 * 
 * Implements cross-platform UI state management and optimization:
 * - Platform-specific UI state persistence
 * - Device capability detection and optimization
 * - Cross-platform UI component configuration
 * - Platform-specific feature flags and settings
 */

import { mutation, query } from '../_generated/server';
import { v, ConvexError } from 'convex/values';

// ====================================================================================
// PLATFORM UI STATE MANAGEMENT
// ====================================================================================

/**
 * Get platform-specific UI state for a user
 */
export const getPlatformUIState = query({
  args: {
    userId: v.string(),
    platform: v.string(), // 'ios' | 'android' | 'web'
    component: v.optional(v.string()), // Optional specific component
    includeDefaults: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    try {
      // Get user's platform UI states
      let uiStates = await ctx.db
        .query('platformUIStates')
        .filter(q => q.eq(q.field('userId'), args.userId))
        .filter(q => q.eq(q.field('platform'), args.platform))
        .collect();

      // Filter by component if specified
      if (args.component) {
        uiStates = uiStates.filter(state => state.componentId === args.component);
      }

      // Only return active states unless includeDefaults is true
      if (!args.includeDefaults) {
        uiStates = uiStates.filter(state => state.isActive);
      }

      // Organize states by component
      const statesByComponent = uiStates.reduce((acc, state) => {
        if (!acc[state.componentId]) {
          acc[state.componentId] = [];
        }
        acc[state.componentId].push({
          stateId: state._id,
          componentId: state.componentId,
          stateData: state.stateData,
          preferences: state.preferences,
          customizations: state.customizations,
          isActive: state.isActive,
          lastUpdated: state.updatedAt,
          version: state.version,
        });
        return acc;
      }, {} as Record<string, any[]>);

      // Add default configurations if requested
      if (args.includeDefaults) {
        const defaultConfigs = await getPlatformDefaults(args.platform);
        
        // Merge defaults with user states
        for (const [componentId, defaults] of Object.entries(defaultConfigs)) {
          if (!statesByComponent[componentId]) {
            statesByComponent[componentId] = [{
              stateId: null,
              componentId,
              stateData: defaults,
              preferences: {},
              customizations: {},
              isActive: true,
              lastUpdated: null,
              version: '1.0.0',
              isDefault: true,
            }];
          }
        }
      }

      // Get platform capabilities for context
      const capabilities = await getPlatformCapabilitiesForUser(ctx, args.userId, args.platform);

      return {
        platform: args.platform,
        userId: args.userId,
        components: statesByComponent,
        capabilities: capabilities,
        metadata: {
          totalComponents: Object.keys(statesByComponent).length,
          activeStates: uiStates.filter(s => s.isActive).length,
          lastUpdated: Math.max(...uiStates.map(s => s.updatedAt || 0), 0) || null,
          platformVersion: capabilities?.platformVersion,
          appVersion: capabilities?.appVersion,
        }
      };

    } catch (error) {
      console.error('Error getting platform UI state:', error);
      throw new ConvexError({
        message: 'Failed to get platform UI state',
        code: 'UI_STATE_FETCH_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },
});

/**
 * Update platform-specific UI state
 */
export const updateUIState = mutation({
  args: {
    userId: v.string(),
    platform: v.string(),
    componentId: v.string(),
    stateData: v.optional(v.any()), // Component-specific state
    preferences: v.optional(v.object({
      theme: v.optional(v.string()),
      layout: v.optional(v.string()),
      density: v.optional(v.string()),
      animations: v.optional(v.boolean()),
      accessibility: v.optional(v.object({
        highContrast: v.optional(v.boolean()),
        reducedMotion: v.optional(v.boolean()),
        textScale: v.optional(v.number()),
      })),
    })),
    customizations: v.optional(v.object({
      colors: v.optional(v.object({
        primary: v.optional(v.string()),
        secondary: v.optional(v.string()),
        accent: v.optional(v.string()),
      })),
      typography: v.optional(v.object({
        fontFamily: v.optional(v.string()),
        fontSize: v.optional(v.number()),
        lineHeight: v.optional(v.number()),
      })),
      spacing: v.optional(v.object({
        compact: v.optional(v.boolean()),
        margins: v.optional(v.number()),
        padding: v.optional(v.number()),
      })),
    })),
    version: v.optional(v.string()),
    merge: v.optional(v.boolean()), // Whether to merge with existing state
  },
  handler: async (ctx, args) => {
    try {
      // Validate platform
      const supportedPlatforms = ['ios', 'android', 'web'];
      if (!supportedPlatforms.includes(args.platform)) {
        throw new ConvexError({
          message: `Unsupported platform: ${args.platform}`,
          code: 'INVALID_PLATFORM'
        });
      }

      // Find existing UI state
      const existingState = await ctx.db
        .query('platformUIStates')
        .filter(q => q.eq(q.field('userId'), args.userId))
        .filter(q => q.eq(q.field('platform'), args.platform))
        .filter(q => q.eq(q.field('componentId'), args.componentId))
        .first();

      const now = Date.now();
      const version = args.version || '1.0.0';

      let stateData = args.stateData;
      let preferences = args.preferences;
      let customizations = args.customizations;

      // Merge with existing data if requested and state exists
      if (args.merge && existingState) {
        stateData = {
          ...existingState.stateData,
          ...args.stateData,
        };
        preferences = {
          ...existingState.preferences,
          ...args.preferences,
        };
        customizations = {
          ...existingState.customizations,
          ...args.customizations,
        };
      }

      // Validate state data against platform capabilities
      const capabilities = await getPlatformCapabilitiesForUser(ctx, args.userId, args.platform);
      const validationResult = await validateUIStateForPlatform(
        args.componentId, 
        stateData, 
        preferences, 
        customizations, 
        capabilities
      );

      if (!validationResult.valid) {
        throw new ConvexError({
          message: `Invalid UI state: ${validationResult.errors.join(', ')}`,
          code: 'INVALID_UI_STATE',
          details: validationResult.errors
        });
      }

      const uiStateData = {
        userId: args.userId,
        platform: args.platform,
        componentId: args.componentId,
        stateData: stateData || {},
        preferences: preferences || {},
        customizations: customizations || {},
        version: version,
        isActive: true,
        platformCapabilities: capabilities,
        validationVersion: validationResult.version,
        updatedAt: now,
      };

      let stateId: string;

      if (existingState) {
        // Update existing state
        await ctx.db.patch(existingState._id, {
          ...uiStateData,
          createdAt: existingState.createdAt, // Preserve creation time
          updateCount: (existingState.updateCount || 0) + 1,
        });
        stateId = existingState._id;
      } else {
        // Create new state
        stateId = await ctx.db.insert('platformUIStates', {
          ...uiStateData,
          createdAt: now,
          updateCount: 1,
        });
      }

      // Apply optimizations based on platform capabilities
      const optimizations = await applyPlatformOptimizations(
        args.platform, 
        args.componentId, 
        capabilities
      );

      return {
        success: true,
        stateId: stateId,
        platform: args.platform,
        componentId: args.componentId,
        version: version,
        optimizations: optimizations,
        capabilities: capabilities,
        validation: validationResult,
        isNewState: !existingState,
        message: existingState 
          ? `Updated ${args.componentId} UI state for ${args.platform}`
          : `Created ${args.componentId} UI state for ${args.platform}`,
      };

    } catch (error) {
      console.error('Error updating UI state:', error);
      if (error instanceof ConvexError) {
        throw error;
      }
      throw new ConvexError({
        message: 'Failed to update UI state',
        code: 'UI_STATE_UPDATE_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },
});

/**
 * Get platform capabilities and device information
 */
export const getPlatformCapabilities = query({
  args: {
    userId: v.string(),
    platform: v.string(),
    deviceInfo: v.optional(v.object({
      model: v.optional(v.string()),
      osVersion: v.optional(v.string()),
      screenSize: v.optional(v.object({
        width: v.number(),
        height: v.number(),
      })),
      screenDensity: v.optional(v.number()),
      isTablet: v.optional(v.boolean()),
      hasNotch: v.optional(v.boolean()),
      safeAreaInsets: v.optional(v.object({
        top: v.number(),
        bottom: v.number(),
        left: v.number(),
        right: v.number(),
      })),
    })),
    includeOptimizations: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    try {
      // Get base platform capabilities
      const baseCaps = getPlatformBaseCapabilities(args.platform);
      
      // Get device-specific capabilities if device info provided
      let deviceCaps = {};
      if (args.deviceInfo) {
        deviceCaps = getDeviceSpecificCapabilities(args.platform, args.deviceInfo);
      }

      // Get user's current capabilities or create new record
      let userCaps = await ctx.db
        .query('platformUIStates')
        .filter(q => q.eq(q.field('userId'), args.userId))
        .filter(q => q.eq(q.field('platform'), args.platform))
        .filter(q => q.eq(q.field('componentId'), 'platform-capabilities'))
        .first();

      const capabilities = {
        platform: args.platform,
        ...baseCaps,
        ...deviceCaps,
        deviceInfo: args.deviceInfo,
        lastUpdated: Date.now(),
      };

      // Update or create capabilities record
      if (userCaps) {
        await ctx.db.patch(userCaps._id, {
          stateData: capabilities,
          platformCapabilities: capabilities,
          updatedAt: Date.now(),
        });
      } else if (args.deviceInfo) {
        await ctx.db.insert('platformUIStates', {
          userId: args.userId,
          platform: args.platform,
          componentId: 'platform-capabilities',
          stateData: capabilities,
          preferences: {},
          customizations: {},
          version: '1.0.0',
          isActive: true,
          platformCapabilities: capabilities,
          validationVersion: '1.0.0',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          updateCount: 1,
        });
      }

      // Add platform-specific optimizations if requested
      let optimizations = {};
      if (args.includeOptimizations) {
        optimizations = {
          ui: await getUIOptimizations(args.platform, capabilities),
          performance: await getPerformanceOptimizations(args.platform, capabilities),
          accessibility: await getAccessibilityOptimizations(args.platform, capabilities),
          battery: await getBatteryOptimizations(args.platform, capabilities),
        };
      }

      return {
        capabilities,
        optimizations: args.includeOptimizations ? optimizations : undefined,
        recommendations: getPlatformRecommendations(args.platform, capabilities),
        metadata: {
          platform: args.platform,
          userId: args.userId,
          hasDeviceInfo: !!args.deviceInfo,
          capabilitiesCount: Object.keys(capabilities).length,
          lastUpdated: capabilities.lastUpdated,
        }
      };

    } catch (error) {
      console.error('Error getting platform capabilities:', error);
      throw new ConvexError({
        message: 'Failed to get platform capabilities',
        code: 'CAPABILITIES_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },
});

/**
 * Bulk update UI states for multiple components
 */
export const bulkUpdateUIStates = mutation({
  args: {
    userId: v.string(),
    platform: v.string(),
    states: v.array(v.object({
      componentId: v.string(),
      stateData: v.optional(v.any()),
      preferences: v.optional(v.any()),
      customizations: v.optional(v.any()),
    })),
    version: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    try {
      const results = [];
      const errors = [];

      for (const stateUpdate of args.states) {
        try {
          const result = await ctx.runMutation('platformUI:updateUIState', {
            userId: args.userId,
            platform: args.platform,
            componentId: stateUpdate.componentId,
            stateData: stateUpdate.stateData,
            preferences: stateUpdate.preferences,
            customizations: stateUpdate.customizations,
            version: args.version,
            merge: true,
          });
          
          results.push({
            componentId: stateUpdate.componentId,
            success: true,
            stateId: result.stateId,
          });
        } catch (error) {
          errors.push({
            componentId: stateUpdate.componentId,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      return {
        success: errors.length === 0,
        results: results,
        errors: errors,
        summary: {
          total: args.states.length,
          successful: results.length,
          failed: errors.length,
        },
        message: errors.length === 0 
          ? `Successfully updated ${results.length} UI states`
          : `Updated ${results.length} states, ${errors.length} failed`,
      };

    } catch (error) {
      console.error('Error in bulk UI state update:', error);
      throw new ConvexError({
        message: 'Failed to bulk update UI states',
        code: 'BULK_UI_UPDATE_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },
});

/**
 * Reset UI state to platform defaults
 */
export const resetToDefaults = mutation({
  args: {
    userId: v.string(),
    platform: v.string(),
    componentId: v.optional(v.string()), // If not provided, reset all
  },
  handler: async (ctx, args) => {
    try {
      // Get states to reset
      let statesToReset = await ctx.db
        .query('platformUIStates')
        .filter(q => q.eq(q.field('userId'), args.userId))
        .filter(q => q.eq(q.field('platform'), args.platform))
        .collect();

      if (args.componentId) {
        statesToReset = statesToReset.filter(s => s.componentId === args.componentId);
      }

      if (statesToReset.length === 0) {
        return {
          success: true,
          message: 'No UI states found to reset',
          resetCount: 0,
        };
      }

      // Get default configurations
      const defaultConfigs = await getPlatformDefaults(args.platform);
      const now = Date.now();
      
      const resetResults = [];
      
      for (const state of statesToReset) {
        const defaultConfig = defaultConfigs[state.componentId];
        
        if (defaultConfig) {
          await ctx.db.patch(state._id, {
            stateData: defaultConfig,
            preferences: {},
            customizations: {},
            version: '1.0.0',
            updatedAt: now,
            updateCount: (state.updateCount || 0) + 1,
          });
          
          resetResults.push(state.componentId);
        } else {
          // Remove states that don't have defaults
          await ctx.db.patch(state._id, {
            isActive: false,
            updatedAt: now,
          });
          
          resetResults.push(state.componentId);
        }
      }

      return {
        success: true,
        resetComponents: resetResults,
        resetCount: resetResults.length,
        platform: args.platform,
        message: args.componentId 
          ? `Reset ${args.componentId} to defaults`
          : `Reset ${resetResults.length} components to defaults`,
      };

    } catch (error) {
      console.error('Error resetting UI states:', error);
      throw new ConvexError({
        message: 'Failed to reset UI states to defaults',
        code: 'UI_RESET_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },
});

// ====================================================================================
// HELPER FUNCTIONS
// ====================================================================================

/**
 * Get platform-specific default configurations
 */
async function getPlatformDefaults(platform: string): Promise<Record<string, any>> {
  const defaults = {
    ios: {
      'navigation-bar': {
        style: 'default',
        backgroundColor: 'systemBackground',
        tintColor: 'systemBlue',
        titleStyle: 'large',
        showsBackButton: true,
      },
      'oauth-button': {
        style: 'filled',
        cornerRadius: 12,
        height: 50,
        showsIcon: true,
        iconPosition: 'left',
      },
      'music-player': {
        style: 'card',
        showsArtwork: true,
        showsProgress: true,
        compactMode: false,
      },
      'workout-controls': {
        primaryButtonStyle: 'filled',
        secondaryButtonStyle: 'outlined',
        layout: 'vertical',
        spacing: 16,
      },
    },
    android: {
      'navigation-bar': {
        style: 'material',
        backgroundColor: 'colorSurface',
        tintColor: 'colorPrimary',
        elevation: 4,
        showsBackButton: true,
      },
      'oauth-button': {
        style: 'material',
        cornerRadius: 8,
        height: 48,
        elevation: 2,
        showsIcon: true,
        iconPosition: 'left',
      },
      'music-player': {
        style: 'material',
        showsArtwork: true,
        showsProgress: true,
        compactMode: false,
      },
      'workout-controls': {
        primaryButtonStyle: 'filled',
        secondaryButtonStyle: 'outlined',
        layout: 'horizontal',
        spacing: 12,
      },
    },
    web: {
      'navigation-bar': {
        style: 'modern',
        backgroundColor: 'var(--background)',
        tintColor: 'var(--primary)',
        showsShadow: true,
        showsBackButton: false,
      },
      'oauth-button': {
        style: 'rounded',
        cornerRadius: 6,
        height: 44,
        showsIcon: true,
        iconPosition: 'left',
        transition: 'smooth',
      },
      'music-player': {
        style: 'glass',
        showsArtwork: true,
        showsProgress: true,
        compactMode: false,
      },
      'workout-controls': {
        primaryButtonStyle: 'gradient',
        secondaryButtonStyle: 'ghost',
        layout: 'responsive',
        spacing: 14,
      },
    },
  };

  return defaults[platform as keyof typeof defaults] || {};
}

/**
 * Get base capabilities for a platform
 */
function getPlatformBaseCapabilities(platform: string): any {
  const capabilities = {
    ios: {
      hasNativeNavigation: true,
      supportsCustomSchemes: true,
      hasHapticFeedback: true,
      supportsBackgroundRefresh: true,
      hasNativeOAuth: true,
      supportsDeepLinking: true,
      hasSystemIntegration: true,
      maxConcurrentRequests: 6,
      supportedFormats: ['aac', 'm4a', 'mp3'],
      hasNativePlayer: true,
      supportsNotifications: true,
    },
    android: {
      hasNativeNavigation: true,
      supportsCustomSchemes: true,
      hasHapticFeedback: true,
      supportsBackgroundRefresh: true,
      hasNativeOAuth: true,
      supportsDeepLinking: true,
      hasSystemIntegration: true,
      maxConcurrentRequests: 8,
      supportedFormats: ['aac', 'mp3', 'ogg', 'flac'],
      hasNativePlayer: true,
      supportsNotifications: true,
    },
    web: {
      hasNativeNavigation: false,
      supportsCustomSchemes: false,
      hasHapticFeedback: false,
      supportsBackgroundRefresh: false,
      hasNativeOAuth: false,
      supportsDeepLinking: true,
      hasSystemIntegration: false,
      maxConcurrentRequests: 6,
      supportedFormats: ['mp3', 'aac', 'ogg', 'wav'],
      hasNativePlayer: false,
      supportsNotifications: true,
    },
  };

  return capabilities[platform as keyof typeof capabilities] || {};
}

/**
 * Get device-specific capabilities
 */
function getDeviceSpecificCapabilities(platform: string, deviceInfo: any): any {
  const capabilities: any = {};

  if (deviceInfo.screenSize) {
    capabilities.screenCategory = getScreenCategory(deviceInfo.screenSize, deviceInfo.isTablet);
    capabilities.supportsLandscape = deviceInfo.screenSize.width > deviceInfo.screenSize.height;
  }

  if (deviceInfo.screenDensity) {
    capabilities.displayDensity = getDisplayDensity(deviceInfo.screenDensity);
  }

  if (platform === 'ios' && deviceInfo.hasNotch) {
    capabilities.hasNotch = true;
    capabilities.requiresSafeArea = true;
  }

  return capabilities;
}

/**
 * Get user's platform capabilities with caching
 */
async function getPlatformCapabilitiesForUser(ctx: any, userId: string, platform: string): Promise<any> {
  const userCaps = await ctx.db
    .query('platformUIStates')
    .filter((q: any) => q.eq(q.field('userId'), userId))
    .filter((q: any) => q.eq(q.field('platform'), platform))
    .filter((q: any) => q.eq(q.field('componentId'), 'platform-capabilities'))
    .first();

  if (userCaps?.platformCapabilities) {
    return userCaps.platformCapabilities;
  }

  return getPlatformBaseCapabilities(platform);
}

/**
 * Validate UI state for platform compatibility
 */
async function validateUIStateForPlatform(
  componentId: string,
  stateData: any,
  preferences: any,
  customizations: any,
  capabilities: any
): Promise<{ valid: boolean; errors: string[]; version: string }> {
  const errors: string[] = [];

  // Component-specific validation
  if (componentId === 'oauth-button') {
    if (stateData?.height && (stateData.height < 32 || stateData.height > 80)) {
      errors.push('Button height must be between 32 and 80 pixels');
    }
  }

  // Platform-specific validation
  if (!capabilities.hasNativeNavigation && componentId === 'navigation-bar') {
    if (stateData?.style === 'native') {
      errors.push('Native navigation style not supported on this platform');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    version: '1.0.0',
  };
}

/**
 * Apply platform-specific optimizations
 */
async function applyPlatformOptimizations(platform: string, componentId: string, capabilities: any): Promise<any> {
  const optimizations: any = {};

  if (platform === 'ios') {
    optimizations.useNativeComponents = capabilities.hasNativeNavigation;
    optimizations.enableHaptics = capabilities.hasHapticFeedback;
  } else if (platform === 'android') {
    optimizations.useMaterialDesign = true;
    optimizations.enableRippleEffect = true;
  } else if (platform === 'web') {
    optimizations.useWebComponents = true;
    optimizations.enableTransitions = true;
  }

  return optimizations;
}

// Optimization helper functions
async function getUIOptimizations(platform: string, capabilities: any): Promise<any> {
  return {
    useHardwareAcceleration: platform !== 'web',
    enableAnimations: capabilities.hasHapticFeedback,
    preferNativeComponents: capabilities.hasNativeNavigation,
  };
}

async function getPerformanceOptimizations(platform: string, capabilities: any): Promise<any> {
  return {
    maxConcurrentRequests: capabilities.maxConcurrentRequests || 4,
    enableCaching: true,
    useCompression: platform === 'web',
  };
}

async function getAccessibilityOptimizations(platform: string, capabilities: any): Promise<any> {
  return {
    supportsVoiceOver: platform === 'ios',
    supportsTalkBack: platform === 'android',
    supportsScreenReader: platform === 'web',
    hasHighContrast: true,
  };
}

async function getBatteryOptimizations(platform: string, capabilities: any): Promise<any> {
  return {
    reduceAnimations: platform !== 'web',
    limitBackgroundActivity: capabilities.supportsBackgroundRefresh,
    optimizeNetworkRequests: true,
  };
}

function getPlatformRecommendations(platform: string, capabilities: any): string[] {
  const recommendations: string[] = [];

  if (platform === 'ios' && capabilities.hasNotch) {
    recommendations.push('Use safe area constraints for notch compatibility');
  }

  if (platform === 'android' && capabilities.screenCategory === 'tablet') {
    recommendations.push('Consider tablet-optimized layouts');
  }

  if (platform === 'web' && !capabilities.hasNativePlayer) {
    recommendations.push('Use HTML5 audio with fallback support');
  }

  return recommendations;
}

// Helper utility functions
function getScreenCategory(screenSize: any, isTablet: boolean): string {
  if (isTablet) return 'tablet';
  if (screenSize.width < 375) return 'small';
  if (screenSize.width < 414) return 'medium';
  return 'large';
}

function getDisplayDensity(density: number): string {
  if (density <= 1.5) return 'mdpi';
  if (density <= 2.0) return 'hdpi';
  if (density <= 3.0) return 'xhdpi';
  return 'xxhdpi';
}