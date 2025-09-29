# API Contracts: OAuth Implementation & Platform-Specific UI

## Overview

This document defines the API contracts for OAuth integration with music streaming platforms and platform-specific UI components. All endpoints follow RESTful conventions and use JSON for request/response bodies.

## Authentication

All API endpoints require valid user authentication via Convex's built-in auth system. OAuth-related endpoints additionally validate the user's connection status to the requested provider.

```typescript
// Standard authentication headers
interface AuthHeaders {
  'Authorization': `Bearer ${convexToken}`;
  'Content-Type': 'application/json';
}
```

## OAuth Provider Management

### GET /api/oauth/providers

List all available OAuth providers and their configuration.

**Request:**
```http
GET /api/oauth/providers HTTP/1.1
Authorization: Bearer {convexToken}
```

**Response:**
```typescript
interface ProvidersResponse {
  providers: OAuthProvider[];
  userConnections: {
    [providerId: string]: {
      isConnected: boolean;
      connectedAt?: number;
      lastSyncAt?: number;
      status: 'active' | 'expired' | 'error';
    };
  };
}

// 200 OK
{
  "providers": [
    {
      "id": "spotify",
      "name": "spotify",
      "displayName": "Spotify",
      "scopes": ["user-read-private", "user-top-read", "playlist-read-private"],
      "isEnabled": true,
      "supportedPlatforms": ["ios", "android", "web"],
      "iconUrl": "https://example.com/spotify-icon.svg",
      "brandColor": "#1DB954"
    }
  ],
  "userConnections": {
    "spotify": {
      "isConnected": true,
      "connectedAt": 1703123456789,
      "lastSyncAt": 1703999999999,
      "status": "active"
    }
  }
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid or missing authentication
- `500 Internal Server Error`: Server configuration error

### POST /api/oauth/authorize

Initiate OAuth authorization flow for a specific provider.

**Request:**
```typescript
interface AuthorizeRequest {
  providerId: string; // 'spotify' | 'apple_music'
  platform: 'ios' | 'android' | 'web';
  redirectUri?: string; // Optional custom redirect
  scopes?: string[]; // Optional custom scopes
}
```

```http
POST /api/oauth/authorize HTTP/1.1
Authorization: Bearer {convexToken}
Content-Type: application/json

{
  "providerId": "spotify",
  "platform": "ios",
  "scopes": ["user-read-private", "user-top-read"]
}
```

**Response:**
```typescript
interface AuthorizeResponse {
  authUrl: string;
  state: string;
  codeChallenge: string;
  sessionId: string;
  expiresAt: number;
}

// 200 OK
{
  "authUrl": "https://accounts.spotify.com/authorize?response_type=code&client_id=...&scope=user-read-private%20user-top-read&redirect_uri=...&state=abc123&code_challenge=xyz789&code_challenge_method=S256",
  "state": "abc123",
  "codeChallenge": "xyz789",
  "sessionId": "sess_456",
  "expiresAt": 1703127056789
}
```

**Error Responses:**
- `400 Bad Request`: Invalid provider ID or platform
- `401 Unauthorized`: Authentication required
- `409 Conflict`: User already connected to this provider
- `500 Internal Server Error`: OAuth provider configuration error

### POST /api/oauth/callback

Handle OAuth callback after user authorization.

**Request:**
```typescript
interface CallbackRequest {
  code: string;
  state: string;
  sessionId: string;
  error?: string; // If user denied authorization
  errorDescription?: string;
}
```

```http
POST /api/oauth/callback HTTP/1.1
Authorization: Bearer {convexToken}
Content-Type: application/json

{
  "code": "auth_code_from_provider",
  "state": "abc123",
  "sessionId": "sess_456"
}
```

**Response:**
```typescript
interface CallbackResponse {
  success: boolean;
  connectionId: string;
  provider: {
    id: string;
    displayName: string;
  };
  userInfo: {
    externalUserId: string;
    displayName?: string;
    email?: string;
    profileImageUrl?: string;
  };
  syncStatus: {
    initiated: boolean;
    estimatedCompletion?: number; // Unix timestamp
  };
}

