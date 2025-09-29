/**
 * OAuth Authorization Flow - Convex Functions
 * 
 * Implements secure OAuth authorization flow with PKCE:
 * - Initiate OAuth authorization with state and PKCE
 * - Handle OAuth callbacks and exchange codes for tokens
 * - Secure session management with validation
 */

import { mutation, query } from '../_generated/server';
import { v, ConvexError } from 'convex/values';
import { randomBytes, createHash } from 'crypto';

// ====================================================================================
// OAUTH AUTHORIZATION FLOW
// ====================================================================================

/**
 * Initiate OAuth authorization flow with PKCE security
 * Creates OAuth session with state verification and PKCE code challenge
 */
export const initiateOAuthFlow = mutation({
  args: {
    providerId: v.string(),
    userId: v.string(),
    platform: v.string(), // 'ios' | 'android' | 'web'
    scopes: v.optional(v.array(v.string())),
    returnUrl: v.optional(v.string()),
    metadata: v.optional(v.object({
      userAgent: v.optional(v.string()),
      ipAddress: v.optional(v.string()),
      deviceType: v.optional(v.string()),
      appVersion: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    try {
      // Get OAuth provider
      const provider = await ctx.db
        .query('oauthProviders')
        .filter(q => q.eq(q.field('id'), args.providerId))
        .filter(q => q.eq(q.field('isEnabled'), true))
        .first();

      if (!provider) {
        throw new ConvexError({
          message: `OAuth provider '${args.providerId}' not found or disabled`,
          code: 'PROVIDER_NOT_FOUND'
        });
      }

      // Verify platform support
      if (!provider.supportedPlatforms.includes(args.platform)) {
        throw new ConvexError({
          message: `Platform '${args.platform}' not supported by ${provider.displayName}`,
          code: 'PLATFORM_NOT_SUPPORTED'
        });
      }

      // Check for existing active session
      const existingSession = await ctx.db
        .query('oauthSessions')
        .filter(q => q.eq(q.field('userId'), args.userId))
        .filter(q => q.eq(q.field('providerId'), args.providerId))
        .filter(q => q.eq(q.field('status'), 'pending'))
        .first();

      if (existingSession) {
        // Check if session is expired
        if (existingSession.expiresAt > Date.now()) {
          return {
            sessionId: existingSession._id,
            authUrl: existingSession.authorizationUrl,
            state: existingSession.state,
            redirectUri: existingSession.redirectUri,
            message: 'Using existing active OAuth session'
          };
        } else {
          // Mark expired session as failed
          await ctx.db.patch(existingSession._id, {
            status: 'failed',
            errorMessage: 'Session expired',
            completedAt: Date.now()
          });
        }
      }

      // Generate PKCE parameters
      const codeVerifier = randomBytes(32).toString('base64url');
      const codeChallenge = createHash('sha256')
        .update(codeVerifier)
        .digest('base64url');

      // Generate secure state parameter
      const state = randomBytes(32).toString('base64url');

      // Determine scopes to use
      const requestedScopes = args.scopes || provider.defaultScopes;
      
      // Validate requested scopes are allowed
      const invalidScopes = requestedScopes.filter(scope => !provider.scopes.includes(scope));
      if (invalidScopes.length > 0) {
        throw new ConvexError({
          message: `Invalid scopes requested: ${invalidScopes.join(', ')}`,
          code: 'INVALID_SCOPES'
        });
      }

      // Get platform-specific redirect URI
      const platformConfig = provider.platformConfig[args.platform as keyof typeof provider.platformConfig];
      const redirectUri = platformConfig?.customScheme 
        ? `${platformConfig.customScheme}://oauth/callback`
        : provider.redirectUri;

      // Build authorization URL
      const authParams = new URLSearchParams({
        client_id: provider.clientId,
        response_type: 'code',
        redirect_uri: redirectUri,
        scope: requestedScopes.join(' '),
        state: state,
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
      });

      // Add provider-specific parameters
      if (args.providerId === 'spotify') {
        authParams.append('show_dialog', 'true');
      } else if (args.providerId === 'apple_music') {
        authParams.append('response_mode', 'form_post');
      }

      const authorizationUrl = `${provider.authEndpoint}?${authParams.toString()}`;

      // Create OAuth session record
      const sessionData = {
        userId: args.userId,
        providerId: args.providerId,
        platform: args.platform,
        state: state,
        codeVerifier: codeVerifier,
        codeChallenge: codeChallenge,
        scopes: requestedScopes,
        redirectUri: redirectUri,
        authorizationUrl: authorizationUrl,
        returnUrl: args.returnUrl,
        status: 'pending' as const,
        createdAt: Date.now(),
        expiresAt: Date.now() + (15 * 60 * 1000), // 15 minutes
        metadata: {
          userAgent: args.metadata?.userAgent,
          ipAddress: args.metadata?.ipAddress,
          deviceType: args.metadata?.deviceType,
          appVersion: args.metadata?.appVersion,
          initiatedFromPlatform: args.platform,
        },
        attempts: 0,
        maxAttempts: 3,
      };

      const sessionId = await ctx.db.insert('oauthSessions', sessionData);

      return {
        sessionId,
        authUrl: authorizationUrl,
        state: state,
        redirectUri: redirectUri,
        expiresAt: sessionData.expiresAt,
        scopes: requestedScopes,
        provider: {
          id: provider.id,
          name: provider.displayName,
          iconUrl: provider.iconUrl,
          brandColor: provider.brandColor,
        }
      };
    } catch (error) {
      console.error(`Error initiating OAuth flow for ${args.providerId}:`, error);
      if (error instanceof ConvexError) {
        throw error;
      }
      throw new ConvexError({
        message: 'Failed to initiate OAuth flow',
        code: 'OAUTH_INITIATION_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },
});

/**
 * Handle OAuth callback and exchange authorization code for tokens
 */
export const handleOAuthCallback = mutation({
  args: {
    code: v.string(),
    state: v.string(),
    error: v.optional(v.string()),
    errorDescription: v.optional(v.string()),
    sessionId: v.optional(v.id('oauthSessions')),
  },
  handler: async (ctx, args) => {
    try {
      // Handle OAuth error responses
      if (args.error) {
        const errorMessage = args.errorDescription || args.error;
        console.error('OAuth callback error:', args.error, args.errorDescription);
        
        // Find session by state if sessionId not provided
        let session = null;
        if (args.sessionId) {
          session = await ctx.db.get(args.sessionId);
        } else {
          session = await ctx.db
            .query('oauthSessions')
            .filter(q => q.eq(q.field('state'), args.state))
            .filter(q => q.eq(q.field('status'), 'pending'))
            .first();
        }

        if (session) {
          await ctx.db.patch(session._id, {
            status: 'failed',
            errorMessage: errorMessage,
            errorCode: args.error,
            completedAt: Date.now()
          });
        }

        throw new ConvexError({
          message: `OAuth authorization failed: ${errorMessage}`,
          code: 'OAUTH_AUTHORIZATION_FAILED',
          details: args.error
        });
      }

      // Find OAuth session by state
      const session = args.sessionId 
        ? await ctx.db.get(args.sessionId)
        : await ctx.db
            .query('oauthSessions')
            .filter(q => q.eq(q.field('state'), args.state))
            .filter(q => q.eq(q.field('status'), 'pending'))
            .first();

      if (!session) {
        throw new ConvexError({
          message: 'OAuth session not found or invalid state parameter',
          code: 'INVALID_SESSION'
        });
      }

      // Verify session is not expired
      if (session.expiresAt <= Date.now()) {
        await ctx.db.patch(session._id, {
          status: 'failed',
          errorMessage: 'Session expired',
          completedAt: Date.now()
        });
        throw new ConvexError({
          message: 'OAuth session has expired',
          code: 'SESSION_EXPIRED'
        });
      }

      // Verify state parameter matches
      if (session.state !== args.state) {
        await ctx.db.patch(session._id, {
          status: 'failed',
          errorMessage: 'State parameter mismatch',
          completedAt: Date.now()
        });
        throw new ConvexError({
          message: 'State parameter mismatch - potential CSRF attack',
          code: 'STATE_MISMATCH'
        });
      }

      // Get OAuth provider
      const provider = await ctx.db
        .query('oauthProviders')
        .filter(q => q.eq(q.field('id'), session.providerId))
        .first();

      if (!provider || !provider.isEnabled) {
        await ctx.db.patch(session._id, {
          status: 'failed',
          errorMessage: 'OAuth provider not available',
          completedAt: Date.now()
        });
        throw new ConvexError({
          message: 'OAuth provider not available',
          code: 'PROVIDER_UNAVAILABLE'
        });
      }

      // Exchange authorization code for tokens
      const tokenResponse = await exchangeCodeForTokens(
        provider,
        args.code,
        session.redirectUri,
        session.codeVerifier
      );

      // Check for existing connection and update or create new one
      const existingConnection = await ctx.db
        .query('userOAuthConnections')
        .filter(q => q.eq(q.field('userId'), session.userId))
        .filter(q => q.eq(q.field('providerId'), session.providerId))
        .first();

      let connectionId: string;
      const now = Date.now();
      const tokenExpiry = now + (tokenResponse.expires_in * 1000);

      if (existingConnection) {
        // Update existing connection
        await ctx.db.patch(existingConnection._id, {
          accessToken: tokenResponse.access_token, // This should be encrypted in production
          refreshToken: tokenResponse.refresh_token || existingConnection.refreshToken,
          tokenExpiry: tokenExpiry,
          scopes: session.scopes,
          isActive: true,
          status: 'connected',
          connectedAt: now,
          lastRefreshAt: now,
          platform: session.platform,
          consecutiveErrors: 0,
          lastErrorMessage: null,
          lastErrorAt: null,
        });
        connectionId = existingConnection._id;
      } else {
        // Create new connection
        const connectionData = {
          userId: session.userId,
          providerId: session.providerId,
          providerDisplayName: provider.displayName,
          accessToken: tokenResponse.access_token, // This should be encrypted in production
          refreshToken: tokenResponse.refresh_token || '',
          tokenExpiry: tokenExpiry,
          scopes: session.scopes,
          isActive: true,
          status: 'connected' as const,
          connectedAt: now,
          lastRefreshAt: now,
          platform: session.platform,
          metadata: {
            tokenType: tokenResponse.token_type || 'Bearer',
            grantedScopes: session.scopes,
            connectionSource: session.platform,
            userAgent: session.metadata?.userAgent,
            ipAddress: session.metadata?.ipAddress,
          },
          preferences: {
            autoSync: true,
            syncFrequency: 'daily',
            sharePublicPlaylists: false,
            includeExplicitContent: true,
          },
          consecutiveErrors: 0,
          successRate: 100.0,
          totalRequests: 0,
          successfulRequests: 0,
          lastSyncAt: null,
          createdAt: now,
          updatedAt: now,
        };

        connectionId = await ctx.db.insert('userOAuthConnections', connectionData);
      }

      // Update session as completed
      await ctx.db.patch(session._id, {
        status: 'completed',
        connectionId: connectionId,
        completedAt: now,
        tokenExchangedAt: now
      });

      // Update provider connection statistics
      await ctx.db.patch((await ctx.db
        .query('oauthProviders')
        .filter(q => q.eq(q.field('id'), session.providerId))
        .first())!._id, {
        totalConnections: provider.totalConnections + (existingConnection ? 0 : 1),
        activeConnections: provider.activeConnections + (existingConnection && !existingConnection.isActive ? 1 : existingConnection ? 0 : 1),
        lastConnectionAt: now,
        updatedAt: now
      });

      return {
        success: true,
        connectionId: connectionId,
        providerId: session.providerId,
        providerName: provider.displayName,
        scopes: session.scopes,
        expiresAt: tokenExpiry,
        returnUrl: session.returnUrl,
        isNewConnection: !existingConnection,
        message: existingConnection 
          ? `Successfully reconnected to ${provider.displayName}`
          : `Successfully connected to ${provider.displayName}`
      };
    } catch (error) {
      console.error('Error handling OAuth callback:', error);
      if (error instanceof ConvexError) {
        throw error;
      }
      throw new ConvexError({
        message: 'Failed to handle OAuth callback',
        code: 'OAUTH_CALLBACK_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },
});

/**
 * Get OAuth session status
 */
export const getOAuthSessionStatus = query({
  args: {
    sessionId: v.id('oauthSessions'),
  },
  handler: async (ctx, args) => {
    try {
      const session = await ctx.db.get(args.sessionId);
      
      if (!session) {
        throw new ConvexError({
          message: 'OAuth session not found',
          code: 'SESSION_NOT_FOUND'
        });
      }

      // Get provider info for display
      const provider = await ctx.db
        .query('oauthProviders')
        .filter(q => q.eq(q.field('id'), session.providerId))
        .first();

      return {
        sessionId: session._id,
        status: session.status,
        providerId: session.providerId,
        providerName: provider?.displayName || session.providerId,
        platform: session.platform,
        createdAt: session.createdAt,
        expiresAt: session.expiresAt,
        completedAt: session.completedAt,
        isExpired: session.expiresAt <= Date.now(),
        errorMessage: session.errorMessage,
        errorCode: session.errorCode,
        returnUrl: session.returnUrl,
      };
    } catch (error) {
      console.error('Error getting OAuth session status:', error);
      if (error instanceof ConvexError) {
        throw error;
      }
      throw new ConvexError({
        message: 'Failed to get session status',
        code: 'SESSION_STATUS_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },
});

/**
 * Cancel/expire an OAuth session
 */
export const cancelOAuthSession = mutation({
  args: {
    sessionId: v.id('oauthSessions'),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    try {
      const session = await ctx.db.get(args.sessionId);
      
      if (!session) {
        throw new ConvexError({
          message: 'OAuth session not found',
          code: 'SESSION_NOT_FOUND'
        });
      }

      if (session.status !== 'pending') {
        return {
          sessionId: args.sessionId,
          status: session.status,
          message: 'Session already completed or cancelled'
        };
      }

      await ctx.db.patch(session._id, {
        status: 'cancelled',
        errorMessage: args.reason || 'Session cancelled by user',
        completedAt: Date.now()
      });

      return {
        sessionId: args.sessionId,
        status: 'cancelled',
        message: 'OAuth session cancelled successfully'
      };
    } catch (error) {
      console.error('Error cancelling OAuth session:', error);
      if (error instanceof ConvexError) {
        throw error;
      }
      throw new ConvexError({
        message: 'Failed to cancel OAuth session',
        code: 'SESSION_CANCEL_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },
});

// ====================================================================================
// HELPER FUNCTIONS
// ====================================================================================

/**
 * Exchange authorization code for access tokens
 * This function makes the actual HTTP request to the OAuth provider
 */
async function exchangeCodeForTokens(
  provider: any,
  authorizationCode: string,
  redirectUri: string,
  codeVerifier: string
): Promise<{
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type?: string;
  scope?: string;
}> {
  const tokenParams = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: provider.clientId,
    code: authorizationCode,
    redirect_uri: redirectUri,
    code_verifier: codeVerifier,
  });

  // Add client secret for providers that require it
  if (provider.clientSecret && provider.id !== 'spotify') {
    tokenParams.append('client_secret', provider.clientSecret);
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Accept': 'application/json',
  };

  // Spotify uses Basic auth instead of client_secret in body
  if (provider.id === 'spotify' && provider.clientSecret) {
    const credentials = Buffer.from(`${provider.clientId}:${provider.clientSecret}`).toString('base64');
    headers['Authorization'] = `Basic ${credentials}`;
  }

  try {
    const response = await fetch(provider.tokenEndpoint, {
      method: 'POST',
      headers,
      body: tokenParams.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Token exchange failed for ${provider.id}:`, response.status, errorText);
      throw new ConvexError({
        message: `Token exchange failed: ${response.status} ${response.statusText}`,
        code: 'TOKEN_EXCHANGE_FAILED',
        details: errorText
      });
    }

    const tokenData = await response.json();
    
    if (!tokenData.access_token) {
      throw new ConvexError({
        message: 'No access token returned from provider',
        code: 'NO_ACCESS_TOKEN'
      });
    }

    return tokenData;
  } catch (error) {
    console.error(`Error exchanging code for tokens with ${provider.id}:`, error);
    if (error instanceof ConvexError) {
      throw error;
    }
    throw new ConvexError({
      message: 'Failed to exchange authorization code for tokens',
      code: 'TOKEN_EXCHANGE_ERROR',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}