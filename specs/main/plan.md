
# Implementation Plan: Monday Workout Intensity Analysis

**Branch**: `001-monday-workout` | **Date**: 2025-09-26 | **Spec**: [specs/001-monday-workout/spec.md](../001-monday-workout/spec.md)
**Input**: Feature specification from `/specs/001-monday-workout/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   → If not found: ERROR "No feature spec at {path}"
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → Detect Project Type from context (web=frontend+backend, mobile=app+api)
   → Set Structure Decision based on project type
3. Fill the Constitution Check section based on the content of the constitution document.
4. Evaluate Constitution Check section below
   → If violations exist: Document in Complexity Tracking
   → If no justification possible: ERROR "Simplify approach first"
   → Update Progress Tracking: Initial Constitution Check
5. Execute Phase 0 → research.md
   → If NEEDS CLARIFICATION remain: ERROR "Resolve unknowns"
6. Execute Phase 1 → contracts, data-model.md, quickstart.md, agent-specific template file (e.g., `CLAUDE.md` for Claude Code, `.github/copilot-instructions.md` for GitHub Copilot, `GEMINI.md` for Gemini CLI, `QWEN.md` for Qwen Code or `AGENTS.md` for opencode).
7. Re-evaluate Constitution Check section
   → If new violations: Refactor design, return to Phase 1
   → Update Progress Tracking: Post-Design Constitution Check
8. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md)
9. STOP - Ready for /tasks command
```

**IMPORTANT**: The /plan command STOPS at step 7. Phases 2-4 are executed by other commands:
- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Summary
Monday Workout Intensity Analysis system for Technically Fit platform. Collects workout data (reps, sets, weight, timing), integrates wearable health metrics (HR, SpO2, sleep), processes user feedback ratings, and calculates weekly intensity scores (0-100%). Automatically adjusts next week's workout volumes based on intensity analysis, with SHA-256 hashing for secure data transmission. Extends existing WorkoutExecutionService with Monday processing capabilities.

## Technical Context
**Language/Version**: TypeScript 5.0+, JavaScript ES2022  
**Primary Dependencies**: SvelteKit 2.22+, Convex 1.27+, Capacitor 7.4+, Tailwind CSS 4.1+  
**Storage**: Convex database (NoSQL document store)  
**Testing**: Vitest 3.2+, Playwright, svelte-check  
**Target Platform**: iOS/Android via Capacitor, Web browsers  
**Project Type**: mobile - SvelteKit app with Capacitor for native deployment  
**Performance Goals**: <200ms API response time, <1GB memory usage  
**Constraints**: Wearable data integration (HealthKit/Health Connect), weekly processing batch, secure SHA-256 hashing  
**Scale/Scope**: 100-1,000 users beta, extending existing WorkoutExecutionService, Monday processing workflow

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

✅ **User-Centric Design**: Feature prioritizes user workout analysis needs with automated volume adjustments and fallbacks for missing data
✅ **Adaptability**: System learns from user feedback patterns and adapts recommendations (flag after 2 weeks mismatch)  
✅ **Cost-Effectiveness**: Extends existing services, uses SHA-256 for security, processes weekly (not real-time) to minimize compute costs
✅ **Scalability**: Weekly batch processing scales efficiently, integrates with existing WorkoutExecutionService architecture
✅ **Safety & Privacy**: SHA-256 hashing protects raw data, secure wearable integration via platform APIs, automated volume reduction prevents overtraining
✅ **Engagement**: Monday updates provide clear intensity feedback and progression insights for user motivation
✅ **Data Ethics**: Transparent intensity calculation, user feedback prioritized over wearable data, clear explanations for adjustments

**Constitutional Compliance**: All principles satisfied. Feature aligns with budget constraints (<$10/month), timeline (beta-ready), and existing technology stack (SvelteKit, Convex).

## Project Structure

### Documentation (this feature)
```
specs/[###-feature]/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)
```
# Option 1: Single project (DEFAULT)
src/
├── models/
├── services/
├── cli/
└── lib/

tests/
├── contract/
├── integration/
└── unit/

# Option 2: Web application (when "frontend" + "backend" detected)
backend/
├── src/
│   ├── models/
│   ├── services/
│   └── api/
└── tests/

frontend/
├── src/
│   ├── components/
│   ├── pages/
│   └── services/
└── tests/

# Option 3: Mobile + API (when "iOS/Android" detected)
api/
└── [same as backend above]

