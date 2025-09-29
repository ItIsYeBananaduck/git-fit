# Agent Context: OAuth Implementation & Platform-Specific UI

## Implementation Overview

This file provides essential context for AI coding assistants implementing OAuth integration with music streaming platforms and platform-specific UI components in the git-fit fitness application.

## Technical Stack Context

### Core Technologies
- **Frontend**: SvelteKit 2.22+ with TypeScript 5.0+
- **Backend**: Convex 1.27+ (real-time database with auto-scaling)
- **Mobile**: Capacitor 7.4+ (iOS/Android deployment)
- **Styling**: Tailwind CSS 4.1+ with platform-specific adaptations
- **Build**: Vite with TypeScript compilation and mobile optimizations

### Key Dependencies
```json
{
  "oauth-providers": {
    "@sveltejs/adapter-auto": "^3.0.0",
    "capacitor-oauth2": "^2.0.0",
    "@capacitor/app": "^5.0.0",
    "@capacitor/haptics": "^5.0.0"
  },
  "music-integration": {
    "spotify-web-api-node": "^5.0.2",
    "apple-music-api": "^2.1.0",
    "music-metadata": "^8.1.0"
  },
  "encryption": {
    "node:crypto": "native",
    "@noble/ciphers": "^0.4.0"
  },
  "ui-components": {
    "@threlte/core": "^7.0.0",
    "three": "^0.158.0",
    "@capacitor/status-bar": "^5.0.0"
  }
}
```

## Architecture Patterns

### OAuth Flow Implementation
```typescript
// Pattern: PKCE OAuth with secure token storage
class OAuthManager {
  async initiateFlow(provider: string, platform: Platform): Promise<AuthSession> {
    // 1. Generate PKCE challenge
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    
    // 2. Create secure session
    const session = await this.convex.mutation(api.oauth.createSession, {
      providerId: provider,
      codeChallenge,
      codeVerifier: await encrypt(codeVerifier),
      platform
    });
    
    // 3. Open platform-appropriate auth window
    return this.openAuthWindow(provider, session, platform);
  }
}
```

### Platform Detection Strategy
```typescript
// Pattern: Comprehensive platform detection
interface PlatformContext {
  platform: 'ios' | 'android' | 'web';
  version: string;
  capabilities: DeviceCapabilities;
  uiAdaptations: UIAdaptations;
}

function detectPlatform(): PlatformContext {
  if (Capacitor.isNativePlatform()) {
    const info = Device.getInfo();
    return {
      platform: info.platform,
      version: info.osVersion,
      capabilities: detectCapabilities(info),
      uiAdaptations: getUIAdaptations(info.platform)
    };
  }
  return detectWebPlatform();
}
```

### Convex Integration Pattern
```typescript
// Pattern: Real-time data with offline support
export const syncMusicProfile = mutation({
  args: {
    userId: v.id("users"),
    providers: v.array(v.string())
  },
  handler: async (ctx, args) => {
    // 1. Validate OAuth connections
    const connections = await ctx.db
      .query("userOAuthConnections")
      .withIndex("by_user_provider", (q) => q.eq("userId", args.userId))
      .filter((q) => q.in(q.field("providerId"), args.providers))
      .collect();
    
    // 2. Sync from external APIs
    const syncResults = await Promise.allSettled(
      connections.map(conn => syncProviderData(conn))
    );
    
    // 3. Update music profile
    return updateMusicProfile(args.userId, syncResults);
  }
});
```

## Security Implementation

### Token Encryption
```typescript
// All OAuth tokens must be encrypted before storage
import { encrypt, decrypt } from '$lib/crypto';

async function storeTokens(tokens: OAuthTokens): Promise<void> {
  const encrypted = {
    accessToken: await encrypt(tokens.accessToken),
    refreshToken: await encrypt(tokens.refreshToken),
    // Store expiry and scopes in plaintext for queries
    expiresAt: tokens.expiresAt,
    scopes: tokens.scopes
  };
  
  await convex.mutation(api.oauth.storeConnection, encrypted);
}
```

