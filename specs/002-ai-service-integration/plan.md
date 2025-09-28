# Implementation Plan: AI SeIntegrate the successfully deployed AI service (https://adaptive-fit-ai.fly.dev/) with the main Adaptive fIt app to provide real-time workout adjustments for pro users while maintaining intelligent fallbacks for free users and service outages.vice Integration

**Branch**: `002-ai-service-integration` | **Date**: September 24, 2025 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-ai-service-integration/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   → SUCCESS: Feature spec loaded and analyzed
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → Project Type: web (SvelteKit frontend + Convex backend + deployed AI service)
   → Structure Decision: Option 2 - Web application with external AI service
3. Evaluate Constitution Check section below
   → No major violations - follows established patterns
   → Update Progress Tracking: Initial Constitution Check PASS
4. Execute Phase 0 → research.md
   → Research HTTP client patterns, error handling, fallback strategies
5. Execute Phase 1 → contracts, data-model.md, quickstart.md, CLAUDE.md
   → AI service contracts already exist (deployed service), focus on integration contracts
6. Re-evaluate Constitution Check section
   → Post-design validation - maintaining simplicity and user-centric approach
   → Update Progress Tracking: Post-Design Constitution Check PASS
7. Plan Phase 2 → Describe task generation approach
   → Integration tasks focusing on service communication and fallback logic
8. STOP - Ready for /tasks command
```

## Summary
Integrate the successfully deployed AI service (https://technically-fit-ai.fly.dev/) with the main Technically Fit app to provide real-time workout adjustments for pro users while maintaining intelligent fallbacks for free users and service outages.

## Technical Context
**Language/Version**: TypeScript 5.0 (SvelteKit), JavaScript (Convex backend)  
**Primary Dependencies**: SvelteKit, Convex, existing AI service at Fly.io  
**Storage**: Convex database (existing schema), local caching for AI responses  
**Testing**: Vitest for unit tests, Playwright for E2E integration testing  
**Target Platform**: Web app (mobile via Capacitor), AI service integration via HTTPS  
**Project Type**: web - SvelteKit frontend + Convex backend + external AI service  
**Performance Goals**: AI requests <5s timeout, fallback activation <100ms, UI updates <50ms  
**Constraints**: Existing AI service contract, 100% uptime via fallbacks, cost-effective usage  
**Scale/Scope**: Integration layer for existing 70% complete app, ~5 new service functions, ~3 new UI components

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Simplicity**:
- Projects: 3 (frontend, backend, existing AI service) - within limit ✅
- Using framework directly? Yes - SvelteKit and Convex patterns ✅
- Single data model? Yes - extending existing Convex schema ✅
- Avoiding patterns? Yes - direct service calls, no unnecessary abstractions ✅

**Architecture**:
- EVERY feature as library? Yes - AI integration as reusable Convex functions ✅
- Libraries listed: aiService (HTTP client), fallbackEngine (rules), eventProcessor (workflow)
- CLI per library: Not applicable for web integration ✅
- Library docs: Will update existing documentation ✅

**Testing (NON-NEGOTIABLE)**:
- RED-GREEN-Refactor cycle enforced? Yes - tests before implementation ✅
- Git commits show tests before implementation? Will ensure proper sequence ✅
- Order: Contract→Integration→E2E→Unit strictly followed? Yes ✅
- Real dependencies used? Yes - actual AI service, not mocks ✅
- Integration tests for: new service integration, contract changes, error handling ✅

**Observability**:
- Structured logging included? Yes - AI service call logging, error tracking ✅
- Frontend logs → backend? Yes - using existing Convex logging patterns ✅
- Error context sufficient? Yes - full request/response logging ✅

**Versioning**:
- Version number assigned? v2.1.0 (MINOR for new AI integration feature) ✅
- BUILD increments on every change? Yes - following existing patterns ✅
- Breaking changes handled? None - additive integration only ✅

## Project Structure

### Documentation (this feature)
```
specs/002-ai-service-integration/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
│   ├── ai-service.json  # AI service integration contract
│   └── fallback.json    # Fallback system contract
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (existing repository structure)
```
# Web application structure (existing)
convex/
├── functions/
│   ├── aiService.js         # NEW: AI service HTTP client
│   ├── workoutEvents.js     # NEW: Event processing and routing  
│   └── fallbackEngine.js   # NEW: Rule-based fallback logic
└── schema.ts                # EXISTING: Extend with AI entities

app/src/
├── lib/
│   ├── components/
│   │   └── AiRecommendation.svelte  # NEW: Display AI suggestions
│   ├── services/
│   │   └── aiIntegration.ts         # NEW: Frontend AI service client
│   └── types/
│       └── aiTypes.d.ts             # NEW: TypeScript definitions
├── routes/
│   └── workouts/
│       └── [id]/
│           └── +page.svelte         # EXISTING: Enhance with AI integration
└── tests/
    ├── integration/
    │   └── ai-service.test.ts       # NEW: AI service integration tests
    └── unit/
        └── fallback.test.ts         # NEW: Fallback logic unit tests
```

