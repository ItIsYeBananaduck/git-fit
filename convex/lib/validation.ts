/**
 * Comprehensive Entity Validation Rules for OAuth & Platform-Specific UI
 * Ensures data integrity across all database entities
 */

import { ConvexError } from 'convex/values';

// Base validation types
type ValidationResult = {
  isValid: boolean;
  errors: string[];
  warnings: string[];
};

type EntityValidationRule<T> = (entity: T) => ValidationResult;

// Utility functions for common validations
export class ValidationUtils {
  // Email validation
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // URL validation
  static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  // Color hex validation
  static isValidHexColor(color: string): boolean {
    const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    return hexRegex.test(color);
  }

  // Timestamp validation (must be positive and reasonable)
  static isValidTimestamp(timestamp: number): boolean {
    const now = Date.now();
    const oneYearAgo = now - (365 * 24 * 60 * 60 * 1000);
    const oneYearFromNow = now + (365 * 24 * 60 * 60 * 1000);
    return timestamp > 0 && timestamp >= oneYearAgo && timestamp <= oneYearFromNow * 2;
  }

  // Range validation
  static isInRange(value: number, min: number, max: number): boolean {
    return value >= min && value <= max;
  }

  // Array not empty
  static isNonEmptyArray<T>(arr: T[]): boolean {
    return Array.isArray(arr) && arr.length > 0;
  }

  // String length validation
  static isValidStringLength(str: string, minLength: number, maxLength: number): boolean {
    return str.length >= minLength && str.length <= maxLength;
  }

  // Platform validation
  static isValidPlatform(platform: string): boolean {
    const validPlatforms = ['ios', 'android', 'web', 'desktop'];
    return validPlatforms.includes(platform);
  }

  // OAuth provider validation
  static isValidOAuthProvider(providerId: string): boolean {
    const validProviders = ['spotify', 'apple_music', 'youtube_music', 'amazon_music'];
    return validProviders.includes(providerId);
  }

  // BPM validation (reasonable tempo range)
  static isValidBPM(bpm: number): boolean {
    return this.isInRange(bpm, 40, 200);
  }

  // Duration validation (reasonable range in milliseconds)
  static isValidDuration(durationMs: number): boolean {
    const oneMinute = 60 * 1000;
    const tenMinutes = 10 * oneMinute;
    return this.isInRange(durationMs, 5000, tenMinutes); // 5 seconds to 10 minutes
  }
}

// OAuth Provider validation
export const validateOAuthProvider: EntityValidationRule<any> = (provider) => {
  const result: ValidationResult = { isValid: true, errors: [], warnings: [] };

  // Required fields
  if (!provider.id || !ValidationUtils.isValidStringLength(provider.id, 1, 50)) {
    result.errors.push('Provider ID is required and must be 1-50 characters');
  }

  if (!provider.name || !ValidationUtils.isValidStringLength(provider.name, 1, 100)) {
    result.errors.push('Provider name is required and must be 1-100 characters');
  }

  if (!provider.displayName || !ValidationUtils.isValidStringLength(provider.displayName, 1, 100)) {
    result.errors.push('Display name is required and must be 1-100 characters');
  }

  // URL validations
  if (!ValidationUtils.isValidUrl(provider.authEndpoint)) {
    result.errors.push('Auth endpoint must be a valid URL');
  }

  if (!ValidationUtils.isValidUrl(provider.tokenEndpoint)) {
    result.errors.push('Token endpoint must be a valid URL');
  }

  if (provider.revokeEndpoint && !ValidationUtils.isValidUrl(provider.revokeEndpoint)) {
    result.errors.push('Revoke endpoint must be a valid URL if provided');
  }

  // Scopes validation
  if (!ValidationUtils.isNonEmptyArray(provider.scopes)) {
    result.errors.push('At least one scope is required');
  }

  if (!ValidationUtils.isNonEmptyArray(provider.defaultScopes)) {
    result.errors.push('At least one default scope is required');
  }

  // Platform support validation
  if (!ValidationUtils.isNonEmptyArray(provider.supportedPlatforms)) {
    result.errors.push('At least one supported platform is required');
  } else {
    const invalidPlatforms = provider.supportedPlatforms.filter(
      (platform: string) => !ValidationUtils.isValidPlatform(platform)
    );
    if (invalidPlatforms.length > 0) {
      result.errors.push(`Invalid platforms: ${invalidPlatforms.join(', ')}`);
    }
  }

  // Feature validation
  if (provider.features) {
    if (typeof provider.features.rateLimitRpm !== 'number' || provider.features.rateLimitRpm <= 0) {
      result.errors.push('Rate limit RPM must be a positive number');
    }

    if (typeof provider.features.maxTokenLifetime !== 'number' || provider.features.maxTokenLifetime <= 0) {
      result.errors.push('Max token lifetime must be a positive number');
    }
  }

  // Color validation
  if (provider.brandColor && !ValidationUtils.isValidHexColor(provider.brandColor)) {
    result.warnings.push('Brand color should be a valid hex color');
  }

  if (provider.brandColorDark && !ValidationUtils.isValidHexColor(provider.brandColorDark)) {
    result.warnings.push('Brand color dark should be a valid hex color');
  }

  // Timestamp validation
  if (!ValidationUtils.isValidTimestamp(provider.createdAt)) {
    result.errors.push('Created at timestamp is invalid');
  }

  if (!ValidationUtils.isValidTimestamp(provider.updatedAt)) {
    result.errors.push('Updated at timestamp is invalid');
  }

  result.isValid = result.errors.length === 0;
  return result;
};

