# Quickstart Guide: OAuth Implementation & Platform-Specific UI

## Overview

This guide helps developers quickly set up and test OAuth integration with music streaming platforms and platform-specific UI components in the git-fit application.

## Prerequisites

- Node.js 18+ and pnpm installed
- Convex CLI installed and configured
- Development environment set up (see main README.md)
- Access to Spotify/Apple Music developer accounts for API keys

## Environment Setup

### 1. OAuth Provider Configuration

Add the following environment variables to your `.env.local`:

```bash
# Spotify OAuth
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
SPOTIFY_REDIRECT_URI=http://localhost:5173/oauth/callback/spotify

# Apple Music OAuth (requires Apple Developer account)
APPLE_MUSIC_TEAM_ID=your_apple_team_id  
APPLE_MUSIC_KEY_ID=your_apple_key_id
APPLE_MUSIC_PRIVATE_KEY=path_to_your_apple_music_private_key.p8

# Encryption for OAuth tokens
OAUTH_ENCRYPTION_KEY=your_32_character_encryption_key

# Platform detection
CAPACITOR_PLATFORM_DETECTION=true
```

### 2. Database Schema Setup

Run the Convex schema migration:

```bash
cd convex
npx convex dev
```

The schema will automatically create the required tables:
- `oauthProviders`
- `userOAuthConnections` 
- `musicProfiles`
- `workoutMusicRecommendations`
- `platformUIStates`
- `oauthSessions`

### 3. Seed Data

Run the setup script to populate OAuth provider configurations:

```bash
pnpm run setup:oauth
```

This creates the base provider configurations for Spotify and Apple Music.

## Quick Development Test

### 1. Start Development Servers

```bash
# Terminal 1: Start Convex backend
cd convex && npx convex dev

# Terminal 2: Start SvelteKit frontend  
cd app && pnpm dev
```

### 2. Test OAuth Flow (Web)

1. Navigate to `http://localhost:5173/settings/connections`
2. Click "Connect Spotify" button
3. Complete OAuth flow in popup window
4. Verify connection appears in UI
5. Check Convex dashboard for created `userOAuthConnections` record

### 3. Test Music Profile Sync

```bash
# Trigger manual sync via API
curl -X POST http://localhost:5173/api/music/sync \
  -H "Authorization: Bearer YOUR_CONVEX_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"providers": ["spotify"]}'
```

### 4. Test Platform-Specific UI (Mobile)

```bash
# Build for iOS
cd app && pnpm cap:build:ios && pnpm cap:open:ios

# Build for Android  
cd app && pnpm cap:build:android && pnpm cap:open:android
```

## Key Components

### Frontend Components

#### OAuth Connection Manager
```typescript
// app/src/lib/components/OAuthManager.svelte
<script lang="ts">
  import { connectProvider, disconnectProvider } from '$lib/oauth';
  
  export let providers: OAuthProvider[];
  export let connections: UserConnection[];
</script>
```

#### Platform UI Adapter
```typescript
// app/src/lib/components/PlatformUIAdapter.svelte
<script lang="ts">
  import { detectPlatform, getUIPreferences } from '$lib/platform';
  
  let platform = detectPlatform();
  let uiState = getUIPreferences(platform);
</script>
```

### Backend Functions

#### OAuth Authorization
```typescript
// convex/functions/oauth.ts
export const authorize = mutation({
  args: {
    providerId: v.string(),
    platform: v.union(v.literal("ios"), v.literal("android"), v.literal("web")),
  },
  handler: async (ctx, args) => {
    // Implementation in contracts.md
  }
});
```

#### Music Profile Sync
```typescript  
// convex/functions/music.ts
export const syncProfile = mutation({
  args: {
    providers: v.optional(v.array(v.string())),
    force: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Implementation in contracts.md
  }
});
```

## Testing Scenarios

### OAuth Flow Testing

1. **Successful Connection**
   ```typescript
   // Test new OAuth connection
   await connectToSpotify();
   expect(connections).toContain('spotify');
   ```

2. **Token Refresh**
   ```typescript
   // Test automatic token refresh
   await simulateTokenExpiry('spotify');
   await syncMusicProfile();
   expect(connection.status).toBe('active');
   ```

