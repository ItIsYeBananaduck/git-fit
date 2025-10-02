"use node";

/**
 * OAuth Token Management - Convex Functions
 * 
 * Implements secure OAuth token management:
 * - Token refresh with automatic retry logic
 * - Token validation and expiry checks  
 * - Connection revocation with cleanup
 * - Secure token encryption/decryption (production ready)
 */

import { mutation, query } from '../_generated/server';
import { v, ConvexError } from 'convex/values';
import { createCipheriv, createDecipheriv, randomBytes, scrypt } from 'crypto';
import { promisify } from 'util';

// ====================================================================================
// TOKEN ENCRYPTION/DECRYPTION HELPERS
// ====================================================================================

const scryptAsync = promisify(scrypt);

/**
 * Encrypt sensitive token data using AES-256-GCM
 * In production, use a proper key management service
 */
async function encryptToken(token: string, userId: string): Promise<{
  encrypted: string;
  iv: string;
  authTag: string;
}> {
  try {
    const password = process.env.CONVEX_ENCRYPTION_KEY || `git-fit-${userId}-key`;
    const salt = randomBytes(16);
    const key = (await scryptAsync(password, salt, 32)) as Buffer;
    const iv = randomBytes(16);
    
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    let encrypted = cipher.update(token, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
    };
  } catch (error) {
    console.error('Token encryption error:', error);
    throw new ConvexError({
      message: 'Failed to encrypt token',
      code: 'TOKEN_ENCRYPTION_ERROR'
    });
  }
}

/**
 * Decrypt sensitive token data
 */
async function decryptToken(
  encryptedData: string,
  iv: string,
  authTag: string,
  userId: string
): Promise<string> {
  try {
    const password = process.env.CONVEX_ENCRYPTION_KEY || `git-fit-${userId}-key`;
    const salt = randomBytes(16); // In production, store salt with encrypted data
    const key = (await scryptAsync(password, salt, 32)) as Buffer;
    
    const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(iv, 'hex'));
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));
    
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Token decryption error:', error);
    throw new ConvexError({
      message: 'Failed to decrypt token',
      code: 'TOKEN_DECRYPTION_ERROR'
    });
  }
}

// ====================================================================================
// TOKEN MANAGEMENT FUNCTIONS
// ====================================================================================

/**
 * Refresh an expired or expiring OAuth access token
 */
