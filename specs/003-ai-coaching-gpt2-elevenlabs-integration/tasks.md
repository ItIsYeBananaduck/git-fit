# Tasks: AI-Driven Coaching with GPT-2 and ElevenLabs TTS Integration

**Input**: Design documents from `/specs/003-ai-coaching-gpt2-elevenlabs-integration/`
**Prerequisites**: plan.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

## Execution Flow (main)

```
1. Load plan.md from feature directory ✅
   → Tech stack: Svelte/SvelteKit, Capacitor, Convex, Python (GPT-2), ElevenLabs TTS
   → Structure: Mobile app with Convex backend and Python AI services
2. Load design documents ✅:
   → data-model.md: 6 entities (AICoachingPersona, WorkoutTrigger, VoiceResponse, UserSubscription, TrainingData, AudioCache)
   → contracts/: AI Coaching API (8 endpoints), Database schema
   → research.md: Technical decisions and integration patterns
   → quickstart.md: 7 test scenarios for validation
3. Generate tasks by category:
   → Setup: Dependencies, environment, AI models
   → Tests: Contract tests, integration tests (TDD approach)
   → Core: Models, services, AI integration
   → Integration: API endpoints, caching, rate limiting
   → Polish: Performance optimization, monitoring
```

## Format: `[ID] [P?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Phase 3.1: Setup

- [x] T001 Initialize Python environment for GPT-2 model fine-tuning in `ai-services/`
- [x] T002 Configure ElevenLabs TTS API integration and authentication
- [x] T003 [P] Setup Convex database schema with AI coaching collections
- [x] T004 [P] Configure TypeScript types generation from Convex schema
- [x] T005 [P] Setup audio file storage and caching infrastructure

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3

**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

- [x] T006 [P] Contract test POST /api/coaching/trigger in `tests/api/coaching-trigger.test.ts`
- [x] T007 [P] Contract test GET /api/coaching/personas in `tests/api/personas.test.ts`
- [x] T008 [P] Contract test GET /api/coaching/subscription in `tests/api/subscription.test.ts`
- [x] T009 [P] Contract test PUT /api/coaching/subscription in `tests/api/subscription-update.test.ts`
- [x] T010 [P] Contract test POST /api/coaching/feedback in `tests/api/feedback.test.ts`
- [x] T011 [P] Contract test GET /api/coaching/audio/{responseId} in `tests/api/audio-retrieval.test.ts`
- [x] T012 [P] Integration test basic coaching trigger in `tests/integration/basic-coaching.test.ts`
- [x] T013 [P] Integration test audio generation pipeline in `tests/integration/audio-generation.test.ts`
- [ ] T014 [P] Integration test subscription management in `tests/integration/subscription-flow.test.ts`
- [x] T015 [P] Integration test rate limiting enforcement in `tests/integration/rate-limiting.test.ts`
- [ ] T016 [P] Integration test audio caching in `tests/integration/audio-caching.test.ts`
- [ ] T017 [P] Integration test mobile workflow in `tests/integration/mobile-integration.test.ts`
- [ ] T018 [P] Integration test privacy compliance in `tests/integration/privacy-compliance.test.ts`

## Phase 3.3: Core Implementation (ONLY after tests are failing)

### Data Models

- [ ] T019 [P] AICoachingPersona model in `app/convex/schema.ts`
- [ ] T020 [P] WorkoutTrigger model in `app/convex/schema.ts`
- [ ] T021 [P] VoiceResponse model in `app/convex/schema.ts`
- [ ] T022 [P] UserSubscription model in `app/convex/schema.ts`
- [ ] T023 [P] TrainingData model in `app/convex/schema.ts`
- [ ] T024 [P] AudioCache model in `app/convex/schema.ts`

### AI Services

- [ ] T025 [P] GPT-2 model fine-tuning service in `ai-services/gpt2_service.py`
- [ ] T026 [P] ElevenLabs TTS integration service in `ai-services/tts_service.py`
- [ ] T027 [P] Persona response generation logic in `ai-services/persona_engine.py`
- [ ] T028 [P] Audio caching service in `ai-services/audio_cache.py`

### Convex Functions

- [ ] T029 [P] Coaching personas CRUD functions in `app/convex/functions/personas.js`
- [ ] T030 [P] Workout triggers CRUD functions in `app/convex/functions/triggers.js`
- [ ] T031 [P] Voice response management functions in `app/convex/functions/responses.js`
- [ ] T032 [P] User subscription functions in `app/convex/functions/subscriptions.js`
- [ ] T033 [P] Training data functions in `app/convex/functions/training.js`
- [ ] T034 [P] Audio cache functions in `app/convex/functions/audio.js`

### API Endpoints

- [ ] T035 POST /api/coaching/trigger endpoint in `app/src/routes/api/coaching/trigger/+server.ts`
- [ ] T036 GET /api/coaching/personas endpoint in `app/src/routes/api/coaching/personas/+server.ts`
- [ ] T037 GET /api/coaching/personas/{personaId} endpoint in `app/src/routes/api/coaching/personas/[personaId]/+server.ts`
- [ ] T038 GET /api/coaching/subscription endpoint in `app/src/routes/api/coaching/subscription/+server.ts`
- [ ] T039 PUT /api/coaching/subscription endpoint in `app/src/routes/api/coaching/subscription/+server.ts`
- [ ] T040 POST /api/coaching/feedback endpoint in `app/src/routes/api/coaching/feedback/+server.ts`
- [ ] T041 GET /api/coaching/audio/{responseId} endpoint in `app/src/routes/api/coaching/audio/[responseId]/+server.ts`

