# Tasks: Refine Alice Orb AI Voice Coach

\*\*I- [x] T002 [P] Configure ElevenLabs API environment variables and types

- [x] T003 [P] Update TypeScript types for Alice AI state interfacesut**: Design documents from `/specs/016-refine-the-alice/`
      **Prerequisites\*\*: plan.md (required), research.md, data-model.md, contracts/

## Execution Flow (main)

```
1. Load plan.md from feature directory
   → Found: TypeScript 5.0+, SvelteKit 2.22+, Convex 1.27+, Capacitor 7.4+
   → Extract: Web application structure (frontend/backend)
2. Load optional design documents:
   → data-model.md: Alice AI State, User Preferences, Workout Session Data, Interaction Context
   → contracts/: alice-api.md → Convex functions and component contracts
   → research.md: anime.js, ElevenLabs, Convex subscriptions, Capacitor haptics
3. Generate tasks by category:
   → Setup: anime.js dependency, ElevenLabs integration setup
   → Tests: Convex function tests, component integration tests
   → Core: AliceOrb component, state management, voice coaching
   → Integration: Real-time data sync, haptic feedback, offline handling
   → Polish: Performance optimization, documentation updates
4. Apply task rules:
   → Different files = mark [P] for parallel
   → Same file = sequential (no [P])
   → Tests before implementation (TDD)
5. Number tasks sequentially (T001, T002...)
6. Generate dependency graph
7. Create parallel execution examples
8. Validate: All Convex functions have tests, all components have integration tests
9. Return: SUCCESS (tasks ready for execution)
```

## Format: `[ID] [P?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions

- **Web app structure**: `app/src/` for frontend, `convex/` for backend functions
- **Components**: `app/src/lib/components/`
- **Stores**: `app/src/lib/stores/`
- **Tests**: `app/src/tests/`

## Phase 3.1: Setup

- [x] T001 Install anime.js dependency for SVG morphing animations
- [x] T002 [P] Configure ElevenLabs API environment variables and types
- [ ] T003 [P] Update TypeScript types for Alice AI state interfaces

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3

**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

- [x] T004 [P] Contract test alice:updateState Convex function in app/src/tests/contract/test_alice_update_state.test.ts
- [x] T005 [P] Contract test alice:getUserPreferences Convex function in app/src/tests/contract/test_alice_get_preferences.test.ts
- [x] T006 [P] Contract test alice:updateUserPreferences Convex function in app/src/tests/contract/test_alice_update_preferences.test.ts
- [x] T007 [P] Contract test alice:getWorkoutMetrics subscription in app/src/tests/contract/test_alice_workout_metrics.test.ts
- [x] T008 [P] Integration test AliceOrb morphing behavior in app/src/tests/integration/test_alice_morphing.test.ts
- [x] T009 [P] Integration test Alice voice coaching triggers in app/src/tests/integration/test_alice_voice_coaching.test.ts
- [x] T010 [P] Integration test Alice haptic feedback in app/src/tests/integration/test_alice_haptic_feedback.test.ts
- [x] T011 [P] Integration test Alice offline behavior in app/src/tests/integration/test_alice_offline.test.ts

## Phase 3.3: Core Implementation (ONLY after tests are failing)

- [x] T012 [P] Enhanced AliceOrb component with morphing shapes in app/src/lib/components/AliceOrb.svelte
- [x] T013 [P] Alice state management store extension in app/src/lib/stores/aliceStore.ts
- [x] T014 [P] Alice voice coaching service in app/src/lib/services/aliceVoiceService.ts
- [x] T015 [P] Alice data service in app/src/lib/services/aliceDataService.ts
- [x] T016 [P] Alice color system utilities in app/src/lib/utils/aliceColorUtils.ts
- [x] T017 [P] Alice SVG shape definitions in app/src/lib/constants/aliceShapes.ts
- [x] T018 alice:updateState Convex function in convex/functions/alice.ts
- [x] T019 alice:getUserPreferences Convex function in convex/functions/alice.ts
- [x] T020 alice:updateUserPreferences Convex function in convex/functions/alice.ts
- [x] T021 alice:getWorkoutMetrics subscription in convex/functions/alice.ts
- [x] T022 Update GlobalAlice component with enhanced features in app/src/lib/components/GlobalAlice.svelte

## Phase 3.4: Integration