// User OAuth Connection validation
export const validateUserOAuthConnection: EntityValidationRule<any> = (connection) => {
  const result: ValidationResult = { isValid: true, errors: [], warnings: [] };

  // Required fields
  if (!connection.userId || !ValidationUtils.isValidStringLength(connection.userId, 1, 100)) {
    result.errors.push('User ID is required and must be valid');
  }

  if (!ValidationUtils.isValidOAuthProvider(connection.providerId)) {
    result.errors.push('Provider ID must be a valid OAuth provider');
  }

  if (!connection.externalUserId || !ValidationUtils.isValidStringLength(connection.externalUserId, 1, 200)) {
    result.errors.push('External user ID is required and must be valid');
  }

  // Token validation
  if (!connection.accessToken || connection.accessToken.length < 10) {
    result.errors.push('Access token is required and must be properly encrypted');
  }

  // Token expiry validation
  if (!ValidationUtils.isValidTimestamp(connection.tokenExpiry)) {
    result.errors.push('Token expiry must be a valid timestamp');
  } else if (connection.tokenExpiry <= Date.now()) {
    result.warnings.push('Token has already expired');
  }

  // Scopes validation
  if (!ValidationUtils.isNonEmptyArray(connection.scopes)) {
    result.errors.push('At least one scope is required');
  }

  // Status validation
  const validStatuses = ['connected', 'expired', 'revoked', 'error'];
  if (!validStatuses.includes(connection.status)) {
    result.errors.push(`Status must be one of: ${validStatuses.join(', ')}`);
  }

  // Retry validation
  if (typeof connection.retryCount !== 'number' || connection.retryCount < 0) {
    result.errors.push('Retry count must be a non-negative number');
  }

  if (typeof connection.maxRetries !== 'number' || connection.maxRetries <= 0) {
    result.errors.push('Max retries must be a positive number');
  }

  if (connection.retryCount > connection.maxRetries) {
    result.warnings.push('Retry count exceeds max retries limit');
  }

  // Email validation if provided
  if (connection.email && !ValidationUtils.isValidEmail(connection.email)) {
    result.warnings.push('Email should be valid if provided');
  }

  // Timestamp validation
  if (!ValidationUtils.isValidTimestamp(connection.createdAt)) {
    result.errors.push('Created at timestamp is invalid');
  }

  if (!ValidationUtils.isValidTimestamp(connection.updatedAt)) {
    result.errors.push('Updated at timestamp is invalid');
  }

  result.isValid = result.errors.length === 0;
  return result;
};

