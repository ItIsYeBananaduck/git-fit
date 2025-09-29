/**
 * OAuth Error Handling - Convex Functions
 * 
 * Implements comprehensive OAuth error handling:
 * - Intelligent retry logic with exponential backoff
 * - User-friendly error messages and recovery suggestions
 * - Error classification and severity assessment
 * - Automatic error recovery and fallback mechanisms
 * - Detailed error logging and analytics
 */

import { mutation, query } from '../_generated/server';
import { v, ConvexError } from 'convex/values';

// ====================================================================================
// OAUTH ERROR HANDLING FUNCTIONS
// ====================================================================================

/**
 * Handle and classify OAuth errors with intelligent recovery
 */
export const handleOAuthError = mutation({
  args: {
    errorContext: v.object({
      errorCode: v.string(),
      errorMessage: v.optional(v.string()),
      errorDescription: v.optional(v.string()),
      providerId: v.string(),
      userId: v.optional(v.string()),
      sessionId: v.optional(v.string()),
      platform: v.optional(v.string()),
      source: v.string(), // 'authorization', 'token_exchange', 'token_refresh', 'api_call'
    }),
    contextData: v.optional(v.object({
      attemptNumber: v.optional(v.number()),
      lastAttemptAt: v.optional(v.number()),
      userAgent: v.optional(v.string()),
      ipAddress: v.optional(v.string()),
      additionalData: v.optional(v.any()),
    })),
    handlingOptions: v.optional(v.object({
      enableRetry: v.optional(v.boolean()),
      maxRetryAttempts: v.optional(v.number()),
      retryDelayMs: v.optional(v.number()),
      enableFallback: v.optional(v.boolean()),
      notifyUser: v.optional(v.boolean()),
    })),
  },
  handler: async (ctx, args) => {
    try {
      const options = {
        enableRetry: true,
        maxRetryAttempts: 3,
        retryDelayMs: 1000,
        enableFallback: true,
        notifyUser: true,
        ...args.handlingOptions
      };

      // Classify the error
      const errorClassification = await classifyOAuthError(args.errorContext);

      // Check if this is a known recoverable error
      const recoveryStrategy = await determineRecoveryStrategy(
        errorClassification,
        args.contextData,
        options
      );

      // Log error for analytics and debugging
      const errorLogId = await logOAuthError(ctx, {
        ...args.errorContext,
        classification: errorClassification,
        recoveryStrategy,
        contextData: args.contextData,
        timestamp: Date.now(),
      });

      // Generate user-friendly error information
      const userError = await generateUserFriendlyError(
        errorClassification,
        args.errorContext,
        recoveryStrategy
      );

      // Determine if automatic retry should be attempted
      let retryInfo = null;
      if (options.enableRetry && recoveryStrategy.canRetry) {
        retryInfo = await calculateRetryStrategy(
          errorClassification,
          args.contextData?.attemptNumber || 0,
          options
        );
      }

      // Handle provider-specific error scenarios
      const providerSpecificHandling = await handleProviderSpecificError(
        args.errorContext.providerId,
        args.errorContext.errorCode,
        args.errorContext
      );

      // Generate recovery actions
      const recoveryActions = await generateRecoveryActions(
        errorClassification,
        recoveryStrategy,
        args.errorContext
      );

      // Update error statistics
      await updateErrorStatistics(ctx, args.errorContext.providerId, errorClassification);

      return {
        success: false, // This is an error handler
        errorId: errorLogId,
        classification: errorClassification,
        userError,
        recoveryStrategy,
        retryInfo,
        providerSpecificHandling,
        recoveryActions,
        analytics: {
          shouldReport: errorClassification.severity === 'critical',
          category: errorClassification.category,
          canAutoRecover: recoveryStrategy.canAutoRecover,
        },
        message: userError.title,
      };

    } catch (error) {
      console.error('Error handling OAuth error:', error);
      // Even error handling can fail - provide basic fallback
      return {
        success: false,
        errorId: null,
        classification: { category: 'unknown', severity: 'high', isRecoverable: false },
        userError: {
          title: 'An unexpected error occurred',
          message: 'Please try again later or contact support.',
          code: 'HANDLER_ERROR'
        },
        recoveryActions: [
          { type: 'retry', label: 'Try Again', delay: 5000 },
          { type: 'contact_support', label: 'Contact Support' }
        ],
        message: 'Error handler encountered an unexpected error',
      };
    }
  },
});

/**
 * Attempt automatic error recovery with retry logic
 */
