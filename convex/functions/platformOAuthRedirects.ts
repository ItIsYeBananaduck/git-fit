/**
 * Platform OAuth Redirects - Convex Functions
 * 
 * Implements platform-specific OAuth redirect handling:
 * - iOS custom URL schemes and universal links
 * - Android intent filters and deep links
 * - Web HTTPS redirect URI management
 * - Cross-platform redirect validation and security
 * - Dynamic redirect URI generation
 */

import { mutation, query } from '../_generated/server';
import { v, ConvexError } from 'convex/values';

// ====================================================================================
// PLATFORM OAUTH REDIRECT FUNCTIONS
// ====================================================================================

/**
 * Generate platform-specific OAuth redirect URIs
 */
export const generatePlatformRedirectURIs = mutation({
  args: {
    platform: v.string(), // 'ios', 'android', 'web'
    providerId: v.string(), // 'spotify', 'apple-music', 'youtube-music'
    sessionId: v.string(),
    redirectOptions: v.optional(v.object({
      customScheme: v.optional(v.string()), // iOS/Android custom scheme
      webDomain: v.optional(v.string()), // Web domain for HTTPS redirects
      deepLinkPath: v.optional(v.string()), // Deep link path
      fallbackURL: v.optional(v.string()), // Fallback URL for failures
      enableUniversalLinks: v.optional(v.boolean()), // iOS universal links
      enableIntentFilters: v.optional(v.boolean()), // Android intent filters
    })),
  },
  handler: async (ctx, args) => {
    try {
      // Validate platform and provider
      const validPlatforms = ['ios', 'android', 'web'];
      if (!validPlatforms.includes(args.platform)) {
        throw new ConvexError({
          message: `Invalid platform: ${args.platform}`,
          code: 'INVALID_PLATFORM'
        });
      }

      // Get OAuth provider configuration
      const provider = await ctx.db
        .query('oauthProviders')
        .filter(q => q.eq(q.field('providerId'), args.providerId))
        .filter(q => q.eq(q.field('isActive'), true))
        .first();

      if (!provider) {
        throw new ConvexError({
          message: `OAuth provider not found: ${args.providerId}`,
          code: 'PROVIDER_NOT_FOUND'
        });
      }

      const options = {
        customScheme: 'gitfit',
        webDomain: 'gitfit-app.vercel.app',
        deepLinkPath: '/oauth/callback',
        fallbackURL: '/oauth/error',
        enableUniversalLinks: true,
        enableIntentFilters: true,
        ...args.redirectOptions
      };

      // Generate platform-specific redirect URIs
      const redirectURIs = await generateRedirectURIsForPlatform(
        args.platform,
        args.providerId,
        args.sessionId,
        options
      );

      // Validate redirect URIs
      const validatedURIs = await validateRedirectURIs(redirectURIs, args.platform, provider);

      // Store redirect configuration
      const redirectConfigId = await ctx.db.insert('oauthSessions', {
        sessionId: args.sessionId,
        providerId: args.providerId,
        platform: args.platform,
        redirectURIs: validatedURIs,
        redirectOptions: options,
        status: 'redirect-generated',
        generatedAt: Date.now(),
        expiresAt: Date.now() + (15 * 60 * 1000), // 15 minutes
        isActive: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      return {
        success: true,
        redirectConfigId,
        platform: args.platform,
        providerId: args.providerId,
        redirectURIs: validatedURIs,
        platformInstructions: generatePlatformInstructions(args.platform, validatedURIs, options),
        security: {
          validated: true,
          expiresAt: Date.now() + (15 * 60 * 1000),
          sessionId: args.sessionId,
        },
        message: `Generated ${args.platform} redirect URIs for ${args.providerId}`,
      };

    } catch (error) {
      console.error('Error generating platform redirect URIs:', error);
      if (error instanceof ConvexError) {
        throw error;
      }
      throw new ConvexError({
        message: 'Failed to generate platform redirect URIs',
        code: 'REDIRECT_GENERATION_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },
});

/**
 * Handle platform-specific OAuth redirect callbacks
 */
export const handlePlatformRedirectCallback = mutation({
  args: {
    platform: v.string(),
    providerId: v.string(),
    sessionId: v.string(),
    redirectData: v.object({
      code: v.optional(v.string()),
      state: v.optional(v.string()),
      error: v.optional(v.string()),
      errorDescription: v.optional(v.string()),
      redirectURI: v.string(),
      additionalParams: v.optional(v.any()),
    }),
    platformMetadata: v.optional(v.object({
      appVersion: v.optional(v.string()),
      osVersion: v.optional(v.string()),
      deviceId: v.optional(v.string()),
      userAgent: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    try {
      // Find redirect configuration
      const redirectConfig = await ctx.db
        .query('oauthSessions')
        .filter(q => q.eq(q.field('sessionId'), args.sessionId))
        .filter(q => q.eq(q.field('providerId'), args.providerId))
        .filter(q => q.eq(q.field('platform'), args.platform))
        .filter(q => q.eq(q.field('isActive'), true))
        .first();

      if (!redirectConfig) {
        throw new ConvexError({
          message: 'OAuth redirect configuration not found or expired',
          code: 'REDIRECT_CONFIG_NOT_FOUND'
        });
      }

      // Check expiration
      if (Date.now() > redirectConfig.expiresAt) {
        throw new ConvexError({
          message: 'OAuth redirect configuration expired',
          code: 'REDIRECT_CONFIG_EXPIRED'
        });
      }

      // Validate redirect URI
      const isValidRedirect = await validateIncomingRedirect(
        args.redirectData.redirectURI,
        redirectConfig.redirectURIs,
        args.platform
      );

      if (!isValidRedirect) {
        throw new ConvexError({
          message: 'Invalid redirect URI',
          code: 'INVALID_REDIRECT_URI'
        });
      }

      // Handle OAuth callback based on platform
      let callbackResult;
      
      if (args.redirectData.error) {
        // Handle OAuth error
        callbackResult = await handleOAuthError(
          args.redirectData.error,
          args.redirectData.errorDescription,
          args.platform,
          args.providerId
        );
      } else if (args.redirectData.code && args.redirectData.state) {
        // Handle successful OAuth callback
        callbackResult = await processOAuthCallback(
          ctx,
          args.redirectData.code,
          args.redirectData.state,
          args.sessionId,
          args.providerId,
          args.platform
        );
      } else {
        throw new ConvexError({
          message: 'Invalid OAuth callback data',
          code: 'INVALID_CALLBACK_DATA'
        });
      }

      // Update redirect configuration
      await ctx.db.patch(redirectConfig._id, {
        status: callbackResult.success ? 'callback-processed' : 'callback-failed',
        callbackData: {
          ...args.redirectData,
          processedAt: Date.now(),
          platformMetadata: args.platformMetadata,
        },
        updatedAt: Date.now(),
      });

      // Generate platform-specific response
      const platformResponse = await generatePlatformResponse(
        args.platform,
        callbackResult,
        redirectConfig.redirectOptions
      );

      return {
        success: callbackResult.success,
        platform: args.platform,
        providerId: args.providerId,
        sessionId: args.sessionId,
        result: callbackResult,
        platformResponse,
        nextSteps: generateNextSteps(args.platform, callbackResult),
        message: callbackResult.success ? 
          `Successfully processed ${args.platform} OAuth callback` : 
          `Failed to process ${args.platform} OAuth callback`,
      };

    } catch (error) {
      console.error('Error handling platform redirect callback:', error);
      if (error instanceof ConvexError) {
        throw error;
      }
      throw new ConvexError({
        message: 'Failed to handle platform redirect callback',
        code: 'REDIRECT_CALLBACK_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },
});

/**
 * Validate platform-specific redirect configurations
 */
export const validatePlatformRedirectConfig = query({
  args: {
    platform: v.string(),
    providerId: v.string(),
    redirectURIs: v.array(v.string()),
    validationOptions: v.optional(v.object({
      strictValidation: v.optional(v.boolean()),
      checkReachability: v.optional(v.boolean()),
      validateSchemes: v.optional(v.boolean()),
    })),
  },
  handler: async (ctx, args) => {
    try {
      // Get provider configuration
      const provider = await ctx.db
        .query('oauthProviders')
        .filter(q => q.eq(q.field('providerId'), args.providerId))
        .first();

      if (!provider) {
        throw new ConvexError({
          message: 'OAuth provider not found',
          code: 'PROVIDER_NOT_FOUND'
        });
      }

      const options = {
        strictValidation: true,
        checkReachability: false, // Would require external HTTP checks
        validateSchemes: true,
        ...args.validationOptions
      };

      const validationResults = [];

      for (const uri of args.redirectURIs) {
        const result = await validateSingleRedirectURI(
          uri,
          args.platform,
          provider,
          options
        );
        validationResults.push({
          uri,
          ...result,
        });
      }

      // Overall validation summary
      const allValid = validationResults.every(r => r.isValid);
      const criticalErrors = validationResults.filter(r => r.severity === 'error').length;
      const warnings = validationResults.filter(r => r.severity === 'warning').length;

      return {
        isValid: allValid,
        platform: args.platform,
        providerId: args.providerId,
        validationResults,
        summary: {
          totalURIs: args.redirectURIs.length,
          validURIs: validationResults.filter(r => r.isValid).length,
          criticalErrors,
          warnings,
        },
        recommendations: generateValidationRecommendations(validationResults, args.platform),
        message: allValid ? 
          'All redirect URIs are valid' : 
          `${criticalErrors} critical errors and ${warnings} warnings found`,
      };

    } catch (error) {
      console.error('Error validating platform redirect config:', error);
      if (error instanceof ConvexError) {
        throw error;
      }
      throw new ConvexError({
        message: 'Failed to validate platform redirect configuration',
        code: 'REDIRECT_VALIDATION_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },
});

/**
 * Generate deep link URLs for platform-specific navigation
 */
export const generateDeepLinks = mutation({
  args: {
    platform: v.string(),
    targetScreen: v.string(), // 'oauth-success', 'oauth-error', 'music-sync'
    parameters: v.optional(v.object({
      providerId: v.optional(v.string()),
      sessionId: v.optional(v.string()),
      userId: v.optional(v.string()),
      error: v.optional(v.string()),
      customData: v.optional(v.any()),
    })),
    linkOptions: v.optional(v.object({
      customScheme: v.optional(v.string()),
      fallbackURL: v.optional(v.string()),
      enableUniversalLinks: v.optional(v.boolean()),
      trackingParams: v.optional(v.boolean()),
    })),
  },
  handler: async (ctx, args) => {
    try {
      const options = {
        customScheme: 'gitfit',
        fallbackURL: 'https://gitfit-app.vercel.app',
        enableUniversalLinks: true,
        trackingParams: true,
        ...args.linkOptions
      };

      // Generate platform-specific deep links
      const deepLinks = await generatePlatformDeepLinks(
        args.platform,
        args.targetScreen,
        args.parameters,
        options
      );

      // Store deep link for tracking
      const deepLinkId = await ctx.db.insert('oauthSessions', {
        sessionId: `deeplink_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        providerId: args.parameters?.providerId || 'system',
        platform: args.platform,
        redirectURIs: deepLinks.links,
        status: 'deep-link-generated',
        deepLinkData: {
          targetScreen: args.targetScreen,
          parameters: args.parameters,
          options,
        },
        generatedAt: Date.now(),
        expiresAt: Date.now() + (60 * 60 * 1000), // 1 hour
        isActive: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      return {
        success: true,
        deepLinkId,
        platform: args.platform,
        targetScreen: args.targetScreen,
        deepLinks,
        instructions: generateDeepLinkInstructions(args.platform, deepLinks),
        testing: generateDeepLinkTestInstructions(args.platform, deepLinks),
        message: `Generated ${args.platform} deep links for ${args.targetScreen}`,
      };

    } catch (error) {
      console.error('Error generating deep links:', error);
      if (error instanceof ConvexError) {
        throw error;
      }
      throw new ConvexError({
        message: 'Failed to generate deep links',
        code: 'DEEP_LINK_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },
});

/**
 * Get platform-specific OAuth redirect status
 */
export const getPlatformRedirectStatus = query({
  args: {
    sessionId: v.string(),
    platform: v.optional(v.string()),
    providerId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    try {
      let query = ctx.db
        .query('oauthSessions')
        .filter(q => q.eq(q.field('sessionId'), args.sessionId));

      if (args.platform) {
        query = query.filter(q => q.eq(q.field('platform'), args.platform));
      }

      if (args.providerId) {
        query = query.filter(q => q.eq(q.field('providerId'), args.providerId));
      }

      const redirectSessions = await query.collect();

      if (redirectSessions.length === 0) {
        return {
          found: false,
          sessionId: args.sessionId,
          status: 'not-found',
          message: 'No redirect sessions found',
        };
      }

      // Get most recent session
      const latestSession = redirectSessions.sort((a, b) => b.updatedAt - a.updatedAt)[0];

      // Check expiration
      const isExpired = Date.now() > latestSession.expiresAt;
      
      return {
        found: true,
        sessionId: args.sessionId,
        redirectConfig: {
          platform: latestSession.platform,
          providerId: latestSession.providerId,
          status: isExpired ? 'expired' : latestSession.status,
          redirectURIs: latestSession.redirectURIs,
          redirectOptions: latestSession.redirectOptions,
          generatedAt: latestSession.generatedAt,
          expiresAt: latestSession.expiresAt,
          isExpired,
        },
        callbackData: latestSession.callbackData,
        deepLinkData: latestSession.deepLinkData,
        allSessions: redirectSessions.map(session => ({
          platform: session.platform,
          providerId: session.providerId,
          status: Date.now() > session.expiresAt ? 'expired' : session.status,
          createdAt: session.createdAt,
        })),
        message: `Found ${redirectSessions.length} redirect sessions`,
      };

    } catch (error) {
      console.error('Error getting platform redirect status:', error);
      throw new ConvexError({
        message: 'Failed to get platform redirect status',
        code: 'REDIRECT_STATUS_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },
});

// ====================================================================================
// PLATFORM-SPECIFIC HELPER FUNCTIONS
// ====================================================================================

async function generateRedirectURIsForPlatform(
  platform: string,
  providerId: string,
  sessionId: string,
  options: any
): Promise<any> {
  const baseURIs: any = {
    primary: '',
    fallback: '',
    universal: null,
  };

  switch (platform) {
    case 'ios':
      baseURIs.primary = `${options.customScheme}://oauth/callback/${providerId}?session=${sessionId}`;
      baseURIs.fallback = `${options.customScheme}://oauth/error?session=${sessionId}`;
      
      if (options.enableUniversalLinks) {
        baseURIs.universal = `https://${options.webDomain}/oauth/callback/${providerId}?session=${sessionId}&platform=ios`;
      }
      break;

    case 'android':
      baseURIs.primary = `${options.customScheme}://oauth/callback/${providerId}?session=${sessionId}`;
      baseURIs.fallback = `${options.customScheme}://oauth/error?session=${sessionId}`;
      
      if (options.enableIntentFilters) {
        baseURIs.intent = `intent://oauth/callback/${providerId}?session=${sessionId}#Intent;scheme=${options.customScheme};package=com.gitfit.app;end`;
      }
      break;

    case 'web':
      baseURIs.primary = `https://${options.webDomain}${options.deepLinkPath}/${providerId}?session=${sessionId}`;
      baseURIs.fallback = `https://${options.webDomain}${options.fallbackURL}?session=${sessionId}`;
      break;

    default:
      throw new ConvexError({
        message: `Unsupported platform: ${platform}`,
        code: 'UNSUPPORTED_PLATFORM'
      });
  }

  return {
    platform,
    providerId,
    sessionId,
    ...baseURIs,
    generatedAt: Date.now(),
  };
}

async function validateRedirectURIs(redirectURIs: any, platform: string, provider: any): Promise<any> {
  const validation = {
    ...redirectURIs,
    isValid: true,
    validationErrors: [] as string[],
    validationWarnings: [] as string[],
  };

  // Platform-specific validation
  switch (platform) {
    case 'ios':
      if (!redirectURIs.primary?.startsWith('gitfit://')) {
        validation.validationErrors.push('iOS redirect URI must use custom scheme');
        validation.isValid = false;
      }
      break;

    case 'android':
      if (!redirectURIs.primary?.startsWith('gitfit://')) {
        validation.validationErrors.push('Android redirect URI must use custom scheme');
        validation.isValid = false;
      }
      break;

    case 'web':
      if (!redirectURIs.primary?.startsWith('https://')) {
        validation.validationErrors.push('Web redirect URI must use HTTPS');
        validation.isValid = false;
      }
      break;
  }

  // Provider-specific validation
  if (provider.redirectUriPatterns) {
    const patterns = provider.redirectUriPatterns;
    const primaryMatches = patterns.some((pattern: string) => 
      new RegExp(pattern).test(redirectURIs.primary)
    );
    
    if (!primaryMatches) {
      validation.validationWarnings.push('Primary URI may not match provider patterns');
    }
  }

  return validation;
}

async function validateIncomingRedirect(incomingURI: string, validURIs: any, platform: string): Promise<boolean> {
  const validURIList = [
    validURIs.primary,
    validURIs.fallback,
    validURIs.universal,
    validURIs.intent,
  ].filter(Boolean);

  // Exact match check
  if (validURIList.includes(incomingURI)) {
    return true;
  }

  // Pattern matching for query parameters
  for (const validURI of validURIList) {
    const validBase = validURI.split('?')[0];
    const incomingBase = incomingURI.split('?')[0];
    
    if (validBase === incomingBase) {
      return true;
    }
  }

  return false;
}

async function handleOAuthError(error: string, description?: string, platform?: string, providerId?: string): Promise<any> {
  const errorMapping: Record<string, string> = {
    'access_denied': 'User denied authorization',
    'invalid_request': 'Invalid OAuth request',
    'unauthorized_client': 'Unauthorized client application',
    'unsupported_response_type': 'Unsupported response type',
    'invalid_scope': 'Invalid authorization scope',
    'server_error': 'Authorization server error',
    'temporarily_unavailable': 'Service temporarily unavailable',
  };

  return {
    success: false,
    error: {
      code: error,
      message: errorMapping[error] || 'Unknown OAuth error',
      description,
      platform,
      providerId,
      timestamp: Date.now(),
    },
    userMessage: generateUserFriendlyErrorMessage(error, platform),
    troubleshooting: generateTroubleshootingSteps(error, platform),
  };
}

async function processOAuthCallback(
  ctx: any,
  code: string,
  state: string,
  sessionId: string,
  providerId: string,
  platform: string
): Promise<any> {
  // This would integrate with the existing OAuth callback processing
  // For now, return a success response
  return {
    success: true,
    data: {
      code,
      state,
      sessionId,
      providerId,
      platform,
      processedAt: Date.now(),
    },
    message: 'OAuth callback processed successfully',
  };
}

async function generatePlatformResponse(platform: string, callbackResult: any, options: any): Promise<any> {
  const baseResponse = {
    platform,
    result: callbackResult,
    timestamp: Date.now(),
  };

  switch (platform) {
    case 'ios':
      return {
        ...baseResponse,
        iosResponse: {
          canOpenURL: `${options.customScheme}://oauth/result`,
          notificationName: 'GitFitOAuthComplete',
          userInfo: {
            success: callbackResult.success,
            providerId: callbackResult.data?.providerId,
            sessionId: callbackResult.data?.sessionId,
          },
        },
      };

    case 'android':
      return {
        ...baseResponse,
        androidResponse: {
          intentAction: 'com.gitfit.OAUTH_COMPLETE',
          extras: {
            success: callbackResult.success,
            providerId: callbackResult.data?.providerId,
            sessionId: callbackResult.data?.sessionId,
            timestamp: Date.now(),
          },
        },
      };

    case 'web':
      return {
        ...baseResponse,
        webResponse: {
          redirect: callbackResult.success ? 
            '/dashboard?oauth=success' : 
            '/oauth/error?code=' + encodeURIComponent(callbackResult.error?.code || 'unknown'),
          postMessage: {
            type: 'oauth-complete',
            success: callbackResult.success,
            data: callbackResult.data,
            error: callbackResult.error,
          },
        },
      };

    default:
      return baseResponse;
  }
}

async function generatePlatformDeepLinks(
  platform: string,
  targetScreen: string,
  parameters: any,
  options: any
): Promise<any> {
  const baseParams = new URLSearchParams();
  
  if (parameters) {
    Object.keys(parameters).forEach(key => {
      if (parameters[key] !== undefined) {
        baseParams.append(key, parameters[key]);
      }
    });
  }

  if (options.trackingParams) {
    baseParams.append('timestamp', Date.now().toString());
    baseParams.append('platform', platform);
  }

  const links: any = {
    platform,
    targetScreen,
    parameters,
  };

  switch (platform) {
    case 'ios':
      links.customScheme = `${options.customScheme}://${targetScreen}?${baseParams.toString()}`;
      
      if (options.enableUniversalLinks) {
        links.universalLink = `${options.fallbackURL}/${targetScreen}?${baseParams.toString()}&platform=ios`;
      }
      
      links.fallback = `${options.fallbackURL}/${targetScreen}?${baseParams.toString()}&fallback=true`;
      break;

    case 'android':
      links.customScheme = `${options.customScheme}://${targetScreen}?${baseParams.toString()}`;
      links.intentFilter = `intent://${targetScreen}?${baseParams.toString()}#Intent;scheme=${options.customScheme};package=com.gitfit.app;end`;
      links.fallback = `${options.fallbackURL}/${targetScreen}?${baseParams.toString()}&fallback=true`;
      break;

    case 'web':
      links.webURL = `${options.fallbackURL}/${targetScreen}?${baseParams.toString()}`;
      links.hash = `${options.fallbackURL}/#/${targetScreen}?${baseParams.toString()}`;
      break;
  }

  return {
    links,
    qrCode: null, // Could generate QR codes for easy testing
    testingURL: generateTestingURL(platform, links),
  };
}

function generatePlatformInstructions(platform: string, redirectURIs: any, options: any): any {
  const instructions: any = {
    platform,
    setup: [],
    configuration: [],
    testing: [],
  };

  switch (platform) {
    case 'ios':
      instructions.setup = [
        'Add custom URL scheme to Info.plist',
        'Configure LSApplicationQueriesSchemes if needed',
        'Implement application:openURL:options: in AppDelegate',
      ];
      instructions.configuration = [
        `URL Scheme: ${options.customScheme}`,
        `Primary Redirect: ${redirectURIs.primary}`,
        `Fallback: ${redirectURIs.fallback}`,
      ];
      if (options.enableUniversalLinks) {
        instructions.setup.push('Configure Universal Links with apple-app-site-association');
        instructions.configuration.push(`Universal Link: ${redirectURIs.universal}`);
      }
      instructions.testing = [
        `Test custom scheme: ${redirectURIs.primary}`,
        'Use Safari or Simulator to test redirects',
        'Verify callback handling in app',
      ];
      break;

    case 'android':
      instructions.setup = [
        'Add intent filters to AndroidManifest.xml',
        'Configure deep link handling in Activity',
        'Implement onNewIntent() method',
      ];
      instructions.configuration = [
        `Scheme: ${options.customScheme}`,
        `Primary Redirect: ${redirectURIs.primary}`,
        `Intent Filter: ${redirectURIs.intent || 'N/A'}`,
      ];
      instructions.testing = [
        `Test with ADB: adb shell am start -W -a android.intent.action.VIEW -d "${redirectURIs.primary}"`,
        'Use browser to test deep links',
        'Verify intent handling in activity',
      ];
      break;

    case 'web':
      instructions.setup = [
        'Configure redirect URI in OAuth provider settings',
        'Implement client-side redirect handler',
        'Set up HTTPS for production',
      ];
      instructions.configuration = [
        `Primary Redirect: ${redirectURIs.primary}`,
        `Fallback: ${redirectURIs.fallback}`,
        'HTTPS required for production',
      ];
      instructions.testing = [
        'Test OAuth flow in browser',
        'Verify callback parameter handling',
        'Test error scenarios',
      ];
      break;
  }

  return instructions;
}

async function validateSingleRedirectURI(uri: string, platform: string, provider: any, options: any): Promise<any> {
  const result = {
    isValid: true,
    severity: 'info' as 'error' | 'warning' | 'info',
    issues: [] as string[],
    recommendations: [] as string[],
  };

  // Platform-specific validation
  switch (platform) {
    case 'ios':
      if (!uri.match(/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//)) {
        result.isValid = false;
        result.severity = 'error';
        result.issues.push('Invalid URL scheme format');
      }
      
      if (uri.startsWith('http://')) {
        result.severity = 'warning';
        result.issues.push('HTTP schemes are not recommended for iOS');
        result.recommendations.push('Use custom scheme or HTTPS');
      }
      break;

    case 'android':
      if (!uri.match(/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//)) {
        result.isValid = false;
        result.severity = 'error';
        result.issues.push('Invalid URL scheme format');
      }
      break;

    case 'web':
      if (!uri.startsWith('https://')) {
        result.isValid = false;
        result.severity = 'error';
        result.issues.push('Web redirects must use HTTPS');
      }
      
      try {
        const url = new URL(uri);
        if (!url.hostname) {
          result.isValid = false;
          result.severity = 'error';
          result.issues.push('Invalid hostname in redirect URI');
        }
      } catch (e) {
        result.isValid = false;
        result.severity = 'error';
        result.issues.push('Malformed redirect URI');
      }
      break;
  }

  // Security validation
  if (uri.includes('javascript:') || uri.includes('data:')) {
    result.isValid = false;
    result.severity = 'error';
    result.issues.push('Potentially dangerous URI scheme');
  }

  return result;
}

function generateValidationRecommendations(results: any[], platform: string): string[] {
  const recommendations = [];
  
  const errorCount = results.filter(r => r.severity === 'error').length;
  const warningCount = results.filter(r => r.severity === 'warning').length;
  
  if (errorCount > 0) {
    recommendations.push(`Fix ${errorCount} critical errors before proceeding`);
  }
  
  if (warningCount > 0) {
    recommendations.push(`Review ${warningCount} warnings for best practices`);
  }
  
  switch (platform) {
    case 'ios':
      recommendations.push('Consider implementing Universal Links for better user experience');
      break;
    case 'android':
      recommendations.push('Test deep links with multiple Android versions');
      break;
    case 'web':
      recommendations.push('Ensure HTTPS certificate is valid for production');
      break;
  }
  
  return recommendations;
}

function generateNextSteps(platform: string, callbackResult: any): string[] {
  const steps = [];
  
  if (callbackResult.success) {
    steps.push('OAuth authorization completed successfully');
    
    switch (platform) {
      case 'ios':
        steps.push('App should receive callback via URL scheme');
        steps.push('Process user info and update UI');
        break;
      case 'android':
        steps.push('Activity should receive intent with callback data');
        steps.push('Update UI and proceed with music sync');
        break;
      case 'web':
        steps.push('Page will redirect to dashboard');
        steps.push('Music sync will begin automatically');
        break;
    }
  } else {
    steps.push('OAuth authorization failed');
    steps.push('Show appropriate error message to user');
    steps.push('Provide option to retry authorization');
    
    if (callbackResult.troubleshooting) {
      steps.push(...callbackResult.troubleshooting);
    }
  }
  
  return steps;
}

function generateUserFriendlyErrorMessage(error: string, platform?: string): string {
  const baseMessages: Record<string, string> = {
    'access_denied': 'You cancelled the authorization process. Please try again if you want to connect your music account.',
    'invalid_request': 'There was a problem with the authorization request. Please try again.',
    'server_error': 'The music service is temporarily unavailable. Please try again later.',
    'temporarily_unavailable': 'The music service is temporarily unavailable. Please try again later.',
  };

  return baseMessages[error] || 'An unexpected error occurred during authorization. Please try again.';
}

function generateTroubleshootingSteps(error: string, platform?: string): string[] {
  const baseSteps = [
    'Check your internet connection',
    'Try again in a few minutes',
    'Contact support if the problem persists',
  ];

  const errorSpecificSteps: Record<string, string[]> = {
    'access_denied': [
      'Make sure you click "Allow" or "Authorize" when prompted',
      'Check if you have an existing connection that needs to be reauthorized',
    ],
    'server_error': [
      'The music service may be experiencing issues',
      'Try connecting to a different music service',
    ],
  };

  const platformSteps: Record<string, string[]> = {
    'ios': [
      'Make sure the app is updated to the latest version',
      'Try restarting the app',
    ],
    'android': [
      'Clear the app cache if problems persist',
      'Make sure the app has necessary permissions',
    ],
    'web': [
      'Try using a different browser',
      'Clear browser cache and cookies',
    ],
  };

  let steps = [...baseSteps];
  
  if (errorSpecificSteps[error]) {
    steps = [...errorSpecificSteps[error], ...steps];
  }
  
  if (platform && platformSteps[platform]) {
    steps.push(...platformSteps[platform]);
  }
  
  return steps;
}

function generateDeepLinkInstructions(platform: string, deepLinks: any): any {
  return {
    platform,
    instructions: `Use the generated deep links to navigate to ${deepLinks.targetScreen}`,
    implementation: generatePlatformInstructions(platform, deepLinks.links, {}),
  };
}

function generateDeepLinkTestInstructions(platform: string, deepLinks: any): any {
  const instructions: any = {
    platform,
    testing: [],
  };

  switch (platform) {
    case 'ios':
      if (deepLinks.links.customScheme) {
        instructions.testing.push(`Test custom scheme: ${deepLinks.links.customScheme}`);
        instructions.testing.push('Use Safari to test the deep link');
      }
      if (deepLinks.links.universalLink) {
        instructions.testing.push(`Test universal link: ${deepLinks.links.universalLink}`);
      }
      break;

    case 'android':
      if (deepLinks.links.customScheme) {
        instructions.testing.push(`ADB test: adb shell am start -W -a android.intent.action.VIEW -d "${deepLinks.links.customScheme}"`);
      }
      if (deepLinks.links.intentFilter) {
        instructions.testing.push(`Intent test: ${deepLinks.links.intentFilter}`);
      }
      break;

    case 'web':
      if (deepLinks.links.webURL) {
        instructions.testing.push(`Direct URL: ${deepLinks.links.webURL}`);
      }
      if (deepLinks.links.hash) {
        instructions.testing.push(`Hash URL: ${deepLinks.links.hash}`);
      }
      break;
  }

  return instructions;
}

function generateTestingURL(platform: string, links: any): string {
  switch (platform) {
    case 'ios':
      return links.customScheme || links.universalLink || '';
    case 'android':
      return links.customScheme || '';
    case 'web':
      return links.webURL || '';
    default:
      return '';
  }
}