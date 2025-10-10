# Tasks: Smooth Orb-to-Card Workout Interface

**Input**: Design documents from `/specs/018-make-the-orb/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/, quickstart.md

## Execution Flow (main)

```
1. Load plan.md from feature directory
   → Extract: SvelteKit 2.22+, animejs 4.2.0, Tailwind CSS 4.1+, Capacitor 7.4+
   → Structure: Web application (frontend + backend via Convex)
2. Load design documents:
   → data-model.md: AliceCardState, ExerciseDisplay, ProgressBar entities
   → contracts/alice-card-api.md: Component interface, service contracts
   → quickstart.md: Test scenarios and implementation steps
3. Generate tasks by category:
   → Setup: Verify dependencies, configure TypeScript types
   → Tests: Component props, animation performance, user stories
   → Core: AliceUnified component extension, animation system
   → Integration: Real-time data, responsive layout, speech bubbles
   → Polish: Performance optimization, accessibility
4. Apply task rules:
   → Different component files = mark [P] for parallel
   → Same AliceUnified.svelte file = sequential implementation
   → Tests before implementation (TDD approach)
5. Number tasks sequentially (T001, T002...)
6. Focus on extending existing AliceUnified.svelte rather than new components
7. Validate against constitutional requirement to enhance existing code
8. Return: SUCCESS (tasks ready for execution)
```

## Format: `[ID] [P?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `app/src/` for frontend components, `convex/` for backend
- Tests in `app/tests/` with subdirectories for contract/integration/unit
- Existing AliceUnified component at `app/src/lib/components/AliceUnified.svelte`

## Phase 3.1: Setup

- [ ] T001 Verify project dependencies (animejs 4.2.0, Tailwind CSS 4.1+, @capacitor/haptics) are available
- [ ] T002 [P] Add TypeScript interface definitions for card state in app/src/types/alice.ts
- [ ] T003 [P] Configure ESLint rules for Alice component extensions in app/eslint.config.js

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3

**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

### Component Contract Tests

- [ ] T004 [P] Contract test for AliceUnified card props interface in app/tests/contract/test_alice_card_props.test.ts
- [ ] T005 [P] Contract test for card animation events in app/tests/contract/test_alice_card_events.test.ts
- [ ] T006 [P] Contract test for speech bubble interaction in app/tests/contract/test_speech_bubble_contract.test.ts
- [ ] T007 [P] Contract test for progress bar data interface in app/tests/contract/test_progress_bar_contract.test.ts

### Animation Performance Tests

- [ ] T008 [P] Animation performance test (<1s expansion) in app/tests/performance/test_card_expansion.test.ts
- [ ] T009 [P] Animation blending test (overlapping animations) in app/tests/performance/test_animation_blending.test.ts
- [ ] T010 [P] Responsive layout test (screen width percentage) in app/tests/performance/test_responsive_card.test.ts

### Integration Tests (User Stories)

- [ ] T011 [P] Integration test orb-to-card smooth expansion in app/tests/integration/test_orb_card_expansion.test.ts
- [ ] T012 [P] Integration test exercise name fade transitions in app/tests/integration/test_exercise_display.test.ts
- [ ] T013 [P] Integration test reps heartbeat pulse animation in app/tests/integration/test_reps_pulse.test.ts
- [ ] T014 [P] Integration test progress bars show on movement in app/tests/integration/test_progress_visibility.test.ts
- [ ] T015 [P] Integration test speech bubbles on gesture tap in app/tests/integration/test_speech_bubbles.test.ts

## Phase 3.3: Core Implementation (ONLY after tests are failing)

### Component State Extensions

- [ ] T016 Extend AliceUnified component with card state management in app/src/lib/components/AliceUnified.svelte
- [ ] T017 Add card display mode toggle logic to AliceUnified component in app/src/lib/components/AliceUnified.svelte
- [ ] T018 Implement card layout CSS Grid structure in AliceUnified component in app/src/lib/components/AliceUnified.svelte

### Animation System

- [ ] T019 [P] Create card expansion animation utilities in app/src/lib/utils/cardAnimations.ts
- [ ] T020 Implement orb-to-card transformation animation in AliceUnified component in app/src/lib/components/AliceUnified.svelte
- [ ] T021 Add breathing expansion effect to card animation in AliceUnified component in app/src/lib/components/AliceUnified.svelte
- [ ] T022 Implement animation blending for overlapping transitions in AliceUnified component in app/src/lib/components/AliceUnified.svelte

### Exercise Display System

- [ ] T023 Implement exercise name display with fade transitions in AliceUnified component in app/src/lib/components/AliceUnified.svelte
- [ ] T024 Add clean white text styling with glow effects in AliceUnified component in app/src/lib/components/AliceUnified.svelte

### Reps Display System

- [ ] T025 Implement reps/duration display in bottom-left in AliceUnified component in app/src/lib/components/AliceUnified.svelte
- [ ] T026 Add heartbeat pulse animation for value updates in AliceUnified component in app/src/lib/components/AliceUnified.svelte

### Progress Bar System

- [ ] T027 [P] Create progress bar service for metrics management in app/src/lib/services/progressBarService.ts
- [ ] T028 Implement vertical progress bars with underglow in AliceUnified component in app/src/lib/components/AliceUnified.svelte
- [ ] T029 Add movement detection for progress bar visibility in AliceUnified component in app/src/lib/components/AliceUnified.svelte
- [ ] T030 Implement color-shifting underglow effects in AliceUnified component in app/src/lib/components/AliceUnified.svelte

### Speech Bubble System

- [ ] T031 [P] Create speech bubble service for interaction management in app/src/lib/services/speechBubbleService.ts
- [ ] T032 Implement gesture/tap trigger detection in AliceUnified component in app/src/lib/components/AliceUnified.svelte
- [ ] T033 Add speech bubble positioning and display logic in AliceUnified component in app/src/lib/components/AliceUnified.svelte

## Phase 3.4: Integration

### Store Integration

- [ ] T034 Extend aliceStore with card state management in app/src/lib/stores/aliceStore.ts
- [ ] T035 Integrate card state with existing Alice AI state in app/src/lib/stores/aliceStore.ts

### Data Service Integration

- [ ] T036 Extend aliceDataService for real-time progress metrics in app/src/lib/services/aliceDataService.ts
- [ ] T037 Connect progress bars to sensor+AI data pipeline in AliceUnified component in app/src/lib/components/AliceUnified.svelte

### Responsive Layout

- [ ] T038 Implement responsive card sizing (screen width percentage) in AliceUnified component in app/src/lib/components/AliceUnified.svelte
- [ ] T039 Add responsive breakpoint handling for mobile/tablet/desktop in AliceUnified component in app/src/lib/components/AliceUnified.svelte

### Color System Integration

- [ ] T040 Integrate iris color matching for card glow in AliceUnified component in app/src/lib/components/AliceUnified.svelte
- [ ] T041 Apply existing Alice color scheme to card elements in AliceUnified component in app/src/lib/components/AliceUnified.svelte

## Phase 3.5: Polish

### Performance Optimization

- [ ] T042 [P] Optimize animation performance for 60fps target in app/src/lib/utils/cardAnimations.ts
- [ ] T043 [P] Implement GPU acceleration for smooth transitions in app/src/lib/components/AliceUnified.svelte
- [ ] T044 [P] Add performance monitoring for animation duration in app/src/lib/utils/performanceMonitor.ts

### Accessibility & UX

- [ ] T045 [P] Add ARIA labels for card interface elements in app/src/lib/components/AliceUnified.svelte
- [ ] T046 [P] Implement keyboard navigation for speech bubbles in app/src/lib/services/speechBubbleService.ts
- [ ] T047 [P] Add screen reader support for progress metrics in app/src/lib/components/AliceUnified.svelte

### Testing & Validation

- [ ] T048 [P] Run quickstart validation scenarios in app/tests/validation/test_quickstart.test.ts
- [ ] T049 [P] Performance validation (<1s animations, <250ms updates) in app/tests/validation/test_performance.test.ts
- [ ] T050 [P] Cross-device responsive testing in app/tests/validation/test_responsive.test.ts

## Dependencies

### Sequential Dependencies (Same File)

- **AliceUnified.svelte modifications** (T016 → T017 → T018 → T020 → T021 → T022 → T023 → T024 → T025 → T026 → T028 → T029 → T030 → T032 → T033 → T037 → T038 → T039 → T040 → T041 → T043 → T045)
- **aliceStore.ts modifications** (T034 → T035)

### Phase Dependencies

- Tests (T004-T015) before implementation (T016-T041)
- Core implementation (T016-T033) before integration (T034-T041)
- Integration (T034-T041) before polish (T042-T050)

### Parallel Groups

- **Setup Tasks**: T002, T003 can run together
- **Contract Tests**: T004, T005, T006, T007 can run together
- **Performance Tests**: T008, T009, T010 can run together
- **Integration Tests**: T011, T012, T013, T014, T015 can run together
- **Service Creation**: T019, T027, T031, T044, T046 can run together (different files)
- **Polish Tasks**: T042, T044, T045, T046, T047, T048, T049, T050 can run together

## Parallel Execution Examples

### Setup Phase

```bash
# Run setup tasks in parallel
Task: "Add TypeScript interface definitions for card state in app/src/types/alice.ts"
Task: "Configure ESLint rules for Alice component extensions in app/eslint.config.js"
```

### Contract Tests Phase

```bash
# All contract tests can run simultaneously
Task: "Contract test for AliceUnified card props interface in app/tests/contract/test_alice_card_props.test.ts"
Task: "Contract test for card animation events in app/tests/contract/test_alice_card_events.test.ts"
Task: "Contract test for speech bubble interaction in app/tests/contract/test_speech_bubble_contract.test.ts"
Task: "Contract test for progress bar data interface in app/tests/contract/test_progress_bar_contract.test.ts"
```

### Service Creation Phase

```bash
# Independent service files can be created in parallel
Task: "Create card expansion animation utilities in app/src/lib/utils/cardAnimations.ts"
Task: "Create progress bar service for metrics management in app/src/lib/services/progressBarService.ts"
Task: "Create speech bubble service for interaction management in app/src/lib/services/speechBubbleService.ts"
```

### Polish Phase

```bash
# Final optimization tasks can run simultaneously
Task: "Optimize animation performance for 60fps target in app/src/lib/utils/cardAnimations.ts"
Task: "Add performance monitoring for animation duration in app/src/lib/utils/performanceMonitor.ts"
Task: "Implement keyboard navigation for speech bubbles in app/src/lib/services/speechBubbleService.ts"
Task: "Run quickstart validation scenarios in app/tests/validation/test_quickstart.test.ts"
```

## Notes

- [P] tasks = different files, no dependencies between them
- AliceUnified.svelte tasks must be sequential (T016-T045 touching same file)
- Verify all tests fail before implementing features
- Commit after each significant task completion
- Focus on extending existing component rather than creating new ones
- Maintain constitutional compliance by enhancing existing architecture

## Task Generation Rules Applied

1. **From Contracts**: alice-card-api.md → contract tests (T004-T007)
2. **From Data Model**: AliceCardState, ExerciseDisplay, ProgressBar → implementation tasks (T016-T030)
3. **From User Stories**: Quickstart scenarios → integration tests (T011-T015)
4. **From Research**: Animation decisions → animation utilities (T019, T042)

## Validation Checklist

- [x] All contracts have corresponding tests (T004-T007)
- [x] All entities have implementation tasks (T016-T030)
- [x] All tests come before implementation (Phase 3.2 before 3.3)
- [x] Parallel tasks truly independent ([P] marked appropriately)
- [x] Each task specifies exact file path
- [x] No [P] task modifies same file as another [P] task
- [x] Constitutional compliance: extends existing AliceUnified component