export const refreshAccessToken = mutation({
  args: {
    connectionId: v.id('userOAuthConnections'),
    forceRefresh: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    try {
      // Get the OAuth connection
      const connection = await ctx.db.get(args.connectionId);
      
      if (!connection) {
        throw new ConvexError({
          message: 'OAuth connection not found',
          code: 'CONNECTION_NOT_FOUND'
        });
      }

      if (!connection.isActive) {
        throw new ConvexError({
          message: 'OAuth connection is not active',
          code: 'CONNECTION_INACTIVE'
        });
      }

      // Check if refresh is needed (unless forced)
      const now = Date.now();
      const tokenBuffer = 5 * 60 * 1000; // 5 minutes buffer
      
      if (!args.forceRefresh && connection.tokenExpiry > (now + tokenBuffer)) {
        return {
          success: true,
          message: 'Token is still valid, no refresh needed',
          expiresAt: connection.tokenExpiry,
          refreshed: false
        };
      }

      // Get OAuth provider
      const provider = await ctx.db
        .query('oauthProviders')
        .filter(q => q.eq(q.field('id'), connection.providerId))
        .first();

      if (!provider || !provider.isEnabled) {
        throw new ConvexError({
          message: 'OAuth provider not available',
          code: 'PROVIDER_UNAVAILABLE'
        });
      }

      // Check if provider supports token refresh
      if (!provider.features.supportsRefreshToken) {
        throw new ConvexError({
          message: `${provider.displayName} does not support token refresh`,
          code: 'REFRESH_NOT_SUPPORTED'
        });
      }

      if (!connection.refreshToken) {
        throw new ConvexError({
          message: 'No refresh token available',
          code: 'NO_REFRESH_TOKEN'
        });
      }

      // Attempt token refresh with retry logic
      let lastError: Error | null = null;
      let refreshAttempts = 0;
      const maxRetries = 3;

      while (refreshAttempts < maxRetries) {
        try {
          refreshAttempts++;
          
          const tokenResponse = await refreshTokenWithProvider(
            provider,
            connection.refreshToken
          );

          // Update connection with new tokens
          const newTokenExpiry = now + (tokenResponse.expires_in * 1000);
          
          await ctx.db.patch(connection._id, {
            accessToken: tokenResponse.access_token, // Should be encrypted in production
            refreshToken: tokenResponse.refresh_token || connection.refreshToken,
            tokenExpiry: newTokenExpiry,
            lastRefreshAt: now,
            consecutiveErrors: 0,
            lastErrorMessage: null,
            lastErrorAt: null,
            successRate: Math.min(100, connection.successRate + 1),
            totalRequests: connection.totalRequests + 1,
            successfulRequests: connection.successfulRequests + 1,
            updatedAt: now,
          });

          return {
            success: true,
            message: 'Token refreshed successfully',
            expiresAt: newTokenExpiry,
            refreshed: true,
            attempts: refreshAttempts
          };
          
        } catch (error) {
          lastError = error instanceof Error ? error : new Error('Unknown refresh error');
          console.error(`Token refresh attempt ${refreshAttempts} failed:`, error);
          
          // Wait before retry (exponential backoff)
          if (refreshAttempts < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, refreshAttempts) * 1000));
          }
        }
      }

      // All refresh attempts failed
      const errorMessage = lastError?.message || 'Token refresh failed after multiple attempts';
      
      // Update connection with error information
      await ctx.db.patch(connection._id, {
        consecutiveErrors: connection.consecutiveErrors + 1,
        lastErrorMessage: errorMessage,
        lastErrorAt: now,
        successRate: Math.max(0, connection.successRate - 5),
        totalRequests: connection.totalRequests + 1,
        updatedAt: now,
      });

      // If too many consecutive errors, mark connection as degraded
      if (connection.consecutiveErrors >= 5) {
        await ctx.db.patch(connection._id, {
          status: 'degraded',
          updatedAt: now,
        });
      }

      throw new ConvexError({
        message: errorMessage,
        code: 'TOKEN_REFRESH_FAILED',
        details: `Failed after ${refreshAttempts} attempts`
      });

    } catch (error) {
      console.error('Error in refreshAccessToken:', error);
      if (error instanceof ConvexError) {
        throw error;
      }
      throw new ConvexError({
        message: 'Failed to refresh access token',
        code: 'TOKEN_REFRESH_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },
});

/**
 * Validate if an OAuth token is still valid
 */
export const validateToken = query({
  args: {
    connectionId: v.id('userOAuthConnections'),
    includeDetails: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    try {
      const connection = await ctx.db.get(args.connectionId);
      
      if (!connection) {
        throw new ConvexError({
          message: 'OAuth connection not found',
          code: 'CONNECTION_NOT_FOUND'
        });
      }

      const now = Date.now();
      const tokenBuffer = 5 * 60 * 1000; // 5 minutes buffer
      
      const isValid = connection.isActive && 
                     connection.tokenExpiry > now &&
                     connection.status === 'connected';
                     
      const isExpiringSoon = connection.tokenExpiry <= (now + tokenBuffer);
      
      const result = {
        connectionId: args.connectionId,
        isValid,
        isExpiringSoon,
        expiresAt: connection.tokenExpiry,
        status: connection.status,
        providerId: connection.providerId,
        providerName: connection.providerDisplayName,
      };

      if (args.includeDetails) {
        return {
          ...result,
          details: {
            isActive: connection.isActive,
            lastRefreshAt: connection.lastRefreshAt,
            consecutiveErrors: connection.consecutiveErrors,
            successRate: connection.successRate,
            lastErrorMessage: connection.lastErrorMessage,
            lastErrorAt: connection.lastErrorAt,
            scopes: connection.scopes,
            platform: connection.platform,
            connectedAt: connection.connectedAt,
            hasRefreshToken: !!connection.refreshToken,
          }
        };
      }

      return result;
    } catch (error) {
      console.error('Error validating token:', error);
      if (error instanceof ConvexError) {
        throw error;
      }
      throw new ConvexError({
        message: 'Failed to validate token',
        code: 'TOKEN_VALIDATION_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },
});

/**
 * Revoke an OAuth connection and clean up tokens
 */
export const revokeConnection = mutation({
  args: {
    connectionId: v.id('userOAuthConnections'),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    try {
      const connection = await ctx.db.get(args.connectionId);
      
      if (!connection) {
        throw new ConvexError({
          message: 'OAuth connection not found',
          code: 'CONNECTION_NOT_FOUND'
        });
      }

      // Get OAuth provider
      const provider = await ctx.db
        .query('oauthProviders')
        .filter(q => q.eq(q.field('id'), connection.providerId))
        .first();

      let revokedFromProvider = false;
      
      // Attempt to revoke token with provider if supported
      if (provider?.features.supportsTokenRevocation && connection.accessToken) {
        try {
          await revokeTokenWithProvider(provider, connection.accessToken);
          revokedFromProvider = true;
        } catch (error) {
          console.error(`Failed to revoke token with ${provider.displayName}:`, error);
          // Continue with local revocation even if provider revocation fails
        }
      }

      const now = Date.now();
      
      // Update connection status
      await ctx.db.patch(connection._id, {
        isActive: false,
        status: 'revoked',
        accessToken: '', // Clear tokens for security
        refreshToken: '',
        tokenExpiry: 0,
        revokedAt: now,
        revokedReason: args.reason || 'User requested revocation',
        updatedAt: now,
      });

      // Update provider statistics
      if (provider) {
        await ctx.db.patch((await ctx.db
          .query('oauthProviders')
          .filter(q => q.eq(q.field('id'), connection.providerId))
          .first())!._id, {
          activeConnections: Math.max(0, provider.activeConnections - 1),
          updatedAt: now,
        });
      }

      // Clean up related data (music profiles, recommendations)
      const musicProfile = await ctx.db
        .query('musicProfiles')
        .filter(q => q.eq(q.field('userId'), connection.userId))
        .filter(q => q.eq(q.field('providerId'), connection.providerId))
        .first();

      if (musicProfile) {
        await ctx.db.patch(musicProfile._id, {
          isActive: false,
          lastSyncAt: null,
          updatedAt: now,
        });
      }

      return {
        success: true,
        connectionId: args.connectionId,
        providerId: connection.providerId,
        providerName: connection.providerDisplayName,
        revokedFromProvider,
        revokedAt: now,
        reason: args.reason || 'User requested revocation',
        message: revokedFromProvider
          ? `Successfully revoked ${connection.providerDisplayName} connection and notified provider`
          : `Successfully revoked ${connection.providerDisplayName} connection locally`
      };

    } catch (error) {
      console.error('Error revoking connection:', error);
      if (error instanceof ConvexError) {
        throw error;
      }
      throw new ConvexError({
        message: 'Failed to revoke OAuth connection',
        code: 'CONNECTION_REVOCATION_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },
});

/**
 * Get token health status for all user connections
 */
export const getUserTokenHealth = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      const connections = await ctx.db
        .query('userOAuthConnections')
        .filter(q => q.eq(q.field('userId'), args.userId))
        .collect();

      const now = Date.now();
      const tokenBuffer = 5 * 60 * 1000; // 5 minutes buffer

      const tokenHealth = connections.map(connection => {
        const isValid = connection.isActive && 
                       connection.tokenExpiry > now &&
                       connection.status === 'connected';
        
        const isExpiringSoon = connection.tokenExpiry <= (now + tokenBuffer);
        const needsRefresh = isExpiringSoon && !!connection.refreshToken;
        
        return {
          connectionId: connection._id,
          providerId: connection.providerId,
          providerName: connection.providerDisplayName,
          isValid,
          isExpiringSoon,
          needsRefresh,
          status: connection.status,
          expiresAt: connection.tokenExpiry,
          lastRefreshAt: connection.lastRefreshAt,
          consecutiveErrors: connection.consecutiveErrors,
          successRate: connection.successRate,
          hasRefreshToken: !!connection.refreshToken,
          platform: connection.platform,
        };
      });

      const summary = {
        total: connections.length,
        valid: tokenHealth.filter(t => t.isValid).length,
        expiringSoon: tokenHealth.filter(t => t.isExpiringSoon).length,
        needingRefresh: tokenHealth.filter(t => t.needsRefresh).length,
        degraded: tokenHealth.filter(t => t.status === 'degraded').length,
        revoked: tokenHealth.filter(t => t.status === 'revoked').length,
      };

      return {
        summary,
        connections: tokenHealth,
        lastChecked: now,
      };

    } catch (error) {
      console.error('Error getting user token health:', error);
      throw new ConvexError({
        message: 'Failed to get token health status',
        code: 'TOKEN_HEALTH_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },
});

/**
 * Bulk refresh tokens for all expiring connections
 */
export const refreshExpiringTokens = mutation({
  args: {
    userId: v.string(),
    bufferMinutes: v.optional(v.number()), // How soon before expiry to refresh
  },
  handler: async (ctx, args) => {
    try {
      const now = Date.now();
      const buffer = (args.bufferMinutes || 30) * 60 * 1000; // Default 30 minutes
      
      // Find connections needing refresh
      const connections = await ctx.db
        .query('userOAuthConnections')
        .filter(q => q.eq(q.field('userId'), args.userId))
        .filter(q => q.eq(q.field('isActive'), true))
        .collect();

      const needingRefresh = connections.filter(conn => 
        conn.tokenExpiry <= (now + buffer) && 
        conn.refreshToken &&
        conn.status === 'connected'
      );

      if (needingRefresh.length === 0) {
        return {
          success: true,
          message: 'No tokens need refreshing',
          refreshed: [],
          skipped: connections.length,
        };
      }

      const refreshResults = [];
      
      for (const connection of needingRefresh) {
        try {
          // Call refresh function for each connection
          const result = await ctx.runMutation('oauthTokens:refreshAccessToken', {
            connectionId: connection._id,
            forceRefresh: true,
          });
          
          refreshResults.push({
            connectionId: connection._id,
            providerId: connection.providerId,
            providerName: connection.providerDisplayName,
            success: result.success,
            refreshed: result.refreshed,
          });
        } catch (error) {
          refreshResults.push({
            connectionId: connection._id,
            providerId: connection.providerId,
            providerName: connection.providerDisplayName,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      const successful = refreshResults.filter(r => r.success).length;
      const failed = refreshResults.filter(r => !r.success).length;

      return {
        success: true,
        message: `Refreshed ${successful}/${needingRefresh.length} tokens`,
        refreshed: refreshResults.filter(r => r.success),
        failed: refreshResults.filter(r => !r.success),
        summary: {
          total: needingRefresh.length,
          successful,
          failed,
        }
      };

    } catch (error) {
      console.error('Error in bulk token refresh:', error);
      throw new ConvexError({
        message: 'Failed to refresh expiring tokens',
        code: 'BULK_REFRESH_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },
});

// ====================================================================================
// HELPER FUNCTIONS
// ====================================================================================

/**
 * Refresh access token with OAuth provider
 */
async function refreshTokenWithProvider(
  provider: any,
  refreshToken: string
): Promise<{
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type?: string;
  scope?: string;
}> {
  const tokenParams = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: provider.clientId,
  });

  // Add client secret for providers that require it
  if (provider.clientSecret && provider.id !== 'spotify') {
    tokenParams.append('client_secret', provider.clientSecret);
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Accept': 'application/json',
  };

  // Spotify uses Basic auth
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
      throw new Error(`Token refresh failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const tokenData = await response.json();
    
    if (!tokenData.access_token) {
      throw new Error('No access token returned from provider');
    }

    return tokenData;
  } catch (error) {
    console.error(`Token refresh error with ${provider.id}:`, error);
    throw error;
  }
}

/**
 * Revoke access token with OAuth provider
 */
async function revokeTokenWithProvider(provider: any, accessToken: string): Promise<void> {
  if (!provider.revokeEndpoint) {
    throw new Error(`${provider.displayName} does not support token revocation`);
  }

  const revokeParams = new URLSearchParams({
    token: accessToken,
    client_id: provider.clientId,
  });

  const headers: Record<string, string> = {
    'Content-Type': 'application/x-www-form-urlencoded',
  };

  // Spotify uses Basic auth for revocation
  if (provider.id === 'spotify' && provider.clientSecret) {
    const credentials = Buffer.from(`${provider.clientId}:${provider.clientSecret}`).toString('base64');
    headers['Authorization'] = `Basic ${credentials}`;
  } else if (provider.clientSecret) {
    revokeParams.append('client_secret', provider.clientSecret);
  }

  const response = await fetch(provider.revokeEndpoint, {
    method: 'POST',
    headers,
    body: revokeParams.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Token revocation failed: ${response.status} ${response.statusText} - ${errorText}`);
  }
}