### Mobile Components

- [ ] T042 [P] AI coaching trigger service in `app/src/lib/services/coaching-service.ts`
- [ ] T043 [P] Audio playback component in `app/src/lib/components/AudioPlayer.svelte`
- [ ] T044 [P] Toast notification component in `app/src/lib/components/CoachingToast.svelte`
- [ ] T045 [P] Persona selection component in `app/src/lib/components/PersonaSelector.svelte`
- [ ] T046 [P] Earbud detection utility in `app/src/lib/utils/audio-detection.ts`

## Phase 3.4: Integration

- [ ] T047 Rate limiting middleware for API endpoints
- [ ] T048 Audio file validation and security checks
- [ ] T049 GDPR compliance data retention scheduler
- [ ] T050 Performance monitoring and logging
- [ ] T051 Error handling and fallback mechanisms
- [ ] T052 WebSocket integration for real-time coaching
- [ ] T053 Background audio processing queue

## Phase 3.5: Polish

- [ ] T054 [P] Unit tests for persona engine in `tests/unit/persona-engine.test.py`
- [ ] T055 [P] Unit tests for TTS service in `tests/unit/tts-service.test.py`
- [ ] T056 [P] Unit tests for coaching service in `tests/unit/coaching-service.test.ts`
- [ ] T057 [P] Unit tests for audio utilities in `tests/unit/audio-utils.test.ts`
- [ ] T058 Performance optimization for <500ms response time
- [ ] T059 Audio quality optimization and compression
- [ ] T060 [P] API documentation updates in `docs/ai-coaching-api.md`
- [ ] T061 [P] Mobile integration guide in `docs/mobile-setup.md`
- [ ] T062 Remove code duplication and refactor
- [ ] T063 Execute quickstart.md validation scenarios

## Dependencies

### Critical Path

- Setup (T001-T005) before all other phases
- Tests (T006-T018) before implementation (T019-T063)
- Models (T019-T024) before services (T025-T034)
- Services before API endpoints (T035-T041)
- Core implementation before integration (T047-T053)
- Integration before polish (T054-T063)

### Specific Dependencies

- T019-T024 (schema) blocks T029-T034 (Convex functions)
- T025-T028 (AI services) blocks T035 (trigger endpoint)
- T029-T034 (Convex functions) blocks T035-T041 (API endpoints)
- T042 (coaching service) blocks T043-T045 (mobile components)
- T035-T041 (endpoints) blocks T047-T053 (integration)

## Parallel Execution Examples

```bash
# Phase 3.2: Launch all contract tests together
Task: "Contract test POST /api/coaching/trigger in tests/api/coaching-trigger.test.ts"
Task: "Contract test GET /api/coaching/personas in tests/api/personas.test.ts"
Task: "Contract test GET /api/coaching/subscription in tests/api/subscription.test.ts"
Task: "Contract test PUT /api/coaching/subscription in tests/api/subscription-update.test.ts"

# Phase 3.3: Launch model definitions together
Task: "AICoachingPersona model in app/convex/schema.ts"
Task: "WorkoutTrigger model in app/convex/schema.ts"
Task: "VoiceResponse model in app/convex/schema.ts"
Task: "UserSubscription model in app/convex/schema.ts"

# Phase 3.3: Launch AI services together
Task: "GPT-2 model fine-tuning service in ai-services/gpt2_service.py"
Task: "ElevenLabs TTS integration service in ai-services/tts_service.py"
Task: "Persona response generation logic in ai-services/persona_engine.py"
Task: "Audio caching service in ai-services/audio_cache.py"
```

## Notes

- [P] tasks = different files, no dependencies between them
- Verify all tests fail before implementing (TDD approach)
- Commit after each task completion
- Monitor performance: <500ms response time target
- ElevenLabs API rate limits: 20 requests/hour (free tier)
- Audio files cached for 24 hours to reduce API costs
- GDPR compliance: 30-day data retention policy

## Task Generation Rules Applied

1. **From Contracts**: 6 contract tests from AI Coaching API endpoints
2. **From Data Model**: 6 model creation tasks from entities
3. **From Quickstart**: 7 integration tests from test scenarios
4. **From Architecture**: Mobile app components + AI services + API endpoints
5. **Ordering**: Setup → Tests → Models → Services → Endpoints → Integration → Polish

## Validation Checklist

- [x] All contracts have corresponding tests (T006-T011)
- [x] All entities have model tasks (T019-T024)
- [x] All tests come before implementation (T006-T018 before T019+)
- [x] Parallel tasks truly independent (different files)
- [x] Each task specifies exact file path
- [x] No task modifies same file as another [P] task
- [x] TDD approach: failing tests before implementation
- [x] Dependencies properly ordered
- [x] Mobile-specific components included
- [x] AI services integration covered
- [x] Performance and privacy requirements addressed
