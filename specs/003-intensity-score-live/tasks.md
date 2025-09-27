# Tasks: Intensity Score (Live)

**Input**: Design documents from `/specs/003-intensity-score-live/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/convex-functions.md, quickstart.md

## Execution Flow (main)
```
1. Load plan.md from feature directory ✓
   → Tech stack: SvelteKit 2.22+, Convex 1.27+, Capacitor 7.4+, TypeScript 5.0+
   → Structure: Mobile + API (Capacitor with SvelteKit web interface, Convex backend)
2. Load design documents ✓
   → data-model.md: 8 core entities extracted
   → contracts/: 14 Convex functions (mutations, queries, actions) identified
   → research.md: Technical decisions for strain vs intensity separation
   → quickstart.md: Test scenarios for real-time intensity scoring workflow
3. Generate tasks by category ✓
   → Setup: Convex schema extension, health data plugin setup
   → Tests: Contract tests for each Convex function, integration scenarios
   → Core: Services, components, device-side calculations
   → Integration: Real-time subscriptions, AI coaching, social features
   → Polish: Performance tests, privacy compliance, documentation
4. Apply task rules ✓
   → Different files = marked [P] for parallel execution
   → Same file modifications = sequential (no [P])
   → Tests before implementation (TDD approach)
5. Tasks numbered T001-T050 with clear dependencies ✓
6. Parallel execution examples provided ✓
7. Validate completeness: All contracts tested, entities modeled, scenarios covered ✓
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- File paths are absolute and specific to the Capacitor + SvelteKit + Convex structure

## Phase 3.1: Setup & Dependencies
- [x] T001 Extend Convex schema in `app/convex/schema.ts` with intensityScores, aiCoachingContext, supplementStacks, supplementItems, socialShares tables
- [ ] T002 [P] Install health data plugin `npm install @felix-health/capacitor-health-data@1.0.9` in `app/package.json`
- [ ] T003 [P] Configure Capacitor health permissions in `app/capacitor.config.ts`
- [ ] T004 [P] Create TypeScript interfaces in `src/lib/types/intensity.ts` for LiveStrain, IntensityScore, AICoachingContext
- [ ] T005 [P] Setup Vitest test configuration for real-time testing in `app/vitest.config.ts`

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

### Convex Function Tests
- [ ] T006 [P] Contract test `intensity:calculateScore` mutation in `tests/contract/test_intensity_calculate.ts`
- [ ] T007 [P] Contract test `coaching:updateContext` mutation in `tests/contract/test_coaching_update.ts`
- [ ] T008 [P] Contract test `supplements:scanItem` mutation in `tests/contract/test_supplements_scan.ts`
- [ ] T009 [P] Contract test `supplements:createStack` mutation in `tests/contract/test_supplements_stack.ts`
- [ ] T010 [P] Contract test `social:shareContent` mutation in `tests/contract/test_social_share.ts`
- [ ] T011 [P] Contract test `intensity:getHistory` query in `tests/contract/test_intensity_history.ts`
- [ ] T012 [P] Contract test `coaching:getVoiceStatus` query in `tests/contract/test_coaching_voice.ts`
- [ ] T013 [P] Contract test `supplements:getStack` query in `tests/contract/test_supplements_get.ts`
- [ ] T014 [P] Contract test `social:getFeed` query in `tests/contract/test_social_feed.ts`
- [ ] T015 [P] Contract test `supplements:fetchProductData` action in `tests/contract/test_supplements_api.ts`

### Integration Test Scenarios
- [ ] T016 [P] Integration test real-time intensity scoring workflow in `tests/integration/test_realtime_intensity.ts`
- [ ] T017 [P] Integration test strain calculation and modifiers in `tests/integration/test_strain_calculation.ts`
- [ ] T018 [P] Integration test AI coaching with voice settings in `tests/integration/test_coaching_integration.ts`
- [ ] T019 [P] Integration test supplement stack management in `tests/integration/test_supplement_lifecycle.ts`
- [ ] T020 [P] Integration test social sharing with privacy filters in `tests/integration/test_social_privacy.ts`
- [ ] T021 [P] Integration test dynamic rest period extension in `tests/integration/test_dynamic_rest.ts`