// Music Profile validation
export const validateMusicProfile: EntityValidationRule<any> = (profile) => {
  const result: ValidationResult = { isValid: true, errors: [], warnings: [] };

  // Required fields
  if (!profile.userId || !ValidationUtils.isValidStringLength(profile.userId, 1, 100)) {
    result.errors.push('User ID is required and must be valid');
  }

  // Version validation
  if (!profile.profileVersion || !ValidationUtils.isValidStringLength(profile.profileVersion, 1, 10)) {
    result.errors.push('Profile version is required');
  }

  // Sync status validation
  const validSyncStatuses = ['syncing', 'completed', 'error', 'paused'];
  if (!validSyncStatuses.includes(profile.syncStatus)) {
    result.errors.push(`Sync status must be one of: ${validSyncStatuses.join(', ')}`);
  }

  // Top genres validation
  if (profile.topGenres && Array.isArray(profile.topGenres)) {
    for (const [index, genre] of profile.topGenres.entries()) {
      if (!genre.name || !ValidationUtils.isValidStringLength(genre.name, 1, 50)) {
        result.errors.push(`Genre ${index + 1}: name is required and must be valid`);
      }

      if (!ValidationUtils.isInRange(genre.confidence, 0, 1)) {
        result.errors.push(`Genre ${index + 1}: confidence must be between 0 and 1`);
      }

      if (!ValidationUtils.isInRange(genre.workoutSuitability, 0, 1)) {
        result.errors.push(`Genre ${index + 1}: workout suitability must be between 0 and 1`);
      }

      if (!ValidationUtils.isInRange(genre.popularity, 0, 100)) {
        result.errors.push(`Genre ${index + 1}: popularity must be between 0 and 100`);
      }
    }
  }

  // Top tracks validation
  if (profile.topTracks && Array.isArray(profile.topTracks)) {
    for (const [index, track] of profile.topTracks.entries()) {
      if (!track.name || !ValidationUtils.isValidStringLength(track.name, 1, 200)) {
        result.errors.push(`Track ${index + 1}: name is required and must be valid`);
      }

      if (!track.artist || !ValidationUtils.isValidStringLength(track.artist, 1, 200)) {
        result.errors.push(`Track ${index + 1}: artist is required and must be valid`);
      }

      // Audio features validation
      if (!ValidationUtils.isInRange(track.energy, 0, 1)) {
        result.errors.push(`Track ${index + 1}: energy must be between 0 and 1`);
      }

      if (!ValidationUtils.isValidBPM(track.tempo)) {
        result.errors.push(`Track ${index + 1}: tempo must be between 40 and 200 BPM`);
      }

      if (!ValidationUtils.isInRange(track.danceability, 0, 1)) {
        result.errors.push(`Track ${index + 1}: danceability must be between 0 and 1`);
      }

      if (!ValidationUtils.isInRange(track.valence, 0, 1)) {
        result.errors.push(`Track ${index + 1}: valence must be between 0 and 1`);
      }

      // Duration validation
      if (!ValidationUtils.isValidDuration(track.durationMs)) {
        result.warnings.push(`Track ${index + 1}: unusual duration detected`);
      }

      // Popularity validation
      if (!ValidationUtils.isInRange(track.popularity, 0, 100)) {
        result.errors.push(`Track ${index + 1}: popularity must be between 0 and 100`);
      }
    }
  }

  // Workout preferences validation
  if (profile.workoutPreferences) {
    const prefs = profile.workoutPreferences;

    // Energy range validation
    if (prefs.energyRange) {
      if (!ValidationUtils.isInRange(prefs.energyRange.min, 0, 1) ||
          !ValidationUtils.isInRange(prefs.energyRange.max, 0, 1) ||
          !ValidationUtils.isInRange(prefs.energyRange.preferred, 0, 1)) {
        result.errors.push('Energy range values must be between 0 and 1');
      }

      if (prefs.energyRange.min > prefs.energyRange.max) {
        result.errors.push('Energy range minimum cannot be greater than maximum');
      }
    }

    // Tempo range validation
    if (prefs.tempoRange) {
      if (!ValidationUtils.isValidBPM(prefs.tempoRange.min) ||
          !ValidationUtils.isValidBPM(prefs.tempoRange.max) ||
          !ValidationUtils.isValidBPM(prefs.tempoRange.preferred)) {
        result.errors.push('Tempo range values must be valid BPM values');
      }

      if (prefs.tempoRange.min > prefs.tempoRange.max) {
        result.errors.push('Tempo range minimum cannot be greater than maximum');
      }
    }

    // Max track length validation
    if (prefs.maxTrackLength && (prefs.maxTrackLength <= 0 || prefs.maxTrackLength > 1800)) {
      result.warnings.push('Max track length should be between 1 and 1800 seconds');
    }
  }

  // Timestamps validation
  if (!ValidationUtils.isValidTimestamp(profile.createdAt)) {
    result.errors.push('Created at timestamp is invalid');
  }

  if (!ValidationUtils.isValidTimestamp(profile.lastUpdated)) {
    result.errors.push('Last updated timestamp is invalid');
  }

  result.isValid = result.errors.length === 0;
  return result;
};