### PKCE Implementation
```typescript
// Required for all OAuth flows to prevent code interception
function generateCodeVerifier(): string {
  return base64URLEncode(crypto.randomBytes(32));
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256', 
    new TextEncoder().encode(verifier)
  );
  return base64URLEncode(hash);
}
```

## Platform-Specific UI Patterns

### iOS Adaptations
```svelte
<!-- Pattern: iOS native look and feel -->
{#if platform === 'ios'}
  <div class="ios-safe-area bg-ios-background">
    <div class="ios-navigation-bar">
      <button class="ios-back-button" on:click={goBack}>
        <ChevronLeft class="ios-icon" />
      </button>
      <h1 class="ios-title">{title}</h1>
    </div>
    
    <!-- iOS-specific haptic feedback -->
    <button 
      class="ios-button"
      on:click={() => triggerHaptic('impact', 'medium')}
    >
      Connect to Apple Music
    </button>
  </div>
{/if}
```

### Android Material You
```svelte
<!-- Pattern: Dynamic Material You theming -->
{#if platform === 'android'}
  <div class="android-container" style:--md-sys-color-primary={dynamicColor.primary}>
    <div class="md-top-app-bar">
      <button class="md-icon-button" on:click={goBack}>
        <ArrowBack />
      </button>
      <span class="md-headline">{title}</span>
    </div>
    
    <!-- Material You adaptive button -->
    <button class="md-filled-button" on:click={connectSpotify}>
      <SpotifyIcon />
      Connect Spotify
    </button>
  </div>
{/if}
```

### Web Responsive
```svelte
<!-- Pattern: Progressive enhancement for web -->
{#if platform === 'web'}
  <div class="web-container">
    <div class="web-header desktop:sticky desktop:top-0">
      <h1 class="text-2xl md:text-3xl">{title}</h1>
    </div>
    
    <!-- Web-specific OAuth popup -->
    <button 
      class="web-button"
      on:click={() => openOAuthPopup('spotify')}
    >
      Connect with Spotify
    </button>
  </div>
{/if}
```

## API Integration Guidelines

### Spotify Web API
```typescript
// Pattern: Robust API client with error handling
class SpotifyClient {
  constructor(private accessToken: string) {}
  
  async getUserProfile(): Promise<SpotifyUser> {
    try {
      const response = await fetch('https://api.spotify.com/v1/me', {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new TokenExpiredError('Spotify token expired');
        }
        throw new SpotifyAPIError(`API error: ${response.status}`);
      }
      
      return response.json();
    } catch (error) {
      // Implement retry logic and error reporting
      throw this.handleAPIError(error);
    }
  }
}
```

### Apple Music API
```typescript
// Pattern: JWT-based authentication for Apple Music
class AppleMusicClient {
  private jwt: string;
  
  constructor(teamId: string, keyId: string, privateKey: string) {
    this.jwt = this.generateJWT(teamId, keyId, privateKey);
  }
  
  async searchMusic(query: string): Promise<AppleMusicSearchResult> {
    const response = await fetch(
      `https://api.music.apple.com/v1/catalog/us/search?term=${encodeURIComponent(query)}`,
      {
        headers: {
          'Authorization': `Bearer ${this.jwt}`,
          'Music-User-Token': this.userToken // From OAuth flow
        }
      }
    );
    
    return this.handleResponse(response);
  }
}
```

## Testing Patterns

### OAuth Flow Testing
```typescript
// Pattern: Mock OAuth providers for testing
import { vi } from 'vitest';