- [ ] T023 Integrate anime.js morphing with AliceOrb component animations
- [ ] T024 Connect Alice state to Convex real-time subscriptions for workout data
- [ ] T025 Implement ElevenLabs voice coaching API integration
- [ ] T026 Add Capacitor haptics feedback to Alice touch interactions
- [ ] T027 Implement Alice offline mode with gray appearance fallback
- [ ] T028 Add strain change throttling (>15% difference) logic
- [ ] T029 Integrate Alice color customization with user preferences

## Phase 3.5: Polish

- [ ] T030 [P] Unit tests for Alice color utilities in app/src/tests/unit/test_alice_color_utils.test.ts
- [ ] T031 [P] Unit tests for Alice shape morphing logic in app/src/tests/unit/test_alice_morphing.test.ts
- [ ] T032 [P] Unit tests for voice coaching service in app/src/tests/unit/test_alice_voice_service.test.ts
- [ ] T033 Performance optimization: ensure 60fps morphing animations
- [ ] T034 Performance validation: confirm <500ms visual feedback response
- [ ] T035 [P] Update documentation in docs/alice-orb-features.md
- [ ] T036 [P] Add Alice feature to user guide in docs/user-guide.md
- [ ] T037 Run manual testing scenarios from quickstart.md

## Dependencies

- Setup (T001-T003) before all other tasks
- Contract tests (T004-T011) before implementation (T012-T022)
- Core components (T012-T017) before Convex functions (T018-T021)
- T013 (aliceStore) blocks T022 (GlobalAlice), T024 (real-time sync)
- T014 (voice service) blocks T025 (ElevenLabs integration)
- T015 (interaction service) blocks T026 (haptics integration)
- T016 (color utils) blocks T029 (color customization)
- T017 (shape definitions) blocks T023 (anime.js morphing)
- Implementation (T012-T029) before polish (T030-T037)

## Parallel Example

```
# Launch contract tests together (T004-T011):
Task: "Contract test alice:updateState Convex function in app/src/tests/contract/test_alice_update_state.test.ts"
Task: "Contract test alice:getUserPreferences Convex function in app/src/tests/contract/test_alice_get_preferences.test.ts"
Task: "Contract test alice:updateUserPreferences Convex function in app/src/tests/contract/test_alice_update_preferences.test.ts"
Task: "Contract test alice:getWorkoutMetrics subscription in app/src/tests/contract/test_alice_workout_metrics.test.ts"

# Launch core components together (T012-T017):
Task: "Enhanced AliceOrb component with morphing shapes in app/src/lib/components/AliceOrb.svelte"
Task: "Alice state management store extension in app/src/lib/stores/aliceStore.ts"
Task: "Alice voice coaching service in app/src/lib/services/aliceVoiceService.ts"
Task: "Alice interaction handler service in app/src/lib/services/aliceInteractionService.ts"
```

## Notes

- [P] tasks = different files, no dependencies
- Verify tests fail before implementing
- Commit after each task
- Focus on extending existing AliceOrb.svelte rather than rewriting
- Maintain existing GlobalAlice.svelte functionality while adding enhancements

## Task Generation Rules

_Applied during main() execution_

1. **From Contracts (alice-api.md)**:
   - alice:updateState → T004 contract test, T018 implementation
   - alice:getUserPreferences → T005 contract test, T019 implementation
   - alice:updateUserPreferences → T006 contract test, T020 implementation
   - alice:getWorkoutMetrics → T007 contract test, T021 implementation
2. **From Data Model**:
   - Alice AI State → T013 state store extension
   - User Preferences → T016 color utilities, T029 integration
   - Workout Session Data → T024 real-time sync
   - Interaction Context → T015 interaction service
3. **From User Stories (spec.md)**:
   - Morphing behavior → T008 integration test
   - Voice coaching → T009 integration test
   - Touch interactions → T010 integration test
   - Offline behavior → T011 integration test

4. **From Research Decisions**:
   - anime.js → T001 setup, T023 integration
   - ElevenLabs → T002 setup, T025 integration
   - Capacitor haptics → T026 integration
   - SVG shapes → T017 definitions

## Validation Checklist

_GATE: Checked by main() before returning_

- [x] All Convex functions have corresponding contract tests (T004-T007 → T018-T021)
- [x] All core entities have implementation tasks (AliceOrb T012, aliceStore T013, etc.)
- [x] All contract tests come before implementation (T004-T011 before T012-T022)
- [x] Parallel tasks truly independent (different file paths)
- [x] Each task specifies exact file path
- [x] No task modifies same file as another [P] task
- [x] Integration tests cover all major user scenarios
- [x] Performance validation included (T033-T034)
- [x] Documentation updates planned (T035-T036)