ios/ or android/
└── [platform-specific structure]
```

**Structure Decision**: Option 3 (Mobile + API) - SvelteKit app with Capacitor for iOS/Android deployment, Convex backend for data processing

## Phase 0: Outline & Research
1. **Extract unknowns from Technical Context** above:
   - For each NEEDS CLARIFICATION → research task
   - For each dependency → best practices task
   - For each integration → patterns task

2. **Generate and dispatch research agents**:
   ```
   For each unknown in Technical Context:
     Task: "Research {unknown} for {feature context}"
   For each technology choice:
     Task: "Find best practices for {tech} in {domain}"
   ```

3. **Consolidate findings** in `research.md` using format:
   - Decision: [what was chosen]
   - Rationale: [why chosen]
   - Alternatives considered: [what else evaluated]

**Output**: research.md with all NEEDS CLARIFICATION resolved

## Phase 1: Design & Contracts
*Prerequisites: research.md complete*

1. **Extract entities from feature spec** → `data-model.md`:
   - Entity name, fields, relationships
   - Validation rules from requirements
   - State transitions if applicable

2. **Generate API contracts** from functional requirements:
   - For each user action → endpoint
   - Use standard REST/GraphQL patterns
   - Output OpenAPI/GraphQL schema to `/contracts/`

3. **Generate contract tests** from contracts:
   - One test file per endpoint
   - Assert request/response schemas
   - Tests must fail (no implementation yet)

4. **Extract test scenarios** from user stories:
   - Each story → integration test scenario
   - Quickstart test = story validation steps

5. **Update agent file incrementally** (O(1) operation):
   - Run `.specify/scripts/powershell/update-agent-context.ps1 -AgentType copilot`
     **IMPORTANT**: Execute it exactly as specified above. Do not add or remove any arguments.
   - If exists: Add only NEW tech from current plan
   - Preserve manual additions between markers
   - Update recent changes (keep last 3)
   - Keep under 150 lines for token efficiency
   - Output to repository root

**Output**: data-model.md, /contracts/*, failing tests, quickstart.md, agent-specific file

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
- Load `.specify/templates/tasks-template.md` as base
- Generate tasks from Phase 1 design artifacts (data-model.md, contracts/, quickstart.md)
- Each API contract endpoint → contract test task [P]
- Each entity in data model → model creation task [P]
- Each integration step from quickstart → implementation task
- Service extension tasks for WorkoutExecutionService integration

**Specific Task Categories**:
1. **Foundation Tasks** (parallel execution):
   - Create crypto utility service for SHA-256 hashing [P]
   - Create health data service for wearable integration [P] 
   - Create intensity calculation service [P]
   - Create volume adjustment service [P]

2. **Data Model Tasks** (parallel execution):
   - Implement WorkoutSession entity and validation [P]
   - Implement HealthMetrics entity and validation [P]
   - Implement UserFeedback entity and validation [P]
   - Implement IntensityScore entity and validation [P]
   - Implement VolumeAdjustment entity and validation [P]
   - Implement MondayProcessor entity and validation [P]

3. **API Contract Tasks** (dependent on data models):
   - Implement POST /workouts/sessions endpoint
   - Implement POST /health/metrics endpoint
   - Implement POST /feedback endpoint  
   - Implement GET /intensity/weekly/{userId} endpoint
   - Implement POST /monday-processing/trigger endpoint
   - Implement GET /monday-processing/status/{processingId} endpoint

4. **Service Integration Tasks** (dependent on APIs):
   - Extend WorkoutExecutionService with Monday data collection
   - Integrate health data collection with workout completion
   - Create Convex scheduled action for Monday processing
   - Implement Monday processor batch logic

5. **UI Component Tasks** (parallel execution):
   - Create WorkoutFeedback.svelte component [P]
   - Create MondayUpdates.svelte component [P]
   - Integrate components with existing workout pages

6. **Testing Tasks** (parallel execution):
   - Make contract tests pass (currently failing by design) [P]
   - Create integration tests for Monday processing workflow
   - Create unit tests for intensity calculation logic [P]
   - Create E2E tests for complete user workflow

**Ordering Strategy**:
- TDD order: Contract tests first, then implementation to make them pass
- Dependency order: Data models → Services → APIs → UI components
- Foundation services first (crypto, health) before dependent services
- Mark [P] for parallel execution (independent implementation)

**Estimated Task Count**: 28-32 numbered, ordered tasks with clear dependencies

**Dependencies**:
- Tasks 1-4: Can run in parallel (foundation services)
- Tasks 5-10: Can run in parallel after foundation (data models)
- Tasks 11-16: Sequential, depend on data models (API endpoints)
- Tasks 17-20: Sequential, depend on APIs (service integration)
- Tasks 21-22: Can run in parallel (UI components) 
- Tasks 23-28: Can run in parallel after implementation (testing)

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (execute tasks.md following constitutional principles)  
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking
*Fill ONLY if Constitution Check has violations that must be justified*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |


## Progress Tracking
*This checklist is updated during execution flow*

**Phase Status**:
- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [x] Phase 2: Task planning complete (/plan command - describe approach only)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [ ] Complexity deviations documented

---
*Based on Constitution v2.1.1 - See `/memory/constitution.md`*