describe('OAuth Integration', () => {
  beforeEach(() => {
    vi.mock('$lib/oauth', () => ({
      initiateOAuthFlow: vi.fn(),
      exchangeCodeForTokens: vi.fn()
    }));
  });
  
  test('should handle successful Spotify connection', async () => {
    const mockTokens = {
      access_token: 'test-access-token',
      refresh_token: 'test-refresh-token',
      expires_in: 3600
    };
    
    exchangeCodeForTokens.mockResolvedValue(mockTokens);
    
    const result = await connectToSpotify('test-code', 'test-state');
    
    expect(result.success).toBe(true);
    expect(result.provider).toBe('spotify');
  });
});
```

### Platform UI Testing
```typescript
// Pattern: Platform-specific component testing
describe('Platform UI Adaptation', () => {
  test.each([
    ['ios', 'should render iOS-specific navigation'],
    ['android', 'should render Material You components'],
    ['web', 'should render responsive web layout']
  ])('on %s platform, %s', async (platform, expectation) => {
    const { getByTestId } = render(PlatformAwareComponent, {
      platform
    });
    
    if (platform === 'ios') {
      expect(getByTestId('ios-navigation-bar')).toBeInTheDocument();
    }
    // ... other platform checks
  });
});
```

## Performance Optimizations

### Code Splitting by Platform
```typescript
// Pattern: Load platform-specific code only when needed
const loadPlatformUI = async (platform: Platform) => {
  switch (platform) {
    case 'ios':
      return import('./platforms/IOSComponents.svelte');
    case 'android':
      return import('./platforms/AndroidComponents.svelte');
    case 'web':
      return import('./platforms/WebComponents.svelte');
  }
};
```

### Convex Query Optimization
```typescript
// Pattern: Efficient database queries with proper indexing
export const getMusicProfileWithConnections = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // Use compound index for efficient lookup
    const [profile, connections] = await Promise.all([
      ctx.db.query("musicProfiles")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .unique(),
      ctx.db.query("userOAuthConnections")
        .withIndex("by_user_active", (q) => 
          q.eq("userId", args.userId).eq("isActive", true)
        )
        .collect()
    ]);
    
    return { profile, connections };
  }
});
```

## Error Handling Standards

### OAuth Error Handling
```typescript
// Pattern: Comprehensive OAuth error handling
class OAuthError extends Error {
  constructor(
    public code: string,
    public provider: string,
    message: string,
    public retryable: boolean = false
  ) {
    super(message);
  }
}

function handleOAuthError(error: any, provider: string): OAuthError {
  if (error.error === 'access_denied') {
    return new OAuthError('USER_DENIED', provider, 'User denied authorization');
  }
  
  if (error.error === 'invalid_grant') {
    return new OAuthError('TOKEN_EXPIRED', provider, 'Token expired', true);
  }
  
  return new OAuthError('UNKNOWN_ERROR', provider, error.message);
}
```

## Implementation Checklist

### Phase 1: Core OAuth Setup
- [ ] Create Convex schema for OAuth entities
- [ ] Implement PKCE OAuth flow for web platform
- [ ] Set up token encryption/decryption utilities
- [ ] Create OAuth provider configuration system
- [ ] Implement Spotify API integration
- [ ] Add basic error handling and logging

### Phase 2: Platform Extensions
- [ ] Extend OAuth flow for iOS/Android via Capacitor
- [ ] Implement platform-specific UI components
- [ ] Add Apple Music API integration
- [ ] Create device capability detection
- [ ] Implement haptic feedback for mobile platforms
- [ ] Add platform-specific navigation patterns

### Phase 3: Music Integration
- [ ] Build music profile aggregation system
- [ ] Implement AI-powered workout music recommendations
- [ ] Create real-time sync with external APIs
- [ ] Add music preference learning algorithms
- [ ] Implement playlist generation features
- [ ] Add offline music data caching

### Phase 4: Security & Performance
- [ ] Implement comprehensive security measures
- [ ] Add performance monitoring and optimization
- [ ] Create automated testing suite
- [ ] Implement data retention and deletion policies
- [ ] Add GDPR/CCPA compliance features
- [ ] Optimize for mobile performance and battery usage

This context file provides the essential patterns, conventions, and implementation guidance needed to successfully build the OAuth integration and platform-specific UI features according to the project's architecture and requirements.