# Tasks: Customizable Alice Orb Color & Watch Interface

**Input**: Design documents from `specs/015-implement-two-features/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/

## Execution Flow (main)

```
1. Load plan.md from feature directory
   → Extract: SvelteKit 2.22+, Convex 1.27+, Capacitor 7.4+, Tailwind CSS 4.1+
2. Load design documents:
   → data-model.md: 4 entities → model tasks
   → contracts/: 2 files → contract test tasks
   → research.md: HSL color decisions, Capacitor watch integration
3. Generate tasks by category:
   → Setup: dependencies, linting, environment
   → Tests: contract tests, integration tests (TDD)
   → Core: models, services, components
   → Integration: real-time sync, device detection
   → Polish: performance optimization, documentation
4. Apply task rules:
   → Different files = mark [P] for parallel
   → Same file = sequential (no [P])
   → Tests before implementation (TDD)
5. Number tasks sequentially (T001, T002...)
6. Generate dependency graph
7. Create parallel execution examples
```

## Format: `[ID] [P?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions

- **Mobile + API structure**: `app/src/` for Svelte components, `app/convex/` for backend
- Paths based on existing SvelteKit/Capacitor/Convex architecture

## Phase 3.1: Setup

- [ ] T001 Install Capacitor Community Watch plugin and audio device dependencies
- [ ] T002 [P] Configure TypeScript types for HSL color manipulation in `app/src/lib/types/orb.ts`
- [ ] T003 [P] Set up Vitest test environment for orb and watch components

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3

**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

- [x] T004 [P] Contract test `updateOrbPreferences` mutation in `app/tests/contract/test_orb_preferences.ts`
- [x] T005 [P] Contract test `getOrbPreferences` query in `app/tests/contract/test_orb_preferences.ts`
- [x] T006 [P] Contract test `getCurrentStrain` query in `app/tests/contract/test_strain_data.ts`
- [x] T007 [P] Contract test `updateWatchExerciseData` mutation in `app/tests/contract/test_watch_interface.ts`
- [x] T008 [P] Contract test `getWatchWorkoutData` query in `app/tests/contract/test_watch_interface.ts`
- [x] T009 [P] Contract test `getAudioDeviceStatus` query in `app/tests/contract/test_audio_devices.ts`
- [x] T010 [P] Contract test `syncWatchState` mutation in `app/tests/contract/test_watch_sync.ts`
- [x] T011 [P] Integration test color customization user story in `app/tests/integration/test_color_customization.ts`
- [x] T012 [P] Integration test strain-based color adjustment in `app/tests/integration/test_strain_visualization.ts`
- [x] T013 [P] Integration test watch exercise controls in `app/tests/integration/test_watch_controls.ts`
- [x] T014 [P] Integration test audio device wave animations in `app/tests/integration/test_audio_integration.ts`
- [x] T015 [P] Integration test offline watch synchronization in `app/tests/integration/test_offline_sync.ts`

## Phase 3.3: Core Implementation (ONLY after tests are failing)

- [x] T016 [P] AliceOrbPreferences model in `app/convex/models/orbPreferences.ts`
- [x] T017 [P] WorkoutStrainData model in `app/convex/models/strainData.ts`
- [x] T018 [P] WatchSyncState model in `app/convex/models/watchSync.ts`
- [x] T019 [P] AudioDeviceContext model in `app/convex/models/audioDevice.ts`
- [x] T020 [P] HSL color utilities in `app/src/lib/utils/colorUtils.ts`
- [x] T021 [P] Watch device detection service in `app/src/lib/services/watchService.ts`
- [x] T022 [P] Audio device detection service in `app/src/lib/services/audioService.ts`
- [ ] T023 `updateOrbPreferences` mutation in `app/convex/functions/orbPreferences.ts`
- [ ] T024 `getOrbPreferences` query in `app/convex/functions/orbPreferences.ts`
- [ ] T025 `getCurrentStrain` query in `app/convex/functions/strainData.ts`
- [ ] T026 `updateWatchExerciseData` mutation in `app/convex/functions/watchInterface.ts`
- [ ] T027 `getWatchWorkoutData` query in `app/convex/functions/watchInterface.ts`
- [ ] T028 `getAudioDeviceStatus` query in `app/convex/functions/audioDevices.ts`
- [ ] T029 `syncWatchState` mutation in `app/convex/functions/watchSync.ts`
- [ ] T030 [P] Orb color customization component in `app/src/lib/components/OrbColorPicker.svelte`
- [ ] T031 [P] Enhanced Alice orb component with strain-based colors in `app/src/lib/components/AliceOrb.svelte`
- [ ] T032 [P] Watch interface layout component in `app/src/lib/components/WatchInterface.svelte`
- [ ] T033 [P] Exercise controls component for watch in `app/src/lib/components/WatchExerciseControls.svelte`
- [ ] T034 [P] Audio wave animation component in `app/src/lib/components/AudioWaveAnimation.svelte`

## Phase 3.4: Integration

- [ ] T035 Connect orb preferences to Convex real-time subscriptions in `app/src/lib/stores/orbStore.ts`
- [ ] T036 Connect strain data to orb color calculations in `app/src/lib/stores/strainStore.ts`
- [ ] T037 Integrate watch interface with Capacitor plugins in `app/src/lib/stores/watchStore.ts`
- [ ] T038 Implement offline sync queue in `app/src/lib/stores/syncStore.ts`
- [ ] T039 Add orb color picker to settings drawer in `app/src/routes/+layout.svelte`
- [ ] T040 Implement watch app routing in `app/src/routes/watch/+page.svelte`
- [ ] T041 Add audio device detection to main app layout
- [ ] T042 Configure performance monitoring for <250ms updates

## Phase 3.5: Polish

- [ ] T043 [P] Unit tests for color conversion utilities in `app/tests/unit/test_colorUtils.ts`
- [ ] T044 [P] Unit tests for watch sync conflict resolution in `app/tests/unit/test_syncConflicts.ts`
- [ ] T045 [P] Unit tests for offline data queuing in `app/tests/unit/test_offlineQueue.ts`
- [ ] T046 Performance tests for orb color updates (<250ms) in `app/tests/performance/test_orb_performance.ts`
- [ ] T047 Performance tests for watch interface responsiveness (<100ms) in `app/tests/performance/test_watch_performance.ts`
- [ ] T048 [P] Update mobile test configuration in `vitest.mobile.config.ts`
- [ ] T049 [P] Add TypeScript type exports in `app/src/lib/types/index.ts`
- [ ] T050 Execute quickstart.md manual testing scenarios
- [ ] T051 Optimize bundle size for watch interface components
- [ ] T052 Add accessibility support for color customization

## Dependencies

- Setup (T001-T003) before everything
- All contract tests (T004-T015) before implementation (T016-T034)
- Models (T016-T019) before Convex functions (T023-T029)
- Utilities and services (T020-T022) before components (T030-T034)
- Components before integration (T035-T042)
- Implementation before polish (T043-T052)

## Specific Blocking Dependencies

- T016 blocks T023, T024 (orb preferences model → mutations/queries)
- T017 blocks T025 (strain data model → strain query)
- T018 blocks T029 (watch sync model → sync mutation)
- T019 blocks T028 (audio device model → audio query)
- T020 blocks T031 (color utils → orb component)
- T021 blocks T032, T037 (watch service → watch components)
- T022 blocks T034, T041 (audio service → audio integration)
- T035, T036 block T039 (stores → layout integration)
- T037, T038 block T040 (watch stores → watch routing)

## Parallel Example

```
# Launch contract tests together (T004-T015):
Task: "Contract test updateOrbPreferences mutation in app/tests/contract/test_orb_preferences.ts"
Task: "Contract test getOrbPreferences query in app/tests/contract/test_orb_preferences.ts"
Task: "Contract test getCurrentStrain query in app/tests/contract/test_strain_data.ts"
Task: "Contract test updateWatchExerciseData mutation in app/tests/contract/test_watch_interface.ts"
Task: "Integration test color customization user story in app/tests/integration/test_color_customization.ts"

# Launch model creation together (T016-T019):
Task: "AliceOrbPreferences model in app/convex/models/orbPreferences.ts"
Task: "WorkoutStrainData model in app/convex/models/strainData.ts"
Task: "WatchSyncState model in app/convex/models/watchSync.ts"
Task: "AudioDeviceContext model in app/convex/models/audioDevice.ts"

# Launch component development together (T030-T034):
Task: "Orb color customization component in app/src/lib/components/OrbColorPicker.svelte"
Task: "Enhanced Alice orb component with strain-based colors in app/src/lib/components/AliceOrb.svelte"
Task: "Watch interface layout component in app/src/lib/components/WatchInterface.svelte"
Task: "Exercise controls component for watch in app/src/lib/components/WatchExerciseControls.svelte"
```

## Notes

- [P] tasks = different files, no dependencies
- Verify contract tests fail before implementing mutations/queries
- Commit after each task completion
- Watch interface requires actual smartwatch for full testing
- Performance tests must validate <250ms orb updates and <100ms watch responses

## Task Generation Rules

_Applied during main() execution_

1. **From Contracts**:
   - orb-preferences.md → T004, T005, T023, T024 (tests + implementation)
   - watch-interface.md → T007, T008, T026, T027, T029 (tests + implementation)
2. **From Data Model**:
   - AliceOrbPreferences → T016 (model creation)
   - WorkoutStrainData → T017 (model creation)
   - WatchSyncState → T018 (model creation)
   - AudioDeviceContext → T019 (model creation)
3. **From Quickstart Scenarios**:
   - Color customization → T011 (integration test)
   - Strain visualization → T012 (integration test)
   - Watch controls → T013 (integration test)
   - Audio integration → T014 (integration test)
   - Offline sync → T015 (integration test)

4. **Ordering**:
   - Setup → Contract Tests → Models → Services → Components → Integration → Polish
   - TDD: All tests before any implementation
   - Dependencies prevent parallel execution where needed

## Validation Checklist

_GATE: Checked before task execution begins_

- [x] All contracts have corresponding tests (T004-T010)
- [x] All entities have model tasks (T016-T019)
- [x] All tests come before implementation (T004-T015 before T016+)
- [x] Parallel tasks truly independent (different files)
- [x] Each task specifies exact file path
- [x] No task modifies same file as another [P] task
- [x] Integration tests cover all quickstart scenarios
- [x] Performance requirements addressed (T046-T047)