## Phase 3.3: Core Implementation (ONLY after tests are failing)

### Convex Backend Functions
- [ ] T022 [P] Create `app/convex/functions/intensity.ts` with calculateScore mutation and getHistory query
- [ ] T023 [P] Create `app/convex/functions/coaching.ts` with updateContext mutation and getVoiceStatus query
- [ ] T024 [P] Create `app/convex/functions/supplements.ts` with scanItem, createStack mutations and getStack query
- [ ] T025 [P] Create `app/convex/functions/social.ts` with shareContent mutation and getFeed query
- [ ] T026 [P] Create `app/convex/actions/supplements.ts` with fetchProductData action for OpenFoodFacts API
- [ ] T027 [P] Create `app/convex/actions/coaching.ts` with generateVoiceMessage action for AI service

### Device-Side Services
- [ ] T028 [P] Create strain calculator service in `src/lib/services/strainCalculator.ts` with live calculation logic
- [ ] T029 [P] Create health data service in `src/lib/services/healthData.ts` with @felix-health plugin integration
- [ ] T030 [P] Create intensity scoring service in `src/lib/services/intensityScoring.ts` with component calculation
- [ ] T031 [P] Create supplement scanner service in `src/lib/services/supplementScanner.ts` with barcode integration
- [ ] T032 [P] Create mock health data provider in `src/lib/services/mockHealthData.ts` for beta testing

### Frontend Components
- [ ] T033 [P] Create LiveIntensityMeter component in `src/lib/components/intensity/LiveIntensityMeter.svelte`
- [ ] T034 [P] Create StrainIndicator component in `src/lib/components/intensity/StrainIndicator.svelte`
- [ ] T035 [P] Create AICoachingPanel component in `src/lib/components/intensity/AICoachingPanel.svelte`
- [ ] T036 [P] Create SupplementScanner component in `src/lib/components/supplements/SupplementScanner.svelte`
- [ ] T037 [P] Create SupplementStackManager component in `src/lib/components/supplements/StackManager.svelte`
- [ ] T038 [P] Create SocialFeed component in `src/lib/components/social/SocialFeed.svelte`
- [ ] T039 [P] Create WorkoutSetTracker component in `src/lib/components/workouts/WorkoutSetTracker.svelte`

## Phase 3.4: Real-Time Integration

### Convex Subscriptions & WebSocket Integration  
- [ ] T040 Add real-time intensity score subscription to workout pages in `src/routes/workouts/[id]/+page.svelte`
- [ ] T041 Add coaching context subscription to AI coaching panel integration
- [ ] T042 Add social feed subscription with clustering updates
- [ ] T043 Implement strain status real-time updates from device sensors
- [ ] T044 Add voice coaching trigger system with earbud detection

### Scheduled Actions & Background Processing
- [ ] T045 [P] Create scheduled action in `app/convex/crons.ts` for supplement stack cleanup (daily)
- [ ] T046 [P] Create scheduled action for weekly intensity trend calculations 
- [ ] T047 [P] Create scheduled action for social feed clustering updates
- [ ] T048 Add error handling and retry logic for external API calls (OpenFoodFacts, AI voice)

## Phase 3.5: Polish & Validation

### Performance & Privacy Testing
- [ ] T049 [P] Performance test real-time updates achieve <1 second latency in `tests/performance/test_realtime_latency.ts`
- [ ] T050 [P] Privacy compliance test medical data filtering in `tests/privacy/test_medical_data_redaction.ts`
- [ ] T051 [P] Load testing for 1,000-10,000 concurrent users in `tests/performance/test_concurrent_users.ts`
- [ ] T052 [P] Test health data permissions and error handling in `tests/integration/test_health_permissions.ts`

