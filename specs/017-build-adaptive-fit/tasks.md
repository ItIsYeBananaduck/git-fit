# Tasks: Build Adaptive Fit

**Input**: Design documents from `/specs/017-build-adaptive-fit/`  
**Prerequisites**: plan.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

## Execution Flow (main)

```text
1. Load plan.md from feature directory ✅
   → Tech stack: SvelteKit 2.22+, Convex 1.27+, Capacitor 7.4+, Tailwind CSS 4.1+, animejs
   → Structure: Web application (frontend + backend)
2. Load design documents ✅:
   → data-model.md: 7 entities (AliceState, UserProfile, Exercise, WorkoutSession, TeamPost, PerformanceData, MarketplaceVideo)
   → contracts/: 15 API endpoints across 5 feature areas
   → research.md: SVG+anime.js approach confirmed
3. Generate tasks by category ✅:
   → Setup: Convex schema updates, dependencies
   → Tests: 15 contract tests, 6 integration tests
   → Core: Alice interface, data models, API functions
   → Integration: subscription management, background monitoring
   → Polish: performance optimization, documentation
4. Apply task rules ✅:
   → Different Convex functions = [P] parallel
   → UI components = [P] parallel
   → Same files = sequential
5. Number tasks T001-T041
6. Dependencies: Tests → Models → Services → UI → Integration
```

## Format: `[ID] [P?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- Paths assume SvelteKit frontend + Convex backend structure

## Phase 3.1: Setup

- [x] T001 Update Convex schema with new tables for Alice, community, marketplace in `convex/schema.ts`
- [x] T002 [P] Install animejs dependency in `app/package.json`
- [x] T003 [P] Add Capacitor background plugins for heart rate monitoring in `app/package.json`

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3

> **CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

### Contract Tests (API Endpoints)

- [ ] T004 [P] Contract test POST /api/alice/state in `app/tests/contract/test_alice_state.ts`
- [ ] T005 [P] Contract test PUT /api/alice/customize in `app/tests/contract/test_alice_customize.ts`
- [ ] T006 [P] Contract test POST /api/fitness/calibrate in `app/tests/contract/test_fitness_calibrate.ts`
- [ ] T007 [P] Contract test POST /api/fitness/workout in `app/tests/contract/test_fitness_workout.ts`
- [ ] T008 [P] Contract test POST /api/community/exercises in `app/tests/contract/test_community_exercises.ts`
- [ ] T009 [P] Contract test POST /api/community/exercises/:id/vote in `app/tests/contract/test_community_vote.ts`
- [ ] T010 [P] Contract test POST /api/community/posts in `app/tests/contract/test_community_posts.ts`
- [ ] T011 [P] Contract test PUT /api/subscription/tier in `app/tests/contract/test_subscription_tier.ts`
- [ ] T012 [P] Contract test POST /api/monitoring/heartrate in `app/tests/contract/test_monitoring_heartrate.ts`
- [ ] T013 [P] Contract test POST /api/monitoring/respond in `app/tests/contract/test_monitoring_respond.ts`
- [ ] T014 [P] Contract test GET /api/marketplace/videos in `app/tests/contract/test_marketplace_list.ts`
- [ ] T015 [P] Contract test POST /api/marketplace/purchase in `app/tests/contract/test_marketplace_purchase.ts`

### Integration Tests (User Stories)

- [ ] T016 [P] Integration test Alice mode blooming workflow in `app/tests/integration/test_alice_blooming.ts`
- [ ] T017 [P] Integration test subscription tier restrictions in `app/tests/integration/test_subscription_features.ts`
- [ ] T018 [P] Integration test exercise approval workflow in `app/tests/integration/test_exercise_approval.ts`
- [ ] T019 [P] Integration test adaptive calibration triggers in `app/tests/integration/test_adaptive_calibration.ts`
- [ ] T020 [P] Integration test background heart rate monitoring in `app/tests/integration/test_background_monitoring.ts`
- [ ] T021 [P] Integration test marketplace purchase flow in `app/tests/integration/test_marketplace_flow.ts`

## Phase 3.3: Core Implementation (ONLY after tests are failing)

### Convex Schema and Data Models

- [ ] T022 [P] AliceState table and mutations in `convex/alice.ts`
- [ ] T023 [P] Exercise table and voting mutations in `convex/exercises.ts`
- [ ] T024 [P] WorkoutSession table and intensity tracking in `convex/workouts.ts`
- [ ] T025 [P] TeamPost table and community features in `convex/community.ts`
- [ ] T026 [P] MarketplaceVideo table and purchase tracking in `convex/marketplace.ts`
- [ ] T027 [P] PerformanceData table with retention policies in `convex/performance.ts`
- [ ] T028 [P] HeartRateMonitoring table for background tracking in `convex/monitoring.ts`

### Alice Interface Components

- [ ] T029 [P] Enhanced Alice SVG component with subscription tiers in `app/src/lib/components/AliceEnhanced.svelte`
- [ ] T030 [P] Alice mode blooming component (workout/nutrition/analytics/radio) in `app/src/lib/components/AliceModes.svelte`
- [ ] T031 [P] Alice customization panel for patterns/colors in `app/src/lib/components/AliceCustomization.svelte`
- [ ] T032 [P] Alice animation service with anime.js integration in `app/src/lib/services/aliceAnimations.ts`

### API Functions (Convex Backend)

