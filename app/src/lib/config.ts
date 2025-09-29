import { dev } from '$app/environment';
import { validateEncryptionSetup } from './crypto.js';

// OAuth Provider Configuration
export interface OAuthConfig {
  spotify: {
    clientId: string;
    clientSecret?: string; // Only for server-side
    redirectUri: string;
    scopes: string[];
  };
  appleMusic: {
    teamId: string;
    keyId: string;
    privateKey?: string; // Only for server-side
    redirectUri: string;
    scopes: string[];
  };
}

// Environment configuration validation
export interface ConfigValidation {
  isValid: boolean;
  warnings: string[];
  errors: string[];
}

// Load OAuth configuration from environment variables
function loadOAuthConfig(): OAuthConfig {
  return {
    spotify: {
      clientId: import.meta.env.VITE_SPOTIFY_CLIENT_ID || '',
      redirectUri: import.meta.env.VITE_SPOTIFY_REDIRECT_URI || getDefaultRedirectUri('spotify'),
      scopes: [
        'user-read-private',
        'user-read-email',
        'user-top-read', 
        'playlist-read-private',
        'user-read-recently-played',
        'user-library-read'
      ]
    },
    appleMusic: {
      teamId: import.meta.env.VITE_APPLE_MUSIC_TEAM_ID || '',
      keyId: import.meta.env.VITE_APPLE_MUSIC_KEY_ID || '',
      redirectUri: import.meta.env.VITE_APPLE_MUSIC_REDIRECT_URI || getDefaultRedirectUri('apple-music'),
      scopes: [
        'user-read-private',
        'user-library-read',
        'user-read-recently-played'
      ]
    }
  };
}

// Get default redirect URI based on environment
function getDefaultRedirectUri(provider: string): string {
  const baseUrl = import.meta.env.VITE_APP_BASE_URL || 'http://localhost:5173';
  return `${baseUrl}/oauth/callback/${provider}`;
}

// Cached configuration
let oauthConfig: OAuthConfig | null = null;

// Get OAuth configuration
export function getOAuthConfig(): OAuthConfig {
  if (!oauthConfig) {
    oauthConfig = loadOAuthConfig();
  }
  return oauthConfig;
}

// Validate OAuth configuration
export function validateOAuthConfig(): ConfigValidation {
  const config = getOAuthConfig();
  const warnings: string[] = [];
  const errors: string[] = [];
  
  // Validate Spotify configuration
  if (!config.spotify.clientId) {
    errors.push('VITE_SPOTIFY_CLIENT_ID is required for Spotify OAuth');
  }
  
  if (config.spotify.redirectUri.includes('localhost') && !dev) {
    warnings.push('Spotify redirect URI uses localhost in production');
  }
  
  // Validate Apple Music configuration
  if (!config.appleMusic.teamId) {
    warnings.push('VITE_APPLE_MUSIC_TEAM_ID not set - Apple Music integration disabled');
  }
  
  if (!config.appleMusic.keyId) {
    warnings.push('VITE_APPLE_MUSIC_KEY_ID not set - Apple Music integration disabled');
  }
  
  if (config.appleMusic.redirectUri.includes('localhost') && !dev) {
    warnings.push('Apple Music redirect URI uses localhost in production');
  }
  
  // Validate encryption setup
  const encryptionValidation = validateEncryptionSetup();
  warnings.push(...encryptionValidation.warnings);
  
  if (!encryptionValidation.isValid) {
    errors.push('Encryption setup is invalid - OAuth tokens cannot be secured');
  }
  
  return {
    isValid: errors.length === 0,
    warnings,
    errors
  };
}

// Get provider configuration by ID
export function getProviderConfig(providerId: 'spotify' | 'apple_music') {
  const config = getOAuthConfig();
  if (providerId === 'apple_music') {
    return config.appleMusic;
  }
  return config[providerId];
}

// Application configuration
export const APP_CONFIG = {
  // API Configuration
  api: {
    baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5173/api',
    timeout: 10000, // 10 seconds
    retries: 3
  },
  
  // Convex Configuration
  convex: {
    url: import.meta.env.VITE_CONVEX_URL || '',
  },
  
  // OAuth Configuration
  oauth: {
    sessionTimeout: 3600000, // 1 hour in milliseconds
    tokenRefreshBuffer: 300000, // 5 minutes before expiry
    maxRetries: 3,
    retryDelay: 1000 // 1 second
  },
  
  // Music Integration Configuration
  music: {
    cacheTimeout: 3600000, // 1 hour for music profile cache
    syncInterval: 86400000, // 24 hours for automatic sync
    maxRecommendations: 50,
    recommendationTimeout: 30000 // 30 seconds
  },
  
  // Platform UI Configuration
  ui: {
    animationDuration: 300, // milliseconds
    hapticIntensity: 'medium' as const,
    toastDuration: 4000, // 4 seconds
    loadingTimeout: 30000 // 30 seconds
  },
  
  // Performance Configuration
  performance: {
    oauthFlowTimeout: 5000, // 5 seconds target
    apiResponseTimeout: 200, // 200ms target
    uiRenderTimeout: 1000, // 1 second target
    maxConcurrentUsers: 10000
  },
  
  // Security Configuration
  security: {
    encryptionRequired: !dev,
    tokenAutoRefresh: true,
    dataRetentionDays: 30,
    auditLogging: true
  }
};

// Development-only configuration helpers
export const DEV_CONFIG = {
  // Mock OAuth responses for testing
  mockOAuth: dev && import.meta.env.VITE_MOCK_OAUTH === 'true',
  
  // Skip encryption in development
  skipEncryption: dev && import.meta.env.VITE_SKIP_ENCRYPTION === 'true',
  
  // Enable verbose logging
  verboseLogging: dev && import.meta.env.VITE_VERBOSE_LOGGING === 'true',
  
  // Mock music data
  mockMusic: dev && import.meta.env.VITE_MOCK_MUSIC === 'true'
};

// Initialize and validate configuration on startup
export function initializeConfig(): ConfigValidation {
  const validation = validateOAuthConfig();
  
  if (dev) {
    console.log('OAuth Configuration:', getOAuthConfig());
    console.log('Configuration Validation:', validation);
  }
  
  if (validation.warnings.length > 0) {
    console.warn('Configuration warnings:', validation.warnings);
  }
  
  if (validation.errors.length > 0) {
    console.error('Configuration errors:', validation.errors);
  }
  
  return validation;
}

// Export configuration for external use
export { getOAuthConfig as oauthConfig };