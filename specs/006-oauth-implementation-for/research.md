# Research: OAuth Implementation & Platform-Specific UI for AdaptiveFit

**Date**: September 28, 2025  
**Feature**: OAuth Implementation & Platform-Specific UI for AdaptiveFit  
**Status**: Complete

## OAuth Provider Integration Research

### Spotify Web API OAuth 2.0
**Decision**: Use Spotify Web API with Authorization Code with PKCE flow  
**Rationale**: 
- PKCE (Proof Key for Code Exchange) provides enhanced security for client applications
- Supports refresh tokens for seamless re-authentication
- Provides track metadata including BPM and genre through Audio Features endpoint
- Well-documented with TypeScript SDK available

**Alternatives considered**: 
- Implicit Grant (rejected: deprecated and less secure)
- Client Credentials (rejected: requires user permission for track data)

**Implementation notes**:
- Use `@spotify/web-api-sdk` npm package for TypeScript support
- Required scopes: `user-read-playback-state`, `user-read-currently-playing`
- Token storage in Capacitor SecureStorage for mobile, IndexedDB for web

### Apple Music API OAuth
**Decision**: Use Apple Music API with developer tokens and user tokens  
**Rationale**:
- MusicKit JS provides browser-based integration
- User tokens allow access to user's library and listening history
- Metadata includes BPM and genre information
- Official Apple SDK with TypeScript definitions