// 200 OK
{
  "success": true,
  "connectionId": "conn_789",
  "provider": {
    "id": "spotify",
    "displayName": "Spotify"
  },
  "userInfo": {
    "externalUserId": "spotify_user_123",
    "displayName": "John Doe",
    "email": "john@example.com",
    "profileImageUrl": "https://i.scdn.co/image/profile.jpg"
  },
  "syncStatus": {
    "initiated": true,
    "estimatedCompletion": 1703127656789
  }
}
```

**Error Responses:**
- `400 Bad Request`: Invalid authorization code or state
- `401 Unauthorized`: Authentication required
- `408 Request Timeout`: OAuth session expired
- `422 Unprocessable Entity`: OAuth provider rejected the request
- `500 Internal Server Error`: Token exchange failed

### DELETE /api/oauth/connections/{providerId}

Disconnect user's OAuth connection to a specific provider.

**Request:**
```http
DELETE /api/oauth/connections/spotify HTTP/1.1
Authorization: Bearer {convexToken}
```

**Response:**
```typescript
interface DisconnectResponse {
  success: boolean;
  providerId: string;
  disconnectedAt: number;
  dataRetention: {
    musicProfile: 'preserved' | 'anonymized' | 'deleted';
    recommendations: 'preserved' | 'deleted';
    retentionPeriod: number; // Days until full deletion
  };
}

// 200 OK
{
  "success": true,
  "providerId": "spotify",
  "disconnectedAt": 1703127756789,
  "dataRetention": {
    "musicProfile": "anonymized",
    "recommendations": "preserved",
    "retentionPeriod": 30
  }
}
```

**Error Responses:**
- `401 Unauthorized`: Authentication required
- `404 Not Found`: Connection not found
- `500 Internal Server Error`: Disconnection failed

## Music Profile Management

### GET /api/music/profile

Retrieve user's aggregated music profile from all connected platforms.

**Request:**
```http
GET /api/music/profile HTTP/1.1
Authorization: Bearer {convexToken}
```

**Query Parameters:**
- `includeRaw`: boolean - Include raw provider data (default: false)
- `refresh`: boolean - Force refresh from providers (default: false)

**Response:**
```typescript
interface MusicProfileResponse {
  profile: MusicProfile;
  lastUpdated: number;
  connectedPlatforms: string[];
  syncStatus: {
    [providerId: string]: {
      lastSync: number;
      status: 'success' | 'error' | 'in_progress';
      errorMessage?: string;
    };
  };
}
```

**Error Responses:**
- `401 Unauthorized`: Authentication required
- `404 Not Found`: No music profile found (no connected platforms)
- `503 Service Unavailable`: External API temporarily unavailable

### POST /api/music/sync

Manually trigger music profile sync from connected platforms.

**Request:**
```typescript
interface SyncRequest {
  providers?: string[]; // Specific providers to sync, or all if omitted
  force?: boolean; // Override rate limits (default: false)
}
```

**Response:**
```typescript
interface SyncResponse {
  jobId: string;
  providers: string[];
  estimatedCompletion: number;
  status: 'queued' | 'in_progress';
}
```

## Music Recommendations

### GET /api/music/recommendations

Get AI-generated music recommendations for workouts.

**Request:**
```http
GET /api/music/recommendations HTTP/1.1
Authorization: Bearer {convexToken}
```

**Query Parameters:**
- `workoutType`: string - Type of workout (required)
- `duration`: number - Duration in minutes (required)
- `intensity`: number - Intensity level 0-1 (required)
- `limit`: number - Max recommendations (default: 50)

**Response:**
```typescript
interface RecommendationsResponse {
  recommendations: WorkoutMusicRecommendation[];
  generatedAt: number;
  algorithm: string;
  confidence: number;
  fallbackUsed: boolean; // True if generic recommendations were used
}
```

### POST /api/music/recommendations/feedback

Provide feedback on music recommendations.

**Request:**
```typescript
interface FeedbackRequest {
  recommendationId: string;
  rating: number; // 1-5 stars
  feedback?: string;
  usedInWorkout: boolean;
  trackFeedback?: {
    [trackId: string]: {
      rating: number;
      skipped?: boolean;
      reason?: string;
    };
  };
}
```

**Response:**
```typescript
interface FeedbackResponse {
  success: boolean;
  recommendationId: string;
  feedbackId: string;
  mlUpdateScheduled: boolean; // Whether ML model will be retrained
}
```

## Platform UI Management

### GET /api/ui/platform-state

Get platform-specific UI state and preferences.

**Request:**
```http
GET /api/ui/platform-state HTTP/1.1
Authorization: Bearer {convexToken}
```

**Query Parameters:**
- `platform`: string - Target platform ('ios', 'android', 'web')

**Response:**
```typescript
interface PlatformStateResponse {
  state: PlatformUIState;
  capabilities: DeviceCapabilities;
  recommendations: {
    theme: string;
    layout: string[];
    features: {
      [feature: string]: boolean;
    };
  };
}

