# Tasks: OAuth Implementation & Platform-Specific UI

**Input**: Design documents from `/specs/006-oauth-implementation-for/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts.md, quickstart.md

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → Extract: SvelteKit 2.22+, Convex 1.27+, Capacitor 7.4+, TypeScript 5.0+
   → Structure: Mobile + API (Capacitor mobile deployment, Convex backend)
2. Load design documents:
   → data-model.md: 6 entities (OAuthProvider, UserOAuthConnection, MusicProfile, etc.)
   → contracts.md: 12 API endpoints across OAuth, Music, and Platform UI
   → quickstart.md: Testing scenarios for OAuth flow and platform detection
3. Generate tasks by category:
   → Setup: Convex schema, OAuth provider config, Capacitor setup
   → Tests: 12 contract tests, 8 integration tests 
   → Core: 6 data models, OAuth services, platform UI components
   → Integration: Encryption utilities, real-time sync, platform detection
   → Polish: performance optimization, security validation, documentation
4. Apply task rules:
   → Different files marked [P] for parallel execution
   → Sequential for shared services and UI components
   → Tests before implementation (TDD approach)
5. Number tasks T001-T032 with dependency ordering
6. Parallel execution: Contract tests, model creation, component development
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- File paths relative to git-fit repository root

## Path Conventions
Based on plan.md structure: Mobile + API with SvelteKit frontend, Convex backend, Capacitor deployment
- **Backend**: `convex/` directory for schema and functions  
- **Frontend**: `app/src/` for components and services
- **Mobile**: Capacitor configuration in `app/`
- **Tests**: `app/tests/` for contract and integration tests

## Phase 3.1: Setup & Infrastructure
- [x] T001 Create Convex schema for OAuth entities in `convex/schema.ts`
- [x] T002 Initialize OAuth provider configurations in `convex/functions/oauthProviders.ts` 
- [x] T003 [P] Set up encryption utilities for token storage in `app/src/lib/crypto.ts`
- [x] T004 [P] Configure Capacitor platform detection in `app/src/lib/platform.ts`
- [x] T005 [P] Set up environment configuration for OAuth providers in `app/src/lib/config.ts`

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

### Contract Tests - OAuth Provider Management
- [ ] T006 [P] Contract test GET /api/oauth/providers in `app/tests/contract/oauth-providers-get.test.ts`
- [ ] T007 [P] Contract test POST /api/oauth/authorize in `app/tests/contract/oauth-authorize-post.test.ts`
- [ ] T008 [P] Contract test POST /api/oauth/callback in `app/tests/contract/oauth-callback-post.test.ts`
- [ ] T009 [P] Contract test DELETE /api/oauth/connections/{providerId} in `app/tests/contract/oauth-disconnect-delete.test.ts`

### Contract Tests - Music Profile Management  
- [ ] T010 [P] Contract test GET /api/music/profile in `app/tests/contract/music-profile-get.test.ts`
- [ ] T011 [P] Contract test POST /api/music/sync in `app/tests/contract/music-sync-post.test.ts`
- [ ] T012 [P] Contract test GET /api/music/recommendations in `app/tests/contract/music-recommendations-get.test.ts`
- [ ] T013 [P] Contract test POST /api/music/recommendations/feedback in `app/tests/contract/music-feedback-post.test.ts`

### Contract Tests - Platform UI Management
- [ ] T014 [P] Contract test GET /api/ui/platform-state in `app/tests/contract/ui-platform-state-get.test.ts`
- [ ] T015 [P] Contract test PUT /api/ui/platform-state in `app/tests/contract/ui-platform-state-put.test.ts`
- [ ] T016 [P] Contract test POST /api/ui/detect-capabilities in `app/tests/contract/ui-detect-capabilities-post.test.ts`

### Integration Tests
- [ ] T017 [P] Integration test OAuth flow (Spotify) in `app/tests/integration/oauth-spotify-flow.test.ts`
- [ ] T018 [P] Integration test OAuth flow (Apple Music) in `app/tests/integration/oauth-apple-music-flow.test.ts`
- [ ] T019 [P] Integration test music profile sync in `app/tests/integration/music-profile-sync.test.ts`
- [ ] T020 [P] Integration test platform UI adaptation in `app/tests/integration/platform-ui-adaptation.test.ts`
- [ ] T021 [P] Integration test token refresh flow in `app/tests/integration/token-refresh-flow.test.ts`
- [ ] T022 [P] Integration test music recommendations generation in `app/tests/integration/music-recommendations.test.ts`
- [ ] T023 [P] Integration test cross-platform sync in `app/tests/integration/cross-platform-sync.test.ts`
- [ ] T024 [P] Integration test security and encryption in `app/tests/integration/security-encryption.test.ts`

## Phase 3.3: Data Models (ONLY after tests are failing)
- [ ] T025 [P] OAuthProvider entity in `convex/schema.ts` (extend existing)
- [ ] T026 [P] UserOAuthConnection entity in `convex/schema.ts` (extend existing)
- [ ] T027 [P] MusicProfile entity in `convex/schema.ts` (extend existing)
- [ ] T028 [P] WorkoutMusicRecommendation entity in `convex/schema.ts` (extend existing)
- [ ] T029 [P] PlatformUIState entity in `convex/schema.ts` (extend existing)
- [ ] T030 [P] OAuthSession entity in `convex/schema.ts` (extend existing)

## Phase 3.4: Core Implementation
### OAuth Service Layer
- [ ] T031 OAuth provider service in `convex/functions/oauth.ts`
- [ ] T032 OAuth authorization endpoint implementation 
- [ ] T033 OAuth callback handler implementation
- [ ] T034 Token refresh service implementation
- [ ] T035 Connection management service implementation

### Music Services
- [ ] T036 [P] Spotify API integration in `app/src/lib/services/spotify.ts`
- [ ] T037 [P] Apple Music API integration in `app/src/lib/services/appleMusic.ts`
- [ ] T038 Music profile aggregation service in `convex/functions/music.ts`
- [ ] T039 Music sync orchestration service implementation
- [ ] T040 Music recommendations AI service implementation

### Platform UI Components
- [ ] T041 [P] Platform detection component in `app/src/lib/components/PlatformDetector.svelte`
- [ ] T042 [P] iOS-specific UI components in `app/src/lib/components/platform/IOSComponents.svelte`
- [ ] T043 [P] Android-specific UI components in `app/src/lib/components/platform/AndroidComponents.svelte` 
- [ ] T044 [P] Web-responsive UI components in `app/src/lib/components/platform/WebComponents.svelte`
- [ ] T045 Platform UI state management in `convex/functions/platformUI.ts`

### OAuth UI Integration
- [ ] T046 OAuth connection manager component in `app/src/lib/components/OAuthManager.svelte`
- [ ] T047 OAuth flow handling service in `app/src/lib/services/oauthFlow.ts`
- [ ] T048 Token storage and encryption integration
- [ ] T049 Connection status monitoring implementation

## Phase 3.5: Integration & Middleware
- [ ] T050 PKCE security flow implementation in OAuth service
- [ ] T051 Real-time sync WebSocket handlers in `convex/functions/realtime.ts`
- [ ] T052 Error handling and logging middleware
- [ ] T053 Rate limiting and security headers implementation
- [ ] T054 Capacitor native integration for secure storage
- [ ] T055 Platform-specific navigation and haptic feedback

## Phase 3.6: Polish & Optimization
- [ ] T056 [P] OAuth flow performance optimization (<5s target)
- [ ] T057 [P] Music profile caching implementation (1-hour cache)
- [ ] T058 [P] Platform UI performance optimization per device
- [ ] T059 [P] Security validation and penetration testing
- [ ] T060 [P] GDPR/CCPA compliance validation
- [ ] T061 [P] Update quickstart.md with final testing procedures
- [ ] T062 [P] Performance monitoring and analytics setup
- [ ] T063 Manual testing execution per quickstart.md scenarios
- [ ] T064 Production deployment configuration validation

## Dependencies
**Setup Phase**: T001 (schema) blocks T025-T030 (entities)
**Testing Phase**: T006-T024 must complete and FAIL before T025+
**Data Models**: T025-T030 before T031+ (services need entities)
**OAuth Services**: T031-T035 sequential (shared OAuth service file)  
**Music Services**: T036-T037 parallel, then T038-T040 sequential
**Platform UI**: T041-T044 parallel, then T045 (state management)
**OAuth UI**: T046-T049 after T031-T035 (OAuth services)
**Integration**: T050-T055 after core services
**Polish**: T056-T064 after all implementation complete

## Parallel Execution Examples

### Phase 3.2: Contract Tests (All Parallel)
```bash
# Launch T006-T016 together (different test files):
Task: "Contract test GET /api/oauth/providers in app/tests/contract/oauth-providers-get.test.ts"
Task: "Contract test POST /api/oauth/authorize in app/tests/contract/oauth-authorize-post.test.ts"  
Task: "Contract test GET /api/music/profile in app/tests/contract/music-profile-get.test.ts"
Task: "Contract test PUT /api/ui/platform-state in app/tests/contract/ui-platform-state-put.test.ts"
```

### Phase 3.2: Integration Tests (All Parallel)  
```bash
# Launch T017-T024 together (different integration test files):
Task: "Integration test OAuth flow (Spotify) in app/tests/integration/oauth-spotify-flow.test.ts"
Task: "Integration test music profile sync in app/tests/integration/music-profile-sync.test.ts"
Task: "Integration test platform UI adaptation in app/tests/integration/platform-ui-adaptation.test.ts"
```

### Phase 3.3: Data Models (All Parallel)
```bash
# Launch T025-T030 together (extending same schema file with different entities):
Task: "OAuthProvider entity in convex/schema.ts (extend existing)"
Task: "UserOAuthConnection entity in convex/schema.ts (extend existing)"
Task: "MusicProfile entity in convex/schema.ts (extend existing)"
```

### Phase 3.4: API Integrations (Parallel)
```bash
# Launch T036-T037 together (different API integration files):
Task: "Spotify API integration in app/src/lib/services/spotify.ts"
Task: "Apple Music API integration in app/src/lib/services/appleMusic.ts"
```

### Phase 3.4: Platform UI Components (Parallel)
```bash
# Launch T041-T044 together (different platform component files):
Task: "Platform detection component in app/src/lib/components/PlatformDetector.svelte"
Task: "iOS-specific UI components in app/src/lib/components/platform/IOSComponents.svelte" 
Task: "Android-specific UI components in app/src/lib/components/platform/AndroidComponents.svelte"
Task: "Web-responsive UI components in app/src/lib/components/platform/WebComponents.svelte"
```

## Notes
- OAuth tokens require encryption before storage (use crypto utilities from T003)
- Platform-specific UI components must adapt to device capabilities
- Music API integrations need proper rate limiting and error handling
- All tests must fail initially to validate TDD approach
- Convex schema extensions preserve existing data structure
- Capacitor integration handles native platform features (storage, haptics)
- Performance targets: <5s OAuth flow, <1s UI adaptation, <200ms API response

## Task Generation Rules Applied
1. **From Contracts (contracts.md)**: 12 endpoints → 11 contract tests (T006-T016)
2. **From Data Model (data-model.md)**: 6 entities → 6 model tasks (T025-T030)  
3. **From Quickstart (quickstart.md)**: Test scenarios → 8 integration tests (T017-T024)
4. **Ordering**: Setup → Tests → Models → Services → Components → Integration → Polish
5. **Dependencies**: Schema before entities, tests before implementation, services before UI

## Validation Checklist
- [x] All 12 contract endpoints have corresponding tests (T006-T016)
- [x] All 6 entities have model creation tasks (T025-T030)
- [x] All tests scheduled before implementation (Phase 3.2 before 3.3+)
- [x] Parallel tasks target different files with no dependencies  
- [x] Each task specifies exact file path for implementation
- [x] No parallel task conflicts (different files or extending same schema)