**Alternatives considered**:
- MediaPlayer framework (rejected: requires native iOS development)
- Third-party APIs (rejected: violates Apple's terms of service)

**Implementation notes**:
- Requires Apple Developer Program membership ($99/year)
- Use MusicKit JS for web, native MusicKit for iOS
- Developer token has 6-month expiration, user tokens refresh automatically

## Platform-Specific UI Research

### Capacitor Cross-Platform Architecture
**Decision**: Single codebase with platform-specific UI components using Capacitor  
**Rationale**:
- Existing SvelteKit + Capacitor setup already proven in codebase
- Platform detection via `Capacitor.getPlatform()`
- Conditional rendering based on screen size and platform
- Native plugin access for device APIs (SecureStorage, Browser, etc.)

**Alternatives considered**:
- Separate native apps (rejected: increased maintenance overhead)
- PWA only (rejected: limited mobile API access)

**Implementation patterns**:
```typescript
// Platform detection pattern
import { Capacitor } from '@capacitor/core';
const platform = Capacitor.getPlatform(); // 'web', 'ios', 'android'
const isTablet = window.innerWidth >= 768;
```

### 3D Avatar Integration (Alice/Aiden)
**Decision**: Use Three.js with @capacitor-community/three loader for GLB models  
**Rationale**:
- Three.js has proven WebGL support across platforms
- GLB format provides optimized file size and loading
- Capacitor Three community plugin enables native rendering acceleration
- Fade-in animations via CSS transitions

**Alternatives considered**:
- Native 3D frameworks (rejected: platform-specific implementation required)
- WebXR (rejected: limited browser support)
- 2D animations (rejected: less engaging user experience)

## Real-Time Architecture Research

### Convex Real-Time Scaling
**Decision**: Use Convex subscriptions with auto-scaling configuration  
**Rationale**:
- Existing Convex infrastructure already handles real-time updates
- Built-in horizontal scaling handles 10k+ concurrent connections
- WebSocket fallback ensures cross-platform compatibility
- Server-side functions scale automatically based on load

**Scaling configuration**:
- Connection pooling for WebSocket management
- Rate limiting: 100 requests/minute per user for OAuth operations
- Batch processing for music metadata correlation

### Strain Monitoring Performance
**Decision**: Client-side calculation with server-side alert triggering  
**Rationale**:
- Reduces server load by calculating strain locally
- 85% threshold detection triggers immediate server notification
- 5-second SLA requires client-side processing for responsiveness
- Trainer notifications via Convex real-time subscriptions

## Security & Compliance Research

### End-to-End Encryption Implementation
**Decision**: Use Web Crypto API with AES-GCM encryption  
**Rationale**:
- Native browser support, no external dependencies
- AES-GCM provides authenticated encryption
- Key exchange via Diffie-Hellman for trainer-client communication
- Compatible with Capacitor's SecureStorage for key management

**Key management**:
- Per-conversation encryption keys stored in SecureStorage
- Keys rotated every 30 days for enhanced security
- Public key distribution via Convex with signature verification

### GDPR/CCPA Compliance Architecture
**Decision**: Privacy-by-design data architecture with automatic retention management  
**Rationale**:
- Convex scheduled functions handle automatic 6-month data cleanup
- User consent tracking with granular permission management
- Data export functionality for user rights requests
- Anonymous data correlation prevents personal identification

**Data retention schedule**:
- OAuth tokens: Until user disconnects service
- Music metadata: 6 months or until user opts out
- Encrypted messages: 30 days after conversation ends
- User deletion requests: Complete within 30 days

## Payment Integration Research

### Stripe Integration for Apple IAP Bypass
**Decision**: External browser redirect for payment processing  
**Rationale**:
- Capacitor Browser plugin opens external payment URLs
- Completely bypasses Apple's in-app purchase restrictions
- Webhook-based payment confirmation ensures security
- Server-side commission calculation (30% standard, 10% pro users)

**Implementation flow**:
1. Trainer shares payment code via encrypted chat
2. Client taps marketplace link → Browser.open() to external site
3. Stripe Checkout session with custom success URL
4. Webhook processes payment and unlocks content in Convex
5. Real-time notification to client via Convex subscription

## Performance Optimization Research

### OAuth Token Management
**Decision**: Proactive token refresh with 5-minute buffer  
**Rationale**:
- Prevents workout interruption from expired tokens
- Background refresh task runs every hour during active sessions
- Fallback graceful degradation continues workout without music logging
- Error recovery automatically retries authentication flow

### Mobile Performance Optimization
**Decision**: Lazy loading with component-level code splitting  
**Rationale**:
- 3D avatar models loaded only when activated
- OAuth providers loaded on-demand when user enables integration
- Platform-specific UI components bundled separately
- Service Worker caching for offline capability

## Integration Testing Strategy

### OAuth Flow Testing
**Decision**: Use Playwright with mock OAuth providers for E2E testing  
**Rationale**:
- Real OAuth flows in development/staging environments
- Mock providers prevent test flakiness in CI/CD
- Token refresh scenarios tested automatically
- Cross-platform testing via Capacitor emulation

**Test scenarios**:
- Initial OAuth authorization (success/failure)
- Token refresh during active workout
- Network interruption recovery
- User permission revocation handling

## Technical Debt Assessment

### Existing Convex Schema Integration
**Finding**: Current schema supports OAuth integration with minor extensions  
**Required changes**:
- Add `oauthTokens` table with proper indexing
- Extend `users` table with music integration preferences
- Add `musicMetadata` correlation tracking
- Payment system already implemented via Stripe

### Mobile Platform Compatibility
**Finding**: Existing Capacitor setup supports required plugins  
**Required additions**:
- `@capacitor/browser` for external payment links
- `@capacitor-community/secure-storage` for token management  
- `@capacitor/haptics` for tactile feedback during strain alerts
- Platform capability detection for feature availability

## Development Timeline Estimate

Based on research findings and existing infrastructure:

**Phase 1 (OAuth Integration)**: 5-7 days
- Spotify/Apple Music OAuth flow implementation
- Token management and refresh logic
- Music metadata collection integration

**Phase 2 (Platform UI)**: 3-5 days  
- Platform detection and conditional rendering
- 3D avatar integration with Three.js
- Tablet trainer mode interface

**Phase 3 (Payment Integration)**: 2-3 days
- External Stripe redirect implementation
- Webhook processing and content unlocking
- Encrypted chat payment code sharing

**Phase 4 (Performance & Security)**: 3-4 days
- Real-time scaling optimization
- End-to-end encryption implementation
- GDPR/CCPA compliance automation

**Total estimated effort**: 13-19 days for complete implementation

## Risk Mitigation

### External Dependency Risks
- **OAuth Provider Changes**: Implement adapter pattern for easy provider swapping
- **Apple Music Restrictions**: Fallback to Spotify-only if Apple requirements change
- **Stripe Policy Changes**: Monitor payment processing regulations quarterly

### Performance Risks  
- **10k Concurrent Users**: Load testing required before production deployment
- **Real-time Update Delays**: Circuit breaker pattern for graceful degradation
- **Mobile Battery Impact**: Background task optimization and user controls

### Compliance Risks
- **GDPR/CCPA Updates**: Quarterly legal compliance review scheduled
- **Data Breach Prevention**: Regular security audits and penetration testing
- **Apple Store Review**: External payment flows require careful policy compliance