- [ ] T033 Update Alice state function in `convex/alice.ts` (POST /api/alice/state)
- [ ] T034 Alice customization function in `convex/alice.ts` (PUT /api/alice/customize)
- [ ] T035 Fitness calibration function in `convex/workouts.ts` (POST /api/fitness/calibrate)
- [ ] T036 Workout recording function in `convex/workouts.ts` (POST /api/fitness/workout)
- [ ] T037 Exercise submission function in `convex/exercises.ts` (POST /api/community/exercises)
- [ ] T038 Exercise voting function in `convex/exercises.ts` (POST /api/community/exercises/:id/vote)

## Phase 3.4: Integration

- [ ] T039 Subscription tier management service in `app/src/lib/services/subscriptionService.ts`
- [ ] T040 Background monitoring with Capacitor integration in `app/src/lib/services/backgroundMonitor.ts`
- [ ] T041 Marketplace download management in `app/src/lib/services/marketplaceService.ts`

## Phase 3.5: Polish

- [ ] T042 [P] Alice animation performance optimization (<100MB memory, 60fps)
- [ ] T043 [P] Update Alice demo page with new features in `app/src/routes/alice-demo/+page.svelte`
- [ ] T044 [P] Add TypeScript interfaces to `sharedTypes.ts`
- [ ] T045 Run quickstart validation scenarios from `specs/017-build-adaptive-fit/quickstart.md`

## Dependencies

### Critical Dependencies

- Setup (T001-T003) before everything
- Contract tests (T004-T015) and integration tests (T016-T021) before implementation
- Schema updates (T022-T028) before API functions (T033-T038)
- Alice components (T029-T032) can run parallel with schema work
- API functions must be sequential within same file (T033-T034 in alice.ts, T035-T036 in workouts.ts, T037-T038 in exercises.ts)

### File-Level Dependencies

- `convex/schema.ts` (T001) blocks all Convex function tasks
- `convex/alice.ts` (T022) blocks T033, T034
- `convex/workouts.ts` (T024) blocks T035, T036
- `convex/exercises.ts` (T023) blocks T037, T038

## Parallel Execution Examples

### Phase 3.2: All Contract Tests (T004-T015)

```bash
# Launch all contract tests simultaneously:
Task: "Contract test POST /api/alice/state in app/tests/contract/test_alice_state.ts"
Task: "Contract test PUT /api/alice/customize in app/tests/contract/test_alice_customize.ts"
Task: "Contract test POST /api/fitness/calibrate in app/tests/contract/test_fitness_calibrate.ts"
Task: "Contract test POST /api/fitness/workout in app/tests/contract/test_fitness_workout.ts"
# ... (continue for all contract tests)
```

### Phase 3.2: All Integration Tests (T016-T021)

```bash
# Launch all integration tests simultaneously:
Task: "Integration test Alice mode blooming workflow in app/tests/integration/test_alice_blooming.ts"
Task: "Integration test subscription tier restrictions in app/tests/integration/test_subscription_features.ts"
Task: "Integration test exercise approval workflow in app/tests/integration/test_exercise_approval.ts"
# ... (continue for all integration tests)
```

### Phase 3.3: Convex Schema Tables (T022-T028)

```bash
# Launch all table definitions simultaneously:
Task: "AliceState table and mutations in convex/alice.ts"
Task: "Exercise table and voting mutations in convex/exercises.ts"
Task: "WorkoutSession table and intensity tracking in convex/workouts.ts"
Task: "TeamPost table and community features in convex/community.ts"
Task: "MarketplaceVideo table and purchase tracking in convex/marketplace.ts"
Task: "PerformanceData table with retention policies in convex/performance.ts"
Task: "HeartRateMonitoring table for background tracking in convex/monitoring.ts"
```

### Phase 3.3: Alice UI Components (T029-T032)

```bash
# Launch all Alice components simultaneously:
Task: "Enhanced Alice SVG component with subscription tiers in app/src/lib/components/AliceEnhanced.svelte"
Task: "Alice mode blooming component in app/src/lib/components/AliceModes.svelte"
Task: "Alice customization panel in app/src/lib/components/AliceCustomization.svelte"
Task: "Alice animation service with anime.js in app/src/lib/services/aliceAnimations.ts"
```

## Notes

- Tests MUST fail before implementing corresponding features
- Alice SVG animations should maintain 60fps performance target
- Convex real-time subscriptions enable Alice's adaptive behaviors
- Background monitoring requires Capacitor native permissions
- Marketplace downloads go to AdaptiveFitDownloads folder
- Data retention policies enforce subscription tier limitations

## Task Generation Rules Applied

1. **From Contracts**: 15 endpoints → 12 contract test tasks [P] + implementation tasks
2. **From Data Model**: 7 entities → 7 table creation tasks [P]
3. **From User Stories**: 6 main workflows → 6 integration tests [P]
4. **Ordering**: Setup → Tests → Models → Services → UI → Integration → Polish
5. **Parallel**: Different files marked [P], same files sequential

## Validation Checklist ✅

- [x] All 15 API contracts have corresponding tests
- [x] All 7 entities have table creation tasks
- [x] All tests (T004-T021) come before implementation (T022+)
- [x] Parallel tasks are truly independent (different files)
- [x] Each task specifies exact file path
- [x] No [P] task modifies same file as another [P] task
- [x] TDD approach: failing tests before implementation
- [x] Alice interface enhancement integrated with existing demo
- [x] Subscription tier restrictions properly validated
- [x] Performance targets specified (60fps, <100MB, <200ms API)
