# Tasks: AI Training System with Voice Integration

**Input**: Design documents from `/specs/014-train-alice-aiden/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → Extract: SvelteKit 2.22+, Convex 1.27+, TypeScript 5.0+, Python 3.10+
   → Structure: Web application (frontend + backend)
2. Load design documents:
   → data-model.md: 6 new entities + 2 extended entities
   → contracts/: 2 API specs (21 total endpoints)
   → quickstart.md: 5 integration scenarios
3. Generate tasks by category:
   → Setup: project init, dependencies, environment variables
   → Tests: contract tests, integration tests (TDD approach)
   → Core: entity models, Convex functions, API actions
   → Integration: ElevenLabs API, Hugging Face Hub, cron jobs
   → Polish: frontend UI, performance tests, documentation
4. Apply task rules:
   → Different files = mark [P] for parallel
   → Same file = sequential (no [P])
   → Tests before implementation (TDD)
5. Number tasks sequentially (T001, T002...)
6. Generate dependency graph
7. Validate task completeness
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions
- Web app structure: `app/` (SvelteKit frontend), `convex/` (backend functions)

## Phase 3.1: Setup
- [x] T001 Install Python 3.10+ dependencies for AI training pipeline in requirements.txt
- [x] T002 [P] Configure ElevenLabs API environment variables in app/.env
- [x] T003 [P] Configure Hugging Face Hub environment variables in app/.env
- [x] T004 [P] Install SvelteKit 2.22+ voice UI dependencies in app/package.json
- [x] T005 [P] Configure TypeScript 5.0+ strict mode in app/tsconfig.json

## Phase 3.2: Tests First (TDD) ✅ COMPLETE - ALL TESTS FAILING AS EXPECTED
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

### Contract Tests [All Parallel]
- [x] T006 [P] Contract test submitTrainingData in app/tests/contract/ai-training-submit-data.test.ts
- [x] T007 [P] Contract test listTrainingSessions in app/tests/contract/ai-training-list-sessions.test.ts
- [x] T008 [P] Contract test startTrainingSession in app/tests/contract/ai-training-start-session.test.ts
- [x] T009 [P] Contract test getTrainingSession in app/tests/contract/ai-training-get-session.test.ts
- [x] T010 [P] Contract test updateTrainingSession in app/tests/contract/ai-training-update-session.test.ts
- [x] T011 [P] Contract test listAIModels in app/tests/contract/ai-training-list-models.test.ts
- [x] T012 [P] Contract test getAIModel in app/tests/contract/ai-training-get-model.test.ts
- [x] T013 [P] Contract test deployAIModel in app/tests/contract/ai-training-deploy-model.test.ts
- [x] T014 [P] Contract test rollbackAIModel in app/tests/contract/ai-training-rollback-model.test.ts
- [x] T015 [P] Contract test getVoicePreferences in app/tests/contract/voice-get-preferences.test.ts
- [x] T016 [P] Contract test updateVoicePreferences in app/tests/contract/voice-update-preferences.test.ts
- [x] T017 [P] Contract test initiateVoiceClone in app/tests/contract/voice-initiate-clone.test.ts
- [x] T018 [P] Contract test getVoiceCloneStatus in app/tests/contract/voice-clone-status.test.ts
- [x] T019 [P] Contract test synthesizeVoice in app/tests/contract/voice-synthesize.test.ts
- [x] T020 [P] Contract test getCachedVoiceClips in app/tests/contract/voice-get-cache.test.ts
- [x] T021 [P] Contract test clearVoiceCache in app/tests/contract/voice-clear-cache.test.ts
- [x] T022 [P] Contract test getCachedVoiceClip in app/tests/contract/voice-get-cache-entry.test.ts
- [x] T023 [P] Contract test deleteCachedVoiceClip in app/tests/contract/voice-delete-cache-entry.test.ts
- [x] T024 [P] Contract test recordVoiceInteraction in app/tests/contract/voice-record-interaction.test.ts
- [x] T025 [P] Contract test getWorkoutVoiceInteractions in app/tests/contract/voice-get-interactions.test.ts

### Integration Tests [All Parallel]
- [x] T026 [P] Integration test AI training data collection in app/tests/integration/ai-training-data-collection.test.ts
- [x] T027 [P] Integration test voice synthesis for premium users in app/tests/integration/voice-synthesis-premium.test.ts
- [x] T028 [P] Integration test weekly AI training pipeline in app/tests/integration/ai-training-pipeline.test.ts
- [x] T029 [P] Integration test voice cache management in app/tests/integration/voice-cache-management.test.ts
- [x] T030 [P] Integration test constitutional compliance validation in app/tests/integration/constitutional-compliance.test.ts

## Phase 3.3: Core Implementation (ONLY after tests are failing)

### Entity Models [All Parallel]
- [ ] T031 [P] Extend User entity with voice fields in convex/schema.ts
- [ ] T032 [P] Extend WorkoutEntry entity with AI training fields in convex/schema.ts
- [ ] T033 [P] Create AITrainingData entity in convex/schema.ts
- [ ] T034 [P] Create VoicePreferences entity in convex/schema.ts
- [ ] T035 [P] Create AIModel entity in convex/schema.ts
- [ ] T036 [P] Create TrainingSession entity in convex/schema.ts
- [ ] T037 [P] Create VoiceInteraction entity in convex/schema.ts

### Core Convex Functions [Sequential within groups]
#### AI Training Functions
- [ ] T038 [P] submitTrainingData mutation in convex/functions/aiTraining.ts
- [ ] T039 [P] listTrainingSessions query in convex/functions/aiTraining.ts
- [ ] T040 startTrainingSession mutation in convex/functions/aiTraining.ts
- [ ] T041 getTrainingSession query in convex/functions/aiTraining.ts
- [ ] T042 updateTrainingSession mutation in convex/functions/aiTraining.ts
- [ ] T043 listAIModels query in convex/functions/aiTraining.ts
- [ ] T044 getAIModel query in convex/functions/aiTraining.ts
- [ ] T045 deployAIModel mutation in convex/functions/aiTraining.ts
- [ ] T046 rollbackAIModel mutation in convex/functions/aiTraining.ts

#### Voice Synthesis Functions
- [ ] T047 [P] getVoicePreferences query in convex/functions/voice.ts
- [ ] T048 [P] updateVoicePreferences mutation in convex/functions/voice.ts
- [ ] T049 initiateVoiceClone action in convex/functions/voice.ts
- [ ] T050 getVoiceCloneStatus query in convex/functions/voice.ts
- [ ] T051 synthesizeVoice action in convex/functions/voice.ts
- [ ] T052 getCachedVoiceClips query in convex/functions/voice.ts
- [ ] T053 clearVoiceCache mutation in convex/functions/voice.ts
- [ ] T054 getCachedVoiceClip query in convex/functions/voice.ts
- [ ] T055 deleteCachedVoiceClip mutation in convex/functions/voice.ts
- [ ] T056 recordVoiceInteraction mutation in convex/functions/voice.ts
- [ ] T057 getWorkoutVoiceInteractions query in convex/functions/voice.ts

### Utility Functions [All Parallel]
- [ ] T058 [P] Data anonymization with SHA-256 hashing in convex/functions/aiTraining.ts
- [ ] T059 [P] Voice cache management with 10-entry rotation in app/src/lib/voiceCache.ts
- [ ] T060 [P] Constitutional compliance validation in convex/functions/compliance.ts

## Phase 3.4: Integration

### External API Integration
- [ ] T061 ElevenLabs voice synthesis integration in convex/functions/voice.ts
- [ ] T062 ElevenLabs voice cloning integration in convex/functions/voice.ts
- [ ] T063 Hugging Face Hub model deployment in convex/functions/aiTraining.ts
- [ ] T064 Hugging Face Hub model training integration in python/train_model.py

### Cron Jobs
- [ ] T065 [P] Weekly AI training pipeline cron job in convex/crons.ts
- [ ] T066 [P] Data retention cleanup cron job in convex/crons.ts

### Frontend Integration
- [ ] T067 Voice preferences UI component in app/src/lib/components/VoicePreferences.svelte
- [ ] T068 Voice cloning setup wizard in app/src/lib/components/VoiceCloning.svelte
- [ ] T069 Voice synthesis playback in app/src/lib/components/VoicePlayback.svelte
- [ ] T070 IndexedDB voice cache implementation in app/src/lib/stores/voiceCache.ts
- [ ] T071 AI training dashboard for admins in app/src/routes/admin/training/+page.svelte

## Phase 3.5: Polish

### Performance & Validation
- [ ] T072 [P] Voice synthesis latency optimization (<500ms target) in convex/functions/voice.ts
- [ ] T073 [P] Cache hit rate optimization (>80% target) in app/src/lib/voiceCache.ts
- [ ] T074 [P] Training pipeline performance tests in app/tests/performance/training-pipeline.test.ts
- [ ] T075 [P] Voice synthesis performance tests in app/tests/performance/voice-synthesis.test.ts
- [ ] T076 [P] Constitutional compliance unit tests in app/tests/unit/compliance.test.ts

### Documentation & Cleanup
- [ ] T077 [P] Update API documentation in docs/api-training.md
- [ ] T078 [P] Update API documentation in docs/api-voice.md
- [ ] T079 [P] Create deployment guide in docs/deployment-ai-voice.md
- [ ] T080 [P] Remove code duplication across Convex functions
- [ ] T081 Run quickstart.md integration scenarios validation

## Dependencies

### Critical Path Dependencies
- Setup (T001-T005) → All other tasks
- All contract tests (T006-T025) → Implementation tasks (T031+)
- All integration tests (T026-T030) → Implementation tasks (T031+)
- Entity models (T031-T037) → Convex functions (T038+)
- AI Training functions (T038-T046) → Training pipeline (T063-T065)
- Voice functions (T047-T057) → Voice integration (T061-T062, T067-T070)
- Core implementation (T031-T060) → Frontend integration (T067-T071)
- All implementation → Polish tasks (T072-T081)

### File-Level Dependencies
- convex/schema.ts: T031-T037 must be sequential (same file)
- convex/functions/aiTraining.ts: T038-T046, T058, T063 must be sequential
- convex/functions/voice.ts: T047-T057, T061-T062, T072 must be sequential
- app/src/lib/voiceCache.ts: T059, T073 must be sequential

## Parallel Execution Examples

### Setup Phase (All Parallel)
```bash
# Launch T002-T005 together:
Task: "Configure ElevenLabs API environment variables in app/.env"
Task: "Configure Hugging Face Hub environment variables in app/.env"
Task: "Install SvelteKit 2.22+ voice UI dependencies in app/package.json"
Task: "Configure TypeScript 5.0+ strict mode in app/tsconfig.json"
```

### Contract Tests Phase (All Parallel)
```bash
# Launch T006-T025 together:
Task: "Contract test submitTrainingData in app/tests/contract/ai-training-submit-data.test.ts"
Task: "Contract test listTrainingSessions in app/tests/contract/ai-training-list-sessions.test.ts"
# ... (all 20 contract tests can run in parallel)
```

### Entity Models Phase (All Parallel)
```bash
# Launch T033-T037 together (T031-T032 extend existing schema):
Task: "Create AITrainingData entity in convex/schema.ts"
Task: "Create VoicePreferences entity in convex/schema.ts"
Task: "Create AIModel entity in convex/schema.ts"
Task: "Create TrainingSession entity in convex/schema.ts"
Task: "Create VoiceInteraction entity in convex/schema.ts"
```

## Performance Targets
- Voice synthesis latency: <500ms (T072)
- Cache hit rate: >80% after initial usage (T073)
- Training pipeline: Weekly automated execution (T065)
- Data retention: 6 months maximum with cleanup (T066)
- Constitutional retry limit: 5 attempts maximum (T060)

## Validation Checklist
*GATE: Checked during execution*

- [x] All contracts have corresponding tests (T006-T025)
- [x] All entities have model tasks (T031-T037)
- [x] All tests come before implementation (Phase 3.2 → 3.3)
- [x] Parallel tasks truly independent ([P] markers verified)
- [x] Each task specifies exact file path
- [x] No task modifies same file as another [P] task
- [x] TDD approach: failing tests first, then implementation
- [x] Integration tests cover all quickstart scenarios
- [x] Constitutional compliance validation included
- [x] Performance targets measurable and testable

## Notes
- **Critical**: Run all tests in Phase 3.2 and verify they FAIL before implementing
- **ElevenLabs API**: Rate limiting and error handling required
- **Hugging Face Hub**: Model versioning and deployment automation
- **IndexedDB**: Client-side voice cache with 10-entry rotation
- **Constitutional**: 5-retry limit, 6-month retention, anonymization
- **Performance**: <500ms voice synthesis, >80% cache hit rate
- **Privacy**: SHA-256 anonymization, user consent validation
- **Premium Features**: Voice synthesis requires subscription validation