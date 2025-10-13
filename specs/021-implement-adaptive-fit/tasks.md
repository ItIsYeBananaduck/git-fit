# Tasks: Adaptive Fit with Alice AI

**Input**: Design documents from `/specs/021-implement-adaptive-fit/`
**Prerequisites**: plan.md (required)

## Execution Flow (main)

```
1. Load plan.md from feature directory
   → Extract: tech stack, libraries, structure
2. Generate tasks by category:
   → Setup: project init, dependencies, linting
   → Tests: contract tests, integration tests
   → Core: models, services, CLI commands
   → Integration: DB, middleware, logging
   → Polish: unit tests, performance, docs
3. Apply task rules:
   → Different files = mark [P] for parallel
   → Same file = sequential (no [P])
   → Tests before implementation (TDD)
4. Number tasks sequentially (T001, T002...)
5. Validate task completeness:
   → All contracts have tests?
   → All entities have models?
   → All endpoints implemented?
6. Return: SUCCESS (tasks ready for execution)
```

## Format: `[ID] [P?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Phase 3.1: Setup

- [ ] T001 Create project structure per implementation plan
- [ ] T002 Initialize TypeScript project with SvelteKit, Convex, Capacitor dependencies
- [ ] T003 [P] Configure linting and formatting tools

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3

**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

- [ ] T004 [P] Integration test privacy policy display in `tests/integration/test_privacy_policy.ts`
- [ ] T005 [P] Integration test weight sync in `tests/integration/test_weight_sync.ts`
- [ ] T006 [P] Integration test pro features access in `tests/integration/test_pro_features.ts`
- [ ] T007 [P] Integration test federated learning in `tests/integration/test_federated_learning.ts`

## Phase 3.3: Core Implementation (ONLY after tests are failing)

- [ ] T008 [P] Privacy policy component in `frontend/src/components/PrivacyPolicy.svelte`
- [ ] T009 [P] Weight sync service in `backend/src/services/WeightSyncService.ts`
- [ ] T010 [P] Pro features service in `backend/src/services/ProFeaturesService.ts`
- [ ] T011 Federated learning aggregator in `backend/src/services/FederatedLearningAggregator.ts`
- [ ] T012 Fly.io deployment script in `scripts/deploy_flyio.ts`

## Phase 3.4: Integration

- [ ] T013 Connect WeightSyncService to Convex DB
- [ ] T014 Implement authentication middleware in `backend/src/middleware/authMiddleware.ts`
- [ ] T015 Add request/response logging in `backend/src/middleware/loggingMiddleware.ts`
- [ ] T016 Configure CORS and security headers in `backend/src/middleware/securityHeaders.ts`

## Phase 3.5: Polish

- [ ] T017 [P] Unit tests for WeightSyncService in `tests/unit/test_weight_sync.ts`
- [ ] T018 [P] Unit tests for ProFeaturesService in `tests/unit/test_pro_features.ts`
- [ ] T019 [P] Performance tests (<200ms API response time) in `tests/performance/test_api_performance.ts`
- [ ] T020 [P] Update documentation in `docs/api.md`
- [ ] T021 Run manual testing checklist in `manual-testing.md`

## Dependencies

- Tests (T004-T007) before implementation (T008-T012)
- T008 blocks T009, T013
- T009 blocks T013
- T014 blocks T016
- Implementation before polish (T017-T021)

## Parallel Example

```
# Launch T004-T007 together:
Task: "Integration test privacy policy display in `tests/integration/test_privacy_policy.ts`"
Task: "Integration test weight sync in `tests/integration/test_weight_sync.ts`"
Task: "Integration test pro features access in `tests/integration/test_pro_features.ts`"
Task: "Integration test federated learning in `tests/integration/test_federated_learning.ts`"
```

## Notes

- [P] tasks = different files, no dependencies
- Verify tests fail before implementing
- Commit after each task
- Avoid: vague tasks, same file conflicts