**Structure Decision**: Option 2 - Web application with external service integration

## Phase 0: Outline & Research
1. **Extract unknowns from Technical Context**:
   - Research best practices for HTTP service integration in SvelteKit/Convex
   - Investigate error handling patterns for external service dependencies
   - Research caching strategies for AI responses
   - Study fallback system architecture patterns

2. **Generate and dispatch research agents**:
   ```
   Task: "Research HTTP client patterns for SvelteKit + Convex integration"
   Task: "Find best practices for external service error handling and timeouts"
   Task: "Research client-side caching strategies for AI service responses"
   Task: "Find patterns for graceful degradation and fallback systems"
   ```

3. **Consolidate findings** in `research.md`:
   - Decision: Use Convex HTTP actions for server-side AI service calls
   - Rationale: Better error handling, security, and caching than client-side calls
   - Alternatives considered: Direct client calls, middleware proxy, service workers

**Output**: research.md with integration architecture decisions

## Phase 1: Design & Contracts
*Prerequisites: research.md complete*

1. **Extract entities from feature spec** → `data-model.md`:
   - WorkoutEvent: Event type, user context, workout data, timestamp
   - AIRecommendation: Action type, reason, modifications, confidence, source
   - UserPreference: Exercise preferences, response history, learning data
   - FallbackRule: Trigger conditions, safety constraints, recommendation logic

2. **Generate API contracts** from functional requirements:
   - AI Service Integration Contract: Request/response schemas for workout events
   - Fallback System Contract: Rule-based recommendation engine interface
   - Caching Contract: AI response storage and retrieval patterns
   - Output contracts to `/contracts/`

3. **Generate contract tests** from contracts:
   - AI service communication tests (success, timeout, error scenarios)
   - Fallback system activation tests
   - Response validation tests
   - Caching behavior tests
   - Tests must fail (no implementation yet)

4. **Extract test scenarios** from user stories:
   - Pro user receives AI recommendations during workout
   - Free user receives fallback recommendations
   - Service outage graceful degradation
   - AI response validation and safety checks

5. **Update CLAUDE.md incrementally**:
   - Add AI service integration patterns
   - Update with new Convex functions and schema extensions
   - Preserve existing context about deployed AI service
   - Add error handling and fallback patterns

**Output**: data-model.md, /contracts/*, failing tests, quickstart.md, CLAUDE.md

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
- Load `/templates/tasks-template.md` as base
- Generate tasks from Phase 1 design docs focusing on integration points
- Each contract → integration test task [P]
- Each entity → Convex schema extension task [P]
- Each user story → E2E test scenario
- Implementation tasks following TDD principles

**Ordering Strategy**:
- TDD order: Tests before implementation (contract tests first)
- Dependency order: Schema → Backend functions → Frontend components → Integration
- Mark [P] for parallel execution (different files, independent functionality)

**Estimated Output**: 15-20 numbered, ordered tasks focusing on AI service integration

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (TDD approach with existing AI service)  
**Phase 5**: Validation (integration testing with deployed AI service, performance validation)

## Complexity Tracking
*No constitutional violations detected*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None | N/A | N/A |

## Progress Tracking
*This checklist is updated during execution flow*

**Phase Status**:
- [x] Phase 0: Research complete (/plan command)
- [ ] Phase 1: Design complete (/plan command)
- [ ] Phase 2: Task planning complete (/plan command - describe approach only)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [ ] Post-Design Constitution Check: PASS
- [ ] All NEEDS CLARIFICATION resolved
- [x] Complexity deviations documented (none)

---
*Based on Constitution v2.1.1 - See `/memory/constitution.md`*