// Platform UI State validation
export const validatePlatformUIState: EntityValidationRule<any> = (uiState) => {
  const result: ValidationResult = { isValid: true, errors: [], warnings: [] };

  // Required fields
  if (!uiState.userId || !ValidationUtils.isValidStringLength(uiState.userId, 1, 100)) {
    result.errors.push('User ID is required and must be valid');
  }

  if (!ValidationUtils.isValidPlatform(uiState.platform)) {
    result.errors.push('Platform must be a valid platform type');
  }

  // Device info validation
  if (uiState.deviceInfo) {
    const device = uiState.deviceInfo;

    // Screen size validation
    if (device.screenSize) {
      if (device.screenSize.width <= 0 || device.screenSize.height <= 0) {
        result.errors.push('Screen dimensions must be positive numbers');
      }

      if (device.screenSize.density <= 0) {
        result.errors.push('Screen density must be a positive number');
      }

      if (device.screenSize.aspectRatio <= 0) {
        result.warnings.push('Screen aspect ratio should be a positive number');
      }
    }

    // Runtime info validation
    if (device.runtimeInfo) {
      if (!device.runtimeInfo.appVersion || !ValidationUtils.isValidStringLength(device.runtimeInfo.appVersion, 1, 20)) {
        result.errors.push('App version is required and must be valid');
      }

      if (!device.runtimeInfo.buildNumber || !ValidationUtils.isValidStringLength(device.runtimeInfo.buildNumber, 1, 20)) {
        result.errors.push('Build number is required and must be valid');
      }

      const validEnvironments = ['development', 'staging', 'production'];
      if (!validEnvironments.includes(device.runtimeInfo.environment)) {
        result.errors.push(`Environment must be one of: ${validEnvironments.join(', ')}`);
      }
    }
  }

  // UI Preferences validation
  if (uiState.uiPreferences) {
    const prefs = uiState.uiPreferences;

    // Theme validation
    const validThemes = ['light', 'dark', 'system', 'high_contrast'];
    if (!validThemes.includes(prefs.theme)) {
      result.errors.push(`Theme must be one of: ${validThemes.join(', ')}`);
    }

    // Font size validation
    const validFontSizes = ['small', 'medium', 'large', 'extra_large'];
    if (!validFontSizes.includes(prefs.fontSize)) {
      result.errors.push(`Font size must be one of: ${validFontSizes.join(', ')}`);
    }

    // Color validation
    if (prefs.accentColor && !ValidationUtils.isValidHexColor(prefs.accentColor)) {
      result.warnings.push('Accent color should be a valid hex color');
    }
  }

  // Layout preferences validation
  if (uiState.layoutPreferences) {
    const layout = uiState.layoutPreferences;

    // Navigation style validation
    const validNavStyles = ['tabs', 'drawer', 'stack', 'split'];
    if (!validNavStyles.includes(layout.navigationStyle)) {
      result.errors.push(`Navigation style must be one of: ${validNavStyles.join(', ')}`);
    }

    // Widget validation
    if (layout.widgets && Array.isArray(layout.widgets)) {
      for (const [index, widget] of layout.widgets.entries()) {
        if (!widget.widgetId || !ValidationUtils.isValidStringLength(widget.widgetId, 1, 50)) {
          result.errors.push(`Widget ${index + 1}: ID is required and must be valid`);
        }

        if (!widget.type || !ValidationUtils.isValidStringLength(widget.type, 1, 50)) {
          result.errors.push(`Widget ${index + 1}: type is required and must be valid`);
        }

        if (widget.size && (widget.size.width <= 0 || widget.size.height <= 0)) {
          result.errors.push(`Widget ${index + 1}: size dimensions must be positive`);
        }
      }
    }
  }

  // Performance settings validation
  if (uiState.performanceSettings) {
    const perf = uiState.performanceSettings;

    // Animation quality validation
    const validAnimationQualities = ['high', 'medium', 'low', 'off'];
    if (!validAnimationQualities.includes(perf.animationQuality)) {
      result.errors.push(`Animation quality must be one of: ${validAnimationQualities.join(', ')}`);
    }

    // Image quality validation
    const validImageQualities = ['original', 'high', 'medium', 'low'];
    if (!validImageQualities.includes(perf.imageQuality)) {
      result.errors.push(`Image quality must be one of: ${validImageQualities.join(', ')}`);
    }

    // Cache size validation
    if (perf.cacheSize <= 0 || perf.cacheSize > 1000) {
      result.warnings.push('Cache size should be between 1 and 1000 MB');
    }

    // Memory limit validation
    if (perf.memoryLimitMB && (perf.memoryLimitMB <= 0 || perf.memoryLimitMB > 8192)) {
      result.warnings.push('Memory limit should be between 1 and 8192 MB');
    }
  }

  // Timestamp validation
  if (!ValidationUtils.isValidTimestamp(uiState.lastUsedAt)) {
    result.errors.push('Last used at timestamp is invalid');
  }

  if (!ValidationUtils.isValidTimestamp(uiState.createdAt)) {
    result.errors.push('Created at timestamp is invalid');
  }

  if (!ValidationUtils.isValidTimestamp(uiState.lastUpdated)) {
    result.errors.push('Last updated timestamp is invalid');
  }

  result.isValid = result.errors.length === 0;
  return result;
};