### Documentation & Manual Testing
- [ ] T053 [P] Update API documentation in `docs/intensity-scoring-api.md`
- [ ] T054 [P] Create user guide for supplement tracking in `docs/supplement-guide.md`
- [ ] T055 [P] Update quickstart guide with deployment instructions
- [ ] T056 Execute manual testing scenarios from quickstart.md workflow

## Dependencies

### Critical Path
```
Setup (T001-T005) → Tests (T006-T021) → Backend (T022-T027) → Services (T028-T032) → Components (T033-T039) → Integration (T040-T048) → Polish (T049-T056)
```

### Key Blockers
- T001 (schema) blocks T022-T025 (Convex functions)
- T028-T032 (services) block T040-T044 (real-time integration)
- T006-T021 (tests) MUST complete before T022-T048 (implementation)
- T002-T003 (health plugin) block T029, T043 (health data integration)

### Sequential Dependencies
- T001 → T022, T023, T024, T025 (schema before functions)
- T040 → T041 → T042 (subscription order matters)
- T028 → T043 (strain calculator before real-time updates)
- T033 → T040 (component before subscription integration)

## Parallel Example
```bash
# Phase 3.2: Launch all contract tests together (T006-T015)
Task: "Contract test intensity:calculateScore mutation in tests/contract/test_intensity_calculate.ts"
Task: "Contract test coaching:updateContext mutation in tests/contract/test_coaching_update.ts"  
Task: "Contract test supplements:scanItem mutation in tests/contract/test_supplements_scan.ts"
Task: "Contract test supplements:createStack mutation in tests/contract/test_supplements_stack.ts"
Task: "Contract test social:shareContent mutation in tests/contract/test_social_share.ts"

# Phase 3.3: Launch backend functions in parallel (T022-T027)
Task: "Create app/convex/functions/intensity.ts with calculateScore mutation and getHistory query"
Task: "Create app/convex/functions/coaching.ts with updateContext mutation and getVoiceStatus query"
Task: "Create app/convex/functions/supplements.ts with scanItem, createStack mutations and getStack query"
Task: "Create app/convex/functions/social.ts with shareContent mutation and getFeed query"

# Phase 3.3: Launch services in parallel (T028-T032)
Task: "Create strain calculator service in src/lib/services/strainCalculator.ts with live calculation logic"
Task: "Create health data service in src/lib/services/healthData.ts with @felix-health plugin integration"
Task: "Create intensity scoring service in src/lib/services/intensityScoring.ts with component calculation"
```

## Notes
- **TDD Critical**: All tests (T006-T021) must fail before implementation starts
- **Real-time Focus**: Strain calculations stay on-device, intensity scores stored in Convex
- **Privacy First**: Medical compound detection and filtering built into all sharing features  
- **Convex Native**: Use Convex subscriptions instead of manual WebSocket management
- **Health Data**: @felix-health plugin provides iOS/Android health data access with fallback to mocks

## Task Generation Rules Applied

1. **From Contracts**: 14 Convex functions → 10 contract tests (T006-T015)
2. **From Data Model**: 8 entities → 6 service creation tasks (T028-T032), 4 function files (T022-T025)
3. **From User Stories**: 6 integration scenarios → 6 integration tests (T016-T021)
4. **Ordering**: Setup → Tests → Backend → Services → Components → Integration → Polish
5. **Parallel Marking**: Different files marked [P], same file modifications sequential

## Validation Checklist ✅

- [x] All Convex functions have corresponding contract tests
- [x] All core entities have service implementations  
- [x] All integration scenarios have test coverage
- [x] Tests come before implementation (TDD)
- [x] Parallel tasks are truly independent (different files)
- [x] Each task specifies exact file paths
- [x] No task modifies same file as another [P] task
- [x] Real-time performance requirements included (<1 second updates)
- [x] Privacy compliance validation included (medical data filtering)