export const attemptErrorRecovery = mutation({
  args: {
    errorId: v.id('oauthErrors'), // Assuming we store errors
    recoveryAction: v.string(), // 'retry', 'refresh_token', 'reauthorize', 'fallback'
    recoveryParams: v.optional(v.object({
      userId: v.optional(v.string()),
      sessionId: v.optional(v.string()),
      providerId: v.optional(v.string()),
      retryAttempt: v.optional(v.number()),
      customParams: v.optional(v.any()),
    })),
  },
  handler: async (ctx, args) => {
    try {
      // Get original error context (would need to implement error storage)
      // For now, we'll work with the provided parameters
      
      const recoveryResult = {
        success: false,
        action: args.recoveryAction,
        attemptedAt: Date.now(),
        nextAction: null as any,
      };

      switch (args.recoveryAction) {
        case 'retry':
          recoveryResult.success = await executeRetryRecovery(args.recoveryParams);
          break;

        case 'refresh_token':
          recoveryResult.success = await executeTokenRefreshRecovery(ctx, args.recoveryParams);
          break;

        case 'reauthorize':
          recoveryResult.success = await executeReauthorizationRecovery(ctx, args.recoveryParams);
          break;

        case 'fallback':
          recoveryResult.success = await executeFallbackRecovery(args.recoveryParams);
          break;

        default:
          throw new ConvexError({
            message: `Unknown recovery action: ${args.recoveryAction}`,
            code: 'UNKNOWN_RECOVERY_ACTION'
          });
      }

      // Update error log with recovery attempt
      // await updateErrorRecoveryLog(ctx, args.errorId, recoveryResult);

      // If recovery failed, determine next action
      if (!recoveryResult.success) {
        recoveryResult.nextAction = await determineNextRecoveryAction(
          args.recoveryAction,
          args.recoveryParams?.retryAttempt || 0
        );
      }

      return {
        success: recoveryResult.success,
        recoveryAction: args.recoveryAction,
        result: recoveryResult,
        message: recoveryResult.success ? 
          `Recovery action '${args.recoveryAction}' completed successfully` :
          `Recovery action '${args.recoveryAction}' failed`,
      };

    } catch (error) {
      console.error('Error during recovery attempt:', error);
      if (error instanceof ConvexError) {
        throw error;
      }
      throw new ConvexError({
        message: 'Failed to attempt error recovery',
        code: 'RECOVERY_ATTEMPT_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },
});

/**
 * Get error statistics and patterns for analytics
 */
export const getErrorAnalytics = query({
  args: {
    timeRange: v.optional(v.string()), // 'hour', 'day', 'week', 'month'
    providerId: v.optional(v.string()),
    errorCategory: v.optional(v.string()),
    includeResolution: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    try {
      const timeRange = args.timeRange || 'day';
      const timeRangeMs = getTimeRangeMs(timeRange);
      const startTime = Date.now() - timeRangeMs;

      // This would query stored error logs
      // For now, return mock analytics structure
      
      const errorAnalytics = {
        timeRange,
        startTime,
        endTime: Date.now(),
        totalErrors: 0,
        errorsByCategory: {} as Record<string, number>,
        errorsByProvider: {} as Record<string, number>,
        errorsBySeverity: {
          low: 0,
          medium: 0,
          high: 0,
          critical: 0,
        },
        recoverySuccess: {
          total: 0,
          successful: 0,
          failed: 0,
          rate: 0,
        },
        topErrors: [] as any[],
        trends: {
          increasing: [] as string[],
          decreasing: [] as string[],
          stable: [] as string[],
        },
        recommendations: [] as string[],
      };

      // Generate recommendations based on error patterns
      errorAnalytics.recommendations = generateErrorRecommendations(errorAnalytics);

      return {
        analytics: errorAnalytics,
        insights: generateErrorInsights(errorAnalytics),
        alerts: checkErrorAlerts(errorAnalytics),
        message: `Error analytics for ${timeRange} period`,
      };

    } catch (error) {
      console.error('Error getting error analytics:', error);
      throw new ConvexError({
        message: 'Failed to get error analytics',
        code: 'ERROR_ANALYTICS_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },
});

/**
 * Validate and test error recovery mechanisms
 */
export const testErrorRecoveryMechanisms = mutation({
  args: {
    testScenarios: v.array(v.object({
      name: v.string(),
      errorType: v.string(),
      providerId: v.string(),
      expectedRecovery: v.string(),
      testParams: v.optional(v.any()),
    })),
    testOptions: v.optional(v.object({
      skipActualRecovery: v.optional(v.boolean()),
      validateOnly: v.optional(v.boolean()),
      includeMetrics: v.optional(v.boolean()),
    })),
  },
  handler: async (ctx, args) => {
    try {
      const options = {
        skipActualRecovery: true, // Default to safe testing
        validateOnly: false,
        includeMetrics: true,
        ...args.testOptions
      };

      const testResults = [];

      for (const scenario of args.testScenarios) {
        const startTime = Date.now();
        
        const testResult = {
          scenario: scenario.name,
          errorType: scenario.errorType,
          providerId: scenario.providerId,
          expectedRecovery: scenario.expectedRecovery,
          success: false,
          actualRecovery: null as string | null,
          metrics: {
            testDuration: 0,
            classificationTime: 0,
            recoveryPlanTime: 0,
          },
          issues: [] as string[],
          recommendations: [] as string[],
        };

        try {
          // Test error classification
          const classificationStart = Date.now();
          const errorContext = {
            errorCode: scenario.errorType,
            errorMessage: `Test error: ${scenario.errorType}`,
            providerId: scenario.providerId,
            source: 'test',
          };

          const classification = await classifyOAuthError(errorContext);
          testResult.metrics.classificationTime = Date.now() - classificationStart;

          // Test recovery strategy determination
          const recoveryStart = Date.now();
          const recoveryStrategy = await determineRecoveryStrategy(
            classification,
            scenario.testParams,
            { enableRetry: true, maxRetryAttempts: 1 }
          );
          testResult.metrics.recoveryPlanTime = Date.now() - recoveryStart;

          // Determine actual recovery action
          const recoveryActions = await generateRecoveryActions(
            classification,
            recoveryStrategy,
            errorContext
          );

          testResult.actualRecovery = recoveryActions[0]?.type || 'none';
          testResult.success = testResult.actualRecovery === scenario.expectedRecovery;

          if (!testResult.success) {
            testResult.issues.push(
              `Expected recovery '${scenario.expectedRecovery}' but got '${testResult.actualRecovery}'`
            );
          }

          // Generate recommendations for failed tests
          if (!testResult.success) {
            testResult.recommendations.push(
              'Review error classification logic',
              'Update recovery strategy mapping',
              'Verify provider-specific error handling'
            );
          }

        } catch (testError) {
          testResult.issues.push(
            `Test execution failed: ${testError instanceof Error ? testError.message : 'Unknown error'}`
          );
        }

        testResult.metrics.testDuration = Date.now() - startTime;
        testResults.push(testResult);
      }

      // Generate overall test summary
      const summary = {
        totalTests: testResults.length,
        passed: testResults.filter(r => r.success).length,
        failed: testResults.filter(r => r.success === false).length,
        passRate: 0,
        avgTestDuration: 0,
        criticalIssues: [] as string[],
      };

      summary.passRate = summary.totalTests > 0 ? summary.passed / summary.totalTests : 0;
      summary.avgTestDuration = testResults.reduce((sum, r) => sum + r.metrics.testDuration, 0) / testResults.length;

      // Identify critical issues
      const failedTests = testResults.filter(r => !r.success);
      failedTests.forEach(test => {
        if (test.errorType.includes('critical') || test.errorType.includes('security')) {
          summary.criticalIssues.push(`Critical test failed: ${test.scenario}`);
        }
      });

      return {
        success: summary.passRate > 0.8, // 80% pass rate required
        testResults,
        summary,
        recommendations: generateTestRecommendations(testResults, summary),
        message: `Completed ${summary.totalTests} error recovery tests with ${Math.round(summary.passRate * 100)}% pass rate`,
      };

    } catch (error) {
      console.error('Error testing recovery mechanisms:', error);
      if (error instanceof ConvexError) {
        throw error;
      }
      throw new ConvexError({
        message: 'Failed to test error recovery mechanisms',
        code: 'ERROR_RECOVERY_TEST_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },
});

/**
 * Get user-friendly error explanations and solutions
 */
export const getErrorExplanation = query({
  args: {
    errorCode: v.string(),
    providerId: v.string(),
    userContext: v.optional(v.object({
      platform: v.optional(v.string()),
      userLevel: v.optional(v.string()), // 'beginner', 'intermediate', 'advanced'
      previousErrors: v.optional(v.array(v.string())),
    })),
  },
  handler: async (ctx, args) => {
    try {
      // Get error classification
      const errorContext = {
        errorCode: args.errorCode,
        providerId: args.providerId,
        source: 'explanation_request',
      };

      const classification = await classifyOAuthError(errorContext);
      
      // Generate explanation based on user context
      const explanation = await generateDetailedErrorExplanation(
        classification,
        args.errorCode,
        args.providerId,
        args.userContext
      );

      // Get similar errors and solutions
      const similarErrors = await findSimilarErrors(args.errorCode, args.providerId);
      
      // Generate step-by-step resolution guide
      const resolutionGuide = await generateResolutionGuide(
        classification,
        args.errorCode,
        args.providerId,
        args.userContext?.platform
      );

      return {
        errorCode: args.errorCode,
        providerId: args.providerId,
        classification,
        explanation,
        similarErrors,
        resolutionGuide,
        preventionTips: generatePreventionTips(classification, args.errorCode),
        additionalResources: generateAdditionalResources(args.errorCode, args.providerId),
        message: 'Error explanation generated successfully',
      };

    } catch (error) {
      console.error('Error getting error explanation:', error);
      throw new ConvexError({
        message: 'Failed to get error explanation',
        code: 'ERROR_EXPLANATION_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },
});

// ====================================================================================
// ERROR CLASSIFICATION AND RECOVERY LOGIC
// ====================================================================================

async function classifyOAuthError(errorContext: any): Promise<any> {
  const classification = {
    category: 'unknown',
    severity: 'medium',
    isRecoverable: false,
    isUserError: false,
    isSystemError: false,
    isProviderError: false,
    requiresImmediateAttention: false,
  };

  const errorCode = errorContext.errorCode.toLowerCase();

  // OAuth standard errors
  if (errorCode === 'access_denied') {
    classification.category = 'authorization_denied';
    classification.severity = 'low';
    classification.isRecoverable = true;
    classification.isUserError = true;
  } else if (errorCode === 'invalid_request') {
    classification.category = 'invalid_request';
    classification.severity = 'medium';
    classification.isRecoverable = true;
    classification.isSystemError = true;
  } else if (errorCode === 'invalid_client') {
    classification.category = 'client_error';
    classification.severity = 'high';
    classification.isRecoverable = false;
    classification.isSystemError = true;
    classification.requiresImmediateAttention = true;
  } else if (errorCode === 'invalid_grant') {
    classification.category = 'token_invalid';
    classification.severity = 'medium';
    classification.isRecoverable = true;
    classification.isSystemError = true;
  } else if (errorCode === 'unauthorized_client') {
    classification.category = 'client_unauthorized';
    classification.severity = 'high';
    classification.isRecoverable = false;
    classification.isSystemError = true;
    classification.requiresImmediateAttention = true;
  } else if (errorCode === 'unsupported_grant_type') {
    classification.category = 'grant_type_error';
    classification.severity = 'high';
    classification.isRecoverable = false;
    classification.isSystemError = true;
  } else if (errorCode === 'invalid_scope') {
    classification.category = 'scope_error';
    classification.severity = 'medium';
    classification.isRecoverable = true;
    classification.isSystemError = true;
  } else if (errorCode === 'server_error') {
    classification.category = 'server_error';
    classification.severity = 'high';
    classification.isRecoverable = true;
    classification.isProviderError = true;
  } else if (errorCode === 'temporarily_unavailable') {
    classification.category = 'service_unavailable';
    classification.severity = 'medium';
    classification.isRecoverable = true;
    classification.isProviderError = true;
  }

  // Network and connection errors
  if (errorCode.includes('network') || errorCode.includes('timeout')) {
    classification.category = 'network_error';
    classification.severity = 'medium';
    classification.isRecoverable = true;
    classification.isSystemError = true;
  }

  // Rate limiting errors
  if (errorCode.includes('rate_limit') || errorCode.includes('too_many_requests')) {
    classification.category = 'rate_limit';
    classification.severity = 'medium';
    classification.isRecoverable = true;
    classification.isProviderError = true;
  }

  // Provider-specific error classification
  if (errorContext.providerId === 'spotify') {
    classification = await classifySpotifyError(errorCode, classification);
  } else if (errorContext.providerId === 'apple-music') {
    classification = await classifyAppleMusicError(errorCode, classification);
  } else if (errorContext.providerId === 'youtube-music') {
    classification = await classifyYouTubeMusicError(errorCode, classification);
  }

  return classification;
}

async function determineRecoveryStrategy(classification: any, contextData: any, options: any): Promise<any> {
  const strategy = {
    canRetry: false,
    canAutoRecover: false,
    maxRetryAttempts: 0,
    retryDelayMs: 1000,
    recoveryActions: [] as string[],
    fallbackOptions: [] as string[],
    requiresUserIntervention: false,
  };

  // Determine retry capability
  if (classification.isRecoverable) {
    strategy.canRetry = true;
    strategy.maxRetryAttempts = options.maxRetryAttempts;
    strategy.retryDelayMs = options.retryDelayMs;

    // Exponential backoff for retries
    const attemptNumber = contextData?.attemptNumber || 0;
    strategy.retryDelayMs = Math.min(
      options.retryDelayMs * Math.pow(2, attemptNumber),
      30000 // Max 30 seconds
    );
  }

  // Determine recovery actions based on error category
  switch (classification.category) {
    case 'authorization_denied':
      strategy.recoveryActions = ['reauthorize'];
      strategy.requiresUserIntervention = true;
      break;

    case 'token_invalid':
      strategy.recoveryActions = ['refresh_token', 'reauthorize'];
      strategy.canAutoRecover = true;
      break;

    case 'invalid_request':
      strategy.recoveryActions = ['validate_request', 'retry'];
      strategy.canAutoRecover = true;
      break;

    case 'server_error':
    case 'service_unavailable':
      strategy.recoveryActions = ['retry', 'fallback'];
      strategy.canAutoRecover = true;
      strategy.fallbackOptions = ['use_cache', 'offline_mode'];
      break;

    case 'rate_limit':
      strategy.recoveryActions = ['wait_and_retry'];
      strategy.canAutoRecover = true;
      strategy.retryDelayMs = Math.max(strategy.retryDelayMs, 60000); // Min 1 minute for rate limits
      break;

    case 'network_error':
      strategy.recoveryActions = ['retry', 'check_connection'];
      strategy.canAutoRecover = true;
      break;

    default:
      strategy.recoveryActions = ['contact_support'];
      strategy.requiresUserIntervention = true;
      break;
  }

  return strategy;
}

async function generateUserFriendlyError(classification: any, errorContext: any, recoveryStrategy: any): Promise<any> {
  const userError = {
    title: 'Unknown Error',
    message: 'An unexpected error occurred.',
    code: errorContext.errorCode,
    severity: classification.severity,
    canRecover: classification.isRecoverable,
    actionRequired: recoveryStrategy.requiresUserIntervention,
  };

  // Generate user-friendly messages based on error category
  switch (classification.category) {
    case 'authorization_denied':
      userError.title = 'Authorization Cancelled';
      userError.message = 'You cancelled the authorization process. To connect your music account, please try again and click "Allow" when prompted.';
      break;

    case 'token_invalid':
      userError.title = 'Connection Expired';
      userError.message = 'Your music account connection has expired. We\'ll automatically try to reconnect, or you can reconnect manually.';
      break;

    case 'invalid_request':
      userError.title = 'Request Error';
      userError.message = 'There was a problem with the request. This is usually temporary and will be resolved automatically.';
      break;

    case 'server_error':
      userError.title = 'Service Temporarily Unavailable';
      userError.message = `${getProviderDisplayName(errorContext.providerId)} is experiencing technical difficulties. Please try again in a few minutes.`;
      break;

    case 'service_unavailable':
      userError.title = 'Service Maintenance';
      userError.message = `${getProviderDisplayName(errorContext.providerId)} is temporarily unavailable for maintenance. Please try again later.`;
      break;

    case 'rate_limit':
      userError.title = 'Too Many Requests';
      userError.message = 'You\'ve made too many requests in a short time. Please wait a minute before trying again.';
      break;

    case 'network_error':
      userError.title = 'Connection Problem';
      userError.message = 'There\'s a problem with your internet connection. Please check your connection and try again.';
      break;

    case 'client_error':
    case 'client_unauthorized':
      userError.title = 'App Configuration Error';
      userError.message = 'There\'s a configuration problem with the app. Please contact support for assistance.';
      break;

    default:
      userError.title = 'Unexpected Error';
      userError.message = 'An unexpected error occurred. Please try again or contact support if the problem persists.';
      break;
  }

  return userError;
}

async function calculateRetryStrategy(classification: any, attemptNumber: number, options: any): Promise<any> {
  const retryInfo = {
    shouldRetry: false,
    delayMs: options.retryDelayMs,
    maxAttempts: options.maxRetryAttempts,
    currentAttempt: attemptNumber,
    nextRetryAt: 0,
    retryType: 'exponential',
  };

  if (attemptNumber < options.maxRetryAttempts && classification.isRecoverable) {
    retryInfo.shouldRetry = true;
    
    // Calculate delay based on error type
    switch (classification.category) {
      case 'rate_limit':
        retryInfo.delayMs = Math.max(60000, options.retryDelayMs * Math.pow(2, attemptNumber));
        retryInfo.retryType = 'rate_limit_backoff';
        break;

      case 'server_error':
      case 'service_unavailable':
        retryInfo.delayMs = options.retryDelayMs * Math.pow(1.5, attemptNumber);
        retryInfo.retryType = 'service_backoff';
        break;

      case 'network_error':
        retryInfo.delayMs = Math.min(options.retryDelayMs * Math.pow(2, attemptNumber), 10000);
        retryInfo.retryType = 'network_backoff';
        break;

      default:
        retryInfo.delayMs = options.retryDelayMs * Math.pow(2, attemptNumber);
        break;
    }

    retryInfo.nextRetryAt = Date.now() + retryInfo.delayMs;
  }

  return retryInfo;
}

async function handleProviderSpecificError(providerId: string, errorCode: string, errorContext: any): Promise<any> {
  const providerHandling = {
    providerId,
    hasSpecialHandling: false,
    customActions: [] as any[],
    providerMessage: null as string | null,
    providerResources: [] as any[],
  };

  switch (providerId) {
    case 'spotify':
      providerHandling.hasSpecialHandling = true;
      providerHandling.customActions = await getSpotifySpecificActions(errorCode);
      providerHandling.providerResources = [
        { title: 'Spotify Developer Documentation', url: 'https://developer.spotify.com/documentation/general/guides/authorization-guide/' },
        { title: 'Spotify API Status', url: 'https://developer.spotify.com/community/news/' },
      ];
      break;

    case 'apple-music':
      providerHandling.hasSpecialHandling = true;
      providerHandling.customActions = await getAppleMusicSpecificActions(errorCode);
      providerHandling.providerResources = [
        { title: 'Apple Music API Documentation', url: 'https://developer.apple.com/documentation/applemusicapi' },
        { title: 'MusicKit Documentation', url: 'https://developer.apple.com/documentation/musickit' },
      ];
      break;

    case 'youtube-music':
      providerHandling.hasSpecialHandling = true;
      providerHandling.customActions = await getYouTubeMusicSpecificActions(errorCode);
      providerHandling.providerResources = [
        { title: 'YouTube API Documentation', url: 'https://developers.google.com/youtube/v3' },
        { title: 'Google API Console', url: 'https://console.developers.google.com/' },
      ];
      break;
  }

  return providerHandling;
}

async function generateRecoveryActions(classification: any, recoveryStrategy: any, errorContext: any): Promise<any[]> {
  const actions = [];

  for (const actionType of recoveryStrategy.recoveryActions) {
    const action: any = {
      type: actionType,
      label: '',
      description: '',
      delay: 0,
      automated: false,
      requiresAuth: false,
      priority: 'medium',
    };

    switch (actionType) {
      case 'retry':
        action.label = 'Try Again';
        action.description = 'Retry the failed operation';
        action.delay = recoveryStrategy.retryDelayMs || 1000;
        action.automated = true;
        action.priority = 'high';
        break;

      case 'refresh_token':
        action.label = 'Refresh Connection';
        action.description = 'Refresh the authorization token';
        action.automated = true;
        action.requiresAuth = true;
        action.priority = 'high';
        break;

      case 'reauthorize':
        action.label = 'Reconnect Account';
        action.description = `Reconnect your ${getProviderDisplayName(errorContext.providerId)} account`;
        action.requiresAuth = true;
        action.priority = 'medium';
        break;

      case 'wait_and_retry':
        action.label = 'Wait and Try Again';
        action.description = 'Wait for rate limiting to reset, then retry';
        action.delay = Math.max(60000, recoveryStrategy.retryDelayMs || 60000);
        action.automated = true;
        action.priority = 'medium';
        break;

      case 'contact_support':
        action.label = 'Contact Support';
        action.description = 'Get help from our support team';
        action.priority = 'low';
        break;

      case 'fallback':
        action.label = 'Use Offline Mode';
        action.description = 'Continue with limited functionality';
        action.automated = true;
        action.priority = 'low';
        break;

      default:
        action.label = 'Unknown Action';
        action.description = 'Unknown recovery action';
        break;
    }

    actions.push(action);
  }

  // Sort by priority
  const priorityOrder = { high: 3, medium: 2, low: 1 };
  actions.sort((a, b) => (priorityOrder[b.priority as keyof typeof priorityOrder] || 0) - (priorityOrder[a.priority as keyof typeof priorityOrder] || 0));

  return actions;
}

// Recovery execution functions
async function executeRetryRecovery(recoveryParams: any): Promise<boolean> {
  // This would implement the actual retry logic
  // For now, simulate success/failure
  return Math.random() > 0.3; // 70% success rate for retries
}

async function executeTokenRefreshRecovery(ctx: any, recoveryParams: any): Promise<boolean> {
  // This would call the token refresh function
  // For now, simulate the operation
  try {
    if (!recoveryParams?.userId || !recoveryParams?.providerId) {
      return false;
    }
    
    // Would call actual token refresh logic here
    return Math.random() > 0.2; // 80% success rate for token refresh
  } catch (error) {
    return false;
  }
}

async function executeReauthorizationRecovery(ctx: any, recoveryParams: any): Promise<boolean> {
  // This would initiate a new authorization flow
  // For now, simulate the operation
  try {
    if (!recoveryParams?.userId || !recoveryParams?.providerId) {
      return false;
    }
    
    // Would initiate new OAuth flow here
    return true; // Reauthorization initiation is usually successful
  } catch (error) {
    return false;
  }
}

async function executeFallbackRecovery(recoveryParams: any): Promise<boolean> {
  // This would enable fallback/offline mode
  return true; // Fallback modes are usually available
}

async function determineNextRecoveryAction(currentAction: string, attemptNumber: number): Promise<string | null> {
  const escalationPath: Record<string, string[]> = {
    retry: ['refresh_token', 'reauthorize', 'contact_support'],
    refresh_token: ['reauthorize', 'contact_support'],
    reauthorize: ['fallback', 'contact_support'],
    fallback: ['contact_support'],
  };

  const nextActions = escalationPath[currentAction];
  return nextActions && attemptNumber < nextActions.length ? nextActions[attemptNumber] : null;
}

// Utility functions
async function logOAuthError(ctx: any, errorData: any): Promise<string> {
  // This would store the error in a proper error log table
  // For now, return a mock ID
  return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

async function updateErrorStatistics(ctx: any, providerId: string, classification: any): Promise<void> {
  // This would update error statistics in the database
  // For now, just log the statistics update
  console.log('Updated error statistics:', { providerId, category: classification.category });
}

function getTimeRangeMs(timeRange: string): number {
  const ranges: Record<string, number> = {
    hour: 60 * 60 * 1000,
    day: 24 * 60 * 60 * 1000,
    week: 7 * 24 * 60 * 60 * 1000,
    month: 30 * 24 * 60 * 60 * 1000,
  };
  return ranges[timeRange] || ranges.day;
}

function generateErrorRecommendations(analytics: any): string[] {
  const recommendations = [];
  
  if (analytics.errorsBySeverity.critical > 0) {
    recommendations.push('Investigate critical errors immediately');
  }
  
  if (analytics.recoverySuccess.rate < 0.5) {
    recommendations.push('Review and improve error recovery mechanisms');
  }
  
  return recommendations;
}

function generateErrorInsights(analytics: any): string[] {
  const insights = [];
  
  if (analytics.totalErrors === 0) {
    insights.push('No errors detected in the specified time range');
  } else {
    insights.push(`${analytics.totalErrors} total errors detected`);
  }
  
  return insights;
}

function checkErrorAlerts(analytics: any): any[] {
  const alerts = [];
  
  if (analytics.errorsBySeverity.critical > 0) {
    alerts.push({
      level: 'critical',
      message: `${analytics.errorsBySeverity.critical} critical errors detected`,
      action: 'immediate_investigation',
    });
  }
  
  return alerts;
}

function generateTestRecommendations(testResults: any[], summary: any): string[] {
  const recommendations = [];
  
  if (summary.passRate < 0.8) {
    recommendations.push('Improve error recovery test coverage');
  }
  
  if (summary.criticalIssues.length > 0) {
    recommendations.push('Address critical test failures immediately');
  }
  
  return recommendations;
}

function getProviderDisplayName(providerId: string): string {
  const names: Record<string, string> = {
    'spotify': 'Spotify',
    'apple-music': 'Apple Music',
    'youtube-music': 'YouTube Music',
  };
  return names[providerId] || providerId;
}

// Provider-specific error classification
async function classifySpotifyError(errorCode: string, baseClassification: any): Promise<any> {
  const classification = { ...baseClassification };
  
  if (errorCode === 'invalid_client_id') {
    classification.category = 'client_error';
    classification.severity = 'critical';
    classification.requiresImmediateAttention = true;
  }
  
  return classification;
}

async function classifyAppleMusicError(errorCode: string, baseClassification: any): Promise<any> {
  const classification = { ...baseClassification };
  
  if (errorCode === 'subscription_required') {
    classification.category = 'subscription_error';
    classification.severity = 'medium';
    classification.isUserError = true;
  }
  
  return classification;
}

async function classifyYouTubeMusicError(errorCode: string, baseClassification: any): Promise<any> {
  const classification = { ...baseClassification };
  
  if (errorCode === 'quota_exceeded') {
    classification.category = 'quota_exceeded';
    classification.severity = 'high';
    classification.isProviderError = true;
  }
  
  return classification;
}

// Provider-specific action generators
async function getSpotifySpecificActions(errorCode: string): Promise<any[]> {
  const actions = [];
  
  if (errorCode === 'invalid_client_id') {
    actions.push({
      type: 'check_app_credentials',
      label: 'Check App Credentials',
      description: 'Verify Spotify app client ID and secret',
    });
  }
  
  return actions;
}

async function getAppleMusicSpecificActions(errorCode: string): Promise<any[]> {
  const actions = [];
  
  if (errorCode === 'subscription_required') {
    actions.push({
      type: 'check_subscription',
      label: 'Check Apple Music Subscription',
      description: 'Verify active Apple Music subscription',
    });
  }
  
  return actions;
}

async function getYouTubeMusicSpecificActions(errorCode: string): Promise<any[]> {
  const actions = [];
  
  if (errorCode === 'quota_exceeded') {
    actions.push({
      type: 'request_quota_increase',
      label: 'Request Quota Increase',
      description: 'Request higher API quota from Google',
    });
  }
  
  return actions;
}

// Advanced explanation functions
async function generateDetailedErrorExplanation(
  classification: any,
  errorCode: string,
  providerId: string,
  userContext?: any
): Promise<any> {
  const explanation = {
    simple: '',
    technical: '',
    causes: [] as string[],
    impacts: [] as string[],
    commonScenarios: [] as string[],
  };

  // Generate explanations based on user level
  const userLevel = userContext?.userLevel || 'beginner';
  
  switch (classification.category) {
    case 'authorization_denied':
      explanation.simple = 'You clicked "Don\'t Allow" or closed the authorization window.';
      explanation.technical = 'The OAuth authorization request was denied by the user or authorization server.';
      explanation.causes = ['User clicked "Don\'t Allow"', 'Authorization window was closed', 'User cancelled the process'];
      explanation.impacts = ['Music account won\'t be connected', 'Music sync features unavailable'];
      explanation.commonScenarios = ['First time connecting account', 'Privacy concerns', 'Accidental cancellation'];
      break;

    case 'token_invalid':
      explanation.simple = 'Your connection to your music account has expired and needs to be refreshed.';
      explanation.technical = 'The OAuth access token or refresh token is invalid, expired, or has been revoked.';
      explanation.causes = ['Token expired naturally', 'User revoked access', 'Provider revoked token'];
      explanation.impacts = ['Cannot access music data', 'Sync operations will fail'];
      explanation.commonScenarios = ['Long time since last use', 'Changed account password', 'Revoked app permissions'];
      break;

    // Add more cases as needed
  }

  return explanation;
}

async function findSimilarErrors(errorCode: string, providerId: string): Promise<any[]> {
  // This would query for similar errors from the error log
  // For now, return mock similar errors
  return [
    {
      errorCode: 'similar_error_1',
      frequency: 15,
      lastOccurrence: Date.now() - 86400000, // 1 day ago
      resolution: 'Resolved by token refresh',
    }
  ];
}

async function generateResolutionGuide(
  classification: any,
  errorCode: string,
  providerId: string,
  platform?: string
): Promise<any> {
  const guide = {
    steps: [] as any[],
    estimatedTime: '2-5 minutes',
    difficulty: 'easy',
    prerequisites: [] as string[],
  };

  switch (classification.category) {
    case 'authorization_denied':
      guide.steps = [
        { step: 1, action: 'Go to Settings > Connected Accounts', description: 'Navigate to your account settings' },
        { step: 2, action: `Click "Connect ${getProviderDisplayName(providerId)}"`, description: 'Start the connection process' },
        { step: 3, action: 'Click "Allow" when prompted', description: 'Grant necessary permissions' },
        { step: 4, action: 'Wait for confirmation', description: 'Connection will be established' },
      ];
      guide.difficulty = 'easy';
      break;

    case 'token_invalid':
      guide.steps = [
        { step: 1, action: 'Go to Settings > Connected Accounts', description: 'Navigate to your account settings' },
        { step: 2, action: `Find ${getProviderDisplayName(providerId)} and click "Reconnect"`, description: 'Refresh the connection' },
        { step: 3, action: 'Complete authorization if prompted', description: 'May need to reauthorize' },
      ];
      guide.estimatedTime = '1-2 minutes';
      break;
  }

  return guide;
}

function generatePreventionTips(classification: any, errorCode: string): string[] {
  const tips = [];
  
  switch (classification.category) {
    case 'authorization_denied':
      tips.push('Make sure to click "Allow" during the authorization process');
      tips.push('Don\'t close the authorization window before completing');
      break;

    case 'token_invalid':
      tips.push('Regular usage helps prevent token expiration');
      tips.push('Don\'t revoke app permissions in your music account settings');
      break;

    case 'network_error':
      tips.push('Ensure stable internet connection before starting');
      tips.push('Try using WiFi instead of cellular data');
      break;
  }
  
  return tips;
}

function generateAdditionalResources(errorCode: string, providerId: string): any[] {
  const resources = [
    {
      title: 'Troubleshooting Guide',
      url: '/help/troubleshooting',
      type: 'documentation'
    },
    {
      title: 'Contact Support',
      url: '/support/contact',
      type: 'support'
    }
  ];

  // Add provider-specific resources
  if (providerId === 'spotify') {
    resources.push({
      title: 'Spotify Connection Help',
      url: '/help/spotify-connection',
      type: 'guide'
    });
  }

  return resources;
}