// OAuth Session validation
export const validateOAuthSession: EntityValidationRule<any> = (session) => {
  const result: ValidationResult = { isValid: true, errors: [], warnings: [] };

  // Required fields
  if (!session.userId || !ValidationUtils.isValidStringLength(session.userId, 1, 100)) {
    result.errors.push('User ID is required and must be valid');
  }

  if (!ValidationUtils.isValidOAuthProvider(session.providerId)) {
    result.errors.push('Provider ID must be a valid OAuth provider');
  }

  if (!session.sessionId || !ValidationUtils.isValidStringLength(session.sessionId, 1, 100)) {
    result.errors.push('Session ID is required and must be valid');
  }

  // PKCE validation
  if (!session.codeVerifier || session.codeVerifier.length < 43 || session.codeVerifier.length > 128) {
    result.errors.push('Code verifier must be between 43 and 128 characters');
  }

  if (!session.codeChallenge || session.codeChallenge.length < 43) {
    result.errors.push('Code challenge must be at least 43 characters');
  }

  if (session.codeChallengeMethod !== 'S256') {
    result.errors.push('Code challenge method must be S256');
  }

  if (!session.state || !ValidationUtils.isValidStringLength(session.state, 1, 128)) {
    result.errors.push('State parameter is required and must be valid');
  }

  if (!session.nonce || !ValidationUtils.isValidStringLength(session.nonce, 1, 128)) {
    result.errors.push('Nonce parameter is required and must be valid');
  }

  // Status validation
  const validStatuses = ['initiated', 'authorized', 'completed', 'expired', 'error', 'cancelled'];
  if (!validStatuses.includes(session.status)) {
    result.errors.push(`Status must be one of: ${validStatuses.join(', ')}`);
  }

  // Flow step validation
  const validFlowSteps = ['authorization', 'callback', 'token_exchange', 'completed'];
  if (!validFlowSteps.includes(session.flowStep)) {
    result.errors.push(`Flow step must be one of: ${validFlowSteps.join(', ')}`);
  }

  // Platform validation
  if (!ValidationUtils.isValidPlatform(session.platform)) {
    result.errors.push('Platform must be a valid platform type');
  }

  // Redirect URI validation
  if (!ValidationUtils.isValidUrl(session.redirectUri)) {
    result.errors.push('Redirect URI must be a valid URL');
  }

  // Timestamp validation
  if (!ValidationUtils.isValidTimestamp(session.createdAt)) {
    result.errors.push('Created at timestamp is invalid');
  }

  if (!ValidationUtils.isValidTimestamp(session.expiresAt)) {
    result.errors.push('Expires at timestamp is invalid');
  }

  if (session.createdAt >= session.expiresAt) {
    result.errors.push('Session cannot expire before it was created');
  }

  // Attempts validation
  if (typeof session.attempts !== 'number' || session.attempts < 0) {
    result.errors.push('Attempts must be a non-negative number');
  }

  if (typeof session.maxAttempts !== 'number' || session.maxAttempts <= 0) {
    result.errors.push('Max attempts must be a positive number');
  }

  if (session.attempts > session.maxAttempts) {
    result.warnings.push('Session attempts exceed maximum allowed');
  }

  result.isValid = result.errors.length === 0;
  return result;
};