interface DeviceCapabilities {
  platform: string;
  version: string;
  supportsHaptics: boolean;
  supportsDarkMode: boolean;
  supportsNotch: boolean;
  screenSize: {
    width: number;
    height: number;
    density: number;
  };
}
```

### PUT /api/ui/platform-state

Update platform-specific UI preferences.

**Request:**
```typescript
interface UpdateStateRequest {
  platform: 'ios' | 'android' | 'web';
  preferences: Partial<PlatformUIState>;
  deviceInfo?: Partial<DeviceInfo>;
}
```

**Response:**
```typescript
interface UpdateStateResponse {
  success: boolean;
  updatedFields: string[];
  effectiveAt: number;
  syncedToOtherDevices: boolean;
}
```

### POST /api/ui/detect-capabilities

Detect and store device capabilities for platform optimization.

**Request:**
```typescript
interface DetectCapabilitiesRequest {
  userAgent: string;
  screenMetrics: {
    width: number;
    height: number;
    pixelRatio: number;
  };
  platform: string;
  platformVersion: string;
  appVersion: string;
}
```

**Response:**
```typescript
interface CapabilitiesResponse {
  detected: DeviceCapabilities;
  optimizations: {
    layout: string;
    theme: string;
    animations: boolean;
    features: {
      [feature: string]: boolean;
    };
  };
  recommendations: string[];
}
```

## WebSocket Events (Real-time Updates)

### OAuth Connection Events

```typescript
// Subscription: oauth-connection-status:{userId}
interface OAuthConnectionEvent {
  type: 'connection-established' | 'connection-lost' | 'token-refreshed' | 'sync-complete' | 'sync-error';
  providerId: string;
  timestamp: number;
  data?: {
    errorMessage?: string;
    syncProgress?: number;
    newDataAvailable?: boolean;
  };
}
```

### Music Profile Events

```typescript
// Subscription: music-profile-updates:{userId}
interface MusicProfileEvent {
  type: 'profile-updated' | 'recommendations-ready' | 'sync-progress';
  timestamp: number;
  data: {
    profileVersion?: number;
    recommendationId?: string;
    syncProgress?: {
      provider: string;
      progress: number; // 0-100
      status: string;
    };
  };
}
```

## Error Handling Standards

All endpoints follow consistent error response format:

```typescript
interface ErrorResponse {
  error: {
    code: string; // Machine-readable error code
    message: string; // Human-readable message
    details?: any; // Additional error context
    timestamp: number;
    requestId: string;
  };
}

// Common error codes:
// - INVALID_REQUEST: Malformed request data
// - AUTHENTICATION_REQUIRED: Missing or invalid auth
// - AUTHORIZATION_FAILED: User lacks required permissions
// - RESOURCE_NOT_FOUND: Requested resource doesn't exist
// - RATE_LIMIT_EXCEEDED: Too many requests
// - EXTERNAL_API_ERROR: Third-party service error
// - VALIDATION_ERROR: Request data validation failed
// - INTERNAL_ERROR: Unexpected server error
```

## Rate Limiting

API endpoints implement rate limiting to prevent abuse and ensure fair usage:

- **OAuth endpoints**: 10 requests/minute per user
- **Music sync**: 1 request/5 minutes per provider per user
- **Recommendations**: 20 requests/hour per user
- **UI state**: 100 requests/hour per user
- **General endpoints**: 1000 requests/hour per user

Rate limit headers included in responses:
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1703130000
```

## Security Considerations

1. **OAuth Token Security**: All access/refresh tokens encrypted at rest
2. **PKCE Flow**: Required for all OAuth flows to prevent code interception
3. **State Validation**: OAuth state parameter validated to prevent CSRF
4. **Scope Minimization**: Only request necessary OAuth scopes
5. **Token Rotation**: Refresh tokens automatically rotated when possible
6. **Audit Logging**: All OAuth operations logged for security monitoring

This API contract provides comprehensive endpoints for secure OAuth integration, music profile management, and platform-optimized UI experiences while maintaining strong security and performance standards.