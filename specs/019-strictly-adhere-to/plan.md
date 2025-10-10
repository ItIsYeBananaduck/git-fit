# Implementation Plan: Strictly adhere to the project constitution and implement all 15 tasks

**Branch**: `019-strictly-adhere-to` | **Date**: 2025-10-09 | **Spec**: specs/019-strictly-adhere-to/spec.md
**Input**: Feature specification from `/specs/019-strictly-adhere-to/spec.md`

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

[Extract from feature spec: primary requirement + technical approach from research]

## Technical Context

**Language/Version**: TypeScript 5.0+, JavaScript ES2022, SvelteKit 2.22+, Convex 1.27+, Capacitor 7.4+, Llama 3.1 8B (4-bit)  
**Primary Dependencies**: Svelte, Capacitor, Convex, Llama 3.1 via Capacitor plugin  
**Storage**: Convex real-time database, localStorage, IndexedDB  
**Testing**: Jest for Svelte, Supertest for APIs  
**Target Platform**: iOS/Android via Capacitor, web  
**Project Type**: mobile + web + api  
**Performance Goals**: latency <500ms for API calls, animations at 30 FPS  
**Constraints**: low-end devices iPhone 7, Android API 19; canvas fallbacks, lightweight animations  
**Scale/Scope**: 1–10,000 concurrent users

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

- User-Centric Design: PASS - 15 tasks prioritize user needs for workout tracking, nutrition, recovery.
- Adaptability and Learning: PASS - Llama 3.1 for AI-driven adjustments, learning from data.
- Cost-Effectiveness: PASS - Fly.io $10-15/month for 10,000 users.
- Scalability and Performance: PASS - Supports 10,000 users, latency <500ms, 30 FPS animations.
- Safety and Privacy: PASS - Encrypted chats, secure APIs, injury-aware coaching.
- Engagement and Gamification: PASS - Alice avatar, badges, progress tracking.
- Data Ethics & Transparency: PASS - Transparent AI, user consent, audit trails.

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

**Structure Decision**: Mobile + API + Web (SvelteKit for web, Capacitor for mobile, Fly.io for API)

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

_Prerequisites: research.md complete_

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

**Output**: data-model.md, /contracts/\*, failing tests, quickstart.md, agent-specific file

## Phase 2: Task Planning Approach

_This section describes what the /tasks command will do - DO NOT execute during /plan_

**Implementation Status Check**: Upon detailed codebase review, 13 of 15 tasks are already fully implemented:

- ✅ Alice Avatar (Task 2): Complete Svelte component with Llama integration
- ✅ Intensity Scoring (Task 3): Complete with comprehensive contract tests
- ✅ Dynamic Rest Periods (Task 4): API endpoint implemented
- ✅ Role-Based Access (Task 5): API endpoint with role checking
- ✅ Workout Card (Task 6): Both basic and adaptive cards implemented
- ✅ Strain Sync (Task 7): API and contract tests implemented
- ✅ Custom Food Entry (Task 9): Nutrition tracker and API
- ✅ Marketplace (Task 10): Full implementation with trainer dashboard
- ✅ Play Mode (Task 11): Activity detection API
- ✅ Trainer Subscriptions (Task 12): Dashboard with billing
- ✅ Trainer Flows (Task 13): Complete trainer interface
- ✅ Admin Training Import (Task 14): UI and PowerShell scripts
- ✅ OTP CSV Plans (Task 15): Import functionality
- ✅ Structure & Testing Deliverables: All components and many tests exist

**Remaining Tasks**: Only 2 tasks need implementation:

- ❌ Teams Social Feed (Task 1): API exists, UI component needed
- ❌ Adaptive Fit Labs (Task 8): API exists, dedicated dashboard needed

**Task Generation Strategy**:

- Load `.specify/templates/tasks-template.md` as base
- Generate tasks from Phase 1 design docs (contracts, data model, quickstart)
- Each contract → contract test task [P]
- Each entity → model creation task [P]
- Each user story → integration test task
- Implementation tasks to make tests pass

**Ordering Strategy**:

- TDD order: Tests before implementation
- Dependency order: Models before services before UI
- Mark [P] for parallel execution (independent files)

**Estimated Output**: 25-30 numbered, ordered tasks in tasks.md

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation

These phases are beyond the scope of the /plan command.

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (execute tasks.md following constitutional principles)  
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking

Fill ONLY if Constitution Check has violations that must be justified.

| Violation                  | Why Needed         | Simpler Alternative Rejected Because |
| -------------------------- | ------------------ | ------------------------------------ |
| [e.g., 4th project]        | [current need]     | [why 3 projects insufficient]        |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient]  |

## Progress Tracking

This checklist is updated during execution flow.

**Phase Status**:

- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command) - 13/15 tasks already implemented
- [x] Phase 2: Task planning complete (/plan command - describe approach only)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:

- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [x] Complexity deviations documented

---

_Based on Constitution v2.1.1 - See `/memory/constitution.md`_