// Workout Music Recommendation validation
export const validateWorkoutMusicRecommendation: EntityValidationRule<any> = (recommendation) => {
  const result: ValidationResult = { isValid: true, errors: [], warnings: [] };

  // Required fields
  if (!recommendation.userId || !ValidationUtils.isValidStringLength(recommendation.userId, 1, 100)) {
    result.errors.push('User ID is required and must be valid');
  }

  if (!recommendation.recommendationId || !ValidationUtils.isValidStringLength(recommendation.recommendationId, 1, 100)) {
    result.errors.push('Recommendation ID is required and must be valid');
  }

  // Context validation
  if (recommendation.context) {
    const context = recommendation.context;

    if (!context.workoutType || !ValidationUtils.isValidStringLength(context.workoutType, 1, 50)) {
      result.errors.push('Workout type is required and must be valid');
    }

    if (!ValidationUtils.isInRange(context.targetIntensity, 0, 1)) {
      result.errors.push('Target intensity must be between 0 and 1');
    }

    if (context.duration <= 0 || context.duration > 300) {
      result.errors.push('Workout duration must be between 1 and 300 minutes');
    }

    // Phases validation
    if (context.phases && Array.isArray(context.phases)) {
      let totalPhaseDuration = 0;
      for (const [index, phase] of context.phases.entries()) {
        if (!phase.name || !ValidationUtils.isValidStringLength(phase.name, 1, 20)) {
          result.errors.push(`Phase ${index + 1}: name is required and must be valid`);
        }

        if (phase.duration <= 0) {
          result.errors.push(`Phase ${index + 1}: duration must be positive`);
        }

        if (!ValidationUtils.isInRange(phase.targetIntensity, 0, 1)) {
          result.errors.push(`Phase ${index + 1}: target intensity must be between 0 and 1`);
        }

        totalPhaseDuration += phase.duration;
      }

      // Check if phase durations roughly match total duration (allow 10% variance)
      const durationDiff = Math.abs(totalPhaseDuration - context.duration);
      if (durationDiff > context.duration * 0.1) {
        result.warnings.push('Phase durations do not match total workout duration');
      }
    }
  }

  // Tracks validation
  if (recommendation.tracks && Array.isArray(recommendation.tracks)) {
    if (recommendation.tracks.length === 0) {
      result.errors.push('Recommendation must contain at least one track');
    }

    for (const [index, track] of recommendation.tracks.entries()) {
      // Basic track info validation
      if (!track.name || !ValidationUtils.isValidStringLength(track.name, 1, 200)) {
        result.errors.push(`Track ${index + 1}: name is required and must be valid`);
      }

      if (!track.artist || !ValidationUtils.isValidStringLength(track.artist, 1, 200)) {
        result.errors.push(`Track ${index + 1}: artist is required and must be valid`);
      }

      // Audio features validation
      if (!ValidationUtils.isInRange(track.energy, 0, 1)) {
        result.errors.push(`Track ${index + 1}: energy must be between 0 and 1`);
      }

      if (!ValidationUtils.isValidBPM(track.tempo)) {
        result.errors.push(`Track ${index + 1}: tempo must be between 40 and 200 BPM`);
      }

      // Recommendation scoring validation
      if (!ValidationUtils.isInRange(track.recommendationScore, 0, 1)) {
        result.errors.push(`Track ${index + 1}: recommendation score must be between 0 and 1`);
      }

      if (!ValidationUtils.isInRange(track.confidenceScore, 0, 1)) {
        result.errors.push(`Track ${index + 1}: confidence score must be between 0 and 1`);
      }

      // Position validation
      if (track.position <= 0 || track.position > recommendation.tracks.length) {
        result.errors.push(`Track ${index + 1}: position must be between 1 and total track count`);
      }

      // Phase match validation
      const validPhaseMatches = ['warmup', 'main', 'cooldown'];
      if (!validPhaseMatches.includes(track.phaseMatch)) {
        result.errors.push(`Track ${index + 1}: phase match must be one of: ${validPhaseMatches.join(', ')}`);
      }
    }

    // Check for duplicate positions
    const positions = recommendation.tracks.map((track: any) => track.position);
    const uniquePositions = [...new Set(positions)];
    if (positions.length !== uniquePositions.length) {
      result.errors.push('Track positions must be unique');
    }
  }

  // Algorithm validation
  if (recommendation.algorithm) {
    const algo = recommendation.algorithm;

    if (!algo.name || !ValidationUtils.isValidStringLength(algo.name, 1, 50)) {
      result.errors.push('Algorithm name is required and must be valid');
    }

    if (!algo.version || !ValidationUtils.isValidStringLength(algo.version, 1, 20)) {
      result.errors.push('Algorithm version is required and must be valid');
    }
  }

  // Quality metrics validation
  if (recommendation.qualityMetrics) {
    const metrics = recommendation.qualityMetrics;

    const metricFields = ['confidence', 'diversity', 'novelty', 'coverage', 'coherence', 'personalización'];
    for (const field of metricFields) {
      if (metrics[field] !== undefined && !ValidationUtils.isInRange(metrics[field], 0, 1)) {
        result.errors.push(`Quality metric ${field} must be between 0 and 1`);
      }
    }
  }

  // Feedback validation
  if (recommendation.feedback) {
    const feedback = recommendation.feedback;

    if (feedback.rating !== undefined && !ValidationUtils.isInRange(feedback.rating, 1, 5)) {
      result.errors.push('Feedback rating must be between 1 and 5');
    }

    if (feedback.completionRate !== undefined && !ValidationUtils.isInRange(feedback.completionRate, 0, 1)) {
      result.errors.push('Completion rate must be between 0 and 1');
    }

    if (feedback.skipRate !== undefined && !ValidationUtils.isInRange(feedback.skipRate, 0, 1)) {
      result.errors.push('Skip rate must be between 0 and 1');
    }
  }

  // Status validation
  const validStatuses = ['generated', 'delivered', 'used', 'expired', 'archived'];
  if (!validStatuses.includes(recommendation.status)) {
    result.errors.push(`Status must be one of: ${validStatuses.join(', ')}`);
  }

  // Timestamp validation
  if (!ValidationUtils.isValidTimestamp(recommendation.createdAt)) {
    result.errors.push('Created at timestamp is invalid');
  }

  if (!ValidationUtils.isValidTimestamp(recommendation.expiresAt)) {
    result.errors.push('Expires at timestamp is invalid');
  }

  if (recommendation.createdAt >= recommendation.expiresAt) {
    result.errors.push('Recommendation cannot expire before it was created');
  }

  result.isValid = result.errors.length === 0;
  return result;
};