3. **Connection Error Handling**
   ```typescript
   // Test provider unavailable
   await disconnectProvider('spotify');
   const result = await syncMusicProfile();
   expect(result.errors).toContain('spotify_unavailable');
   ```

### Platform UI Testing

1. **iOS-Specific Features**
   ```typescript
   // Test iOS native features
   if (platform === 'ios') {
     expect(uiState.iosSettings?.useSystemColors).toBe(true);
     expect(components).toInclude('SafeAreaView');
   }
   ```

2. **Android Material You**
   ```typescript
   // Test Android dynamic theming
   if (platform === 'android' && androidVersion >= 12) {
     expect(uiState.androidSettings?.materialYou).toBe(true);
     expect(theme.colors).toMatchSystemColors();
   }
   ```

3. **Web Responsive Design**
   ```typescript
   // Test responsive breakpoints
   await resize(768);
   expect(layout).toBe('tablet');
   await resize(1200);
   expect(layout).toBe('desktop');
   ```

## Performance Monitoring

### Key Metrics to Track

1. **OAuth Performance**
   - Authorization flow completion time
   - Token refresh success rate  
   - API rate limit utilization

2. **Music Sync Performance**
   - Profile sync duration per provider
   - Recommendation generation time
   - Cache hit rates

3. **Platform UI Performance**
   - Component render times by platform
   - Memory usage across devices
   - Battery impact (mobile)

### Monitoring Setup

```typescript
// app/src/lib/monitoring/oauth.ts
export function trackOAuthMetrics(providerId: string, action: string, duration: number) {
  analytics.track('oauth_action', {
    provider: providerId,
    action,
    duration,
    platform: getCurrentPlatform(),
    timestamp: Date.now()
  });
}
```

## Troubleshooting

### Common Issues

1. **OAuth Callback Not Working**
   - Check redirect URI configuration
   - Verify CORS settings for popup mode
   - Ensure HTTPS in production

2. **Music Data Not Syncing**
   - Verify provider API keys and scopes
   - Check rate limiting status
   - Review error logs in Convex dashboard

3. **Platform UI Not Adapting**
   - Confirm Capacitor platform detection
   - Check device capability detection
   - Verify CSS media queries

### Debug Commands

```bash
# Check OAuth provider status
pnpm run debug:oauth-status

# Test music API connections  
pnpm run debug:music-apis

# Validate platform detection
pnpm run debug:platform-detection

# Run full integration test suite
pnpm run test:integration
```

### Useful Debug URLs

- **OAuth Status**: `http://localhost:5173/debug/oauth`
- **Music Profile**: `http://localhost:5173/debug/music`  
- **Platform Info**: `http://localhost:5173/debug/platform`
- **Convex Dashboard**: `https://dashboard.convex.dev`

## Production Deployment

### Security Checklist

- [ ] All OAuth secrets properly configured in production environment
- [ ] Encryption keys generated securely and stored safely
- [ ] HTTPS enforced for all OAuth redirects
- [ ] Rate limiting configured appropriately
- [ ] Error logging and monitoring set up
- [ ] Data retention policies implemented

### Platform-Specific Deployment

#### iOS App Store
```bash
# Build production iOS app
cd app && pnpm cap:build:ios --prod
# Upload via Xcode or Transporter
```

#### Google Play Store
```bash
# Build production Android app  
cd app && pnpm cap:build:android --prod
# Sign and upload via Play Console
```

#### Web Deployment
```bash
# Build optimized web bundle
cd app && pnpm build
# Deploy to your hosting platform
```

## Support & Resources

- **API Documentation**: See `contracts.md`
- **Data Model**: See `data-model.md`
- **Architecture Research**: See `research.md`
- **Convex Docs**: https://docs.convex.dev
- **SvelteKit Docs**: https://kit.svelte.dev
- **Capacitor Docs**: https://capacitorjs.com

## Next Steps

1. Complete OAuth provider setup with your API keys
2. Test the full flow on your target platforms
3. Customize UI components to match your design system
4. Set up monitoring and analytics
5. Deploy to staging environment for testing

This quickstart should have you up and running with OAuth integration and platform-specific UI in under 30 minutes. For detailed implementation guidance, refer to the companion documentation files.