// Main validation function
export function validateEntity(entityType: string, entity: any): ValidationResult {
  switch (entityType) {
    case 'oauthProvider':
      return validateOAuthProvider(entity);
    case 'userOAuthConnection':
      return validateUserOAuthConnection(entity);
    case 'musicProfile':
      return validateMusicProfile(entity);
    case 'platformUIState':
      return validatePlatformUIState(entity);
    case 'oauthSession':
      return validateOAuthSession(entity);
    case 'workoutMusicRecommendation':
      return validateWorkoutMusicRecommendation(entity);
    default:
      return {
        isValid: false,
        errors: [`Unknown entity type: ${entityType}`],
        warnings: []
      };
  }
}

// Helper function to throw validation errors
export function throwIfInvalid(entityType: string, entity: any): void {
  const validation = validateEntity(entityType, entity);
  if (!validation.isValid) {
    throw new ConvexError({
      message: `Validation failed for ${entityType}`,
      errors: validation.errors,
      warnings: validation.warnings
    });
  }
}

// Export all validators for individual use
export const validators = {
  oauthProvider: validateOAuthProvider,
  userOAuthConnection: validateUserOAuthConnection,
  musicProfile: validateMusicProfile,
  platformUIState: validatePlatformUIState,
  oauthSession: validateOAuthSession,
  workoutMusicRecommendation: validateWorkoutMusicRecommendation
};